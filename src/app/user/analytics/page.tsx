"use client";

import { useMemo, useState } from "react";
import { format, subDays, subMonths } from "date-fns";
import { BarChart3, DoorOpen, Lock, Receipt, Siren, Wrench } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ChartCard, ColumnChart, type Series } from "@/components/charts";
import { EmptyState, PageHeader, Panel, StatCard } from "@/components/page";
import { Pill } from "@/components/status";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNow } from "@/hooks/use-now";
import { inr } from "@/lib/format";
import { useDemoState } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { DemoState, VisitorPurpose } from "@/lib/types";

// Historical gate traffic isn't in the demo store, so earlier days are generated from a
// seeded RNG keyed by date (stable across reloads). Today's numbers come from the live store.

function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const GROUPS = [
  { key: "delivery", label: "Deliveries", color: "var(--series-1)", base: [42, 26] as const, weekend: 1.25 },
  { key: "guest", label: "Guests", color: "var(--series-2)", base: [14, 14] as const, weekend: 1.8 },
  { key: "service", label: "Service & staff", color: "var(--series-3)", base: [18, 10] as const, weekend: 0.6 },
  { key: "cab", label: "Cabs", color: "var(--series-4)", base: [9, 8] as const, weekend: 1.3 },
];
const groupOf = (p: VisitorPurpose) => (p === "Delivery" ? "delivery" : p === "Guest" ? "guest" : p === "Cab" ? "cab" : "service");

/** Hour-of-day profile for gate entries (6 AM – 11 PM), relative weights. */
const HOURLY = [3, 6, 9, 8, 6, 5, 7, 6, 5, 5, 6, 8, 10, 11, 10, 8, 5, 3];
const HOURS = HOURLY.map((_, i) => i + 6);

function gateTraffic(days: number, state: DemoState, now: number) {
  const today = format(now, "yyyy-MM-dd");
  const dayFraction = Math.max(0.05, (new Date(now).getHours() + 1) / 24);
  return Array.from({ length: days }, (_, k) => {
    const d = subDays(now, days - 1 - k);
    const key = format(d, "yyyy-MM-dd");
    const r = rng(key);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const counts = GROUPS.map((g) => Math.round((g.base[0] + r() * g.base[1]) * (weekend ? g.weekend : 1)));
    if (key === today) {
      const live = state.visitors.filter((v) => v.entryAt && format(new Date(v.entryAt), "yyyy-MM-dd") === today);
      GROUPS.forEach((g, gi) => {
        counts[gi] = Math.round(counts[gi] * dayFraction) + live.filter((v) => groupOf(v.purpose) === g.key).length;
      });
    }
    return { label: format(d, days > 14 ? "d MMM" : "EEE d"), date: d, counts };
  });
}

const RANGES = [
  { days: 7, label: "Last 7 days" },
  { days: 14, label: "Last 14 days" },
  { days: 30, label: "Last 30 days" },
];

export default function AnalyticsPage() {
  return (
    <AppShell>
      <Analytics />
    </AppShell>
  );
}

