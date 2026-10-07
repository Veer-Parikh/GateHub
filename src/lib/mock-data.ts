// Mock Data and Demo Authentication Engine for NexGate

export interface DemoResident {
  userId: string;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  room: {
    room: string;
    block: string;
    society: string;
    Maintenance?: MaintenanceItem[];
  };
}

export interface MaintenanceItem {
  maintenanceId: string;
  amount: number;
  paid: boolean;
  month: string;
  year: string;
  dueDate?: string;
  breakdown?: {
    sinkingFund: number;
    waterElectricity: number;
    securityOps: number;
    gst: number;
  };
}

export interface VisitorItem {
  visitorId: string;
  name: string;
  purpose: "Delivery" | "Guest" | "Cab" | "Service" | "Contractor";
  number: string | number;
  vehicleNo?: string;
  status: boolean; // true = approved/inside, false = waiting
  hasLeft: boolean;
  createdAt: string;
  updatedAt?: string;
  room?: {
    block: string;
    room: string;
  };
  entryTime?: string;
  exitTime?: string;
  passPin?: string;
}

export interface GatePassItem {
  passId: string;
  guestName: string;
  guestPhone: string;
  pin: string;
  validityHours: number;
  entryType: "Guest" | "Delivery" | "Cab" | "Service";
  vehicleNumber?: string;
  createdAt: string;
  expiresAt: string;
  flat: string;
  status: "ACTIVE" | "USED" | "EXPIRED";
}

export interface ServiceJobItem {
  jobId: string;
  serviceType: "plumber" | "laundry";
  customerName: string;
  customerFlat: string;
  customerPhone: string;
  title: string;
  details: string;
  status: "pending" | "in_progress" | "completed";
  scheduledTime: string;
  estimatedCost: number;
  paymentStatus: "unpaid" | "paid";
}

export interface MarketplaceItem {
  id: string;
  title: string;
  price: number;
  isFree?: boolean;
  category: "Furniture" | "Electronics" | "Kids" | "Bicycles" | "Appliances" | "Books";
  condition: "Brand New" | "Like New" | "Gently Used";
  sellerName: string;
  sellerFlat: string;
  sellerPhone: string;
  description: string;
  postedAt: string;
  likes: number;
}

export const DEMO_CREDENTIALS = {
  user: {
    name: "Arjun",
    password: "password123",
    role: "user",
    label: "Resident",
    displayName: "Arjun Mehta",
    email: "arjun.mehta@nexgate.in",
    flat: "304",
    block: "A",
    society: "Palm Heights Township",
    phone: "+91 98765 43210",
    description: "Tower A, Flat 304 • Resident",
  },
  security: {
    name: "Vikram",
    password: "password123",
    role: "security",
    label: "Guard Console",
    displayName: "Officer Vikram Singh",
    email: "guard.vikram@nexgate.in",
    gate: "North Main Gate 1",
    phone: "+91 98200 88123",
    description: "Gate Console 1 • Duty Marshal",
  },
  plumber: {
    name: "Raju",
    password: "password123",
    role: "plumber",
    label: "Plumber Partner",
    displayName: "Raju Sharma",
    company: "QuickPlumb Services",
    email: "raju.plumber@nexgate.in",
    phone: "+91 98450 01234",
    description: "Verified Society Plumber",
    rating: 4.9,
    jobsCompleted: 142,
  },
  laundry: {
    name: "FreshPress",
    password: "password123",
    role: "laundry",
    label: "Laundry Partner",
    displayName: "FreshPress Laundry",
    company: "FreshPress Care",
    email: "care@freshpress.in",
    phone: "+91 98112 34567",
    description: "Society Laundry Partner",
    rating: 4.8,
    jobsCompleted: 310,
  },
};

const SEED_RESIDENT: DemoResident = {
  userId: "res-001",
  name: "Arjun Mehta",
  email: "arjun.mehta@nexgate.in",
  phone: "+91 98765 43210",
  isAdmin: true,
  room: {
    room: "304",
    block: "A",
    society: "Palm Heights Township",
    Maintenance: [
      {
        maintenanceId: "m-curr",
        amount: 2400,
        paid: false,
        month: "October",
        year: "2026",
        dueDate: "15 Oct 2026",
        breakdown: { sinkingFund: 600, waterElectricity: 900, securityOps: 600, gst: 300 },
      },
      {
        maintenanceId: "m-sep",
        amount: 2400,
        paid: true,
        month: "September",
        year: "2026",
        dueDate: "15 Sep 2026",
        breakdown: { sinkingFund: 600, waterElectricity: 900, securityOps: 600, gst: 300 },
      },
      {
        maintenanceId: "m-aug",
        amount: 2400,
        paid: true,
        month: "August",
        year: "2026",
        dueDate: "15 Aug 2026",
        breakdown: { sinkingFund: 600, waterElectricity: 900, securityOps: 600, gst: 300 },
      },
    ],
  },
};

