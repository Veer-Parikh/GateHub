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
  Video,
  MapPin,
  Calendar,
  Clock,
  Plus,
  ArrowUpRight,
  Monitor,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Meeting {
  id: string;
  title: string;
  agenda?: string;
  timing: string;
  location: string;
  completed: boolean;
  jitsiLink?: string;
  jitsiId?: string;
}

const SEED_MEETINGS: Meeting[] = [
  {
    id: "m1",
    title: "Quarterly Budget & Capital Expenditure Review",
    agenda: "Review maintenance fund expenditure for Oct–Dec. Vote on gymnasium renovation and solar panel installation.",
    timing: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
    location: "Community Hall — 2nd Floor",
    completed: false,
  },
  {
    id: "m2",
    title: "Security & Guard Operations Town Hall",
    agenda: "Review CCTV upgrade coverage and the NexGate digital pass gate console deployment.",
    timing: new Date(Date.now() + 4 * 24 * 3600000).toISOString(),
    location: "online",
    completed: false,
    jitsiLink: "https://meet.jit.si/nexgate-security-briefing-2025",
    jitsiId: "nexgate-security-briefing-2025",
  },
  {
    id: "m3",
    title: "Common Garden & Perimeter Landscaping Review",
    agenda: "Resident feedback on central lawn irrigation, pathway pavers, and tree pruning.",
    timing: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    location: "Tower B Lobby",
    completed: true,
  },
];

function generateJitsiLink(title: string) {
  const roomName = title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") + "-" + Math.random().toString(36).slice(2, 7);
  return { link: `https://meet.jit.si/${roomName}`, id: roomName };
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: "", agenda: "", timing: "", location: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token");
        const [userRes, meetingsRes] = await Promise.all([
          fetch("http://localhost:5000/api/user/my", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("http://localhost:5000/api/meeting/all", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!userRes.ok || !meetingsRes.ok) throw new Error("API error");
        const user = await userRes.json();
        setIsAdmin(user.isAdmin);
        setMeetings(await meetingsRes.json());
      } catch {
        setMeetings(SEED_MEETINGS);
      }
    };
    fetchData();
  }, []);

  const createMeeting = async () => {
    if (!newMeeting.title || !newMeeting.timing || !newMeeting.location) return;
    setSubmitting(true);

    const isOnline = newMeeting.location.toLowerCase() === "online";
    const jitsi = isOnline ? generateJitsiLink(newMeeting.title) : null;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/meeting/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...newMeeting,
          jitsiLink: jitsi?.link,
          jitsiId: jitsi?.id,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setMeetings(prev => [created, ...prev]);
      } else throw new Error("API failed");
    } catch {
      const localMeeting: Meeting = {
        id: `local-${Date.now()}`,
        title: newMeeting.title,
        agenda: newMeeting.agenda,
        timing: new Date(newMeeting.timing).toISOString(),
        location: newMeeting.location,
        completed: false,
        jitsiLink: jitsi?.link,
        jitsiId: jitsi?.id,
      };
      setMeetings(prev => [localMeeting, ...prev]);
    }

    toast.success("Meeting scheduled", { description: newMeeting.title });
    setIsDialogOpen(false);
    setNewMeeting({ title: "", agenda: "", timing: "", location: "" });
    setSubmitting(false);
  };

  const filtered = meetings
    .filter(m => {
      const isPast = new Date(m.timing) < new Date() || m.completed;
      if (filter === "upcoming") return !isPast;
      if (filter === "past") return isPast;
      return true;
    })
    .sort((a, b) => new Date(a.timing).getTime() - new Date(b.timing).getTime());

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Sidebar userType="user" />
      <main className="flex-1 overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">AGM &amp; Town Halls</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Society general body meetings, online conferences, and agendas.</p>
            </div>

            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs h-8 gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Schedule Meeting
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <DialogHeader>
                    <DialogTitle className="text-base font-semibold">Schedule Meeting</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3.5 py-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-500">Meeting Title</Label>
                      <Input
                        placeholder="e.g. Annual General Body Meeting"
                        value={newMeeting.title}
                        onChange={e => setNewMeeting(p => ({ ...p, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-zinc-500">Agenda Points (Optional)</Label>
                      <Textarea
                        placeholder="Key topics, motions to be put to vote..."
                        value={newMeeting.agenda}
                        onChange={e => setNewMeeting(p => ({ ...p, agenda: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-zinc-500">Date &amp; Time</Label>
                        <Input
                          type="datetime-local"
                          value={newMeeting.timing}
                          onChange={e => setNewMeeting(p => ({ ...p, timing: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-zinc-500">Location</Label>
                        <Input
                          placeholder='e.g. online or Community Hall'
                          value={newMeeting.location}
                          onChange={e => setNewMeeting(p => ({ ...p, location: e.target.value }))}
                        />
                        <p className="text-[10px] text-zinc-400">Type &quot;online&quot; to auto-generate video link</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button
                        onClick={createMeeting}
                        size="sm"
                        disabled={!newMeeting.title || !newMeeting.timing || !newMeeting.location || submitting}
                        className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                      >
                        {submitting ? "Scheduling..." : "Schedule Meeting"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5">
            {(["upcoming", "past", "all"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all capitalize",
                  filter === f
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                )}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>

          {/* Meeting cards */}
          {filtered.length === 0 ? (
            <div className="text-center py-14 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <Calendar className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No meetings found</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {filter === "upcoming" ? "No upcoming meetings scheduled." : "No past meeting history found."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(meeting => {
                const meetingDate = new Date(meeting.timing);
                const isPast = meetingDate < new Date() || meeting.completed;
                const isOnline = meeting.location.toLowerCase() === "online";
                const daysAway = Math.round((meetingDate.getTime() - Date.now()) / 86400000);

                return (
                  <div
                    key={meeting.id}
                    className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 shadow-none"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
                        {isOnline ? <Monitor className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-snug">{meeting.title}</p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isOnline && (
                              <Badge variant="outline" className="text-[10px]">
                                Online
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px]">
                              {isPast ? "Concluded" : daysAway === 0 ? "Today" : `In ${daysAway}d`}
                            </Badge>
                          </div>
                        </div>

                        {meeting.agenda && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{meeting.agenda}</p>
                        )}

                        <div className="flex items-center gap-4 mt-2.5 flex-wrap text-xs text-zinc-400">
                          <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            {format(meetingDate, "EEE, dd MMM yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            {format(meetingDate, "h:mm a")}
                          </span>
                          <span className="flex items-center gap-1">
                            {isOnline ? <Video className="w-3.5 h-3.5 text-zinc-400" /> : <MapPin className="w-3.5 h-3.5 text-zinc-400" />}
                            {isOnline ? "Virtual Room" : meeting.location}
                          </span>
                        </div>

                        {/* Join button for online upcoming meetings */}
                        {isOnline && meeting.jitsiLink && !isPast && (
                          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                            <a
                              href={meeting.jitsiLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-medium rounded transition-colors"
                            >
                              Join Video Call
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
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