function Analytics() {
  const now = useNow(60_000);
  const state = useDemoState();
  const [days, setDays] = useState(14);

  const traffic = useMemo(() => gateTraffic(days, state, now), [days, state, now]);
  const previous = useMemo(() => {
    const prev = gateTraffic(days * 2, state, now).slice(0, days);
    return prev.reduce((s, d) => s + d.counts.reduce((a, b) => a + b, 0), 0);
  }, [days, state, now]);

  if (!state.resident.isAdmin) {
    return <EmptyState icon={Lock} title="Committee members only" description="Society analytics are available to RWA committee members." />;
  }

  const total = traffic.reduce((s, d) => s + d.counts.reduce((a, b) => a + b, 0), 0);
  const delta = previous ? Math.round(((total - previous) / previous) * 100) : 0;
  const series: Series[] = GROUPS.map((g, gi) => ({ key: g.key, label: g.label, color: g.color, values: traffic.map((d) => d.counts[gi]) }));
  const busiest = traffic.reduce((m, d, i) => (d.counts.reduce((a, b) => a + b, 0) > traffic[m].counts.reduce((a, b) => a + b, 0) ? i : m), 0);

  const hourlyTotal = HOURLY.reduce((a, b) => a + b, 0);
  const hourly = HOURLY.map((w) => Math.round((w / hourlyTotal) * total));
  const peakHour = hourly.indexOf(Math.max(...hourly));

  // Maintenance collection: current cycle from the ledger, earlier months from history.
  const cycleBills = state.bills.filter((b) => b.month === format(now, "MMMM") && b.year === new Date(now).getFullYear());
  const currentRate = cycleBills.length ? Math.round((cycleBills.filter((b) => b.paidAt).length / cycleBills.length) * 100) : 0;
  const collection = Array.from({ length: 6 }, (_, k) => {
    const d = subMonths(now, 5 - k);
    const rate = k === 5 ? currentRate : Math.round(88 + rng(format(d, "yyyy-MM"))() * 10);
    return { label: format(d, "MMM"), rate };
  });
  const pendingAmount = cycleBills.filter((b) => !b.paidAt).reduce((s, b) => s + b.amount, 0);

  const providers = state.providers.map((p) => {
    const jobs = state.bookings.filter((b) => b.providerId === p.providerId);
    const done = jobs.filter((b) => b.status === "completed");
    const rated = done.filter((b) => b.rating);
    return {
      ...p,
      open: jobs.filter((b) => b.status === "requested" || b.status === "in_progress").length,
      done: done.length,
      revenue: done.reduce((s, b) => s + b.cost, 0),
      avg: rated.length ? rated.reduce((s, b) => s + b.rating!, 0) / rated.length : null,
    };
  });
  const openJobs = providers.reduce((s, p) => s + p.open, 0);

  const handled = state.sos.filter((a) => a.acknowledgedAt);
  const avgResponse = handled.length
    ? Math.round(handled.reduce((s, a) => s + (new Date(a.acknowledgedAt!).getTime() - new Date(a.raisedAt).getTime()), 0) / handled.length / 1000)
    : null;

  return (
    <>
      <PageHeader title="Society analytics" description="Gate traffic, collections and service performance for the RWA committee." badge={<Pill tone="blue">Committee</Pill>} />

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Date range">
        {RANGES.map((r) => (
          <button
            key={r.days}
            type="button"
            aria-pressed={days === r.days}
            onClick={() => setDays(r.days)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              days === r.days ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
            )}
          >
            {r.label}
          </button>
        ))}
        <span className="ml-1 text-[11px] text-zinc-400">Applies to gate traffic and peak hours</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Gate entries"
          value={total.toLocaleString("en-IN")}
          hint={`${delta >= 0 ? "+" : ""}${delta}% vs previous ${days} days`}
          icon={DoorOpen}
        />
        <StatCard label="Collection this month" value={`${currentRate}%`} hint={`${inr(pendingAmount)} still pending`} icon={Receipt} tone={currentRate >= 90 ? "success" : "warning"} />
        <StatCard label="Open service jobs" value={openJobs} hint={`${providers.length} partners`} icon={Wrench} />
        <StatCard
          label="Avg SOS response"
          value={avgResponse === null ? "—" : avgResponse < 90 ? `${avgResponse}s` : `${Math.round(avgResponse / 60)} min`}
          hint={`${handled.length} alert${handled.length === 1 ? "" : "s"} handled`}
          icon={Siren}
        />
      </div>

      <ChartCard
        title="Gate traffic by purpose"
        description={`Daily entries · busiest day ${traffic[busiest].label} (${traffic[busiest].counts.reduce((a, b) => a + b, 0)})`}
        chart={
          <ColumnChart
            ariaLabel={`Stacked daily gate entries for the ${RANGES.find((r) => r.days === days)?.label.toLowerCase()}`}
            categories={traffic.map((d) => d.label)}
            series={series}
            labelEvery={days > 14 ? 5 : days > 7 ? 2 : 1}
            capLabels={[busiest]}
            height={240}
          />
        }
        table={{
          columns: ["Day", ...GROUPS.map((g) => g.label), "Total"],
          rows: traffic.map((d) => [d.label, ...d.counts, d.counts.reduce((a, b) => a + b, 0)]),
        }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Peak gate hours"
          description={`Entries by hour · busiest ${format(new Date(2000, 0, 1, HOURS[peakHour]), "h a")}`}
          chart={
            <ColumnChart
              ariaLabel="Gate entries by hour of day"
              categories={HOURS.map((h) => format(new Date(2000, 0, 1, h), "ha").toLowerCase())}
              series={[{ key: "entries", label: "Entries", color: "var(--series-1)", values: hourly }]}
              labelEvery={3}
              capLabels={[peakHour]}
            />
          }
          table={{ columns: ["Hour", "Entries"], rows: HOURS.map((h, i) => [format(new Date(2000, 0, 1, h), "h a"), hourly[i]]) }}
        />
        <ChartCard
          title="Maintenance collection rate"
          description="Share of flats paid each month"
          chart={
            <ColumnChart
              ariaLabel="Monthly maintenance collection rate"
              categories={collection.map((c) => c.label)}
              series={[{ key: "rate", label: "Collected", color: "var(--series-1)", values: collection.map((c) => c.rate) }]}
              format={(v) => `${Math.round(v)}%`}
              capLabels={collection.map((_, i) => i)}
            />
          }
          table={{ columns: ["Month", "Collected"], rows: collection.map((c) => [c.label, `${c.rate}%`]) }}
        />
      </div>

      <Panel
        title={
          <span className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-zinc-500" /> Service partner performance
          </span>
        }
        bodyClassName="p-0 overflow-x-auto"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Partner</TableHead>
              <TableHead className="text-right text-xs">Open</TableHead>
              <TableHead className="text-right text-xs">Completed</TableHead>
              <TableHead className="text-right text-xs">Revenue</TableHead>
              <TableHead className="text-right text-xs">Resident rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((p) => (
              <TableRow key={p.providerId}>
                <TableCell className="text-xs">
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-2 capitalize text-zinc-500">{p.type}</span>
                </TableCell>
                <TableCell className="text-right text-xs tabular-nums">{p.open}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">{p.done}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">{inr(p.revenue)}</TableCell>
                <TableCell className="text-right text-xs tabular-nums">{p.avg ? `${p.avg.toFixed(1)} ★` : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
      <p className="text-[11px] text-zinc-400">Demo data: history before today is simulated; today&apos;s figures, collections and service stats are live from the society store.</p>
    </>
  );
}
