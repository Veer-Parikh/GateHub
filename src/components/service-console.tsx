"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building2, CheckCircle2, Clock, IndianRupee, Inbox, Phone, Star, type LucideIcon } from "lucide-react";
import { ConsoleShell } from "@/components/app-shell";
import { EmptyState, Panel, StatCard } from "@/components/page";
import { BookingStatusPill, Pill } from "@/components/status";
import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import { useNewItems } from "@/hooks/use-new-items";
import { advanceBooking } from "@/lib/actions";
import { friendlyDateTime, inr, timeAgo } from "@/lib/format";
import { PERSONAS } from "@/lib/session";
import { useDemoState } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Booking, BookingStatus, ServiceType } from "@/lib/types";

export interface ServiceCopy {
  icon: LucideIcon;
  accent: string;
  tagline: string;
  statusLabels: Partial<Record<BookingStatus, string>>;
  startLabel: string;
  doneLabel: string;
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-3 w-3", i <= value ? "fill-amber-400 text-amber-400" : "text-zinc-300 dark:text-zinc-600")} />
      ))}
    </span>
  );
}

export function ServiceConsole({ type, copy }: { type: ServiceType; copy: ServiceCopy }) {
  const persona = PERSONAS[type];
  const state = useDemoState();
  const provider = state.providers.find((p) => p.providerId === persona.providerId);

  return (
    <ConsoleShell
      role={type}
      icon={copy.icon}
      accent={copy.accent}
      title={
        <span className="flex items-center gap-2">
          {provider?.company ?? provider?.name ?? persona.displayName}
          <Pill tone="emerald">Verified partner</Pill>
        </span>
      }
      subtitle={`${persona.displayName} · ${copy.tagline} · ${state.resident.society}`}
    >
      <Jobs type={type} copy={copy} />
    </ConsoleShell>
  );
}

