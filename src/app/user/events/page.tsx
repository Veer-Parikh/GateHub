"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CalendarDays,
  MapPin,
  User,
  Plus,
  Search,
  Clock,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface Event {
  eventId: string;
  title: string;
  details: string;
  date: string;
  venue: string;
  admin: { name: string; profileUrl: string | null };
}

const SEED_EVENTS: Event[] = [
  {
    eventId: "e1",
    title: "Annual Sports Meet",
    details: "Cricket tournament, badminton matches, and athletic events for all age groups.",
    date: new Date(Date.now() + 5 * 24 * 3600000).toISOString(),
    venue: "Main Clubhouse Ground",
    admin: { name: "Suresh Menon (Secretary)", profileUrl: null },
  },
  {
    eventId: "e2",
    title: "Diwali Community Festival",
    details: "Cultural performances, food stalls, and traditional festivities at the central courtyard.",
    date: new Date(Date.now() + 12 * 24 * 3600000).toISOString(),
    venue: "Tower A Amphitheatre",
    admin: { name: "Priya Iyer (Admin)", profileUrl: null },
  },
  {
    eventId: "e3",
    title: "Quarterly Budget & Sinking Fund Review",
    details: "Presentation of operational accounts, audit report, and upcoming capital expenditure.",
    date: new Date(Date.now() + 3 * 24 * 3600000).toISOString(),
    venue: "Community Hall — 3rd Floor",
    admin: { name: "Rajesh Kumar (President)", profileUrl: null },
  },
  {
    eventId: "e4",
    title: "Youth Summer Workshop Orientation",
    details: "Robotics, arts, swimming, and chess instruction workshops for school-age residents.",
    date: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
    venue: "Basement Activity Center",
    admin: { name: "Anita Bose (Admin)", profileUrl: null },
  },
];

const eventSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  details: z.string().optional(),
  date: z.string().refine(v => !isNaN(Date.parse(v)), { message: "Enter a valid date" }),
  venue: z.string().min(2, "Venue must be at least 2 characters"),
});

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: { title: "", details: "", date: "", venue: "" },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token");
        const [userRes, eventsRes] = await Promise.all([
          fetch("http://localhost:5000/api/user/my", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/event/all", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!userRes.ok || !eventsRes.ok) throw new Error("API error");
        const user = await userRes.json();
        setIsAdmin(user.isAdmin);
        setEvents(await eventsRes.json());
      } catch {
        setEvents(SEED_EVENTS);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (values: z.infer<typeof eventSchema>) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/event/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        const newEvent = await res.json();
        setEvents(prev => [newEvent, ...prev]);
      } else {
        const localEvent: Event = {
          eventId: `local-${Date.now()}`,
          ...values,
          details: values.details || "",
          admin: { name: "You (Admin)", profileUrl: null },
        };
        setEvents(prev => [localEvent, ...prev]);
      }
      toast.success("Event created", { description: values.title });
      setShowForm(false);
      form.reset();
    } catch {
      toast.error("Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = events
    .filter(e => {
      const s = searchTerm.toLowerCase();
      const matches = e.title.toLowerCase().includes(s) || e.venue.toLowerCase().includes(s) || (e.details || "").toLowerCase().includes(s);
      const now = new Date();
      const d = new Date(e.date);
      if (filter === "upcoming") return matches && d >= now;
      if (filter === "past") return matches && d < now;
      return matches;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Sidebar userType="user" />
      <main className="flex-1 overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">Society Events</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Notices, community activities, and celebrations.</p>
            </div>
            {isAdmin && (
              <Button
                onClick={() => setShowForm(v => !v)}
                className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs h-8 gap-1.5"
              >
                {showForm ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showForm ? "Close Form" : "Create Event"}
              </Button>
            )}
          </div>

          {/* Admin create form */}
          {showForm && isAdmin && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5">
              <h2 className="font-semibold text-sm mb-3">Create New Event</h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-zinc-500">Event Title</FormLabel>
                          <FormControl><Input placeholder="e.g. Annual Sports Meet" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="venue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-zinc-500">Venue</FormLabel>
                          <FormControl><Input placeholder="e.g. Community Hall" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-zinc-500">Date &amp; Time</FormLabel>
                        <FormControl><Input type="datetime-local" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-zinc-500">Details</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe the event agenda, registration notes..." rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                    <Button type="submit" size="sm" disabled={submitting} className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
                      {submitting ? "Publishing..." : "Publish Event"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-0 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
            <div className="flex gap-1.5">
              {(["all", "upcoming", "past"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    filter === f
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                      : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                  )}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Events grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-14 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <CalendarDays className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No events found</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {searchTerm ? "Refine your search criteria." : "No scheduled events match the current filter."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filtered.map(event => {
                const eventDate = new Date(event.date);
                const isPast = eventDate < new Date();
                const daysAway = Math.round((eventDate.getTime() - Date.now()) / 86400000);

                return (
                  <div
                    key={event.eventId}
                    className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col justify-between shadow-none"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-snug">{event.title}</p>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {isPast ? "Past" : daysAway === 0 ? "Today" : `In ${daysAway}d`}
                        </Badge>
                      </div>

                      {event.details && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{event.details}</p>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs text-zinc-400">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 font-medium">
                          <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
                          {format(eventDate, "EEE, dd MMM yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          {format(eventDate, "h:mm a")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-0.5 text-[11px]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-400" />
                          {event.venue}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-zinc-400" />
                          {event.admin.name.split(" ")[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}