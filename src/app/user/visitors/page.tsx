"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Check,
  X,
  LogOut,
  Users,
  Clock,
  UserCheck,
  History,
  Phone,
  MapPin,
  RefreshCw,
} from "lucide-react";

interface Visitor {
  visitorId: string;
  name: string;
  age: number;
  address: string;
  purpose: string;
  number: number;
  photo?: string;
  status: boolean;
  hasLeft: boolean;
  createdAt: string;
  updatedAt: string;
  security?: { name: string; number: string };
}

const SEED_WAITING: Visitor[] = [
  {
    visitorId: "v-seed-1",
    name: "Priya Nair",
    age: 34,
    address: "12, MG Road, Koramangala",
    purpose: "Delivery",
    number: 9845001234,
    status: false,
    hasLeft: false,
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    security: { name: "Ramesh G.", number: "9900112233" },
  },
  {
    visitorId: "v-seed-2",
    name: "Akash Sharma",
    age: 28,
    address: "45, BTM Layout, Bangalore",
    purpose: "Friend",
    number: 9812345678,
    status: false,
    hasLeft: false,
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60000).toISOString(),
    security: { name: "Ramesh G.", number: "9900112233" },
  },
];

const SEED_INSIDE: Visitor[] = [
  {
    visitorId: "v-seed-3",
    name: "Meena Krishnan",
    age: 52,
    address: "Old Airport Road",
    purpose: "House Help",
    number: 9876543210,
    status: true,
    hasLeft: false,
    createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 85 * 60000).toISOString(),
    security: { name: "Suresh P.", number: "9900112244" },
  },
];

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
}

export default function VisitorsPage() {
  const [waiting, setWaiting] = useState<Visitor[]>([]);
  const [inside, setInside] = useState<Visitor[]>([]);
  const [previous, setPrevious] = useState<Visitor[]>([]);
  const [activeTab, setActiveTab] = useState<"waiting" | "inside" | "history">("waiting");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

    try {
      const [waitRes, insideRes, prevRes] = await Promise.all([
        fetch("http://localhost:5000/api/visitor/waiting", { headers }),
        fetch("http://localhost:5000/api/visitor/getInside", { headers }),
        fetch("http://localhost:5000/api/visitor/prev", { headers }),
      ]);
      if (!waitRes.ok || !insideRes.ok || !prevRes.ok) throw new Error("API error");
      setWaiting(await waitRes.json());
      setInside(await insideRes.json());
      setPrevious(await prevRes.json());
    } catch {
      setWaiting(SEED_WAITING);
      setInside(SEED_INSIDE);
      setPrevious([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const approveVisitor = async (id: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      await fetch("http://localhost:5000/api/visitor/inside", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: id }),
      });
    } catch {
      // offline
    }
    toast.success("Visitor entry approved");
    setWaiting((prev) => prev.filter((v) => v.visitorId !== id));
    setActiveTab("inside");
  };

  const rejectVisitor = async (id: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      await fetch("http://localhost:5000/api/visitor/delete", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: id }),
      });
    } catch {
      // offline
    }
    toast.info("Visitor entry denied");
    setWaiting((prev) => prev.filter((v) => v.visitorId !== id));
  };

  const markAsLeft = async (id: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      await fetch("http://localhost:5000/api/visitor/hasLeft", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: id }),
      });
    } catch {
      // offline
    }
    toast.success("Visitor checkout recorded");
    setInside((prev) => prev.filter((v) => v.visitorId !== id));
  };

  const tabs = [
    { id: "waiting" as const, label: "Awaiting Decision", icon: Clock, count: waiting.length },
    { id: "inside" as const, label: "Currently Inside", icon: UserCheck, count: inside.length },
    { id: "history" as const, label: "History", icon: History, count: previous.length },
  ];

  const currentData = activeTab === "waiting" ? waiting : activeTab === "inside" ? inside : previous;

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Sidebar userType="user" />
      <main className="flex-1 overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">Visitor Management</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Approve and monitor visitors arriving at your building.</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAll} disabled={refreshing} className="gap-1.5 text-xs h-8">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Stats tabs */}
          <div className="grid grid-cols-3 gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-3.5 rounded-lg border text-left transition-all ${
                  activeTab === tab.id
                    ? "border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-400">{tab.label}</span>
                  <span className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {tab.count}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Visitor Cards */}
          <div className="space-y-2.5">
            {currentData.length === 0 ? (
              <div className="text-center py-14 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <Users className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No visitors in this category</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {activeTab === "waiting"
                    ? "All clear — no pending gate requests."
                    : activeTab === "inside"
                    ? "No visitors currently inside your premises."
                    : "No logged visitor history available."}
                </p>
              </div>
            ) : (
              currentData.map((v) => (
                <div
                  key={v.visitorId}
                  className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 flex items-start gap-3.5"
                >
                  {/* Monochromatic Avatar */}
                  <div className="w-9 h-9 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-semibold text-xs shrink-0">
                    {v.name.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{v.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                            {v.purpose}
                          </Badge>
                          <span className="text-xs text-zinc-400">{timeAgo(v.createdAt)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {activeTab === "waiting" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => approveVisitor(v.visitorId)}
                              className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs h-7 px-2.5 gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectVisitor(v.visitorId)}
                              className="text-xs h-7 px-2.5 gap-1 text-red-600 dark:text-red-400"
                            >
                              <X className="w-3.5 h-3.5" /> Deny
                            </Button>
                          </>
                        )}
                        {activeTab === "inside" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsLeft(v.visitorId)}
                            className="h-7 px-2.5 gap-1 text-xs text-zinc-600 dark:text-zinc-400"
                          >
                            <LogOut className="w-3.5 h-3.5" /> Check Out
                          </Button>
                        )}
                        {activeTab === "history" && (
                          <Badge variant="outline" className="text-[10px]">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Details row */}
                    <div className="flex items-center gap-3.5 mt-2 flex-wrap text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {v.number}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {v.address}
                      </span>
                      {v.security && (
                        <span>
                          Guard: {v.security.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}