function Jobs({ type, copy }: { type: ServiceType; copy: ServiceCopy }) {
  const now = useNow(30_000);
  const state = useDemoState();
  const providerId = PERSONAS[type].providerId!;
  const provider = state.providers.find((p) => p.providerId === providerId);
  const [tab, setTab] = useState<"queue" | "done">("queue");

  const jobs = state.bookings.filter((b) => b.providerId === providerId);
  const queue = jobs
    .filter((b) => b.status === "requested" || b.status === "in_progress")
    .sort((a, b) => (a.status === b.status ? a.scheduledFor.localeCompare(b.scheduledFor) : a.status === "in_progress" ? -1 : 1));
  const done = jobs
    .filter((b) => b.status === "completed" || b.status === "cancelled")
    .sort((a, b) => (b.completedAt ?? b.cancelledAt ?? "").localeCompare(a.completedAt ?? a.cancelledAt ?? ""));
  const completed = jobs.filter((b) => b.status === "completed");
  const earned = completed.reduce((s, b) => s + b.cost, 0);
  const reviews = completed.filter((b) => b.rating).sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  useNewItems(
    jobs.filter((b) => b.status === "requested"),
    (b) => b.bookingId,
    (b) => toast.info(`New request from ${b.block}-${b.flat}`, { description: `${b.title} · ${friendlyDateTime(b.scheduledFor)}`, duration: 12_000 }),
  );
  useNewItems(
    jobs.filter((b) => b.status === "cancelled"),
    (b) => b.bookingId,
    (b) => toast(`${b.block}-${b.flat} cancelled a request`, { description: b.title }),
  );
  useNewItems(
    reviews,
    (b) => b.bookingId,
    (b) => toast.success(`New ${b.rating}★ review from ${b.block}-${b.flat}`, { description: b.review ?? b.title }),
  );

  const advance = (b: Booking) => {
    advanceBooking(b.bookingId);
    toast.success(b.status === "requested" ? `Started “${b.title}”` : `Completed “${b.title}”`, {
      description: `${b.customerName} (${b.block}-${b.flat}) has been notified.`,
    });
  };

  const list = tab === "queue" ? queue : done;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="New requests" value={queue.filter((b) => b.status === "requested").length} hint="Waiting for you to start" icon={Inbox} tone="warning" />
        <StatCard label="In progress" value={queue.filter((b) => b.status === "in_progress").length} hint="Active jobs" icon={Clock} />
        <StatCard label="Earned" value={inr(earned)} hint={`${completed.length} completed jobs`} icon={IndianRupee} tone="success" />
        <StatCard
          label="Rating"
          value={provider ? `${provider.rating.toFixed(1)} ★` : "—"}
          hint={`${provider?.jobsDone ?? 0} jobs lifetime`}
          icon={Star}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section className="space-y-3 lg:col-span-8">
          <div className="flex items-center gap-1.5" role="tablist">
            {(
              [
                ["queue", `Open jobs (${queue.length})`],
                ["done", `History (${done.length})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === id
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <EmptyState
              icon={tab === "queue" ? Inbox : CheckCircle2}
              title={tab === "queue" ? "No open jobs" : "No history yet"}
              description={tab === "queue" ? "Requests booked by residents appear here instantly — try booking one from the resident app's Services page." : undefined}
            />
          ) : (
            <ul className="space-y-3">
              {list.map((b) => {
                const late = b.status === "requested" && new Date(b.scheduledFor).getTime() < now;
                return (
                  <li key={b.bookingId} className={cn("rounded-lg border bg-white p-4 dark:bg-zinc-900", late ? "border-amber-300 dark:border-amber-900/70" : "border-zinc-200 dark:border-zinc-800")}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{b.title}</span>
                          <BookingStatusPill status={b.status} labels={copy.statusLabels} />
                          <span className="font-mono text-xs text-zinc-500">{inr(b.cost)}</span>
                        </div>
                        {b.description && <p className="text-xs text-zinc-600 dark:text-zinc-300">{b.description}</p>}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                            <Building2 className="h-3.5 w-3.5" /> {b.block}-{b.flat} · {b.customerName}
                          </span>
                          <a href={`tel:${b.phone}`} className="flex items-center gap-1 hover:underline">
                            <Phone className="h-3.5 w-3.5" /> {b.phone}
                          </a>
                          <span className={cn("flex items-center gap-1", late && "font-medium text-amber-700 dark:text-amber-400")}>
                            <Clock className="h-3.5 w-3.5" />
                            {b.status === "completed"
                              ? `Done ${timeAgo(b.completedAt, now)}`
                              : b.status === "cancelled"
                                ? `Cancelled ${timeAgo(b.cancelledAt, now)}`
                                : `${late ? "Was due " : ""}${friendlyDateTime(b.scheduledFor)}`}
                          </span>
                        </div>
                        {b.rating && (
                          <p className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                            <Stars value={b.rating} /> {b.review && <span>“{b.review}”</span>}
                          </p>
                        )}
                      </div>
                      {(b.status === "requested" || b.status === "in_progress") && (
                        <Button
                          size="sm"
                          onClick={() => advance(b)}
                          className={cn("h-8 shrink-0 text-xs", b.status === "in_progress" && "bg-emerald-600 text-white hover:bg-emerald-700")}
                        >
                          {b.status === "requested" ? copy.startLabel : copy.doneLabel}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Panel title="Recent reviews" className="lg:col-span-4" bodyClassName="p-0">
          {reviews.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-zinc-500">No reviews yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {reviews.slice(0, 6).map((b) => (
                <li key={b.bookingId} className="space-y-1 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <Stars value={b.rating!} />
                    <span className="text-[11px] text-zinc-400">{timeAgo(b.completedAt, now)}</span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">{b.review ?? "No comment"}</p>
                  <p className="text-[11px] text-zinc-500">
                    {b.customerName} · {b.block}-{b.flat}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
