// All demo-mode mutations. Each one goes through `update`, so every open tab sees the change.

import { POINTS, QUICK_RESPONSE_MS } from "./gamification";
import { createSeed } from "./seed";
import { resetDemo, update } from "./store";
import { flatLabel, uid } from "./format";
import type {
  ActivityKind,
  Booking,
  DemoState,
  EventCategory,
  GatePass,
  ListingCategory,
  ListingCondition,
  MaintenanceBill,
  PassStatus,
  PassType,
  PointsEntry,
  Resident,
  SosAlert,
  SosType,
  Visitor,
  VisitorPurpose,
} from "./types";

const nowIso = () => new Date().toISOString();

function award(s: DemoState, entry: Omit<PointsEntry, "id" | "at">): number {
  if (s.points.some((p) => p.ref === entry.ref)) return 0;
  s.points.unshift({ id: uid("pt"), at: nowIso(), ...entry });
  return entry.points;
}

function log(s: DemoState, kind: ActivityKind, text: string, block?: string, flat?: string) {
  s.activity.unshift({ id: uid("ac"), at: nowIso(), kind, text, block, flat });
  s.activity = s.activity.slice(0, 80);
}

const isMine = (s: DemoState, x: { block: string; flat: string }) =>
  x.block === s.resident.block && x.flat === s.resident.flat;

// ── Selectors ──────────────────────────────────────────────────────────────

export function passStatus(p: GatePass, now: number = Date.now()): PassStatus {
  if (p.revokedAt) return "revoked";
  if (p.usedAt) return "used";
  if (new Date(p.expiresAt).getTime() <= now) return "expired";
  return "active";
}

export function activeSos(s: DemoState): SosAlert | undefined {
  return s.sos.find((a) => !a.resolvedAt && !a.cancelledAt);
}

export function visitorLabel(v: Pick<Visitor, "name" | "company">) {
  return v.company && !v.name.includes(v.company) ? `${v.name} (${v.company})` : v.name;
}

// ── Visitors ───────────────────────────────────────────────────────────────

export function residentDecide(visitorId: string, approve: boolean) {
  return update((s) => {
    const v = s.visitors.find((x) => x.visitorId === visitorId);
    if (!v || v.status !== "waiting") return { points: 0, visitor: v };
    const at = nowIso();
    v.status = approve ? "inside" : "denied";
    v.decidedAt = at;
    v.decidedBy = "resident";
    if (approve) v.entryAt = at;
    log(s, "visitor", `${flatLabel(v.block, v.flat)} ${approve ? "approved" : "declined"} ${visitorLabel(v)}`, v.block, v.flat);
    let points = 0;
    if (isMine(s, v)) {
      const quick = Date.now() - new Date(v.createdAt).getTime() <= QUICK_RESPONSE_MS;
      points = award(s, {
        points: quick ? POINTS.visitorQuick : POINTS.visitorSlow,
        reason: quick ? "Responded to a visitor within 2 minutes" : "Responded to a gate request",
        kind: "visitor",
        ref: `visitor:${v.visitorId}`,
        bonus: quick,
      });
    }
    return { points, visitor: v };
  });
}

export function guardDecide(visitorId: string, admit: boolean, guardName: string) {
  return update((s) => {
    const v = s.visitors.find((x) => x.visitorId === visitorId);
    if (!v || v.status !== "waiting") return v;
    const at = nowIso();
    v.status = admit ? "inside" : "denied";
    v.decidedAt = at;
    v.decidedBy = "guard";
    v.guardName = guardName;
    if (admit) v.entryAt = at;
    log(s, "visitor", `Gate ${admit ? "admitted" : "turned away"} ${visitorLabel(v)} for ${flatLabel(v.block, v.flat)}`, v.block, v.flat);
    return v;
  });
}

export function checkoutVisitor(visitorId: string) {
  return update((s) => {
    const v = s.visitors.find((x) => x.visitorId === visitorId);
    if (!v || v.status !== "inside") return v;
    v.status = "left";
    v.exitAt = nowIso();
    log(s, "visitor", `${visitorLabel(v)} checked out from ${flatLabel(v.block, v.flat)}`, v.block, v.flat);
    return v;
  });
}

export interface NewVisitorInput {
  name: string;
  phone: string;
  purpose: VisitorPurpose;
  block: string;
  flat: string;
  vehicleNo?: string;
  company?: string;
}

export function registerVisitor(input: NewVisitorInput, guardName: string) {
  return update((s) => {
    const v: Visitor = {
      visitorId: uid("v"),
      ...input,
      vehicleNo: input.vehicleNo?.toUpperCase() || undefined,
      company: input.company || undefined,
      status: "waiting",
      createdAt: nowIso(),
      guardName,
    };
    s.visitors.unshift(v);
    log(s, "visitor", `${visitorLabel(v)} is waiting at the gate for ${flatLabel(v.block, v.flat)}`, v.block, v.flat);
    return v;
  });
}

