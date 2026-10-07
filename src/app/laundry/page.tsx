"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Phone,
  Building2,
  DollarSign,
  PackageCheck,
  LogOut,
  Layers,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { getOrCreateDemoStore, ServiceJobItem } from "@/lib/mock-data";

export default function LaundryDashboard() {
  const [jobs, setJobs] = useState<ServiceJobItem[]>([]);

  useEffect(() => {
    const store = getOrCreateDemoStore();
    setJobs(store.laundryJobs);
  }, []);

  const updateJobStatus = (jobId: string, newStatus: "pending" | "in_progress" | "completed") => {
    const updated = jobs.map((j) => {
      if (j.jobId === jobId) {
        return {
          ...j,
          status: newStatus,
          paymentStatus: newStatus === "completed" ? "paid" : j.paymentStatus,
        };
      }
      return j;
    });
    setJobs(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("nexgate_laundry_jobs", JSON.stringify(updated));
    }
    toast.success(`Order updated to ${newStatus.replace("_", " ").toUpperCase()}`);
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const inProgressCount = jobs.filter((j) => j.status === "in_progress").length;
  const totalEarned = jobs
    .filter((j) => j.status === "completed")
    .reduce((sum, j) => sum + j.estimatedCost, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-6 lg:px-10 py-3.5">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-sm leading-tight text-zinc-900 dark:text-zinc-100">
                  FreshPress Laundry Care
                </h1>
                <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 text-xs font-semibold py-0.5">
                  Society Partner &bull; Rating 4.8 / 5.0
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Palm Heights Express Wash &amp; Dry Cleaning Station</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/user"
              className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-md transition"
            >
              Resident View
            </Link>
            <Link
              href="/security"
              className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-md transition"
            >
              Guard Console
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-xs text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-8"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-medium">Orders Received</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">{jobs.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-medium">Processing / Wash</p>
                <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400 tabular-nums">{inProgressCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-medium">Delivered Today</p>
                <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums">{completedCount}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 font-medium">Settled Revenue</p>
                <p className="text-2xl font-bold mt-1 text-zinc-900 dark:text-zinc-100 tabular-nums">₹{totalEarned.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Current Laundry &amp; Dry-Cleaning Loads
              </h2>
              <p className="text-xs text-zinc-500">Pickups and drop-offs for registered society apartments</p>
            </div>
            <Badge variant="outline" className="text-xs border-zinc-200 dark:border-zinc-800">
              Live updates
            </Badge>
          </div>

          <div className="space-y-3">
            {jobs.map((job) => (
              <Card key={job.jobId} className="border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        {job.title}
                      </span>
                      <Badge
                        variant="secondary"
                        className={
                          job.status === "completed"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200"
                            : job.status === "in_progress"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        }
                      >
                        {job.status === "completed" ? "Delivered" : job.status === "in_progress" ? "In Wash / Steam" : "Pending Pickup"}
                      </Badge>
                      <span className="text-xs text-zinc-400 font-mono">₹{job.estimatedCost}</span>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-300">{job.details}</p>

                    <div className="flex items-center gap-4 text-xs text-zinc-500 pt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                        <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                        Flat {job.customerFlat} • {job.customerName}
                      </span>
                      <a href={`tel:${job.customerPhone}`} className="flex items-center gap-1 text-teal-600 hover:underline">
                        <Phone className="w-3.5 h-3.5" />
                        {job.customerPhone}
                      </a>
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Clock className="w-3.5 h-3.5" />
                        {job.scheduledTime}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {job.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => updateJobStatus(job.jobId, "in_progress")}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8"
                      >
                        Start Processing
                      </Button>
                    )}
                    {job.status === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={() => updateJobStatus(job.jobId, "completed")}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                      >
                        <PackageCheck className="w-3.5 h-3.5 mr-1" />
                        Mark Delivered
                      </Button>
                    )}
                    {job.status === "completed" && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 py-1">
                        Delivered &amp; Settled
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
