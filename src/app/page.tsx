"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Shield,
  Menu,
  X,
  Check,
  Minus,
  Sun,
  Moon,
  QrCode,
  BellRing,
  UserCheck,
  Receipt,
  Siren,
  ShoppingBag,
  Wrench,
  CheckCircle2,
  Clock,
  Sparkles,
  Play,
  RotateCcw,
  Utensils,
  Package,
  Car,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Gate Simulator", href: "#simulator" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

const STATS = [
  { value: "2,400+", label: "Gated Communities", badge: "Verified" },
  { value: "1.2M+", label: "Active Residents", badge: "Pan-India" },
  { value: "< 3.5s", label: "Gate Pass Clearance", badge: "Real-time" },
  { value: "99.98%", label: "Uptime SLA", badge: "Enterprise" },
];

const FEATURES = [
  {
    number: "01",
    tag: "Access Control",
    title: "Digital Gate Access & PIN Passes",
    body: "Generate instant 6-digit OTP passes for guests, deliveries, and cabs. Guards verify in 2 taps. Zero paper registers, zero phone delays.",
    color: "emerald",
  },
  {
    number: "02",
    tag: "Real-time Intercom",
    title: "Instant Visitor Push Approvals",
    body: "Receive live visitor photos and vehicle numbers directly on your phone. Approve or decline from anywhere — flat, office, or transit.",
    color: "blue",
  },
  {
    number: "03",
    tag: "Finances",
    title: "Automated Maintenance & Billing",
    body: "One-click digital invoice settlement with instant GST tax receipts. RWA administrators get real-time defaulter tracking and ledgers.",
    color: "amber",
  },
  {
    number: "04",
    tag: "Emergency",
    title: "Tower-wide Emergency SOS",
    body: "Instant panic alerts broadcast your exact tower and flat coordinates to security desk and marshals for medical, fire, or lift hazards.",
    color: "rose",
  },
  {
    number: "05",
    tag: "Community",
    title: "Verified Resident Marketplace",
    body: "A safe classifieds exchange within your society walls. Buy and sell furniture, electronics, and baby gear only with verified neighbours.",
    color: "indigo",
  },
  {
    number: "06",
    tag: "Facility",
    title: "Verified Plumber & Laundry Partners",
    body: "Book society-vetted service partners with transparent standard rates, automated job tracking, and post-service payment settlement.",
    color: "teal",
  },
];

const HOW_IT_WORKS = [
  {
    role: "Residents",
    desc: "Seamless day-to-day township living right from your pocket.",
    steps: [
      "Issue 6-digit PIN passes for expected deliveries and guests",
      "One-tap visitor authorization with real-time arrival notifications",
      "Pay monthly maintenance dues and download GST receipts instantly",
      "Request society plumbers or book laundry pickup with live tracking",
    ],
    route: "/user",
    cta: "Launch Resident Dashboard",
  },
  {
    role: "Security Guards",
    desc: "Fast, reliable gate check-in console engineered for high throughput.",
    steps: [
      "Verify PIN passes in under 3 seconds with instant visual feedback",
      "Check-in walk-in delivery partners and cabs with vehicle logging",
      "Trigger audio-visual alarms during emergency SOS escalations",
      "Maintain 100% digital entry & exit logs with departure timestamps",
    ],
    route: "/security",
    cta: "Launch Guard Console",
  },
  {
    role: "Service Partners",
    desc: "Dedicated dispatch console for plumbers, electricians, and laundry.",
    steps: [
      "Receive real-time service requests dispatched by flat residents",
      "Track job status from pending to in-progress to completion",
      "Transparent society-approved pricing with zero commission cuts",
      "Collect digital settlements and maintain customer ratings",
    ],
    route: "/plumber",
    cta: "Launch Partner Console",
  },
];

const PLANS = [
  {
    name: "Gatekeeper",
    price: "18",
    per: "flat / month",
    badge: "Basic Security",
    description: "Ideal for boutique apartments under 120 units.",
    features: [
      { text: "Digital PIN gate passes", included: true },
      { text: "Real-time visitor approval flow", included: true },
      { text: "Maintenance dues billing", included: true },
      { text: "Tower Emergency SOS alerts", included: false },
      { text: "Resident community marketplace", included: false },
      { text: "Dedicated service partner portal", included: false },
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Township Pro",
    price: "32",
    per: "flat / month",
    badge: "Most Popular",
    description: "The complete operating system for active gated communities.",
    features: [
      { text: "Digital PIN gate passes", included: true },
      { text: "Real-time visitor approval flow", included: true },
      { text: "Maintenance dues billing & GST receipts", included: true },
      { text: "Tower Emergency SOS alerts & sirens", included: true },
      { text: "Resident community marketplace", included: true },
      { text: "Dedicated service partner portal (Plumber/Laundry)", included: true },
    ],
    cta: "Start 30-Day Trial",
    highlighted: true,
  },
  {
    name: "Enterprise Estate",
    price: "48",
    per: "flat / month",
    badge: "Multi-Tower",
    description: "For multi-phase townships, villas, and high-rise condominiums.",
    features: [
      { text: "All Township Pro features", included: true },
      { text: "Multi-gate guard sync with boom barrier API", included: true },
      { text: "Automated RFID & ANPR vehicle recognition", included: true },
      { text: "Dedicated society account manager & 24/7 SLA", included: true },
      { text: "Custom RWA financial audit exports", included: true },
      { text: "Unlimited admin accounts & audit trails", included: true },
    ],
    cta: "Contact Enterprise Sales",
    highlighted: false,
  },
];

function ThemeToggleBtn() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-all"
      title="Toggle theme"
    >
      <Sun className="w-4 h-4 block dark:hidden text-amber-500" />
      <Moon className="w-4 h-4 hidden dark:block text-blue-400" />
    </button>
  );
}

