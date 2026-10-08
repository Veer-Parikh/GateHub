"use client";

import { type FormEvent, useMemo, useState } from "react";
import { format, isToday } from "date-fns";
import { toast } from "sonner";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  Clock,
  Copy,
  FileText,
  MapPin,
  NotebookPen,
  Plus,
  User,
  Video,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, SourceBadge } from "@/components/page";
import { Pill } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNow } from "@/hooks/use-now";
import { useMeetings } from "@/lib/data";
import { relativeDay } from "@/lib/format";
import { pointsToast } from "@/lib/notify";
import { useDemoState } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Meeting } from "@/lib/types";

/** A meeting is treated as running for two hours; the call opens 10 minutes early. */
const DURATION_MS = 2 * 60 * 60 * 1000;
const EARLY_MS = 10 * 60 * 1000;

type When = "upcoming" | "past" | "all";

const DIALOG_CLASS =
  "max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";

const localInput = (ms: number) => format(new Date(ms), "yyyy-MM-dd'T'HH:mm");

function meetingState(m: Meeting, now: number) {
  const start = new Date(m.timing).getTime();
  const past = m.completed || start + DURATION_MS < now;
  const live = !m.completed && now >= start - EARLY_MS && now <= start + DURATION_MS;
  return { start, past, live };
}

export default function MeetingsPage() {
  return (
    <AppShell>
      <Meetings />
    </AppShell>
  );
}