const SEED_VISITORS: VisitorItem[] = [
  {
    visitorId: "v-101",
    name: "Suresh Kumar (Amazon Prime)",
    purpose: "Delivery",
    number: "9845001234",
    vehicleNo: "KA-05-EP-2104",
    status: false, // waiting for approval
    hasLeft: false,
    createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
    room: { block: "A", room: "304" },
  },
  {
    visitorId: "v-102",
    name: "Pooja & Dev Sharma",
    purpose: "Guest",
    number: "9820011994",
    vehicleNo: "KA-01-MJ-9912",
    status: true, // currently inside
    hasLeft: false,
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    entryTime: "13:45",
    room: { block: "A", room: "304" },
  },
  {
    visitorId: "v-103",
    name: "Uber Driver (Ramesh G.)",
    purpose: "Cab",
    number: "9877112233",
    vehicleNo: "KA-03-AA-4019",
    status: true,
    hasLeft: true,
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
    entryTime: "11:20",
    exitTime: "11:35",
    room: { block: "A", room: "304" },
  },
  {
    visitorId: "v-104",
    name: "Urban Company Deep Clean",
    purpose: "Service",
    number: "9812398123",
    status: false,
    hasLeft: false,
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    room: { block: "B", room: "201" },
  },
];

const SEED_GATE_PASSES: GatePassItem[] = [
  {
    passId: "GP-9401",
    guestName: "Arjun Verma & Family",
    guestPhone: "9876501234",
    pin: "482019",
    validityHours: 6,
    entryType: "Guest",
    vehicleNumber: "KA-03-NB-4412",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 6 * 3600000).toISOString(),
    flat: "Block A - Flat 304",
    status: "ACTIVE",
  },
  {
    passId: "GP-8832",
    guestName: "BlueDart Priority Courier",
    guestPhone: "9812345678",
    pin: "194022",
    validityHours: 2,
    entryType: "Delivery",
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    expiresAt: new Date(Date.now() + 95 * 60000).toISOString(),
    flat: "Block A - Flat 304",
    status: "ACTIVE",
  },
];

const SEED_PLUMBER_JOBS: ServiceJobItem[] = [
  {
    jobId: "job-p1",
    serviceType: "plumber",
    customerName: "Arjun Mehta",
    customerFlat: "A-304",
    customerPhone: "9876543210",
    title: "Kitchen Sink Mixer Tap Leaking",
    details: "Hot water valve dripping continuously. Needs cartridge replacement.",
    status: "in_progress",
    scheduledTime: "Today, 4:00 PM",
    estimatedCost: 350,
    paymentStatus: "unpaid",
  },
  {
    jobId: "job-p2",
    serviceType: "plumber",
    customerName: "Dr. K. Raman",
    customerFlat: "B-502",
    customerPhone: "9811223344",
    title: "Bathroom Flush Cistern Sticking",
    details: "Dual-flush mechanism button stuck down. Water overflowing in bowl.",
    status: "pending",
    scheduledTime: "Today, 5:30 PM",
    estimatedCost: 400,
    paymentStatus: "unpaid",
  },
  {
    jobId: "job-p3",
    serviceType: "plumber",
    customerName: "Sneha Nair",
    customerFlat: "C-108",
    customerPhone: "9899001122",
    title: "Geyser Inlet Connector Replacement",
    details: "Replaced rusted flexible braided connector hose. Verified pressure test.",
    status: "completed",
    scheduledTime: "Yesterday, 11:00 AM",
    estimatedCost: 550,
    paymentStatus: "paid",
  },
];

const SEED_LAUNDRY_JOBS: ServiceJobItem[] = [
  {
    jobId: "job-l1",
    serviceType: "laundry",
    customerName: "Arjun Mehta",
    customerFlat: "A-304",
    customerPhone: "9876543210",
    title: "Dry Clean — 3x Formal Suits + 4 Shirts",
    details: "Gentle press, starch collar, hanger delivery requested.",
    status: "in_progress",
    scheduledTime: "Pickup completed • Delivery Tomorrow 7 PM",
    estimatedCost: 680,
    paymentStatus: "unpaid",
  },
  {
    jobId: "job-l2",
    serviceType: "laundry",
    customerName: "Vikram Roy",
    customerFlat: "A-101",
    customerPhone: "9845012399",
    title: "Curtains & Heavy Drapes Wash (8 Panels)",
    details: "Steam pressing & sanitization cycle.",
    status: "pending",
    scheduledTime: "Pickup scheduled Today 6:00 PM",
    estimatedCost: 1200,
    paymentStatus: "unpaid",
  },
  {
    jobId: "job-l3",
    serviceType: "laundry",
    customerName: "Pooja Hegde",
    customerFlat: "B-303",
    customerPhone: "9820033112",
    title: "Express 24h Wash & Iron — 6kg load",
    details: "Delivered in cotton bundle with invoice.",
    status: "completed",
    scheduledTime: "Delivered Today 10:30 AM",
    estimatedCost: 450,
    paymentStatus: "paid",
  },
];

