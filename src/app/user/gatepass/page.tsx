"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import {
  QrCode,
  Share2,
  Copy,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface GatePass {
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
}

export default function DigitalGatePassPage() {
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [entryType, setEntryType] = useState<"Guest" | "Delivery" | "Cab" | "Service">("Guest");
  const [validityHours, setValidityHours] = useState("4");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [activePasses, setActivePasses] = useState<GatePass[]>([
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
      flat: "Block A - Flat 302",
    },
    {
      passId: "GP-8832",
      guestName: "Amazon Prime Express Delivery",
      guestPhone: "9812345678",
      pin: "194022",
      validityHours: 2,
      entryType: "Delivery",
      createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
      expiresAt: new Date(Date.now() + 90 * 60000).toISOString(),
      flat: "Block A - Flat 302",
    },
  ]);

  const handleGeneratePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      toast.error("Please enter guest name");
      return;
    }

    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    const hours = parseInt(validityHours) || 4;
    const now = new Date();
    const expires = new Date(now.getTime() + hours * 3600000);

    const newPass: GatePass = {
      passId: "GP-" + Math.floor(1000 + Math.random() * 9000),
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim() || "N/A",
      pin: randomPin,
      validityHours: hours,
      entryType,
      vehicleNumber: vehicleNumber.trim() || undefined,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      flat: "Block A - Flat 302",
    };

    setActivePasses([newPass, ...activePasses]);
    toast.success("Gate pass generated", {
      description: `PIN ${randomPin} valid for ${hours} hours.`,
    });

    setGuestName("");
    setGuestPhone("");
    setVehicleNumber("");
  };

  const handleCopyPass = (pass: GatePass) => {
    const text = `NexGate Digital Pass\nHost: ${pass.flat}\nGuest: ${pass.guestName}\nGate PIN: ${pass.pin}\nValid for: ${pass.validityHours} Hours\nPresent this PIN at the security gate terminal for clearance.`;
    navigator.clipboard.writeText(text);
    toast.success("Pass copied to clipboard");
  };

  const handleShareWhatsApp = (pass: GatePass) => {
    const text = encodeURIComponent(
      `NexGate Pass Invite\n\nGuest: ${pass.guestName}\nHost: ${pass.flat}\nEntry PIN: ${pass.pin}\nValid until: ${new Date(pass.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\n\nPresent this PIN to security at the gate.`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleDeletePass = (passId: string) => {
    setActivePasses(activePasses.filter((p) => p.passId !== passId));
    toast.info("Gate pass revoked");
  };

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Sidebar userType="user" />

      <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">Digital Gate Pass</h1>
              <Badge variant="outline" className="text-xs">
                Direct Clearance
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Issue fast-entry PINs for expected visitors, deliveries, and cabs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Issue Pass
                </CardTitle>
                <CardDescription>
                  Pre-approve entry for visitors.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleGeneratePass}>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-500 dark:text-zinc-400">Guest Name</Label>
                    <Input
                      required
                      placeholder="e.g. Vikram Seth"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-500 dark:text-zinc-400">Phone (Optional)</Label>
                    <Input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-500 dark:text-zinc-400">Category</Label>
                      <Select
                        value={entryType}
                        onValueChange={(val: "Guest" | "Delivery" | "Cab" | "Service") => setEntryType(val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Guest">Guest</SelectItem>
                          <SelectItem value="Delivery">Delivery</SelectItem>
                          <SelectItem value="Cab">Cab</SelectItem>
                          <SelectItem value="Service">Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-500 dark:text-zinc-400">Validity</Label>
                      <Select
                        value={validityHours}
                        onValueChange={setValidityHours}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 Hours</SelectItem>
                          <SelectItem value="4">4 Hours</SelectItem>
                          <SelectItem value="8">8 Hours</SelectItem>
                          <SelectItem value="24">24 Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-500 dark:text-zinc-400">Vehicle Number (Optional)</Label>
                    <Input
                      placeholder="e.g. KA-01-AB-1234"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button type="submit" className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200">
                    Generate Pass
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <div className="p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
                <ShieldCheck className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                Verified Gate Access
              </div>
              <p className="text-zinc-500 dark:text-zinc-400">
                Security terminals verify the 6-digit PIN instantly. Clearance logs are recorded automatically.
              </p>
            </div>
          </div>

          {/* Active Passes Showcase */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">Active Passes ({activePasses.length})</h2>
              <span className="text-xs text-zinc-400">Synced with Gate Consoles</span>
            </div>

            {activePasses.length === 0 ? (
              <Card className="p-8 text-center border-dashed bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none">
                <QrCode className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
                <p className="font-medium text-sm text-zinc-700 dark:text-zinc-300">No active passes</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Generated passes will show here.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {activePasses.map((pass) => (
                  <div
                    key={pass.passId}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-zinc-400">{pass.passId}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {pass.entryType}
                          </Badge>
                        </div>
                        <h3 className="text-base font-semibold mt-1">{pass.guestName}</h3>
                        <p className="text-xs text-zinc-400">{pass.flat}</p>
                      </div>

                      {/* PIN Callout box */}
                      <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-3.5 py-1.5 text-center">
                        <span className="text-[9px] uppercase font-semibold text-zinc-400 block tracking-wider">PIN</span>
                        <span className="font-mono text-xl font-bold tracking-wider text-zinc-900 dark:text-zinc-100">
                          {pass.pin}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-md border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <span className="text-zinc-400 text-[10px] block">Valid Until</span>
                        <span className="font-medium flex items-center gap-1 text-zinc-700 dark:text-zinc-300 mt-0.5">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          {new Date(pass.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px] block">Vehicle</span>
                        <span className="font-medium flex items-center gap-1 text-zinc-700 dark:text-zinc-300 mt-0.5">
                          <Car className="w-3 h-3 text-zinc-400" />
                          {pass.vehicleNumber || "None"}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 text-[10px] block">Status</span>
                        <span className="font-medium flex items-center gap-1 text-zinc-900 dark:text-zinc-100 mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-zinc-600 dark:text-zinc-400" /> Authorized
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShareWhatsApp(pass)}
                        className="text-xs h-7 gap-1"
                      >
                        <Share2 className="w-3 h-3" /> Share
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyPass(pass)}
                        className="text-xs h-7 gap-1"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePass(pass.passId)}
                        className="text-xs h-7 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 ml-auto"
                      >
                        <Trash2 className="w-3 h-3" /> Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
