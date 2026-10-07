"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { toast } from "sonner";
import Link from "next/link";
import {
  QrCode,
  Siren,
  ShoppingBag,
  Receipt,
  Check,
  X,
  ArrowRight,
  User,
  Building2,
  Clock,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Sparkles,
  Car,
  CalendarDays,
  UserCheck,
  Share2,
  Copy,
  Plus,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  getOrCreateDemoStore,
  approveVisitorLocal,
  denyVisitorLocal,
  payMaintenanceLocal,
  VisitorItem,
  DemoResident,
  GatePassItem,
} from "@/lib/mock-data";

export default function UserDashboard() {
  const [resident, setResident] = useState<DemoResident | null>(null);
  const [visitors, setVisitors] = useState<VisitorItem[]>([]);
  const [gatePasses, setGatePasses] = useState<GatePassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const syncData = () => {
    const store = getOrCreateDemoStore();
    setResident(store.resident);
    setVisitors(store.visitors);
    setGatePasses(store.gatePasses);
    setIsLoading(false);
  };

  useEffect(() => {
    syncData();
  }, []);

  const handleApproveVisitor = (visitorId: string, name: string) => {
    const updated = approveVisitorLocal(visitorId);
    setVisitors(updated);
    toast.success(`Entry Approved for ${name}`, {
      description: "Digital gate barrier opened. Security console notified.",
    });
  };

  const handleDenyVisitor = (visitorId: string, name: string) => {
    const updated = denyVisitorLocal(visitorId);
    setVisitors(updated);
    toast.error(`Entry Denied for ${name}`, {
      description: "Security guard informed to turn visitor away.",
    });
  };

  const handlePayBill = (maintenanceId: string, amount: number) => {
    const updatedResident = payMaintenanceLocal(maintenanceId);
    setResident({ ...updatedResident });
    toast.success("Maintenance Paid Successfully", {
      description: `INR ${amount.toLocaleString()} settled via Razorpay. GST Invoice generated.`,
    });
  };

  const copyPin = (pin: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(pin);
      toast.success(`Pass PIN ${pin} copied to clipboard`);
    }
  };

  const waitingVisitors = visitors.filter((v) => !v.status && !v.hasLeft);
  const insideVisitors = visitors.filter((v) => v.status && !v.hasLeft);
  const unpaidMaintenance = resident?.room?.Maintenance?.filter((m) => !m.paid) || [];
  const totalDue = unpaidMaintenance.reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Sidebar userType="user" />

      <main className="flex-1 overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-6">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Welcome back, {resident?.name?.split(" ")[0] || "Arjun"}
                </h1>
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-semibold px-2.5 py-0.5">
                  Flat Owner
                </Badge>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1.5 flex items-center gap-2 font-medium">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{resident?.room?.society || "Palm Heights Township"} &bull; Tower {resident?.room?.block || "A"} &bull; Apartment {resident?.room?.room || "304"}</span>
              </p>
            </div>

            {/* Live System Status Chips */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Intercom Gate: Online
              </span>
              <Link
                href="/security"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 transition shadow-sm"
              >
                <span>Switch to Guard Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Real-time Incoming Visitor Alert Banner (If Any Waiting) */}
          {waitingVisitors.length > 0 && (
            <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/30 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200 font-bold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  Visitor Awaiting Your Authorization at Main Gate
                </div>
                <Badge variant="outline" className="border-amber-400 text-amber-800 dark:text-amber-300 text-xs font-semibold">
                  Real-time Intercom
                </Badge>
              </div>

              {waitingVisitors.map((v) => (
                <div
                  key={v.visitorId}
                  className="p-4 rounded-lg bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-base text-zinc-900 dark:text-zinc-100">{v.name}</span>
                      <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border-none text-xs font-semibold px-2 py-0.5">
                        {v.purpose}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-zinc-600 dark:text-zinc-300 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-zinc-500" />
                        {v.number}
                      </span>
                      {v.vehicleNo && (
                        <span className="flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-zinc-500" />
                          {v.vehicleNo}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        Arrived 4 mins ago
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApproveVisitor(v.visitorId, v.name)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 h-9 shadow-sm"
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      Approve Entry
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDenyVisitor(v.visitorId, v.name)}
                      className="text-xs font-semibold h-9 px-3.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2-Column Responsive Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Main Column (7 Columns) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Quick Metrics (3 Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Maintenance Card */}
                <Card className="border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      <span>Maintenance</span>
                      <Receipt className="w-4 h-4 text-blue-600" />
                    </div>
                    {totalDue > 0 ? (
                      <>
                        <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
                          ₹{totalDue.toLocaleString()}
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                          Due: 15 Oct 2026 (October)
                        </p>
                        <div className="pt-2">
                          <Button
                            size="sm"
                            onClick={() => handlePayBill(unpaidMaintenance[0].maintenanceId, unpaidMaintenance[0].amount)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-8"
                          >
                            Pay in 1 Click
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                          Clear &amp; Paid
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">All invoices settled</p>
                        <div className="pt-2">
                          <Link
                            href="/user/maintenance"
                            className="block text-center text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline py-1"
                          >
                            View Invoices &rarr;
                          </Link>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Active Gate Passes Card */}
                <Card className="border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      <span>Active Passes</span>
                      <QrCode className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
                      {gatePasses.length}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Active PIN passes issued</p>
                    <div className="pt-2">
                      <Link
                        href="/user/gatepass"
                        className="block text-center text-xs bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold py-1.5 rounded-md transition"
                      >
                        + Issue Pass
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Inside Premises Card */}
                <Card className="border-slate-200 dark:border-zinc-800 shadow-sm">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      <span>Visitors Inside</span>
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
                      {insideVisitors.length}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">
                      {insideVisitors.length > 0 ? insideVisitors[0].name : "No visitors inside"}
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/user/visitors"
                        className="block text-center text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline py-1"
                      >
                        View Registry &rarr;
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Society Hub Services (4 Cards Grid) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                    Society Hub Services
                  </h2>
                  <span className="text-xs text-zinc-500 font-medium">Quick Access</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Link
                    href="/user/gatepass"
                    className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Digital Gate Pass</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed font-medium">
                          Issue instant 6-digit PIN passes for guests, cabs, and delivery partners.
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/user/marketplace"
                    className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Resident Marketplace</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed font-medium">
                          Buy, sell, and give away verified pre-owned items within your society walls.
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/user/bookings"
                    className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Facility Services</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed font-medium">
                          Book trusted society plumbers (Raju) and laundry care (FreshPress).
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/user/sos"
                    className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-red-500 dark:hover:border-red-500 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <Siren className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Emergency SOS</p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed font-medium">
                          Instant tower-wide panic broadcast to security gate desk and marshals.
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Active Visitors Inside Flat Table/List */}
              <Card className="border-slate-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Currently Inside Apartment
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Visitors currently marked active inside Tower A - Flat 304
                    </CardDescription>
                  </div>
                  <Link href="/user/visitors" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    Full Registry &rarr;
                  </Link>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {insideVisitors.length > 0 ? (
                    insideVisitors.map((v) => (
                      <div
                        key={v.visitorId}
                        className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{v.name}</span>
                            <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 dark:text-emerald-400 font-semibold">
                              {v.purpose}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                            <span>Phone: {v.number}</span>
                            {v.vehicleNo && <span>Vehicle: {v.vehicleNo}</span>}
                            <span>Entered: {v.entryTime || "13:45"}</span>
                          </div>
                        </div>
                        <Badge className="bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1">
                          Inside Flat
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-zinc-500 font-medium">
                      No visitors currently inside. New arrivals will show here once admitted.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Rail Column (5 Columns) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Active Gate Passes Box */}
              <Card className="border-slate-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Active Gate Passes
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Valid passes for upcoming arrivals today
                    </CardDescription>
                  </div>
                  <Link
                    href="/user/gatepass"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Pass
                  </Link>
                </CardHeader>
                <CardContent className="p-5 space-y-3.5">
                  {gatePasses.map((p) => (
                    <div
                      key={p.passId}
                      className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{p.guestName}</span>
                        <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold px-2 py-0.5">
                          Valid 4h
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-xs text-zinc-500 font-medium">Entry PIN</p>
                          <p className="text-lg font-mono font-bold tracking-widest text-zinc-900 dark:text-zinc-100">
                            {p.pin}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyPin(p.pin)}
                          className="text-xs h-8 font-semibold text-zinc-700 dark:text-zinc-300 border-slate-300 dark:border-zinc-700"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy PIN
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-slate-200 dark:border-zinc-800 font-medium">
                        <span>{p.entryType}</span>
                        {p.vehicleNumber && <span>Vehicle: {p.vehicleNumber}</span>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Society Announcements & Noticeboard */}
              <Card className="border-slate-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Society Announcements
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Official notices posted by RWA Committee
                    </CardDescription>
                  </div>
                  <Link href="/user/events" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    View All &rarr;
                  </Link>
                </CardHeader>
                <CardContent className="p-5 space-y-3.5">
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Annual General Body Meeting (AGM)</span>
                      <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border-none text-xs font-semibold">
                        Upcoming
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                      Clubhouse Main Hall and Online Jitsi stream. Saturday at 10:00 AM.
                    </p>
                    <p className="text-xs text-zinc-400 font-medium pt-1">Agenda: Annual financial audit &amp; security upgrades.</p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Overhead Water Tank Deep Cleaning</span>
                      <Badge variant="outline" className="text-zinc-600 dark:text-zinc-400 text-xs font-semibold">
                        Maintenance
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                      Scheduled supply shutdown 1:00 PM to 4:00 PM this Thursday for Tower A and Tower B.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Verified Service Partners Snapshot */}
              <Card className="border-slate-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Verified Service Partners
                  </CardTitle>
                  <Link href="/user/bookings" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    Book &rarr;
                  </Link>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Raju Sharma (QuickPlumb)</p>
                        <p className="text-xs text-zinc-500 font-medium">Society Plumber &bull; 4.9 Rating</p>
                      </div>
                    </div>
                    <Link
                      href="/plumber"
                      className="text-xs font-semibold text-blue-600 hover:underline px-2 py-1"
                    >
                      View &rarr;
                    </Link>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">FreshPress Laundry Care</p>
                        <p className="text-xs text-zinc-500 font-medium">Express Wash &bull; 4.8 Rating</p>
                      </div>
                    </div>
                    <Link
                      href="/laundry"
                      className="text-xs font-semibold text-teal-600 hover:underline px-2 py-1"
                    >
                      View &rarr;
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