export default function HomePage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(0);

  // Interactive Live Gate Simulator State
  const [simStep, setSimStep] = useState<"idle" | "arrived" | "approved" | "verified">("idle");
  const [simVisitor, setSimVisitor] = useState("Swiggy Delivery (Ravi)");

  const handleSimulateArrival = (name: string) => {
    setSimVisitor(name);
    setSimStep("arrived");
  };

  const handleSimulateApprove = () => {
    setSimStep("approved");
    setTimeout(() => {
      setSimStep("verified");
    }, 1200);
  };

  const handleResetSim = () => {
    setSimStep("idle");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-blue-600 selection:text-white">

      {/* ─── NAVBAR ─── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                NexGate
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live OS v2.4
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggleBtn />
            <Link
              href="/login"
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 transition"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow transition"
            >
              Launch Demo
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggleBtn />
            <button
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-5 py-4 space-y-3">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 py-1"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-col gap-2">
              <Link
                href="/login"
                className="text-center text-sm font-semibold bg-blue-600 text-white px-4 py-2.5 rounded-lg shadow-sm"
              >
                Sign In to Demo
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="pt-32 pb-20 px-5 max-w-6xl mx-auto relative">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200/80 dark:border-blue-800/40 bg-blue-50/80 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Zero database hassle • Ready with full test dataset</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.1]">
            Security that runs smoothly.
            <br />
            <span className="text-blue-600 dark:text-blue-500">Living that feels effortless.</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            NexGate turns paper registers, gate delays, and scattered WhatsApp groups into a unified digital experience — with instant PIN passes, 1-tap visitor approvals, and local facility services.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow transition"
            >
              Enter Resident Portal
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/security"
              className="inline-flex items-center gap-2 border border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-sm font-semibold px-5 py-3 rounded-lg shadow-sm transition"
            >
              Open Guard Console
            </Link>
          </div>

          {/* Quick Credential Pills */}
          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Quick Test Personas:</span>
            <Link href="/user" className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:text-blue-600">
              Resident (Arjun)
            </Link>
            <Link href="/security" className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:text-blue-600">
              Guard (Vikram)
            </Link>
            <Link href="/plumber" className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:text-blue-600">
              Plumber (Raju)
            </Link>
            <Link href="/laundry" className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:text-blue-600">
              Laundry (FreshPress)
            </Link>
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE GATE SIMULATOR WIDGET ─── */}
      <section id="simulator" className="pb-24 px-5 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-blue-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Interactive Gate Pass &amp; Intercom Simulator
                </h2>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Test the real-time notification loop between guard gate and resident flat right now
              </p>
            </div>
            <button
              onClick={handleResetSim}
              className="text-xs flex items-center gap-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
              title="Reset simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          {/* Simulator Content Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Step trigger buttons */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                1. Simulate Action at Main Gate
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSimulateArrival("Swiggy Partner (Ravi)")}
                  className={`text-xs h-10 justify-start border-slate-200 dark:border-zinc-800 font-medium ${
                    simStep === "arrived" && simVisitor.includes("Swiggy")
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold"
                      : ""
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5 mr-1.5 text-blue-600 shrink-0" />
                  Swiggy Delivery
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSimulateArrival("Guest: Dr. Anita Bose")}
                  className={`text-xs h-10 justify-start border-slate-200 dark:border-zinc-800 font-medium ${
                    simStep === "arrived" && simVisitor.includes("Anita")
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold"
                      : ""
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
                  Visiting Guest
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSimulateArrival("Amazon Express (Courier)")}
                  className={`text-xs h-10 justify-start border-slate-200 dark:border-zinc-800 font-medium ${
                    simStep === "arrived" && simVisitor.includes("Amazon")
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold"
                      : ""
                  }`}
                >
                  <Package className="w-3.5 h-3.5 mr-1.5 text-amber-600 shrink-0" />
                  Amazon Package
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSimulateArrival("Uber Cab (KA-04-E-1122)")}
                  className={`text-xs h-10 justify-start border-slate-200 dark:border-zinc-800 font-medium ${
                    simStep === "arrived" && simVisitor.includes("Uber")
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold"
                      : ""
                  }`}
                >
                  <Car className="w-3.5 h-3.5 mr-1.5 text-indigo-600 shrink-0" />
                  Cab Pick-up
                </Button>
              </div>
              <p className="text-[11px] text-zinc-400">
                Click any scenario to trigger the gate arrival notification on Flat A-304.
              </p>
            </div>

            {/* Resident Phone Mockup Display */}
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200 dark:border-zinc-800 text-zinc-500">
                <span>Apartment Intercom • Tower A-304</span>
                <span className="font-mono text-[10px]">Gate Console #1</span>
              </div>

              {simStep === "idle" && (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">Ready. Click a scenario on the left.</p>
                </div>
              )}

              {simStep === "arrived" && (
                <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{simVisitor}</p>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        Waiting at North Gate • Flat A-304
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={handleSimulateApprove}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold"
                    >
                      Approve &amp; Open Gate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetSim}
                      className="text-xs h-8 text-red-600 hover:bg-red-50"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              )}

              {simStep === "approved" && (
                <div className="py-5 text-center space-y-2 animate-in fade-in duration-200">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Entry Approved by Resident!
                  </p>
                  <p className="text-[11px] text-zinc-400">Syncing digital gate pass with guard terminal...</p>
                </div>
              )}

              {simStep === "verified" && (
                <div className="py-4 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Gate Pass Cleared</p>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400">{simVisitor} admitted to Tower A</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Admitted</Badge>
                  </div>
                  <button
                    onClick={handleResetSim}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline text-center w-full block pt-1"
                  >
                    Test another visitor &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS SECTION ─── */}
      <section className="border-y border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto px-5 py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
                {s.badge}
              </span>
              <p className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
                {s.value}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section id="features" className="py-24 px-5 max-w-6xl mx-auto space-y-12">
        <div className="max-w-xl">
          <Badge variant="outline" className="text-blue-600 border-blue-200 dark:border-blue-900 text-xs mb-3">
            Ecosystem Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Engineered for safety, designed for daily ease.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.number}
              className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-zinc-400">{f.number}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {f.tag}
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{f.title}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS (ROLES) ─── */}
      <section id="how-it-works" className="py-24 px-5 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Customized Portals</span>
            <h2 className="text-3xl font-bold tracking-tight mt-2 text-white">
              Built for every persona in your community.
            </h2>
          </div>

          <div className="flex gap-2 border border-zinc-800 p-1 rounded-xl bg-zinc-950 w-fit flex-wrap">
            {HOW_IT_WORKS.map((r, i) => (
              <button
                key={r.role}
                onClick={() => setActiveRole(i)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                  activeRole === i
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {r.role}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-zinc-950 border border-zinc-800 p-8 rounded-2xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white">{HOW_IT_WORKS[activeRole].role} Portal</h3>
                <p className="text-xs text-zinc-400 mt-1">{HOW_IT_WORKS[activeRole].desc}</p>
              </div>

              <div className="space-y-3">
                {HOW_IT_WORKS[activeRole].steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              <Link
                href={HOW_IT_WORKS[activeRole].route}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm transition"
              >
                {HOW_IT_WORKS[activeRole].cta}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Visual Callout */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <span className="text-xs font-semibold text-zinc-300">Live Persona Environment</span>
                <span className="text-[10px] font-mono text-emerald-400">Offline Mock Ready</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                You can switch between any role without needing to configure databases or API keys. Test accounts are fully pre-populated with realistic society data.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Resident Name</span>
                  <span className="font-semibold text-white">Arjun Mehta (A-304)</span>
                </div>
                <div className="p-3 rounded bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 block text-[10px]">Guard Marshal</span>
                  <span className="font-semibold text-white">Officer Vikram Singh</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-24 px-5 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <Badge variant="outline" className="text-blue-600 border-blue-200 dark:border-blue-900 text-xs">
            Simple Pricing
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Per-flat transparent subscriptions.
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            All plans include 30 days of risk-free trial. Zero hardware setup overhead.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
                plan.highlighted
                  ? "border-2 border-blue-600 bg-white dark:bg-zinc-900 shadow-xl relative"
                  : "border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold tracking-wider uppercase">
                  {plan.badge}
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{plan.name}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                    ₹{plan.price}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">/{plan.per}</span>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs">
                      {f.included ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2.5} />
                      ) : (
                        <Minus className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" />
                      )}
                      <span className={f.included ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400 line-through"}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <Link
                  href="/login"
                  className={`block text-center text-xs font-semibold py-2.5 rounded-lg transition ${
                    plan.highlighted
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      : "border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">NexGate Township OS</span>
            <span>•</span>
            <span>Modern Living &amp; Security Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/user" className="hover:text-zinc-900 dark:hover:text-zinc-100">Resident Portal</Link>
            <Link href="/security" className="hover:text-zinc-900 dark:hover:text-zinc-100">Guard Console</Link>
            <Link href="/plumber" className="hover:text-zinc-900 dark:hover:text-zinc-100">Plumber Portal</Link>
            <Link href="/laundry" className="hover:text-zinc-900 dark:hover:text-zinc-100">Laundry Portal</Link>
            <span>© 2026 NexGate</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
