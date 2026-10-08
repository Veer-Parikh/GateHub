"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { CalendarCheck, Check, Clock, IndianRupee, Phone, RotateCcw, Shirt, Star, Wrench, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, SourceBadge, StatCard } from "@/components/page";
import { BookingStatusPill, Pill } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNow } from "@/hooks/use-now";
import { useBookings } from "@/lib/data";
import { friendlyDateTime, inr } from "@/lib/format";
import { pointsToast } from "@/lib/notify";
import { cn } from "@/lib/utils";
import type { Booking, ServiceProvider, ServiceType } from "@/lib/types";

const QUICK_TITLES: Record<ServiceType, string[]> = {
  plumber: ["Leaking tap", "Blocked drain", "Flush not working", "Geyser fitting", "Low water pressure"],
  laundry: ["Wash & fold", "Wash & iron", "Dry clean", "Curtains & drapes", "Shoe cleaning"],
};

/** Default slot: the next full hour at least 2 hours from now. */
function defaultSlot() {
  const d = new Date(Date.now() + 2 * 3_600_000);
  d.setMinutes(0, 0, 0);
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" role="radio" aria-checked={value === i} aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => onChange(i)}>
          <Star className={cn("h-7 w-7 transition-colors", i <= value ? "fill-amber-400 text-amber-400" : "text-zinc-300 hover:text-amber-300 dark:text-zinc-600")} />
        </button>
      ))}
    </div>
  );
}

function Timeline({ b }: { b: Booking }) {
  if (b.status === "cancelled") return <p className="text-[11px] text-zinc-500">Cancelled {b.cancelledAt ? friendlyDateTime(b.cancelledAt) : ""}</p>;
  const steps = [
    { label: "Requested", at: b.createdAt },
    { label: b.type === "laundry" ? "Picked up" : "Started", at: b.startedAt },
    { label: b.type === "laundry" ? "Delivered" : "Completed", at: b.completedAt },
  ];
  return (
    <ol className="flex items-center gap-1.5 text-[11px]">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-1.5">
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full",
              s.at ? "bg-emerald-600 text-white" : "border border-zinc-300 dark:border-zinc-600",
            )}
          >
            {s.at && <Check className="h-2.5 w-2.5" />}
          </span>
          <span className={s.at ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400"}>{s.label}</span>
          {i < steps.length - 1 && <span className={cn("h-px w-4 sm:w-8", steps[i + 1].at ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-700")} />}
        </li>
      ))}
    </ol>
  );
}

export default function BookingsPage() {
  return (
    <AppShell>
      <Bookings />
    </AppShell>
  );
}

