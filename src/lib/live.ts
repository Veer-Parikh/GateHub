// Adapters for "live" sessions: call the Express backend and map its records into the
// same shapes the demo store uses, so pages render either source with one code path.

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { BILL_BREAKDOWN, DEFAULT_RESIDENT } from "./seed";
import type {
  Booking,
  MaintenanceBill,
  Meeting,
  Resident,
  ServiceProvider,
  SocietyEvent,
  Visitor,
  VisitorPurpose,
} from "./types";

// ── Backend record shapes (only the fields we read) ────────────────────────

interface ApiUser { userId: string; name: string; email: string; number: string; isAdmin: boolean }
interface ApiRoom { roomId: string; block: string; room: string; users?: ApiUser[] }
interface ApiProfile extends ApiUser { room?: ApiRoom | null }
interface ApiVisitor {
  visitorId: string; name: string; address?: string; purpose: string; number: number | string;
  status: boolean; hasLeft: boolean; createdAt: string; updatedAt: string; security?: { name: string } | null;
}
interface ApiEvent { eventId: string; title: string; details?: string | null; date: string; venue: string; admin?: { name: string } }
interface ApiMeeting {
  meetingId: string; title: string; agenda?: string | null; timing: string; location: string; completed: boolean;
  jitsiLink?: string | null; admin?: { name: string };
}
interface ApiPlumber { plumberId: string; name: string; generalCost: number; serviceHours: string | null; number: string }
interface ApiLaundry { laundryId: string; name: string; generalCost: number; serviceHours: string | null; number: string }
interface ApiBooking {
  bookingId: string; date: string; description: string; createdAt: string; plumberId: string | null; laundryId: string | null;
  plumber?: ApiPlumber | null; laundry?: ApiLaundry | null; Rating?: { rating: number; comment?: string | null }[];
}
interface ApiMaintenance {
  maintenanceId: string; amount: number; paid: boolean; month: string; year: string; createdAt: string; updatedAt: string;
  room?: ApiRoom | null;
}

const PURPOSES: VisitorPurpose[] = ["Guest", "Delivery", "Cab", "Service", "Daily Help"];
const asPurpose = (p: string): VisitorPurpose =>
  PURPOSES.find((x) => x.toLowerCase() === p?.toLowerCase()) ?? "Guest";

// ── Profile ────────────────────────────────────────────────────────────────

export async function fetchProfile(): Promise<Resident> {
  const p = await api<ApiProfile>("/user/my");
  return {
    userId: p.userId,
    name: p.name,
    email: p.email,
    phone: p.number,
    isAdmin: !!p.isAdmin,
    block: p.room?.block ?? "—",
    flat: p.room?.room ?? "—",
    society: DEFAULT_RESIDENT.society,
  };
}

// ── Visitors ───────────────────────────────────────────────────────────────

function mapVisitor(v: ApiVisitor, r: Resident): Visitor {
  return {
    visitorId: v.visitorId,
    name: v.name,
    purpose: asPurpose(v.purpose),
    phone: String(v.number),
    company: v.address || undefined,
    block: r.block,
    flat: r.flat,
    status: v.hasLeft ? "left" : v.status ? "inside" : "waiting",
    createdAt: v.createdAt,
    entryAt: v.status || v.hasLeft ? v.updatedAt : undefined,
    exitAt: v.hasLeft ? v.updatedAt : undefined,
    guardName: v.security?.name,
  };
}

export async function fetchVisitors(r: Resident): Promise<Visitor[]> {
  const [waiting, inside, prev] = await Promise.all([
    api<ApiVisitor[]>("/visitor/waiting"),
    api<ApiVisitor[]>("/visitor/getInside"),
    api<ApiVisitor[]>("/visitor/prev"),
  ]);
  const seen = new Set<string>();
  return [...waiting, ...inside, ...prev]
    .filter((v) => (seen.has(v.visitorId) ? false : (seen.add(v.visitorId), true)))
    .map((v) => mapVisitor(v, r));
}

export const liveVisitor = {
  approve: (visitorId: string) => api("/visitor/inside", { method: "PUT", body: { visitorId } }),
  deny: (visitorId: string) => api("/visitor/delete", { method: "DELETE", body: { visitorId } }),
  checkout: (visitorId: string) => api("/visitor/hasLeft", { method: "PUT", body: { visitorId } }),
};

// ── Events & meetings ──────────────────────────────────────────────────────

export async function fetchEvents(): Promise<SocietyEvent[]> {
  const rows = await api<ApiEvent[]>("/event/all");
  return rows.map((e) => ({
    eventId: e.eventId,
    title: e.title,
    details: e.details ?? "",
    date: e.date,
    venue: e.venue,
    host: e.admin?.name ?? "RWA",
    category: "Notice",
    rsvps: 0,
    going: false,
  }));
}

export function createEventLive(v: { title: string; details: string; date: string; venue: string }) {
  return api("/event/create", { method: "POST", body: { ...v, date: new Date(v.date).toISOString() } });
}

export async function fetchMeetings(): Promise<Meeting[]> {
  const rows = await api<ApiMeeting[]>("/meeting/all");
  return rows.map((m) => ({
    meetingId: m.meetingId,
    title: m.title,
    agenda: m.agenda ?? "",
    timing: m.timing,
    location: m.location,
    online: !!m.jitsiLink || m.location.toLowerCase() === "online",
    link: m.jitsiLink ?? undefined,
    host: m.admin?.name ?? "RWA",
    completed: m.completed,
  }));
}