/**
 * Initializes and retrieves demo datasets from localStorage
 */
export function getOrCreateDemoStore() {
  if (typeof window === "undefined") {
    return {
      resident: SEED_RESIDENT,
      visitors: SEED_VISITORS,
      gatePasses: SEED_GATE_PASSES,
      plumberJobs: SEED_PLUMBER_JOBS,
      laundryJobs: SEED_LAUNDRY_JOBS,
    };
  }

  // Resident profile
  let resident: DemoResident = SEED_RESIDENT;
  const rawResident = localStorage.getItem("nexgate_resident");
  if (!rawResident) {
    localStorage.setItem("nexgate_resident", JSON.stringify(SEED_RESIDENT));
  } else {
    try { resident = JSON.parse(rawResident); } catch {}
  }

  // Visitors
  let visitors: VisitorItem[] = SEED_VISITORS;
  const rawVisitors = localStorage.getItem("nexgate_visitors");
  if (!rawVisitors) {
    localStorage.setItem("nexgate_visitors", JSON.stringify(SEED_VISITORS));
  } else {
    try { visitors = JSON.parse(rawVisitors); } catch {}
  }

  // Gate Passes
  let gatePasses: GatePassItem[] = SEED_GATE_PASSES;
  const rawPasses = localStorage.getItem("nexgate_gatepasses");
  if (!rawPasses) {
    localStorage.setItem("nexgate_gatepasses", JSON.stringify(SEED_GATE_PASSES));
  } else {
    try { gatePasses = JSON.parse(rawPasses); } catch {}
  }

  // Plumber jobs
  let plumberJobs: ServiceJobItem[] = SEED_PLUMBER_JOBS;
  const rawPlumber = localStorage.getItem("nexgate_plumber_jobs");
  if (!rawPlumber) {
    localStorage.setItem("nexgate_plumber_jobs", JSON.stringify(SEED_PLUMBER_JOBS));
  } else {
    try { plumberJobs = JSON.parse(rawPlumber); } catch {}
  }

  // Laundry jobs
  let laundryJobs: ServiceJobItem[] = SEED_LAUNDRY_JOBS;
  const rawLaundry = localStorage.getItem("nexgate_laundry_jobs");
  if (!rawLaundry) {
    localStorage.setItem("nexgate_laundry_jobs", JSON.stringify(SEED_LAUNDRY_JOBS));
  } else {
    try { laundryJobs = JSON.parse(rawLaundry); } catch {}
  }

  return { resident, visitors, gatePasses, plumberJobs, laundryJobs };
}

/**
 * Authenticates a demo user client-side and configures token + session profile
 */
export function authenticateDemoSession(role: "user" | "security" | "plumber" | "laundry", customName?: string) {
  if (typeof window === "undefined") return null;

  // Initialize all storage tables
  getOrCreateDemoStore();

  const cred = DEMO_CREDENTIALS[role];
  const token = `nexgate-demo-jwt-${role}-${Date.now()}`;
  localStorage.setItem("token", token);
  localStorage.setItem("nexgate_current_role", role);

  const sessionUser = {
    ...cred,
    name: customName || cred.name,
    token,
  };
  localStorage.setItem("nexgate_session_user", JSON.stringify(sessionUser));

  return sessionUser;
}

/**
 * Quick helper to approve a visitor locally
 */
export function approveVisitorLocal(visitorId: string): VisitorItem[] {
  if (typeof window === "undefined") return [];
  const { visitors } = getOrCreateDemoStore();
  const updated = visitors.map(v =>
    v.visitorId === visitorId
      ? { ...v, status: true, hasLeft: false, entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      : v
  );
  localStorage.setItem("nexgate_visitors", JSON.stringify(updated));
  return updated;
}

/**
 * Quick helper to deny a visitor locally
 */
export function denyVisitorLocal(visitorId: string): VisitorItem[] {
  if (typeof window === "undefined") return [];
  const { visitors } = getOrCreateDemoStore();
  const updated = visitors.filter(v => v.visitorId !== visitorId);
  localStorage.setItem("nexgate_visitors", JSON.stringify(updated));
  return updated;
}

/**
 * Pay maintenance invoice locally
 */
export function payMaintenanceLocal(maintenanceId: string): DemoResident {
  if (typeof window === "undefined") return SEED_RESIDENT;
  const { resident } = getOrCreateDemoStore();
  if (resident.room.Maintenance) {
    resident.room.Maintenance = resident.room.Maintenance.map(m =>
      m.maintenanceId === maintenanceId ? { ...m, paid: true } : m
    );
  }
  localStorage.setItem("nexgate_resident", JSON.stringify(resident));
  return resident;
}