function Bookings() {
  const now = useNow(30_000);
  const data = useBookings();
  const [type, setType] = useState<ServiceType>("plumber");
  const [filter, setFilter] = useState<"open" | "done" | "all">("open");
  const [booking, setBooking] = useState<ServiceProvider | null>(null);
  const [form, setForm] = useState({ title: "", description: "", when: defaultSlot() });
  const [rating, setRating] = useState<{ b: Booking; stars: number; review: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const providers = data.providers.filter((p) => p.type === type);
  const open = data.bookings.filter((b) => b.status === "requested" || b.status === "in_progress");
  const completed = data.bookings.filter((b) => b.status === "completed");
  const spent = completed.reduce((s, b) => s + b.cost, 0);
  const rated = completed.filter((b) => b.rating);
  const toRate = completed.filter((b) => !b.rating).length;
  const list = data.bookings
    .filter((b) => (filter === "open" ? open.includes(b) : filter === "done" ? !open.includes(b) : true))
    .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor));

  const startBooking = (p: ServiceProvider, title = "") => {
    setForm({ title, description: "", when: defaultSlot() });
    setBooking(p);
  };

  const when = new Date(form.when);
  const formError = form.title.trim().length < 3 ? "Describe the job in a few words" : !form.when || when.getTime() < Date.now() ? "Pick a time in the future" : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || formError) return;
    setSubmitting(true);
    try {
      await data.create(booking, { title: form.title, description: form.description, scheduledFor: when.toISOString() });
      toast.success(`Booked ${booking.name}`, { description: `${form.title} · ${friendlyDateTime(when.toISOString())}` });
      setBooking(null);
      setFilter("open");
    } catch (err) {
      toast.error("Couldn't create the booking", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setSubmitting(false);
    }
  };

  const submitRating = async () => {
    if (!rating || !rating.stars) return;
    try {
      const pts = await data.rate(rating.b.bookingId, rating.stars, rating.review);
      toast.success("Thanks for the review");
      pointsToast(pts ?? 0, `Reviewed ${rating.b.providerName}`);
      setRating(null);
    } catch (err) {
      toast.error("Couldn't save the rating", { description: err instanceof Error ? err.message : undefined });
    }
  };

  return (
    <>
      <PageHeader
        title="Services"
        description="Book society-verified plumbers and laundry partners, track jobs and rate the work."
        badge={<SourceBadge live={data.live} error={data.error} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open requests" value={open.length} hint={`${open.filter((b) => b.status === "in_progress").length} in progress`} icon={Clock} tone={open.length ? "warning" : "default"} />
        <StatCard label="Completed" value={completed.length} hint={toRate ? `${toRate} waiting for your rating` : "All rated"} icon={CalendarCheck} tone="success" />
        <StatCard label="Spent on services" value={inr(spent)} hint="Completed jobs" icon={IndianRupee} />
        <StatCard
          label="Your average rating"
          value={rated.length ? `${(rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length).toFixed(1)} ★` : "—"}
          hint={`${rated.length} review${rated.length === 1 ? "" : "s"} given`}
          icon={Star}
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-1.5">
          {(
            [
              ["plumber", "Plumbers", Wrench],
              ["laundry", "Laundry", Shirt],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              aria-pressed={type === id}
              onClick={() => setType(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors",
                type === id
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        {data.loading && providers.length === 0 ? (
          <p className="text-xs text-zinc-500">Loading partners…</p>
        ) : providers.length === 0 ? (
          <EmptyState icon={Wrench} title="No partners listed" description="The RWA hasn't onboarded any partners in this category yet." />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((p) => (
              <div key={p.providerId} className="flex flex-col justify-between rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.name}</p>
                      {p.company && <p className="truncate text-xs text-zinc-500">{p.company}</p>}
                    </div>
                    {p.rating > 0 && (
                      <span className="flex shrink-0 items-center gap-1 text-xs font-medium">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {p.rating.toFixed(1)}
                        <span className="font-normal text-zinc-400">({p.jobsDone})</span>
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {p.hours}
                    </span>
                    <a href={`tel:${p.phone}`} className="flex items-center gap-1 hover:underline">
                      <Phone className="h-3 w-3" /> {p.phone}
                    </a>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {QUICK_TITLES[p.type].slice(0, 3).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => startBooking(p, t)}
                        className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <p className="text-sm">
                    <span className="font-semibold tabular-nums">{inr(p.baseCost)}</span>
                    <span className="text-xs text-zinc-500"> / {p.type === "laundry" ? "load" : "visit"}</span>
                  </p>
                  <Button size="sm" className="h-8 text-xs" onClick={() => startBooking(p)}>
                    Book
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Your bookings</h2>
          <div className="flex gap-1.5">
            {(
              [
                ["open", "Open"],
                ["done", "Past"],
                ["all", "All"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium",
                  filter === id ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <EmptyState icon={CalendarCheck} title={filter === "open" ? "No open requests" : "No bookings here yet"} description="Book a partner above — they'll see your request on their console straight away." />
        ) : (
          <ul className="space-y-2.5">
            {list.map((b) => {
              const provider = data.providers.find((p) => p.providerId === b.providerId);
              return (
                <li key={b.bookingId} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{b.title}</span>
                        <BookingStatusPill status={b.status} />
                        {b.status === "requested" && new Date(b.scheduledFor).getTime() < now && <Pill tone="amber">Running late</Pill>}
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {b.providerName} · {friendlyDateTime(b.scheduledFor)} · {inr(b.cost)}
                      </p>
                      {b.description && b.description !== b.title && <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{b.description}</p>}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      {b.status === "requested" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs text-red-600 dark:text-red-400"
                          onClick={async () => {
                            await data.cancel(b.bookingId);
                            toast("Booking cancelled", { description: `${b.providerName} has been notified.` });
                          }}
                        >
                          <X className="h-3 w-3" /> Cancel
                        </Button>
                      )}
                      {b.status === "completed" && !b.rating && (
                        <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => setRating({ b, stars: 0, review: "" })}>
                          <Star className="h-3 w-3" /> Rate
                        </Button>
                      )}
                      {(b.status === "completed" || b.status === "cancelled") && provider && (
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => startBooking(provider, b.title)}>
                          <RotateCcw className="h-3 w-3" /> Book again
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Timeline b={b} />
                    {b.rating && (
                      <span className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
                        You rated <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {b.rating}
                        {b.review && <span className="text-zinc-400">· “{b.review}”</span>}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Dialog open={!!booking} onOpenChange={(o) => !o && setBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book {booking?.name}</DialogTitle>
            <DialogDescription>
              {booking && `${inr(booking.baseCost)} per ${booking.type === "laundry" ? "load" : "visit"} · ${booking.hours}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="bk-title" className="text-xs">What do you need?</Label>
              <Input id="bk-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Kitchen tap leaking" />
              <div className="flex flex-wrap gap-1.5">
                {booking &&
                  QUICK_TITLES[booking.type].map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={form.title === t}
                      onClick={() => setForm({ ...form, title: t })}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px]",
                        form.title === t ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900" : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300",
                      )}
                    >
                      {t}
                    </button>
                  ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-when" className="text-xs">When</Label>
              <Input id="bk-when" type="datetime-local" value={form.when} min={format(new Date(), "yyyy-MM-dd'T'HH:mm")} onChange={(e) => setForm({ ...form, when: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-desc" className="text-xs">
                Details <span className="font-normal text-zinc-400">(optional)</span>
              </Label>
              <Textarea id="bk-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Anything the partner should know — location in the flat, items, access…" />
            </div>
            {formError && form.title && <p className="text-xs text-red-600">{formError}</p>}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setBooking(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!!formError || submitting}>
                {submitting ? "Booking…" : "Confirm booking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rating} onOpenChange={(o) => !o && setRating(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rate {rating?.b.providerName}</DialogTitle>
            <DialogDescription>{rating?.b.title}</DialogDescription>
          </DialogHeader>
          {rating && (
            <div className="space-y-3">
              <StarInput value={rating.stars} onChange={(stars) => setRating({ ...rating, stars })} />
              <Textarea rows={3} aria-label="Review" placeholder="How was the work? (optional)" value={rating.review} onChange={(e) => setRating({ ...rating, review: e.target.value })} />
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRating(null)}>
              Later
            </Button>
            <Button disabled={!rating?.stars} onClick={submitRating}>
              Submit rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