function Meetings() {
  const now = useNow(30_000);
  const state = useDemoState();
  const isAdmin = state.resident.isAdmin;
  const data = useMeetings();

  const [when, setWhen] = useState<When>("upcoming");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [minutesFor, setMinutesFor] = useState<Meeting | null>(null);

  const counts = {
    upcoming: data.meetings.filter((m) => !meetingState(m, now).past).length,
    past: data.meetings.filter((m) => meetingState(m, now).past).length,
    all: data.meetings.length,
  };

  const visible = useMemo(() => {
    const rows = data.meetings.filter((m) => {
      const { past } = meetingState(m, now);
      return when === "all" || (when === "past" ? past : !past);
    });
    return [...rows].sort((a, b) => {
      const pa = meetingState(a, now).past;
      const pb = meetingState(b, now).past;
      if (pa !== pb) return Number(pa) - Number(pb);
      return pa ? b.timing.localeCompare(a.timing) : a.timing.localeCompare(b.timing);
    });
  }, [data.meetings, when, now]);

  const join = (m: Meeting) => {
    if (!m.link) return;
    window.open(m.link, "_blank", "noopener");
    const pts = data.join(m.meetingId);
    pointsToast(pts, "Joined a society meeting");
  };

  const copyLink = async (m: Meeting) => {
    if (!m.link) return;
    try {
      await navigator.clipboard.writeText(m.link);
      toast.success("Meeting link copied", { description: m.link });
    } catch {
      toast.error("Clipboard not available");
    }
  };

  const whens: { id: When; label: string }[] = [
    { id: "upcoming", label: "Upcoming" },
    { id: "past", label: "Past" },
    { id: "all", label: "All" },
  ];

  return (
    <>
      <PageHeader
        title="Meetings"
        description="General body meetings, town halls and committee reviews — join online, read agendas and catch up on minutes."
        badge={<SourceBadge live={data.live} error={data.error} />}
        actions={
          isAdmin && (
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => setScheduleOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Schedule meeting
            </Button>
          )
        }
      />

      <div className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900" role="group" aria-label="Show">
        {whens.map((w) => (
          <button
            key={w.id}
            type="button"
            aria-pressed={when === w.id}
            onClick={() => setWhen(w.id)}
            className={cn(
              "rounded px-3 py-1 text-xs font-medium transition-colors",
              when === w.id
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            {w.label} <span className="tabular-nums opacity-70">{counts[w.id]}</span>
          </button>
        ))}
      </div>

      {data.loading && data.meetings.length === 0 ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading meetings">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : data.live && data.error && data.meetings.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Couldn't load meetings" description={data.error} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={when === "past" ? "No past meetings" : when === "upcoming" ? "No upcoming meetings" : "No meetings yet"}
          description={
            when === "past"
              ? "Concluded meetings and their minutes are kept here."
              : isAdmin
                ? "Schedule a meeting — online meetings get a video link automatically."
                : "When the RWA schedules a meeting, it will show up here with the agenda."
          }
          action={
            when !== "past" && isAdmin ? (
              <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => setScheduleOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Schedule meeting
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((m) => (
            <MeetingCard
              key={m.meetingId}
              m={m}
              now={now}
              isAdmin={isAdmin}
              onJoin={() => join(m)}
              onCopy={() => copyLink(m)}
              onPublish={() => setMinutesFor(m)}
            />
          ))}
        </ul>
      )}

      {isAdmin && (
        <>
          <ScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} now={now} create={data.create} />
          <MinutesDialog meeting={minutesFor} live={data.live} onClose={() => setMinutesFor(null)} complete={data.complete} />
        </>
      )}
    </>
  );
}

function MeetingCard({
  m,
  now,
  isAdmin,
  onJoin,
  onCopy,
  onPublish,
}: {
  m: Meeting;
  now: number;
  isAdmin: boolean;
  onJoin: () => void;
  onCopy: () => void;
  onPublish: () => void;
}) {
  const { start, past, live } = meetingState(m, now);
  const d = new Date(m.timing);
  const canJoin = !past && m.online && !!m.link;
  const canPublish = isAdmin && !m.completed && (start <= now || isToday(d));
  const Icon = m.online ? Video : Building2;

  return (
    <li
      className={cn(
        "flex gap-3.5 rounded-lg border bg-white p-4 dark:bg-zinc-900",
        live ? "border-emerald-300 dark:border-emerald-900/70" : "border-zinc-200 dark:border-zinc-800",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          live
            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
        )}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className={cn(past && !m.completed && "opacity-70")}>
          <div className="flex flex-wrap items-center gap-1.5">
            {m.online && <Pill tone="blue">Online</Pill>}
            {live ? (
              <Pill tone="emerald" dot>
                Live now
              </Pill>
            ) : past ? (
              <Pill>Concluded</Pill>
            ) : (
              <Pill dot={isToday(d)}>{relativeDay(m.timing, now)}</Pill>
            )}
            {m.attended && <Pill tone="emerald">Attended</Pill>}
            {!m.completed && past && isAdmin && <Pill tone="amber">Minutes pending</Pill>}
          </div>
          <h3 className="mt-1.5 font-semibold leading-snug text-zinc-900 dark:text-zinc-100">{m.title}</h3>
          {m.agenda && <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{m.agenda}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
              <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
              {format(d, "EEE d MMM yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              {format(d, "h:mm a")}
            </span>
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <span className="truncate">{m.online && m.location.toLowerCase() !== "online" ? `${m.location} + online` : m.location}</span>
            </span>
            <span className="flex min-w-0 items-center gap-1">
              <User className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <span className="truncate">{m.host}</span>
            </span>
          </div>
        </div>

        {m.completed && m.minutes && (
          <Collapsible className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/40">
            <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-zinc-400" /> View minutes
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="whitespace-pre-line border-t border-zinc-200 px-3 py-2.5 text-xs leading-relaxed text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
                {m.minutes}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}
        {m.completed && !m.minutes && <p className="mt-2 text-xs text-zinc-400">No minutes were published for this meeting.</p>}

        {(canJoin || canPublish) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            {canJoin && (
              <>
                <Button
                  size="sm"
                  onClick={onJoin}
                  className={cn("h-8 gap-1 text-xs", live && "bg-emerald-600 text-white hover:bg-emerald-700")}
                >
                  <Video className="h-3.5 w-3.5" /> Join video call
                </Button>
                <Button size="sm" variant="outline" onClick={onCopy} className="h-8 gap-1 text-xs" title={`Copy video link for ${m.title}`}>
                  <Copy className="h-3.5 w-3.5" /> Copy link
                </Button>
              </>
            )}
            {canPublish && (
              <Button size="sm" variant="outline" onClick={onPublish} className="h-8 gap-1 text-xs sm:ml-auto">
                <NotebookPen className="h-3.5 w-3.5" /> Publish minutes
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

type ScheduleInput = { title: string; agenda: string; timing: string; location: string; online: boolean };

const EMPTY_FORM = { title: "", agenda: "", timing: "", location: "", online: false };

function ScheduleDialog({
  open,
  onOpenChange,
  now,
  create,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  now: number;
  create: (v: ScheduleInput) => Promise<unknown>;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const when = form.timing ? new Date(form.timing).getTime() : NaN;
  const errors = {
    title: form.title.trim().length < 3 ? "Enter a title (at least 3 characters)" : null,
    agenda: form.agenda.length > 1000 ? "Keep the agenda under 1000 characters" : null,
    timing: !form.timing || Number.isNaN(when) ? "Pick a date and time" : when < now - 60_000 ? "Pick a time in the future" : null,
    location: !form.online && form.location.trim().length < 2 ? "Where will residents meet?" : null,
  };
  const valid = !errors.title && !errors.agenda && !errors.timing && !errors.location;
  const show = (k: keyof typeof errors) => touched[k] && errors[k];
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));

  const close = () => {
    setForm(EMPTY_FORM);
    setTouched({});
    setSubmitting(false);
    onOpenChange(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ title: true, agenda: true, timing: true, location: true });
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await create({
        title: form.title.trim(),
        agenda: form.agenda.trim(),
        timing: new Date(form.timing).toISOString(),
        location: form.location.trim(),
        online: form.online,
      });
      toast.success("Meeting scheduled", {
        description: form.online ? `${form.title.trim()} — a video link has been created.` : form.title.trim(),
      });
      close();
    } catch (err) {
      setSubmitting(false);
      toast.error("Couldn't schedule the meeting", { description: err instanceof Error ? err.message : undefined });
    }
  };

  const fieldError = (k: keyof typeof errors) =>
    show(k) ? (
      <p id={`mt-${k}-err`} className="text-xs text-red-600 dark:text-red-400">
        {errors[k]}
      </p>
    ) : null;

  const modes = [
    { online: false, label: "In person", icon: Building2 },
    { online: true, label: "Online", icon: Video },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className={DIALOG_CLASS}>
        <DialogHeader>
          <DialogTitle className="text-base">Schedule a meeting</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Residents see it on their Meetings page and dashboard straight away.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="mt-title" className="text-xs">
              Title
            </Label>
            <Input
              id="mt-title"
              placeholder="e.g. Annual General Body Meeting"
              value={form.title}
              maxLength={100}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onBlur={blur("title")}
              aria-invalid={!!show("title")}
              aria-describedby={show("title") ? "mt-title-err" : undefined}
            />
            {fieldError("title")}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mt-agenda" className="text-xs">
              Agenda <span className="font-normal text-zinc-400">(optional)</span>
            </Label>
            <Textarea
              id="mt-agenda"
              rows={3}
              placeholder="Key topics, motions to be put to vote…"
              value={form.agenda}
              onChange={(e) => setForm({ ...form, agenda: e.target.value })}
              onBlur={blur("agenda")}
              aria-invalid={!!show("agenda")}
              aria-describedby={show("agenda") ? "mt-agenda-err" : undefined}
            />
            {fieldError("agenda")}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mt-timing" className="text-xs">
              Date &amp; time
            </Label>
            <Input
              id="mt-timing"
              type="datetime-local"
              min={localInput(now)}
              value={form.timing}
              onChange={(e) => setForm({ ...form, timing: e.target.value })}
              onBlur={blur("timing")}
              aria-invalid={!!show("timing")}
              aria-describedby={show("timing") ? "mt-timing-err" : undefined}
            />
            {fieldError("timing")}
          </div>

          <div className="space-y-1.5">
            <span id="mt-mode-label" className="text-xs font-medium leading-none">
              Format
            </span>
            <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="mt-mode-label">
              {modes.map((mode) => (
                <button
                  key={mode.label}
                  type="button"
                  aria-pressed={form.online === mode.online}
                  onClick={() => setForm({ ...form, online: mode.online })}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    form.online === mode.online
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600",
                  )}
                >
                  <mode.icon className="h-4 w-4" /> {mode.label}
                </button>
              ))}
            </div>
            {form.online && (
              <p className="flex items-start gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-2 text-xs text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                <Video className="mt-0.5 h-3.5 w-3.5 shrink-0" />A Jitsi video link is generated automatically — residents can join from the Meetings page.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mt-location" className="text-xs">
              Location {form.online && <span className="font-normal text-zinc-400">(optional — for hybrid meetings)</span>}
            </Label>
            <Input
              id="mt-location"
              placeholder={form.online ? "Online" : "e.g. Community hall, 2nd floor"}
              value={form.location}
              maxLength={100}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              onBlur={blur("location")}
              aria-invalid={!!show("location")}
              aria-describedby={show("location") ? "mt-location-err" : undefined}
            />
            {fieldError("location")}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || submitting}>
              {submitting ? "Scheduling…" : "Schedule meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MinutesDialog({
  meeting,
  live,
  onClose,
  complete,
}: {
  meeting: Meeting | null;
  live: boolean;
  onClose: () => void;
  complete: (id: string, minutes: string) => Promise<unknown>;
}) {
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const error = text.trim().length < 10 ? "Summarise the decisions taken (at least 10 characters)" : text.length > 4000 ? "Keep the minutes under 4000 characters" : null;

  const close = () => {
    setText("");
    setTouched(false);
    setSubmitting(false);
    onClose();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!meeting || error || submitting) return;
    setSubmitting(true);
    try {
      await complete(meeting.meetingId, text);
      toast.success("Minutes published", { description: `${meeting.title} is now marked as concluded.` });
      close();
    } catch (err) {
      setSubmitting(false);
      toast.error("Couldn't publish the minutes", { description: err instanceof Error ? err.message : undefined });
    }
  };

  return (
    <Dialog open={!!meeting} onOpenChange={(o) => !o && close()}>
      <DialogContent className={DIALOG_CLASS}>
        <DialogHeader>
          <DialogTitle className="text-base">Publish minutes</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            {meeting?.title} — publishing marks the meeting as concluded.
            {live && " The live server doesn't store minutes yet, so only the status will be saved."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="mt-minutes" className="text-xs">
              Minutes
            </Label>
            <Textarea
              id="mt-minutes"
              rows={6}
              placeholder="Decisions taken, votes, action items and owners…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={touched && !!error}
              aria-describedby={touched && error ? "mt-minutes-err" : undefined}
            />
            {touched && error && (
              <p id="mt-minutes-err" className="text-xs text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={!!error || submitting}>
              {submitting ? "Publishing…" : "Publish minutes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
