"use client";

import { type FormEvent, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarDays, CalendarPlus, Check, Clock, MapPin, Megaphone, Plus, Search, User, Users, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, SourceBadge } from "@/components/page";
import { Pill, type Tone } from "@/components/status";
import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNow } from "@/hooks/use-now";
import { useEvents } from "@/lib/data";
import { relativeDay } from "@/lib/format";
import { pointsToast } from "@/lib/notify";
import { useDemoState } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { EventCategory, SocietyEvent } from "@/lib/types";

const CATEGORIES: EventCategory[] = ["Festival", "Sports", "Meeting", "Workshop", "Notice"];
const CATEGORY_TONE: Record<EventCategory, Tone> = {
  Festival: "neutral",
  Sports: "neutral",
  Meeting: "neutral",
  Workshop: "neutral",
  Notice: "blue",
};
/** Events are assumed to last two hours (also used for the calendar file). */
const DURATION_MS = 2 * 60 * 60 * 1000;

type When = "upcoming" | "past" | "all";

const DIALOG_CLASS =
  "max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";

const localInput = (ms: number) => format(new Date(ms), "yyyy-MM-dd'T'HH:mm");

// ── iCalendar export ─────────────────────────────────────────────────────────

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); // yyyyMMdd'T'HHmmss'Z' in UTC
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Fold content lines at 75 octets as RFC 5545 requires. */
function fold(line: string) {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}

function downloadIcs(ev: SocietyEvent, society: string) {
  const start = new Date(ev.date);
  const end = new Date(start.getTime() + DURATION_MS);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NexGate//Society Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.eventId}@nexgate.app`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(ev.title)}`,
    `LOCATION:${icsText(`${ev.venue}, ${society}`)}`,
    `DESCRIPTION:${icsText(`${ev.details}${ev.details ? "\n\n" : ""}Hosted by ${ev.host}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.map(fold).join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "event"}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  return (
    <AppShell>
      <Events />
    </AppShell>
  );
}

function Events() {
  const now = useNow(30_000);
  const state = useDemoState();
  const isAdmin = state.resident.isAdmin;
  const data = useEvents();

  const [when, setWhen] = useState<When>("upcoming");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<EventCategory | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);

  const isPast = (e: SocietyEvent) => new Date(e.date).getTime() + DURATION_MS < now;

  const counts = {
    upcoming: data.events.filter((e) => !isPast(e)).length,
    past: data.events.filter(isPast).length,
    all: data.events.length,
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const past = (e: SocietyEvent) => new Date(e.date).getTime() + DURATION_MS < now;
    const rows = data.events.filter((e) => {
      if (when === "upcoming" && past(e)) return false;
      if (when === "past" && !past(e)) return false;
      if (category !== "all" && e.category !== category) return false;
      if (!q) return true;
      return [e.title, e.details, e.venue, e.host].some((s) => s.toLowerCase().includes(q));
    });
    // Upcoming soonest-first, then past most-recent-first.
    return [...rows].sort((a, b) => {
      const pa = past(a);
      const pb = past(b);
      if (pa !== pb) return Number(pa) - Number(pb);
      return pa ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    });
  }, [data.events, when, category, query, now]);

  const filtersActive = query.trim() !== "" || category !== "all";

  const rsvp = (ev: SocietyEvent) => {
    const wasGoing = ev.going;
    const delta = data.rsvp(ev.eventId);
    if (wasGoing) toast(`You're no longer going to ${ev.title}`);
    else toast.success("See you there!", { description: `${ev.title} · ${relativeDay(ev.date, now)}, ${format(new Date(ev.date), "h:mm a")}` });
    pointsToast(delta, wasGoing ? `Withdrew RSVP for ${ev.title}` : `RSVP’d to ${ev.title}`);
  };

  const addToCalendar = (ev: SocietyEvent) => {
    try {
      downloadIcs(ev, state.resident.society);
      toast.success("Calendar file downloaded", { description: "Open it to add the event to your calendar." });
    } catch {
      toast.error("Couldn't create the calendar file");
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
        title="Events & notices"
        description="Festivals, sports, workshops and facility notices from your RWA. RSVP so organisers know how many to expect."
        badge={<SourceBadge live={data.live} error={data.error} />}
        actions={
          isAdmin && (
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Post event
            </Button>
          )
        }
      />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex self-start rounded-md border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900" role="group" aria-label="Show">
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
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Label htmlFor="ev-search" className="sr-only">
              Search events
            </Label>
            <Input
              id="ev-search"
              type="search"
              placeholder="Search events, venues or hosts"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-9 text-sm"
            />
          </div>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="Category">
          <div className="flex w-max gap-1.5 sm:w-auto sm:flex-wrap">
            {(["all", ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  category === c
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700",
                )}
              >
                {c === "all" ? "All types" : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {data.loading && data.events.length === 0 ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2" aria-busy="true" aria-label="Loading events">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : data.live && data.error && data.events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Couldn't load events" description={data.error} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={filtersActive ? "No events match your filters" : when === "past" ? "No past events" : when === "upcoming" ? "Nothing coming up" : "No events yet"}
          description={
            filtersActive
              ? "Try a different search or category."
              : when === "upcoming"
                ? isAdmin
                  ? "Post an event or notice to let residents know what's happening."
                  : "When the RWA posts an event or notice, it will show up here."
                : "Events that have already happened are kept here."
          }
          action={
            filtersActive ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                }}
              >
                <X className="h-3.5 w-3.5" /> Clear filters
              </Button>
            ) : when === "upcoming" && isAdmin ? (
              <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Post event
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {visible.map((ev) => (
            <EventCard
              key={ev.eventId}
              ev={ev}
              now={now}
              past={isPast(ev)}
              canRsvp={data.canRsvp}
              onRsvp={() => rsvp(ev)}
              onCalendar={() => addToCalendar(ev)}
            />
          ))}
        </ul>
      )}

      {isAdmin && <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} now={now} create={data.create} />}
    </>
  );
}

