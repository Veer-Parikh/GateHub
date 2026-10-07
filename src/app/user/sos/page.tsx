"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import {
  AlertTriangle,
  Flame,
  Activity,
  ShieldAlert,
  PhoneCall,
  Radio,
  Siren,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function EmergencySosPage() {
  const [activeAlert, setActiveAlert] = useState<{
    type: string;
    timestamp: number;
    block: string;
    flat: string;
  } | null>(null);

  const emergencyContacts = [
    { title: "Main Security Gate 1", number: "+91 80 4910 2001", role: "24x7 Guard Supervisor" },
    { title: "Facility Operations Desk", number: "+91 98450 11992", role: "RWA Operations Lead" },
    { title: "Elevator Emergency Hotline", number: "1800 120 4455", role: "Lift Technician On-Call" },
    { title: "Ambulance / Emergency Medical", number: "1066", role: "Nearest Hospital Emergency" },
    { title: "Police Control Room", number: "112", role: "Law Enforcement" },
    { title: "Fire & Rescue Department", number: "101", role: "Fire Station" },
  ];

  const handleTriggerSos = (type: string, title: string) => {
    const alertData = {
      type,
      title,
      block: "A",
      flat: "302",
      residentName: "Aarav Sharma",
      timestamp: Date.now(),
    };

    localStorage.setItem("nexgate_emergency_sos", JSON.stringify(alertData));
    setActiveAlert(alertData);

    toast.error(`EMERGENCY ALERT: ${title.toUpperCase()}`, {
      description: "Guard console alerted. Response dispatched to Flat A-302.",
      duration: 8000,
    });
  };

  const handleCancelSos = () => {
    localStorage.removeItem("nexgate_emergency_sos");
    setActiveAlert(null);
    toast.success("Emergency alert deactivated");
  };

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Sidebar userType="user" />

      <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-6">
        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <Siren className="w-5 h-5 text-red-600 dark:text-red-500" />
              Emergency Response
            </h1>
            <Badge variant="outline" className="border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs">
              Direct Guard Line
            </Badge>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Trigger an immediate alert to broadcast your coordinates to security and tower responders.
          </p>
        </div>

        {/* Active Alert Banner */}
        {activeAlert && (
          <div className="rounded-lg bg-red-600 text-white p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 animate-pulse shrink-0" />
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider">
                    {activeAlert.type} Alert Active
                  </h2>
                  <p className="text-xs opacity-90 mt-0.5">
                    Broadcasting from Block {activeAlert.block} - Flat {activeAlert.flat}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancelSos}
                className="bg-white text-zinc-900 hover:bg-zinc-100 text-xs h-8"
              >
                Cancel Alert
              </Button>
            </div>
            <p className="text-xs bg-red-700/80 p-2.5 rounded text-red-100">
              Security gate desk has received your emergency coordinates. Keep entry door unlocked if safe.
            </p>
          </div>
        )}

        {/* 4 Emergency Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Medical */}
          <button
            onClick={() => handleTriggerSos("medical", "Medical Emergency")}
            className="group rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-left transition hover:border-red-500 dark:hover:border-red-500"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-red-600 dark:text-red-400">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-red-600 dark:text-red-400 uppercase">
                Immediate
              </span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Medical Emergency</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Cardiac, acute injury, or severe medical distress. Dispatches first aid and ambulance.
            </p>
          </button>

          {/* Fire */}
          <button
            onClick={() => handleTriggerSos("fire", "Fire & Smoke Alert")}
            className="group rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-left transition hover:border-red-500 dark:hover:border-red-500"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-red-600 dark:text-red-400">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-red-600 dark:text-red-400 uppercase">
                Immediate
              </span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Fire &amp; Gas Hazard</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Active fire, electrical smoke, or gas leak. Alerts tower marshals and response staff.
            </p>
          </button>

          {/* Lift Entrapment */}
          <button
            onClick={() => handleTriggerSos("lift", "Elevator Entrapment")}
            className="group rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-left transition hover:border-red-500 dark:hover:border-red-500"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                Urgent
              </span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Elevator Entrapment</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Passenger trapped inside lift cab. Notifies technician and security desk on duty.
            </p>
          </button>

          {/* Intruder / Security Threat */}
          <button
            onClick={() => handleTriggerSos("security", "Security Threat")}
            className="group rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-left transition hover:border-red-500 dark:hover:border-red-500"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                Urgent
              </span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Security Threat</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Unauthorized presence, burglary attempt, or altercation. Dispatches floor patrol.
            </p>
          </button>
        </div>

        {/* 24x7 Society Emergency Contacts Book */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-zinc-500" />
              Emergency Directory
            </CardTitle>
            <CardDescription className="text-xs">
              Critical contact numbers configured for your gated township.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-zinc-100 dark:divide-zinc-800 p-0">
            {emergencyContacts.map((c, i) => (
              <div key={i} className="p-3.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                <div>
                  <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{c.title}</p>
                  <p className="text-[11px] text-zinc-400">{c.role}</p>
                </div>
                <a
                  href={`tel:${c.number}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 transition"
                >
                  {c.number}
                  <ArrowUpRight className="w-3 h-3 text-zinc-400" />
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
