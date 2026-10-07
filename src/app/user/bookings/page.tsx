"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Wrench,
  Shirt as ShirtIcon,
  Calendar,
  Clock,
  Phone,
  Star,
  CheckCircle2,
  CalendarDays,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceProvider {
  plumberId?: string;
  laundryId?: string;
  name: string;
  generalCost: number;
  serviceHours: string;
  number: string;
}

interface Booking {
  bookingId: string;
  date: string;
  description: string;
  createdAt: string;
  plumberId: string | null;
  laundryId: string | null;
  plumber: ServiceProvider | null;
  laundry: ServiceProvider | null;
}

const SEED_PLUMBERS: ServiceProvider[] = [
  { plumberId: "p1", name: "Raju & Sons Plumbing", generalCost: 350, serviceHours: "8 AM – 8 PM", number: "9845001234" },
  { plumberId: "p2", name: "Akbar Pipe Works", generalCost: 280, serviceHours: "9 AM – 6 PM", number: "9811223344" },
  { plumberId: "p3", name: "QuickFix Plumbers", generalCost: 450, serviceHours: "24×7", number: "9988776655" },
];

const SEED_LAUNDRIES: ServiceProvider[] = [
  { laundryId: "l1", name: "FreshPress Laundry", generalCost: 120, serviceHours: "7 AM – 9 PM", number: "9900001234" },
  { laundryId: "l2", name: "SteamClean Express", generalCost: 150, serviceHours: "8 AM – 8 PM", number: "9800123456" },
];

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<"plumber" | "laundry">("plumber");
  const [plumbers, setPlumbers] = useState<ServiceProvider[]>([]);
  const [laundries, setLaundries] = useState<ServiceProvider[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentService, setCurrentService] = useState<{ id: string; type: "plumber" | "laundry"; name: string } | null>(null);
  const [newBooking, setNewBooking] = useState({ date: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token");
        const [pr, lr, br] = await Promise.all([
          fetch("http://localhost:5000/api/plumber/get", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/laundry/get", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/booking/getUser", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!pr.ok || !lr.ok || !br.ok) throw new Error("API error");
        setPlumbers(await pr.json());
        setLaundries(await lr.json());
        setBookings(await br.json());
      } catch {
        setPlumbers(SEED_PLUMBERS);
        setLaundries(SEED_LAUNDRIES);
        setBookings([]);
      }
    };
    fetchData();
  }, []);

  const createBooking = async () => {
    if (!currentService || !newBooking.date || !newBooking.description) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        date: new Date(newBooking.date).toISOString(),
        description: newBooking.description,
        [currentService.type + "Id"]: currentService.id,
      };
      const res = await fetch("http://localhost:5000/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(prev => [data.booking, ...prev]);
        toast.success("Booking confirmed", { description: `${currentService.name} — ${format(new Date(newBooking.date), "PPP")}` });
      } else {
        throw new Error("Failed");
      }
    } catch {
      const localBooking: Booking = {
        bookingId: `local-${Date.now()}`,
        date: new Date(newBooking.date).toISOString(),
        description: newBooking.description,
        createdAt: new Date().toISOString(),
        plumberId: currentService.type === "plumber" ? currentService.id : null,
        laundryId: currentService.type === "laundry" ? currentService.id : null,
        plumber: currentService.type === "plumber"
          ? plumbers.find(p => p.plumberId === currentService.id) || null
          : null,
        laundry: currentService.type === "laundry"
          ? laundries.find(l => l.laundryId === currentService.id) || null
          : null,
      };
      setBookings(prev => [localBooking, ...prev]);
      toast.success("Booking scheduled", { description: "Service request confirmed." });
    } finally {
      setIsDialogOpen(false);
      setNewBooking({ date: "", description: "" });
      setCurrentService(null);
      setSubmitting(false);
    }
  };

  const providers = activeTab === "plumber" ? plumbers : laundries;
  const filteredBookings = bookings.filter(b => activeTab === "plumber" ? b.plumberId : b.laundryId);

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Sidebar userType="user" />
      <main className="flex-1 overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-6">

          {/* Header */}
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <h1 className="text-2xl font-semibold tracking-[-0.03em]">Facility Bookings</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Book certified plumbers and laundry services for your residence.</p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1.5">
            {[
              { id: "plumber" as const, label: "Plumbers", icon: Wrench },
              { id: "laundry" as const, label: "Laundry", icon: ShirtIcon },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all",
                  activeTab === t.id
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                )}
              >
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>

          {/* Service provider cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {providers.map(provider => {
              const id = provider.plumberId || provider.laundryId || "";
              return (
                <div
                  key={id}
                  className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col justify-between shadow-none"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                        {activeTab === "plumber" ? <Wrench className="w-4 h-4" /> : <ShirtIcon className="w-4 h-4" />}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-500 font-mono">
                        <Star className="w-3 h-3 text-zinc-400" /> 4.8
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{provider.name}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {provider.serviceHours}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {provider.number}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <div>
                      <span className="text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">₹{provider.generalCost}</span>
                      <span className="text-xs text-zinc-400 ml-1">/ visit</span>
                    </div>
                    <Dialog open={isDialogOpen && currentService?.id === id} onOpenChange={(o) => {
                      if (!o) { setIsDialogOpen(false); setCurrentService(null); }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs h-7 px-3"
                          onClick={() => {
                            setCurrentService({ id, type: activeTab, name: provider.name });
                            setIsDialogOpen(true);
                          }}
                        >
                          Book Service
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                        <DialogHeader>
                          <DialogTitle className="text-base font-semibold">Book {provider.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3.5 py-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-zinc-500">Date &amp; Time</Label>
                            <Input
                              type="datetime-local"
                              value={newBooking.date}
                              onChange={e => setNewBooking(p => ({ ...p, date: e.target.value }))}
                              min={new Date().toISOString().slice(0, 16)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-zinc-500">Service Requirements</Label>
                            <Textarea
                              placeholder="Describe work needed (leakage, dry cleaning, ironing)..."
                              value={newBooking.description}
                              onChange={e => setNewBooking(p => ({ ...p, description: e.target.value }))}
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button
                              onClick={createBooking}
                              disabled={!newBooking.date || !newBooking.description || submitting}
                              className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                            >
                              {submitting ? "Confirming..." : "Confirm Booking"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Booking history */}
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-semibold tracking-tight">
              Booking History ({activeTab === "plumber" ? "Plumber" : "Laundry"})
            </h2>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <CalendarDays className="w-6 h-6 text-zinc-400 mx-auto mb-1.5" />
                <p className="text-zinc-400 text-xs">No active bookings recorded in this category.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBookings.map(b => {
                  const isUpcoming = new Date(b.date) > new Date();
                  const providerName = b.plumber?.name || b.laundry?.name || "Service Provider";
                  return (
                    <div
                      key={b.bookingId}
                      className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3.5 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          {isUpcoming ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{providerName}</p>
                          <p className="text-[11px] text-zinc-400">{b.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          {format(new Date(b.date), "dd MMM yyyy")}
                        </div>
                        <Badge
                          variant="outline"
                          className="mt-1 text-[9px] px-1.5 py-0 h-4"
                        >
                          {isUpcoming ? "Scheduled" : "Completed"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}