function EventCard({
  ev,
  now,
  past,
  canRsvp,
  onRsvp,
  onCalendar,
}: {
  ev: SocietyEvent;
  now: number;
  past: boolean;
  canRsvp: boolean;
  onRsvp: () => void;
  onCalendar: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const d = new Date(ev.date);
  const start = d.getTime();
  const happening = start <= now && now <= start + DURATION_MS;
  const longDetails = ev.details.length > 140;
  const showRsvp = canRsvp && !past && ev.category !== "Notice";
  const detailsId = `ev-details-${ev.eventId}`;

  return (
    <li
      className={cn(
        "flex gap-3.5 rounded-lg border bg-white p-4 dark:bg-zinc-900",
        past ? "border-zinc-200/70 dark:border-zinc-800/70" : "border-zinc-200 dark:border-zinc-800",
      )}
    >
      <div
        className={cn(
          "flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-md border",
          past
            ? "border-zinc-200 bg-zinc-50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-500"
            : "border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
        )}
        aria-hidden="true"
      >
        <span className="text-lg font-semibold leading-none tabular-nums">{format(d, "d")}</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{format(d, "MMM")}</span>
      </div>

      <div className={cn("min-w-0 flex-1", past && "opacity-60")}>
        <div className="flex flex-wrap items-center gap-1.5">
          <Pill tone={CATEGORY_TONE[ev.category]}>
            {ev.category === "Notice" && <Megaphone className="h-3 w-3" />}
            {ev.category}
          </Pill>
          {happening && (
            <Pill tone="emerald" dot>
              Happening now
            </Pill>
          )}
          {past && <Pill>Ended</Pill>}
          {ev.going && !past && <Pill tone="emerald">You&apos;re going</Pill>}
        </div>
        <h3 className="mt-1.5 font-semibold leading-snug text-zinc-900 dark:text-zinc-100">{ev.title}</h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
            {relativeDay(ev.date, now)} · {format(d, "EEE d MMM, h:mm a")}
          </span>
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <span className="truncate">{ev.venue}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1">
            <User className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
            <span className="truncate">{ev.host}</span>
          </span>
        </div>

        {ev.details && (
          <div className="mt-2">
            <p id={detailsId} className={cn("text-xs leading-relaxed text-zinc-600 dark:text-zinc-400", !expanded && "line-clamp-2")}>
              {ev.details}
            </p>
            {longDetails && (
              <button
                type="button"
                onClick={() => setExpanded((x) => !x)}
                aria-expanded={expanded}
                aria-controls={detailsId}
                className="mt-1 text-xs font-medium text-zinc-700 hover:underline dark:text-zinc-300"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {!past && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            {showRsvp && (
              <>
                <Button
                  size="sm"
                  variant={ev.going ? "default" : "outline"}
                  aria-pressed={ev.going}
                  onClick={onRsvp}
                  className="h-8 gap-1 text-xs"
                >
                  {ev.going ? <Check className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />} I&apos;m going
                </Button>
                <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                  {ev.rsvps} {ev.rsvps === 1 ? "resident" : "residents"} going
                </span>
              </>
            )}
            <Button size="sm" variant="outline" onClick={onCalendar} className="ml-auto h-8 gap-1 text-xs">
              <CalendarPlus className="h-3.5 w-3.5" /> Add to calendar
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

type CreateInput = { title: string; details: string; date: string; venue: string; category: EventCategory };

const EMPTY_FORM = { title: "", category: "Festival" as EventCategory, date: "", venue: "", details: "" };

function CreateEventDialog({
  open,
  onOpenChange,
  now,
  create,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  now: number;
  create: (v: CreateInput) => Promise<unknown>;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const when = form.date ? new Date(form.date).getTime() : NaN;
  const errors = {
    title: form.title.trim().length < 3 ? "Enter a title (at least 3 characters)" : null,
    date: !form.date || Number.isNaN(when) ? "Pick a date and time" : when < now - 60_000 ? "Pick a time in the future" : null,
    venue: form.venue.trim().length < 2 ? "Where is it happening?" : null,
    details: form.details.length > 1000 ? "Keep the details under 1000 characters" : null,
  };
  const valid = !errors.title && !errors.date && !errors.venue && !errors.details;
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
    setTouched({ title: true, date: true, venue: true, details: true });
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await create({
        title: form.title.trim(),
        category: form.category,
        date: new Date(form.date).toISOString(),
        venue: form.venue.trim(),
        details: form.details.trim(),
      });
      toast.success(`${form.category === "Notice" ? "Notice" : "Event"} posted`, { description: form.title.trim() });
      close();
    } catch (err) {
      setSubmitting(false);
      toast.error("Couldn't post the event", { description: err instanceof Error ? err.message : undefined });
    }
  };

  const fieldError = (k: keyof typeof errors) =>
    show(k) ? (
      <p id={`ev-${k}-err`} className="text-xs text-red-600 dark:text-red-400">
        {errors[k]}
      </p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className={DIALOG_CLASS}>
        <DialogHeader>
          <DialogTitle className="text-base">Post an event or notice</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Every resident will see it on their Events page and dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="ev-title" className="text-xs">
              Title
            </Label>
            <Input
              id="ev-title"
              placeholder="e.g. Annual Sports Meet"
              value={form.title}
              maxLength={100}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onBlur={blur("title")}
              aria-invalid={!!show("title")}
              aria-describedby={show("title") ? "ev-title-err" : undefined}
            />
            {fieldError("title")}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ev-category" className="text-xs">
                Category
              </Label>
              <Select value={form.category} onValueChange={(v: EventCategory) => setForm({ ...form, category: v })}>
                <SelectTrigger id="ev-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-date" className="text-xs">
                Date &amp; time
              </Label>
              <Input
                id="ev-date"
                type="datetime-local"
                min={localInput(now)}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                onBlur={blur("date")}
                aria-invalid={!!show("date")}
                aria-describedby={show("date") ? "ev-date-err" : undefined}
              />
              {fieldError("date")}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-venue" className="text-xs">
              Venue
            </Label>
            <Input
              id="ev-venue"
              placeholder="e.g. Clubhouse, Central courtyard"
              value={form.venue}
              maxLength={100}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              onBlur={blur("venue")}
              aria-invalid={!!show("venue")}
              aria-describedby={show("venue") ? "ev-venue-err" : undefined}
            />
            {fieldError("venue")}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-details" className="text-xs">
              Details <span className="font-normal text-zinc-400">(optional)</span>
            </Label>
            <Textarea
              id="ev-details"
              rows={3}
              placeholder="Agenda, registration notes, what to bring…"
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              onBlur={blur("details")}
              aria-invalid={!!show("details")}
              aria-describedby={show("details") ? "ev-details-err" : undefined}
            />
            {fieldError("details")}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid || submitting}>
              {submitting ? "Posting…" : "Post event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
