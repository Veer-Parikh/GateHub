"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  UserCheck,
  Clock,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Phone,
  QrCode,
  LogOut,
  RefreshCw,
  Camera,
  Flame,
  Activity,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

interface VisitorEntry {
  visitorId: string;
  name: string;
  age?: number;
  address?: string;
  purpose: string;
  number: number | string;
  status: boolean;
  hasLeft: boolean;
  createdAt: string;
  updatedAt: string;
  vehicleNo?: string;
  roomId?: string;
  room?: {
    block: string;
    room: string;
  };
}

export default function SecurityGuardConsole() {
  const [visitors, setVisitors] = useState<VisitorEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("all");
  const [passPin, setPassPin] = useState("");
  const [isVerifyPassOpen, setIsVerifyPassOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [sirenActive, setSirenActive] = useState(false);
  const [sosDetails, setSosDetails] = useState<string | null>(null);

  const { theme, setTheme } = useTheme();

  const [newVisitor, setNewVisitor] = useState({
    name: "",
    age: "",
    address: "",
    purpose: "Guest",
    number: "",
    vehicleNo: "",
    block: "A",
    flat: "",
  });

  const checkEmergencyStatus = useCallback(() => {
    try {
      const sosData = localStorage.getItem("nexgate_emergency_sos");
      if (sosData) {
        const parsed = JSON.parse(sosData);
        setSirenActive(true);
        setSosDetails(`ALERT: ${parsed.type?.toUpperCase()} reported at Block ${parsed.block} - Flat ${parsed.flat}`);
      } else {
        setSirenActive(false);
        setSosDetails(null);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/visitor/notified");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setVisitors(data);
          setLoading(false);
          return;
        }
      }
    } catch {
      // use local seed
    }

    const cached = localStorage.getItem("nexgate_visitors");
    if (cached) {
      try {
        setVisitors(JSON.parse(cached));
        setLoading(false);
        return;
      } catch {
        // ignore
      }
    }

    const defaultSeed: VisitorEntry[] = [
      {
        visitorId: "v-001",
        name: "Rahul Deshmukh",
        purpose: "Guest",
        number: "9820011223",
        status: true,
        hasLeft: false,
        createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 40 * 60000).toISOString(),
        vehicleNo: "KA-01-MJ-9912",
        room: { block: "A", room: "302" },
      },
      {
        visitorId: "v-002",
        name: "Swiggy Delivery Partner",
        purpose: "Delivery",
        number: "9877112233",
        status: true,
        hasLeft: false,
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
        vehicleNo: "KA-03-EX-1011",
        room: { block: "B", room: "501" },
      },
      {
        visitorId: "v-003",
        name: "Urban Company AC Technician",
        purpose: "Service",
        number: "9812345000",
        status: false,
        hasLeft: false,
        createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
        updatedAt: new Date().toISOString(),
        vehicleNo: "KA-05-SR-2200",
        room: { block: "C", room: "204" },
      },
      {
        visitorId: "v-004",
        name: "Uber Premier",
        purpose: "Cab",
        number: "9900112244",
        status: true,
        hasLeft: true,
        createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
        updatedAt: new Date(Date.now() - 90 * 60000).toISOString(),
        vehicleNo: "KA-51-AB-7788",
        room: { block: "A", room: "102" },
      },
    ];

    setVisitors(defaultSeed);
    localStorage.setItem("nexgate_visitors", JSON.stringify(defaultSeed));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVisitors();
    checkEmergencyStatus();
    const interval = setInterval(checkEmergencyStatus, 4000);
    return () => clearInterval(interval);
  }, [fetchVisitors, checkEmergencyStatus]);

  const handleApproveEntry = (visitorId: string) => {
    const updated = visitors.map((v) =>
      v.visitorId === visitorId ? { ...v, status: true, updatedAt: new Date().toISOString() } : v
    );
    setVisitors(updated);
    localStorage.setItem("nexgate_visitors", JSON.stringify(updated));
    toast.success("Visitor Entry Approved — Boom Barrier Opened");
  };

  const handleMarkExit = (visitorId: string) => {
    const updated = visitors.map((v) =>
      v.visitorId === visitorId ? { ...v, hasLeft: true, updatedAt: new Date().toISOString() } : v
    );
    setVisitors(updated);
    localStorage.setItem("nexgate_visitors", JSON.stringify(updated));
    toast.info("Visitor Checked Out — Departure Logged");
  };

  const handleVerifyPass = () => {
    if (!passPin || passPin.trim().length < 4) {
      toast.error("Please enter a valid 4 to 6-digit gate code");
      return;
    }

    const pin = passPin.trim();
    let guestName = `Visitor (PIN ${pin})`;
    let targetRoom = { block: "A", room: "304" };
    let purpose = "Guest";

    try {
      const storedPasses = localStorage.getItem("nexgate_gatepasses");
      if (storedPasses) {
        const passes = JSON.parse(storedPasses);
        const matched = passes.find((p: any) => p.pin === pin);
        if (matched) {
          guestName = matched.guestName;
          purpose = matched.entryType || "Guest";
        }
      }
    } catch {
      // fallback
    }

    const newEntry: VisitorEntry = {
      visitorId: `v-${Date.now()}`,
      name: guestName,
      purpose: purpose,
      number: "PIN Verified Pass",
      status: true,
      hasLeft: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      room: targetRoom,
    };

    const updated = [newEntry, ...visitors];
    setVisitors(updated);
    localStorage.setItem("nexgate_visitors", JSON.stringify(updated));

    toast.success("Gate Pass Verified — Boom Barrier Lifted", {
      description: `PIN ${pin} verified for ${guestName} (Flat A-304).`,
    });
    setPassPin("");
    setIsVerifyPassOpen(false);
  };

  const handleRegisterVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitor.name || !newVisitor.number || !newVisitor.flat) {
      toast.error("Please fill required fields (Name, Phone, Flat)");
      return;
    }

    const entry: VisitorEntry = {
      visitorId: `v-${Date.now()}`,
      name: newVisitor.name,
      age: parseInt(newVisitor.age) || undefined,
      address: newVisitor.address,
      purpose: newVisitor.purpose,
      number: newVisitor.number,
      status: false,
      hasLeft: false,
      vehicleNo: newVisitor.vehicleNo || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      room: {
        block: newVisitor.block,
        room: newVisitor.flat,
      },
    };

    const updated = [entry, ...visitors];
    setVisitors(updated);
    localStorage.setItem("nexgate_visitors", JSON.stringify(updated));

    toast.success("Visitor Logged at Gate Desk", {
      description: `Notification sent to Block ${newVisitor.block} - Flat ${newVisitor.flat}`,
    });

    setNewVisitor({
      name: "",
      age: "",
      address: "",
      purpose: "Guest",
      number: "",
      vehicleNo: "",
      block: "A",
      flat: "",
    });
    setIsAddOpen(false);
  };

  const insideCommunityList = visitors.filter((v) => v.status && !v.hasLeft);
  const waitingApprovalList = visitors.filter((v) => !v.status && !v.hasLeft);
  const departedList = visitors.filter((v) => v.hasLeft);

  const filteredInside = insideCommunityList.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.room && `${v.room.block}-${v.room.room}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.vehicleNo && v.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPurpose =
      selectedPurpose === "all" || v.purpose.toLowerCase() === selectedPurpose.toLowerCase();
    return matchesSearch && matchesPurpose;
  });

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Emergency Siren Banner */}
      {sirenActive && (
        <div className="bg-red-600 text-white px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold text-xs md:text-sm tracking-wide uppercase">
                Active SOS Alarm
              </p>
              <p className="text-xs opacity-90">{sosDetails || "Emergency triggered by resident."}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white text-zinc-900 hover:bg-zinc-100 text-xs h-7 font-medium"
              onClick={() => {
                toast.success("Guard unit dispatched to location");
              }}
            >
              Dispatch Unit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-red-700 text-xs h-7"
              onClick={() => {
                setSirenActive(false);
                localStorage.removeItem("nexgate_emergency_sos");
                toast.info("SOS alarm muted");
              }}
            >
              Mute
            </Button>
          </div>
        </div>
      )}

      {/* Top Security Bar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-40 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm tracking-tight">Guard Station</h1>
              <Badge variant="outline" className="text-[10px]">
                Gate 1 Active
              </Badge>
            </div>
            <p className="text-xs text-zinc-400">
              Officer Vikram Singh (#G-04)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-8 h-8 flex items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            title="Toggle theme"
          >
            <Sun className="w-4 h-4 block dark:hidden" />
            <Moon className="w-4 h-4 hidden dark:block" />
          </button>

          {/* Rapid Verify GatePass Button */}
          <Dialog open={isVerifyPassOpen} onOpenChange={setIsVerifyPassOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5 text-xs h-8">
                <QrCode className="w-3.5 h-3.5" />
                <span>Verify Pass</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">
                  Verify Pass PIN
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Enter the 6-digit visitor invite code provided by the resident.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500">Passcode / PIN</Label>
                  <Input
                    placeholder="e.g. 842190"
                    value={passPin}
                    onChange={(e) => setPassPin(e.target.value)}
                    className="text-center font-mono text-xl tracking-widest font-semibold h-11"
                    maxLength={8}
                    autoFocus
                  />
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
                  <span>Pre-approved entries open gate without ringing resident intercom.</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsVerifyPassOpen(false)}>Cancel</Button>
                <Button onClick={handleVerifyPass} className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
                  Verify &amp; Admit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Quick Add Visitor Button */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 flex items-center gap-1.5 text-xs h-8">
                <Plus className="w-3.5 h-3.5" />
                <span>Check-in</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Register Visitor
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Log arriving guest and dispatch approval request to resident flat.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleRegisterVisitor} className="space-y-3.5 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-500">Full Name</Label>
                    <Input
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={newVisitor.name}
                      onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-500">Phone</Label>
                    <Input
                      required
                      type="tel"
                      placeholder="Mobile number"
                      value={newVisitor.number}
                      onChange={(e) => setNewVisitor({ ...newVisitor, number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-500">Purpose</Label>
                    <Select
                      value={newVisitor.purpose}
                      onValueChange={(val) => setNewVisitor({ ...newVisitor, purpose: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Guest">Guest</SelectItem>
                        <SelectItem value="Delivery">Delivery</SelectItem>
                        <SelectItem value="Cab">Cab</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                        <SelectItem value="Daily Help">Daily Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-500">Block</Label>
                    <Select
                      value={newVisitor.block}
                      onValueChange={(val) => setNewVisitor({ ...newVisitor, block: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">Block A</SelectItem>
                        <SelectItem value="B">Block B</SelectItem>
                        <SelectItem value="C">Block C</SelectItem>
                        <SelectItem value="D">Block D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-500">Flat #</Label>
                    <Input
                      required
                      placeholder="e.g. 302"
                      value={newVisitor.flat}
                      onChange={(e) => setNewVisitor({ ...newVisitor, flat: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-500">Vehicle (Optional)</Label>
                    <Input
                      placeholder="e.g. KA-01-AB-1234"
                      value={newVisitor.vehicleNo}
                      onChange={(e) => setNewVisitor({ ...newVisitor, vehicleNo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-500">Age</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 28"
                      value={newVisitor.age}
                      onChange={(e) => setNewVisitor({ ...newVisitor, age: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-zinc-500">Company / Origin</Label>
                  <Input
                    placeholder="e.g. Swiggy, Amazon, Friend"
                    value={newVisitor.address}
                    onChange={(e) => setNewVisitor({ ...newVisitor, address: e.target.value })}
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
                    Send Approval Request
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Link href="/user">
            <Button variant="ghost" size="sm" className="text-xs text-zinc-500 h-8">
              Resident App
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900" title="Logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Guard Console Content */}
      <main className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-6">
        {/* KPI Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400">Currently Inside</p>
                <p className="text-2xl font-semibold mt-1 tabular-nums text-zinc-900 dark:text-zinc-100">
                  {insideCommunityList.length}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Active on premises</p>
              </div>
              <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400">Awaiting Approval</p>
                <p className="text-2xl font-semibold mt-1 tabular-nums text-zinc-900 dark:text-zinc-100">
                  {waitingApprovalList.length}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Decision pending</p>
              </div>
              <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400">Departed Today</p>
                <p className="text-2xl font-semibold mt-1 tabular-nums text-zinc-900 dark:text-zinc-100">
                  {departedList.length}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Logged exits</p>
              </div>
              <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center">
                <LogOut className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400">Barrier &amp; OCR</p>
                <p className="text-sm font-semibold mt-1.5 flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                  <CheckCircle2 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" /> Operational
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Barrier 1 Online</p>
              </div>
              <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approval Priority Section */}
        {waitingApprovalList.length > 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 md:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-pulse" />
                <h2 className="font-semibold text-sm">
                  Awaiting Resident Decision ({waitingApprovalList.length})
                </h2>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Approval push notification sent to flat
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {waitingApprovalList.map((visitor) => (
                <div
                  key={visitor.visitorId}
                  className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 rounded-md p-3.5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{visitor.name}</p>
                      <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {visitor.number}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {visitor.purpose}
                    </Badge>
                  </div>

                  <div className="text-xs flex items-center justify-between bg-white dark:bg-zinc-800 p-2 rounded border border-zinc-100 dark:border-zinc-700">
                    <span className="text-zinc-400">Destination</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      Block {visitor.room?.block || "A"} - Flat {visitor.room?.room || "302"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleApproveEntry(visitor.visitorId)}
                      className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs h-7 gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Admit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkExit(visitor.visitorId)}
                      className="text-xs h-7 px-3 gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Deny
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Visitors Inside Directory */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Visitors on Premises</h2>
              <p className="text-xs text-zinc-400">
                Admitted guests, couriers, and cabs inside society perimeter.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  placeholder="Search name, flat, vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-xs"
                />
              </div>

              <Select value={selectedPurpose} onValueChange={setSelectedPurpose}>
                <SelectTrigger className="w-28 h-8 text-xs">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="cab">Cab</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={fetchVisitors}
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {filteredInside.length === 0 ? (
            <Card className="border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none">
              <CardContent className="p-8 text-center space-y-1.5">
                <UserCheck className="w-8 h-8 mx-auto text-zinc-400" />
                <p className="font-medium text-sm text-zinc-700 dark:text-zinc-300">No visitors inside matching query</p>
                <p className="text-xs text-zinc-400">
                  {searchQuery ? "Refine your search term." : "All admitted visitors have checked out."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredInside.map((v) => (
                <Card
                  key={v.visitorId}
                  className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs">
                          {v.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-xs font-semibold">{v.name}</CardTitle>
                          <CardDescription className="text-[11px] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-zinc-400" /> {v.number}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {v.purpose}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded">
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Destination</span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {v.room ? `Block ${v.room.block}-${v.room.room}` : "Flat A-302"}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px]">Vehicle</span>
                        <span className="font-mono text-zinc-700 dark:text-zinc-300">
                          {v.vehicleNo || "Pedestrian"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        In: {new Date(v.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-zinc-600 dark:text-zinc-400">Admitted</span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkExit(v.visitorId)}
                      className="w-full text-xs h-7 flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3 h-3" /> Check Out
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Departures History Log */}
        {departedList.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Departures Log (Today)
            </h3>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden">
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                {departedList.slice(0, 5).map((dep) => (
                  <div key={dep.visitorId} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{dep.name}</p>
                      <p className="text-[11px] text-zinc-400">
                        {dep.purpose} • Flat {dep.room?.block}-{dep.room?.room}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[10px]">
                        Checked Out
                      </Badge>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {new Date(dep.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