export type VerifyResult =
  | { ok: true; pass: GatePass; visitor: Visitor }
  | { ok: false; reason: "not_found" | "expired" | "used" | "revoked"; pass?: GatePass };

export function verifyPin(pin: string, guardName: string): VerifyResult {
  return update((s): VerifyResult => {
    const clean = pin.replace(/\D/g, "");
    const matches = s.passes.filter((p) => p.pin === clean);
    // Prefer a currently-active pass if a PIN was ever reused.
    const pass = matches.find((p) => passStatus(p) === "active") ?? matches[0];
    if (!pass) return { ok: false, reason: "not_found" };
    const status = passStatus(pass);
    if (status !== "active") return { ok: false, reason: status, pass };

    const at = nowIso();
    pass.usedAt = at;
    const visitor: Visitor = {
      visitorId: uid("v"),
      name: pass.guestName,
      purpose: pass.entryType,
      phone: pass.guestPhone || "—",
      vehicleNo: pass.vehicleNo,
      block: pass.block,
      flat: pass.flat,
      status: "inside",
      createdAt: at,
      decidedAt: at,
      decidedBy: "pass",
      entryAt: at,
      passId: pass.passId,
      guardName,
    };
    s.visitors.unshift(visitor);
    log(s, "pass", `${pass.guestName} entered with pass ${pass.passId} for ${flatLabel(pass.block, pass.flat)}`, pass.block, pass.flat);
    return { ok: true, pass, visitor };
  });
}

// ── Gate passes ────────────────────────────────────────────────────────────

export interface NewPassInput {
  guestName: string;
  guestPhone?: string;
  entryType: PassType;
  validityHours: number;
  vehicleNo?: string;
}

export function createPass(input: NewPassInput) {
  return update((s) => {
    const taken = new Set(s.passes.filter((p) => passStatus(p) === "active").map((p) => p.pin));
    let pin = "";
    do pin = String(Math.floor(100000 + Math.random() * 900000));
    while (taken.has(pin));
    const ids = new Set(s.passes.map((p) => p.passId));
    let passId = "";
    do passId = `GP-${Math.floor(1000 + Math.random() * 9000)}`;
    while (ids.has(passId));

    const created = new Date();
    const pass: GatePass = {
      passId,
      pin,
      guestName: input.guestName.trim(),
      guestPhone: input.guestPhone?.trim() || undefined,
      entryType: input.entryType,
      vehicleNo: input.vehicleNo?.trim().toUpperCase() || undefined,
      block: s.resident.block,
      flat: s.resident.flat,
      createdAt: created.toISOString(),
      expiresAt: new Date(created.getTime() + input.validityHours * 3_600_000).toISOString(),
    };
    s.passes.unshift(pass);
    log(s, "pass", `Gate pass issued for ${pass.guestName}`, pass.block, pass.flat);
    const points = award(s, { points: POINTS.gatepass, reason: "Issued a gate pass", kind: "gatepass", ref: `pass:${passId}` });
    return { pass, points };
  });
}

export function revokePass(passId: string) {
  update((s) => {
    const p = s.passes.find((x) => x.passId === passId);
    if (p && passStatus(p) === "active") {
      p.revokedAt = nowIso();
      log(s, "pass", `Gate pass ${p.passId} for ${p.guestName} was revoked`, p.block, p.flat);
    }
  });
}

// ── Maintenance ────────────────────────────────────────────────────────────

export function payBill(billId: string, method: string) {
  return update((s) => {
    const b = s.bills.find((x) => x.billId === billId);
    if (!b || b.paidAt) return { points: 0, bill: b };
    const at = new Date();
    b.paidAt = at.toISOString();
    b.method = method;
    b.txnId = `TXN${at.getTime().toString(36).toUpperCase()}`;
    log(s, "payment", `${flatLabel(b.block, b.flat)} paid ${b.month} ${b.year} maintenance`, b.block, b.flat);
    let points = 0;
    if (isMine(s, b)) {
      const onTime = at.getTime() <= new Date(b.dueDate).getTime();
      points = award(s, {
        points: onTime ? POINTS.paymentOnTime : POINTS.paymentLate,
        reason: onTime ? `Paid ${b.month} maintenance before the due date` : `Paid ${b.month} maintenance`,
        kind: "payment",
        ref: `bill:${b.billId}`,
        bonus: onTime,
      });
    }
    return { points, bill: b as MaintenanceBill };
  });
}

export function remindDefaulters() {
  return update((s) => {
    const at = nowIso();
    const unpaid = s.bills.filter((b) => !b.paidAt && !isMine(s, b));
    unpaid.forEach((b) => (b.remindedAt = at));
    return unpaid.length;
  });
}

