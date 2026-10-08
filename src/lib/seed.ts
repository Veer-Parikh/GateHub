// Seed data for the offline demo. Every timestamp is relative to `now` so a freshly
// seeded store always looks "live" (visitor waiting 3 minutes, pass expiring in 95 minutes…).

import { format, setDate, subMonths } from "date-fns";
import type {
  ActivityItem,
  Booking,
  DemoState,
  GatePass,
  Listing,
  MaintenanceBill,
  Meeting,
  PointsEntry,
  Resident,
  ServiceProvider,
  SocietyEvent,
  SosAlert,
  Visitor,
} from "./types";

export const STORE_VERSION = 3;

export const DEFAULT_RESIDENT: Resident = {
  userId: "res-001",
  name: "Arjun Mehta",
  email: "arjun.mehta@nexgate.in",
  phone: "9876543210",
  isAdmin: true,
  block: "A",
  flat: "304",
  society: "Palm Heights Township",
};

export const BLOCKS = ["A", "B", "C", "D"];

/** Flats 101–804: 8 floors × 4 flats per block. Used when the backend room list is unavailable. */
export function demoFlats() {
  const flats: string[] = [];
  for (let floor = 1; floor <= 8; floor++) {
    for (let unit = 1; unit <= 4; unit++) flats.push(`${floor}${String(unit).padStart(2, "0")}`);
  }
  return flats;
}

export const BILL_BREAKDOWN = [
  { label: "Sinking fund", amount: 600 },
  { label: "Common water & electricity", amount: 900 },
  { label: "Security & housekeeping", amount: 600 },
  { label: "GST (18% on services)", amount: 300 },
];
export const BILL_AMOUNT = BILL_BREAKDOWN.reduce((s, l) => s + l.amount, 0);

const OTHER_RESIDENTS = [
  { name: "Vikram Roy", block: "A", flat: "101", phone: "9845012399" },
  { name: "Rahul Deshmukh", block: "A", flat: "102", phone: "9820011223" },
  { name: "Aditya Roy", block: "A", flat: "201", phone: "9845012300" },
  { name: "Neha Mathur", block: "B", flat: "404", phone: "9871122334" },
  { name: "Dr. K. Raman", block: "B", flat: "502", phone: "9811223344" },
  { name: "Pooja Hegde", block: "B", flat: "303", phone: "9820033112" },
  { name: "Siddharth Rao", block: "B", flat: "603", phone: "9900118822" },
  { name: "Vikram Malhotra", block: "B", flat: "104", phone: "9812300000" },
  { name: "Sneha Nair", block: "C", flat: "108", phone: "9899001122" },
  { name: "Priya Rao", block: "C", flat: "402", phone: "9812311111" },
  { name: "Pooja Varma", block: "C", flat: "702", phone: "9731201122" },
  { name: "Karthik Nair", block: "D", flat: "105", phone: "9820033441" },
  { name: "Anita Bose", block: "D", flat: "306", phone: "9833012345" },
];