export function createMeetingLive(v: { title: string; agenda: string; timing: string; location: string; link?: string }) {
  return api("/meeting/create", {
    method: "POST",
    body: {
      title: v.title,
      agenda: v.agenda,
      timing: new Date(v.timing).toISOString(),
      location: v.location,
      jitsiLink: v.link,
      jitsiId: v.link?.split("/").pop(),
    },
  });
}

export const completeMeetingLive = (meetingId: string) => api(`/meeting/complete/${meetingId}`, { method: "PUT" });

// ── Service bookings ───────────────────────────────────────────────────────

function mapProvider(p: ApiPlumber | ApiLaundry): ServiceProvider {
  const isPlumber = "plumberId" in p;
  return {
    providerId: isPlumber ? p.plumberId : p.laundryId,
    type: isPlumber ? "plumber" : "laundry",
    name: p.name,
    phone: p.number,
    baseCost: p.generalCost,
    hours: p.serviceHours ?? "—",
    rating: 0,
    jobsDone: 0,
  };
}

export async function fetchProviders(): Promise<ServiceProvider[]> {
  const [plumbers, laundries] = await Promise.all([api<ApiPlumber[]>("/plumber/get"), api<ApiLaundry[]>("/laundry/get")]);
  return [...plumbers.map(mapProvider), ...laundries.map(mapProvider)];
}

export async function fetchBookings(r: Resident): Promise<Booking[]> {
  const rows = await api<ApiBooking[]>("/booking/getUser");
  return rows.map((b) => {
    const provider = b.plumber ?? b.laundry;
    const rating = b.Rating?.[0];
    // The backend has no job status; infer it from the scheduled date.
    const past = new Date(b.date).getTime() < Date.now();
    return {
      bookingId: b.bookingId,
      type: b.plumberId ? "plumber" : "laundry",
      providerId: b.plumberId ?? b.laundryId ?? "",
      providerName: provider?.name ?? "Service partner",
      title: b.description.split(/[.\n]/)[0].slice(0, 60) || "Service request",
      description: b.description,
      scheduledFor: b.date,
      createdAt: b.createdAt,
      customerName: r.name,
      block: r.block,
      flat: r.flat,
      phone: r.phone,
      status: past ? "completed" : "requested",
      cost: provider?.generalCost ?? 0,
      rating: rating?.rating,
      review: rating?.comment ?? undefined,
    } satisfies Booking;
  });
}

export function createBookingLive(p: ServiceProvider, v: { title: string; description: string; scheduledFor: string }) {
  return api("/booking/create", {
    method: "POST",
    body: {
      date: v.scheduledFor,
      description: v.description ? `${v.title}. ${v.description}` : v.title,
      [p.type === "plumber" ? "plumberId" : "laundryId"]: p.providerId,
    },
  });
}

export const cancelBookingLive = (bookingId: string) => api(`/booking/delete/${bookingId}`, { method: "DELETE" });
export const rateBookingLive = (bookingId: string, rating: number, comment: string) =>
  api("/rating/create", { method: "POST", body: { bookingId, rating, comment } });

// ── Maintenance ────────────────────────────────────────────────────────────

function mapBill(m: ApiMaintenance, fallback: Resident): MaintenanceBill {
  const owner = m.room?.users?.[0];
  const year = Number(m.year) || new Date().getFullYear();
  const monthIdx = new Date(`${m.month} 1, ${year}`).getMonth();
  const due = new Date(year, Number.isNaN(monthIdx) ? 0 : monthIdx, 15).toISOString();
  return {
    billId: m.maintenanceId,
    block: m.room?.block ?? fallback.block,
    flat: m.room?.room ?? fallback.flat,
    residentName: owner?.name ?? fallback.name,
    phone: owner?.number ?? fallback.phone,
    month: m.month,
    year,
    amount: m.amount,
    dueDate: due,
    breakdown: [{ label: "Maintenance", amount: m.amount }],
    paidAt: m.paid ? m.updatedAt : undefined,
  };
}

export async function fetchBills(r: Resident): Promise<{ mine: MaintenanceBill[]; society: MaintenanceBill[] }> {
  const [unpaid, paid] = await Promise.all([
    api<ApiMaintenance[]>("/maintenance/userUnpaid"),
    api<ApiMaintenance[]>("/maintenance/userPaid"),
  ]);
  let society: MaintenanceBill[] = [];
  if (r.isAdmin) {
    try {
      society = (await api<ApiMaintenance[]>("/maintenance/allUnpaid")).map((m) => mapBill(m, r));
    } catch {
      society = [];
    }
  }
  return { mine: [...unpaid, ...paid].map((m) => mapBill(m, r)), society };
}

export const sendMaintenanceLive = (amount: number, month: string, year: string) =>
  api("/maintenance/send", { method: "POST", body: { amount, month, year } });

export const markBillPaidLive = (maintenanceId: string) =>
  api("/maintenance/update", { method: "PATCH", body: { maintenanceId } });

/** Breakdown used for display when the backend only stores a total. */
export function estimatedBreakdown(amount: number) {
  const total = BILL_BREAKDOWN.reduce((s, l) => s + l.amount, 0);
  return BILL_BREAKDOWN.map((l) => ({ label: l.label, amount: Math.round((l.amount / total) * amount) }));
}

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * Fetch live data when `fetcher` is provided (i.e. in a live session). Pass `null` in demo
 * mode and the hook stays idle. `refresh()` re-runs the fetcher.
 */
export function useLive<T>(fetcher: (() => Promise<T>) | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!fetcher);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    const f = fetcherRef.current;
    if (!f) return;
    setLoading(true);
    try {
      setData(await f());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const enabled = !!fetcher;
  useEffect(() => {
    if (enabled) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, refresh, ...deps]);

  return { data, error, loading: enabled && loading, refresh };
}