// ── Service bookings ───────────────────────────────────────────────────────

export function createBooking(input: { providerId: string; title: string; description: string; scheduledFor: string }) {
  return update((s) => {
    const p = s.providers.find((x) => x.providerId === input.providerId);
    if (!p) return null;
    const r = s.resident;
    const b: Booking = {
      bookingId: uid("bk"),
      type: p.type,
      providerId: p.providerId,
      providerName: p.name,
      title: input.title.trim(),
      description: input.description.trim(),
      scheduledFor: input.scheduledFor,
      createdAt: nowIso(),
      customerName: r.name,
      block: r.block,
      flat: r.flat,
      phone: r.phone,
      status: "requested",
      cost: p.baseCost,
    };
    s.bookings.unshift(b);
    log(s, "booking", `${flatLabel(r.block, r.flat)} booked ${p.name}: “${b.title}”`, r.block, r.flat);
    return b;
  });
}

export function cancelBooking(bookingId: string) {
  update((s) => {
    const b = s.bookings.find((x) => x.bookingId === bookingId);
    if (b && b.status === "requested") {
      b.status = "cancelled";
      b.cancelledAt = nowIso();
      log(s, "booking", `Booking “${b.title}” was cancelled`, b.block, b.flat);
    }
  });
}

/** Provider moves a job forward: requested → in_progress → completed. */
export function advanceBooking(bookingId: string) {
  return update((s) => {
    const b = s.bookings.find((x) => x.bookingId === bookingId);
    if (!b) return null;
    if (b.status === "requested") {
      b.status = "in_progress";
      b.startedAt = nowIso();
      log(s, "booking", `${b.providerName} started “${b.title}” for ${flatLabel(b.block, b.flat)}`, b.block, b.flat);
    } else if (b.status === "in_progress") {
      b.status = "completed";
      b.completedAt = nowIso();
      const p = s.providers.find((x) => x.providerId === b.providerId);
      if (p) p.jobsDone += 1;
      log(s, "booking", `${b.providerName} completed “${b.title}” for ${flatLabel(b.block, b.flat)}`, b.block, b.flat);
    }
    return b;
  });
}

export function rateBooking(bookingId: string, rating: number, review: string) {
  return update((s) => {
    const b = s.bookings.find((x) => x.bookingId === bookingId);
    if (!b || b.status !== "completed" || b.rating) return 0;
    b.rating = rating;
    b.review = review.trim() || undefined;
    const p = s.providers.find((x) => x.providerId === b.providerId);
    if (p) p.rating = Math.round(((p.rating * p.jobsDone + rating) / (p.jobsDone + 1)) * 10) / 10;
    return award(s, { points: POINTS.review, reason: `Reviewed ${b.providerName}`, kind: "review", ref: `review:${b.bookingId}` });
  });
}

// ── Marketplace ────────────────────────────────────────────────────────────

export function createListing(input: {
  title: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  description: string;
}) {
  return update((s) => {
    const r = s.resident;
    const id = uid("ls");
    s.listings.unshift({
      id,
      ...input,
      title: input.title.trim(),
      description: input.description.trim(),
      sellerName: r.name,
      block: r.block,
      flat: r.flat,
      phone: r.phone,
      createdAt: nowIso(),
      likes: 0,
      liked: false,
    });
    log(s, "market", `${flatLabel(r.block, r.flat)} listed “${input.title.trim()}”${input.price === 0 ? " as a giveaway" : ""}`, r.block, r.flat);
    return input.price === 0
      ? award(s, { points: POINTS.giveaway, reason: `Gave away “${input.title.trim()}”`, kind: "giveaway", ref: `giveaway:${id}` })
      : award(s, { points: POINTS.listing, reason: `Listed “${input.title.trim()}”`, kind: "listing", ref: `listing:${id}` });
  });
}

export function toggleLike(id: string) {
  update((s) => {
    const l = s.listings.find((x) => x.id === id);
    if (!l) return;
    l.liked = !l.liked;
    l.likes += l.liked ? 1 : -1;
  });
}

export function markSold(id: string) {
  update((s) => {
    const l = s.listings.find((x) => x.id === id);
    if (l && isMine(s, l)) l.soldAt = l.soldAt ? undefined : nowIso();
  });
}

export function deleteListing(id: string) {
  update((s) => {
    s.listings = s.listings.filter((l) => !(l.id === id && isMine(s, l)));
  });
}

// ── Events & meetings ──────────────────────────────────────────────────────

