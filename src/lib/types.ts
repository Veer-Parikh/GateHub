// Shared domain types for NexGate. Demo store and live-API adapters both map into these.

export type Role = "user" | "security" | "plumber" | "laundry";
export type ServiceType = "plumber" | "laundry";

export interface Resident {
  userId: string;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  block: string;
  flat: string;
  society: string;
}

export type VisitorPurpose = "Guest" | "Delivery" | "Cab" | "Service" | "Daily Help";
export type VisitorStatus = "waiting" | "inside" | "left" | "denied";

export interface Visitor {
  visitorId: string;
  name: string;
  purpose: VisitorPurpose;
  phone: string;
  vehicleNo?: string;
  company?: string;
  block: string;
  flat: string;
  status: VisitorStatus;
  /** Arrival at the gate */
  createdAt: string;
  decidedAt?: string;
  decidedBy?: "resident" | "guard" | "pass";
  entryAt?: string;
  exitAt?: string;
  passId?: string;
  guardName?: string;
}

export type PassType = "Guest" | "Delivery" | "Cab" | "Service";
export type PassStatus = "active" | "used" | "expired" | "revoked";

export interface GatePass {
  passId: string;
  guestName: string;
  guestPhone?: string;
  pin: string;
  entryType: PassType;
  vehicleNo?: string;
  block: string;
  flat: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  revokedAt?: string;
}

export interface BillLine {
  label: string;
  amount: number;
}

export interface MaintenanceBill {
  billId: string;
  block: string;
  flat: string;
  residentName: string;
  phone: string;
  month: string;
  year: number;
  amount: number;
  dueDate: string;
  breakdown: BillLine[];
  paidAt?: string;
  method?: string;
  txnId?: string;
  remindedAt?: string;
}

export interface ServiceProvider {
  providerId: string;
  type: ServiceType;
  name: string;
  company?: string;
  phone: string;
  baseCost: number;
  hours: string;
  rating: number;
  jobsDone: number;
}

export type BookingStatus = "requested" | "in_progress" | "completed" | "cancelled";

export interface Booking {
  bookingId: string;
  type: ServiceType;
  providerId: string;
  providerName: string;
  title: string;
  description: string;
  scheduledFor: string;
  createdAt: string;
  customerName: string;
  block: string;
  flat: string;
  phone: string;
  status: BookingStatus;
  cost: number;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  rating?: number;
  review?: string;
}

export type ListingCategory = "Furniture" | "Electronics" | "Kids" | "Bicycles" | "Appliances" | "Books";
export type ListingCondition = "Brand New" | "Like New" | "Gently Used";

export interface Listing {
  id: string;
  title: string;
  price: number;
  category: ListingCategory;
  condition: ListingCondition;
  description: string;
  sellerName: string;
  block: string;
  flat: string;
  phone: string;
  createdAt: string;
  likes: number;
  liked: boolean;
  soldAt?: string;
}

export type EventCategory = "Festival" | "Sports" | "Meeting" | "Workshop" | "Notice";

export interface SocietyEvent {
  eventId: string;
  title: string;
  details: string;
  date: string;
  venue: string;
  host: string;
  category: EventCategory;
  rsvps: number;
  going: boolean;
}

export interface Meeting {
  meetingId: string;
  title: string;
  agenda: string;
  timing: string;
  location: string;
  online: boolean;
  link?: string;
  host: string;
  completed: boolean;
  minutes?: string;
  attended?: boolean;
}

export type SosType = "medical" | "fire" | "lift" | "security";

export interface SosAlert {
  alertId: string;
  type: SosType;
  title: string;
  block: string;
  flat: string;
  residentName: string;
  phone: string;
  raisedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  cancelledAt?: string;
}

export type PointsKind =
  | "payment"
  | "visitor"
  | "gatepass"
  | "listing"
  | "giveaway"
  | "review"
  | "rsvp"
  | "meeting";

export interface PointsEntry {
  id: string;
  at: string;
  points: number;
  reason: string;
  kind: PointsKind;
  /** De-duplication key so the same action can't be farmed for points */
  ref: string;
  /** Extra flag used by badge rules (e.g. on-time payment, quick response) */
  bonus?: boolean;
}

export type ActivityKind = "visitor" | "pass" | "payment" | "booking" | "sos" | "market" | "event" | "meeting";

export interface ActivityItem {
  id: string;
  at: string;
  kind: ActivityKind;
  text: string;
  block?: string;
  flat?: string;
}

export interface DemoState {
  version: number;
  seededAt: string;
  updatedAt: string;
  resident: Resident;
  visitors: Visitor[];
  passes: GatePass[];
  bills: MaintenanceBill[];
  providers: ServiceProvider[];
  bookings: Booking[];
  listings: Listing[];
  events: SocietyEvent[];
  meetings: Meeting[];
  sos: SosAlert[];
  points: PointsEntry[];
  activity: ActivityItem[];
}