export function createSeed(resident: Resident = DEFAULT_RESIDENT, nowMs: number = Date.now()): DemoState {
  const now = new Date(nowMs);
  const iso = (ms: number) => new Date(ms).toISOString();
  const ago = (mins: number) => iso(nowMs - mins * 60_000);
  const ahead = (mins: number) => iso(nowMs + mins * 60_000);
  /** Next half-hour slot at least `hours` from now — keeps "Today, 4:30 PM" style times tidy. */
  const slot = (hours: number) => {
    const t = nowMs + hours * 3_600_000;
    return iso(Math.ceil(t / 1_800_000) * 1_800_000);
  };
  const { block, flat, name: me, phone: myPhone } = resident;

  // ── Visitors ──────────────────────────────────────────────────────────────
  const visitors: Visitor[] = [
    {
      visitorId: "v-101", name: "Suresh Kumar", company: "Amazon", purpose: "Delivery", phone: "9845001234",
      vehicleNo: "KA-05-EP-2104", block, flat, status: "waiting", createdAt: ago(3), guardName: "Vikram Singh",
    },
    {
      visitorId: "v-102", name: "Pooja & Dev Sharma", purpose: "Guest", phone: "9820011994", vehicleNo: "KA-01-MJ-9912",
      block, flat, status: "inside", createdAt: ago(47), decidedAt: ago(46), decidedBy: "resident", entryAt: ago(45),
      guardName: "Vikram Singh",
    },
    {
      visitorId: "v-103", name: "Ramesh G.", company: "Uber", purpose: "Cab", phone: "9877112233", vehicleNo: "KA-03-AA-4019",
      block, flat, status: "left", createdAt: ago(182), decidedAt: ago(181), decidedBy: "resident", entryAt: ago(180),
      exitAt: ago(165), guardName: "Vikram Singh",
    },
    {
      visitorId: "v-104", name: "Meena Krishnan", purpose: "Daily Help", phone: "9876500011", block, flat, status: "left",
      createdAt: ago(370), decidedAt: ago(370), decidedBy: "guard", entryAt: ago(368), exitAt: ago(250), guardName: "Suresh P.",
    },
    {
      visitorId: "v-105", name: "Urban Company — Deep Clean", company: "Urban Company", purpose: "Service", phone: "9812398123",
      block: "B", flat: "201", status: "waiting", createdAt: ago(6), guardName: "Vikram Singh",
    },
    {
      visitorId: "v-106", name: "Ravi (Swiggy)", company: "Swiggy", purpose: "Delivery", phone: "9877001100",
      vehicleNo: "KA-03-EX-1011", block: "B", flat: "502", status: "inside", createdAt: ago(12), decidedAt: ago(11),
      decidedBy: "resident", entryAt: ago(10), guardName: "Vikram Singh",
    },
    {
      visitorId: "v-107", name: "AC Technician", company: "Urban Company", purpose: "Service", phone: "9812345000",
      vehicleNo: "KA-05-SR-2200", block: "C", flat: "204", status: "inside", createdAt: ago(42), decidedAt: ago(40),
      decidedBy: "resident", entryAt: ago(39), guardName: "Vikram Singh",
    },
    {
      visitorId: "v-108", name: "Kavya Deshmukh", purpose: "Guest", phone: "9820099887", block: "A", flat: "102",
      status: "inside", createdAt: ago(82), decidedAt: ago(81), decidedBy: "resident", entryAt: ago(80), guardName: "Vikram Singh",
    },
    {
      visitorId: "v-109", name: "Imran (Zomato)", company: "Zomato", purpose: "Delivery", phone: "9900112244",
      block: "B", flat: "303", status: "left", createdAt: ago(130), decidedAt: ago(129), decidedBy: "resident",
      entryAt: ago(128), exitAt: ago(120), guardName: "Vikram Singh",
    },
    {
      visitorId: "v-110", name: "Door-to-door sales rep", purpose: "Service", phone: "9811000222", block: "C", flat: "702",
      status: "denied", createdAt: ago(140), decidedAt: ago(138), decidedBy: "resident", guardName: "Vikram Singh",
    },
  ];

  // ── Gate passes ───────────────────────────────────────────────────────────
  const passes: GatePass[] = [
    {
      passId: "GP-9401", guestName: "Arjun Verma & Family", guestPhone: "9876501234", pin: "482019", entryType: "Guest",
      vehicleNo: "KA-03-NB-4412", block, flat, createdAt: ago(30), expiresAt: ahead(330),
    },
    {
      passId: "GP-8832", guestName: "BlueDart Priority Courier", guestPhone: "9812345678", pin: "194022",
      entryType: "Delivery", block, flat, createdAt: ago(25), expiresAt: ahead(95),
    },
    {
      passId: "GP-7710", guestName: "Uber — airport pickup", pin: "650318", entryType: "Cab", vehicleNo: "KA-51-AB-7788",
      block, flat, createdAt: ago(26 * 60), expiresAt: ago(22 * 60), usedAt: ago(25 * 60),
    },
    {
      passId: "GP-6604", guestName: "Nikhil (cousin)", pin: "305527", entryType: "Guest", block, flat,
      createdAt: ago(3 * 24 * 60), expiresAt: ago(3 * 24 * 60 - 240),
    },
  ];

  // ── Maintenance ───────────────────────────────────────────────────────────
  const monthOf = (d: Date) => ({ month: format(d, "MMMM"), year: d.getFullYear() });
  const fifteenth = (d: Date) => setDate(d, 15).toISOString();
  const cur = monthOf(now);
  const prev1 = subMonths(now, 1);
  const prev2 = subMonths(now, 2);
  const bill = (
    id: string, who: { name: string; block: string; flat: string; phone: string }, m: { month: string; year: number },
    dueDate: string, paidAt?: string,
  ): MaintenanceBill => ({
    billId: id, block: who.block, flat: who.flat, residentName: who.name, phone: who.phone, ...m, amount: BILL_AMOUNT,
    dueDate, breakdown: BILL_BREAKDOWN, ...(paidAt ? { paidAt, method: "UPI", txnId: `TXN${id.replace(/\W/g, "").toUpperCase()}` } : {}),
  });
  const meWho = { name: me, block, flat, phone: myPhone };
  const currentDue = ahead(7 * 24 * 60);
  const bills: MaintenanceBill[] = [
    bill("mb-cur", meWho, cur, currentDue),
    bill("mb-p1", meWho, monthOf(prev1), fifteenth(prev1), setDate(prev1, 10).toISOString()),
    bill("mb-p2", meWho, monthOf(prev2), fifteenth(prev2), setDate(prev2, 12).toISOString()),
    // Society-wide ledger for the current cycle (about two thirds already collected)
    ...OTHER_RESIDENTS.map((r, i) =>
      bill(`mb-o${i}`, r, cur, currentDue, i % 3 === 2 ? undefined : ago((i + 1) * 9 * 60)),
    ),
  ];

  // ── Service partners & bookings ───────────────────────────────────────────
  const providers: ServiceProvider[] = [
    { providerId: "p1", type: "plumber", name: "Raju Sharma", company: "QuickPlumb Services", phone: "9845001234", baseCost: 350, hours: "8 AM – 8 PM", rating: 4.9, jobsDone: 142 },
    { providerId: "p2", type: "plumber", name: "Akbar Pipe Works", phone: "9811223344", baseCost: 280, hours: "9 AM – 6 PM", rating: 4.6, jobsDone: 88 },
    { providerId: "p3", type: "plumber", name: "QuickFix 24×7", phone: "9988776655", baseCost: 450, hours: "24×7", rating: 4.4, jobsDone: 61 },
    { providerId: "l1", type: "laundry", name: "FreshPress Laundry", company: "FreshPress Care", phone: "9811234567", baseCost: 120, hours: "7 AM – 9 PM", rating: 4.8, jobsDone: 310 },
    { providerId: "l2", type: "laundry", name: "SteamClean Express", phone: "9800123456", baseCost: 150, hours: "8 AM – 8 PM", rating: 4.5, jobsDone: 97 },
  ];
  const raju = providers[0];
  const fresh = providers[3];
  const other = (n: string) => OTHER_RESIDENTS.find((r) => r.name === n)!;
  const booking = (b: Omit<Booking, "providerName" | "customerName" | "block" | "flat" | "phone"> & {
    who: { name: string; block: string; flat: string; phone: string };
  }): Booking => {
    const { who, ...rest } = b;
    const p = providers.find((x) => x.providerId === b.providerId)!;
    return { ...rest, providerName: p.name, customerName: who.name, block: who.block, flat: who.flat, phone: who.phone };
  };
  const bookings: Booking[] = [
    booking({
      bookingId: "bk-101", type: "plumber", providerId: raju.providerId, title: "Kitchen sink mixer tap leaking",
      description: "Hot water valve dripping continuously. Probably needs a cartridge replacement.",
      scheduledFor: slot(1.5), createdAt: ago(5 * 60), status: "in_progress", startedAt: ago(10), cost: 350, who: meWho,
    }),
    booking({
      bookingId: "bk-102", type: "plumber", providerId: raju.providerId, title: "Flush cistern sticking",
      description: "Dual-flush button stuck down, water overflowing in the bowl.",
      scheduledFor: slot(3.5), createdAt: ago(90), status: "requested", cost: 400, who: other("Dr. K. Raman"),
    }),
    booking({
      bookingId: "bk-103", type: "plumber", providerId: raju.providerId, title: "Geyser inlet connector replacement",
      description: "Replace rusted braided hose and pressure-test.", scheduledFor: ago(26 * 60), createdAt: ago(48 * 60),
      status: "completed", startedAt: ago(26 * 60), completedAt: ago(25 * 60), cost: 550, rating: 5,
      review: "Quick, tidy and explained everything.", who: other("Sneha Nair"),
    }),
    booking({
      bookingId: "bk-104", type: "plumber", providerId: raju.providerId, title: "Bathroom tap washer change",
      description: "Wash basin tap not closing fully.", scheduledFor: ago(12 * 24 * 60), createdAt: ago(13 * 24 * 60),
      status: "completed", startedAt: ago(12 * 24 * 60), completedAt: ago(12 * 24 * 60 - 40), cost: 350, rating: 5,
      review: "On time and fair pricing.", who: meWho,
    }),
    booking({
      bookingId: "bk-201", type: "laundry", providerId: fresh.providerId, title: "Dry clean — 3 suits + 4 shirts",
      description: "Gentle press, starched collars, hanger delivery.", scheduledFor: ago(20 * 60), createdAt: ago(26 * 60),
      status: "in_progress", startedAt: ago(19 * 60), cost: 680, who: meWho,
    }),
    booking({
      bookingId: "bk-202", type: "laundry", providerId: fresh.providerId, title: "Curtains & drapes wash (8 panels)",
      description: "Steam press and sanitisation cycle.", scheduledFor: slot(4), createdAt: ago(3 * 60), status: "requested",
      cost: 1200, who: other("Vikram Roy"),
    }),
    booking({
      bookingId: "bk-203", type: "laundry", providerId: fresh.providerId, title: "Express wash & iron — 6 kg",
      description: "Cotton bundle, 24h express.", scheduledFor: ago(30 * 60), createdAt: ago(32 * 60), status: "completed",
      startedAt: ago(29 * 60), completedAt: ago(5 * 60), cost: 450, rating: 4, review: "Good, one shirt slightly creased.",
      who: other("Pooja Hegde"),
    }),
    booking({
      bookingId: "bk-204", type: "laundry", providerId: fresh.providerId, title: "Wash & fold — 5 kg",
      description: "Regular weekly load.", scheduledFor: ago(9 * 24 * 60), createdAt: ago(10 * 24 * 60), status: "completed",
      startedAt: ago(9 * 24 * 60), completedAt: ago(8 * 24 * 60), cost: 300, who: meWho,
    }),
  ];

  // ── Marketplace ───────────────────────────────────────────────────────────
  const listing = (l: Omit<Listing, "liked" | "sellerName" | "block" | "flat" | "phone"> & {
    who: { name: string; block: string; flat: string; phone: string };
  }): Listing => {
    const { who, ...rest } = l;
    return { ...rest, liked: false, sellerName: who.name, block: who.block, flat: who.flat, phone: who.phone };
  };
  const listings: Listing[] = [
    listing({ id: "ls-1", title: "IKEA POÄNG armchair & footstool", price: 3200, category: "Furniture", condition: "Like New", description: "Barely used for 4 months. Moving-out sale, pickup from the 4th floor.", createdAt: ago(2 * 60), likes: 12, who: other("Neha Mathur") }),
    listing({ id: "ls-2", title: "Hero Sprint Pro 21-speed mountain bike", price: 4500, category: "Bicycles", condition: "Gently Used", description: "Serviced last month, dual disc brakes. Great for rides around the society loop.", createdAt: ago(5 * 60), likes: 8, who: other("Aditya Roy") }),
    listing({ id: "ls-3", title: "Philips digital air fryer HD9252 (4.1 L)", price: 2800, category: "Appliances", condition: "Like New", description: "Under warranty until next year. Box and accessories included.", createdAt: ago(26 * 60), likes: 19, who: other("Pooja Varma") }),
    listing({ id: "ls-4", title: "Chicco baby crib & playard", price: 0, category: "Kids", condition: "Gently Used", description: "Free to any new parents in the society. Cleaned and sanitised.", createdAt: ago(28 * 60), likes: 27, who: other("Siddharth Rao") }),
    listing({ id: "ls-5", title: "Kindle Paperwhite 10th gen (8 GB)", price: 3900, category: "Electronics", condition: "Like New", description: "Battery easily lasts 3 weeks. Comes with a magnetic flip cover.", createdAt: ago(50 * 60), likes: 15, who: other("Karthik Nair") }),
    listing({ id: "ls-6", title: "NCERT + reference books, Class 10 set", price: 600, category: "Books", condition: "Gently Used", description: "Full Science & Maths set with a few notes in pencil.", createdAt: ago(3 * 24 * 60), likes: 4, who: other("Anita Bose") }),
    listing({ id: "ls-7", title: "Solid wood study table", price: 1800, category: "Furniture", condition: "Gently Used", description: "120 × 60 cm with one drawer. Minor scratches on the top.", createdAt: ago(4 * 24 * 60), likes: 6, who: meWho }),
  ];

  // ── Events & meetings ─────────────────────────────────────────────────────
  const events: SocietyEvent[] = [
    { eventId: "ev-1", title: "Overhead water tank cleaning", details: "Water supply shut-off from 1 PM to 4 PM for Towers A and B. Please store water in advance.", date: slot(2 * 24), venue: "Towers A & B", host: "Facility Desk", category: "Notice", rsvps: 0, going: false },
    { eventId: "ev-2", title: "Annual Sports Meet", details: "Cricket tournament, badminton doubles and athletics for all age groups. Register your team at the clubhouse.", date: slot(5 * 24), venue: "Main clubhouse ground", host: "Suresh Menon (Secretary)", category: "Sports", rsvps: 64, going: true },
    { eventId: "ev-3", title: "Diwali Community Festival", details: "Cultural performances, food stalls by residents and a rangoli competition at the central courtyard.", date: slot(12 * 24), venue: "Central courtyard", host: "Priya Iyer (Cultural Committee)", category: "Festival", rsvps: 128, going: false },
    { eventId: "ev-4", title: "First-aid & CPR workshop", details: "Hands-on session by St. John Ambulance volunteers. Limited to 30 participants.", date: slot(8 * 24), venue: "Community hall, 3rd floor", host: "Dr. K. Raman", category: "Workshop", rsvps: 21, going: false },
    { eventId: "ev-5", title: "Youth summer workshop orientation", details: "Robotics, arts, swimming and chess instruction for school-age residents.", date: ago(7 * 24 * 60), venue: "Basement activity centre", host: "Anita Bose", category: "Workshop", rsvps: 42, going: false },
  ];

  const meetings: Meeting[] = [
    { meetingId: "mt-1", title: "Quarterly budget & capital expenditure review", agenda: "Review maintenance fund spend for the quarter. Vote on gym renovation and rooftop solar installation.", timing: slot(2 * 24), location: "Community hall, 2nd floor", online: false, host: "Rajesh Kumar (President)", completed: false },
    { meetingId: "mt-2", title: "Security & guard operations town hall", agenda: "CCTV coverage upgrade, visitor PIN-pass adoption, and night patrol rota.", timing: slot(4 * 24), location: "Online", online: true, link: "https://meet.jit.si/nexgate-palm-heights-security-townhall", host: "Rajesh Kumar (President)", completed: false },
    { meetingId: "mt-3", title: "Annual General Body Meeting (AGM)", agenda: "Annual audit report, committee elections and security upgrades. Quorum required.", timing: slot(6 * 24), location: "Clubhouse main hall", online: true, link: "https://meet.jit.si/nexgate-palm-heights-agm", host: "RWA Committee", completed: false },
    { meetingId: "mt-4", title: "Garden & perimeter landscaping review", agenda: "Resident feedback on lawn irrigation, pathway pavers and tree pruning.", timing: ago(5 * 24 * 60), location: "Tower B lobby", online: false, host: "Anita Bose", completed: true, attended: true, minutes: "Approved drip irrigation for the central lawn (₹1.2L). Pruning contract renewed. Pathway pavers deferred to next quarter." },
  ];

  // ── Emergency history ─────────────────────────────────────────────────────
  const sos: SosAlert[] = [
    { alertId: "sos-1", type: "lift", title: "Elevator entrapment", block: "C", flat: "402", residentName: "Priya Rao", phone: "9812311111", raisedAt: ago(9 * 24 * 60), acknowledgedAt: ago(9 * 24 * 60 - 1), acknowledgedBy: "Vikram Singh", resolvedAt: ago(9 * 24 * 60 - 18) },
  ];

  // ── Gamification ledger (resident) ────────────────────────────────────────
  const points: PointsEntry[] = [
    { id: "pt-1", at: setDate(prev2, 12).toISOString(), points: 50, reason: `Paid ${format(prev2, "MMMM")} maintenance before the due date`, kind: "payment", ref: "bill:mb-p2", bonus: true },
    { id: "pt-2", at: setDate(prev1, 10).toISOString(), points: 50, reason: `Paid ${format(prev1, "MMMM")} maintenance before the due date`, kind: "payment", ref: "bill:mb-p1", bonus: true },
    { id: "pt-3", at: ago(12 * 24 * 60 - 60), points: 15, reason: "Reviewed Raju Sharma", kind: "review", ref: "review:bk-104" },
    { id: "pt-4", at: ago(4 * 24 * 60), points: 10, reason: "Listed “Solid wood study table”", kind: "listing", ref: "listing:ls-7" },
    { id: "pt-5", at: ago(3 * 24 * 60), points: 10, reason: "RSVP’d to Annual Sports Meet", kind: "rsvp", ref: "rsvp:ev-2" },
    { id: "pt-6", at: ago(26 * 60), points: 5, reason: "Issued a gate pass", kind: "gatepass", ref: "pass:GP-7710" },
    { id: "pt-7", at: ago(181), points: 5, reason: "Responded to a visitor within 2 minutes", kind: "visitor", ref: "visitor:v-103", bonus: true },
    { id: "pt-8", at: ago(46), points: 5, reason: "Responded to a visitor within 2 minutes", kind: "visitor", ref: "visitor:v-102", bonus: true },
    { id: "pt-9", at: ago(30), points: 5, reason: "Issued a gate pass", kind: "gatepass", ref: "pass:GP-9401" },
    { id: "pt-10", at: ago(25), points: 5, reason: "Issued a gate pass", kind: "gatepass", ref: "pass:GP-8832" },
  ];

  const activity: ActivityItem[] = [
    { id: "ac-1", at: ago(3), kind: "visitor", text: "Suresh Kumar (Amazon) is waiting at the main gate", block, flat },
    { id: "ac-2", at: ago(10), kind: "booking", text: "Raju Sharma started work on “Kitchen sink mixer tap leaking”", block, flat },
    { id: "ac-3", at: ago(25), kind: "pass", text: "Gate pass issued for BlueDart Priority Courier", block, flat },
    { id: "ac-4", at: ago(45), kind: "visitor", text: "Pooja & Dev Sharma entered the premises", block, flat },
    { id: "ac-5", at: ago(165), kind: "visitor", text: "Ramesh G. (Uber) checked out", block, flat },
  ];

  const stamp = iso(nowMs);
  return {
    version: STORE_VERSION,
    seededAt: stamp,
    updatedAt: stamp,
    resident,
    visitors,
    passes,
    bills,
    providers,
    bookings,
    listings,
    events,
    meetings,
    sos,
    points,
    activity,
  };
}