export function createEvent(input: { title: string; details: string; date: string; venue: string; category: EventCategory }) {
  return update((s) => {
    const ev = {
      eventId: uid("ev"),
      ...input,
      host: `${s.resident.name} (RWA)`,
      rsvps: 0,
      going: false,
    };
    s.events.unshift(ev);
    log(s, "event", `New ${input.category.toLowerCase()} posted: “${input.title}”`);
    return ev;
  });
}

/** Returns the points delta (positive on RSVP, negative when withdrawing). */
export function toggleRsvp(eventId: string) {
  return update((s) => {
    const ev = s.events.find((e) => e.eventId === eventId);
    if (!ev) return 0;
    ev.going = !ev.going;
    ev.rsvps = Math.max(0, ev.rsvps + (ev.going ? 1 : -1));
    const ref = `rsvp:${eventId}`;
    if (ev.going) return award(s, { points: POINTS.rsvp, reason: `RSVP’d to ${ev.title}`, kind: "rsvp", ref });
    const had = s.points.find((p) => p.ref === ref);
    s.points = s.points.filter((p) => p.ref !== ref);
    return had ? -had.points : 0;
  });
}

export function jitsiLink(title: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `https://meet.jit.si/nexgate-${slug}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createMeeting(input: { title: string; agenda: string; timing: string; location: string; online: boolean }) {
  return update((s) => {
    const m = {
      meetingId: uid("mt"),
      ...input,
      location: input.location.trim() || (input.online ? "Online" : "Community hall"),
      link: input.online ? jitsiLink(input.title) : undefined,
      host: `${s.resident.name} (RWA)`,
      completed: false,
    };
    s.meetings.unshift(m);
    log(s, "meeting", `Meeting scheduled: “${input.title}”`);
    return m;
  });
}

export function joinMeeting(meetingId: string) {
  return update((s) => {
    const m = s.meetings.find((x) => x.meetingId === meetingId);
    if (!m) return 0;
    m.attended = true;
    return award(s, { points: POINTS.meeting, reason: `Joined “${m.title}”`, kind: "meeting", ref: `meeting:${meetingId}` });
  });
}

export function completeMeeting(meetingId: string, minutes: string) {
  update((s) => {
    const m = s.meetings.find((x) => x.meetingId === meetingId);
    if (!m) return;
    m.completed = true;
    m.minutes = minutes.trim() || undefined;
    log(s, "meeting", `Minutes published for “${m.title}”`);
  });
}

// ── Emergency SOS ──────────────────────────────────────────────────────────

export const SOS_TITLES: Record<SosType, string> = {
  medical: "Medical emergency",
  fire: "Fire / gas hazard",
  lift: "Elevator entrapment",
  security: "Security threat",
};

export function raiseSos(type: SosType) {
  return update((s) => {
    const r = s.resident;
    const existing = s.sos.find((a) => !a.resolvedAt && !a.cancelledAt && a.block === r.block && a.flat === r.flat);
    if (existing) return existing;
    const alert: SosAlert = {
      alertId: uid("sos"),
      type,
      title: SOS_TITLES[type],
      block: r.block,
      flat: r.flat,
      residentName: r.name,
      phone: r.phone,
      raisedAt: nowIso(),
    };
    s.sos.unshift(alert);
    log(s, "sos", `SOS raised from ${flatLabel(r.block, r.flat)}: ${alert.title}`, r.block, r.flat);
    return alert;
  });
}

export function cancelSos(alertId: string) {
  update((s) => {
    const a = s.sos.find((x) => x.alertId === alertId);
    if (a && !a.resolvedAt) {
      a.cancelledAt = nowIso();
      log(s, "sos", `SOS from ${flatLabel(a.block, a.flat)} was cancelled by the resident`, a.block, a.flat);
    }
  });
}

export function acknowledgeSos(alertId: string, guardName: string) {
  update((s) => {
    const a = s.sos.find((x) => x.alertId === alertId);
    if (a && !a.acknowledgedAt) {
      a.acknowledgedAt = nowIso();
      a.acknowledgedBy = guardName;
      log(s, "sos", `${guardName} is responding to the SOS at ${flatLabel(a.block, a.flat)}`, a.block, a.flat);
    }
  });
}

export function resolveSos(alertId: string) {
  update((s) => {
    const a = s.sos.find((x) => x.alertId === alertId);
    if (a && !a.resolvedAt) {
      a.resolvedAt = nowIso();
      log(s, "sos", `SOS at ${flatLabel(a.block, a.flat)} marked resolved`, a.block, a.flat);
    }
  });
}

// ── Identity ───────────────────────────────────────────────────────────────

/** Change who the demo resident is. Moving flats re-seeds so the demo data follows them. */
export function setResident(next: Resident) {
  update((s) => {
    const moved = s.resident.block !== next.block || s.resident.flat !== next.flat;
    if (moved) Object.assign(s, createSeed(next));
    else s.resident = next;
  });
}

export { resetDemo };
