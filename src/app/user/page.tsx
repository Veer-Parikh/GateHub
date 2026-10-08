"use client";

import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  BellRing,
  Building2,
  CalendarDays,
  Car,
  Check,
  Clock,
  Copy,
  ExternalLink,
  LogOut,
  Phone,
  Plus,
  QrCode,
  Receipt,
  ShoppingBag,
  Siren,
  Trophy,
  UserCheck,
  Video,
  Wrench,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, Panel, SourceBadge, StatCard } from "@/components/page";
import { BookingStatusPill, Pill } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNow } from "@/hooks/use-now";
import { activeSos, passStatus, visitorLabel } from "@/lib/actions";
import { useBills, useVisitors } from "@/lib/data";
import { clock, countdown, friendlyDateTime, inr, relativeDay, timeAgo } from "@/lib/format";
import { levelFor, totalPoints } from "@/lib/gamification";
import { pointsToast } from "@/lib/notify";
import { useDemoState } from "@/lib/store";

function greeting(now: number) {
  const h = new Date(now).getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const QUICK_ACTIONS = [
  { href: "/user/gatepass", icon: QrCode, label: "Issue gate pass", hint: "6-digit PIN for guests" },
  { href: "/user/bookings", icon: Wrench, label: "Book a service", hint: "Plumber or laundry" },
  { href: "/user/marketplace", icon: ShoppingBag, label: "Sell or give away", hint: "Neighbours only" },
  { href: "/user/sos", icon: Siren, label: "Emergency SOS", hint: "Alerts the gate desk", danger: true },
];

export default function ResidentDashboard() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

function Dashboard() {
  const now = useNow(15_000);
  const state = useDemoState();
  const { resident } = state;
  const visitorsData = useVisitors();
  const billsData = useBills();
  const mine = <T extends { block: string; flat: string }>(x: T) => x.block === resident.block && x.flat === resident.flat;

  const waiting = visitorsData.visitors.filter((v) => v.status === "waiting");
  const inside = visitorsData.visitors.filter((v) => v.status === "inside");
  const unpaid = billsData.myBills.filter((b) => !b.paidAt);
  const due = unpaid.reduce((s, b) => s + b.amount, 0);
  const nextDue = [...unpaid].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const activePasses = state.passes.filter((p) => mine(p) && passStatus(p, now) === "active");
  const myBookings = state.bookings.filter((b) => mine(b) && (b.status === "requested" || b.status === "in_progress"));
  const sos = activeSos(state);
  const mySos = sos && mine(sos) ? sos : undefined;
  const points = totalPoints(state.points);
  const lvl = levelFor(points);

  const upcoming = useMemo(() => {
    const items = [
      ...state.events.map((e) => ({ id: e.eventId, title: e.title, at: e.date, where: e.venue, kind: e.category, href: "/user/events" })),
      ...state.meetings
        .filter((m) => !m.completed)
        .map((m) => ({ id: m.meetingId, title: m.title, at: m.timing, where: m.online ? "Online + " + m.location : m.location, kind: "Meeting", href: "/user/meetings" })),
    ];
    return items.filter((i) => new Date(i.at).getTime() > now).sort((a, b) => a.at.localeCompare(b.at)).slice(0, 3);
  }, [state.events, state.meetings, now]);

  const activity = state.activity.filter((a) => !a.block || mine(a as { block: string; flat: string })).slice(0, 6);

  const decide = async (id: string, name: string, approve: boolean) => {
    try {
      const { points: earned } = await (approve ? visitorsData.approve(id) : visitorsData.deny(id));
      if (approve) toast.success(`${name} approved`, { description: "The guard has been notified to open the barrier." });
      else toast(`${name} declined`, { description: "The guard will turn the visitor away." });
      pointsToast(earned, "Quick response at the gate");
    } catch (e) {
      toast.error("Couldn't update the visitor", { description: e instanceof Error ? e.message : undefined });
    }
  };

  const copyPin = async (pin: string) => {
    try {
      await navigator.clipboard.writeText(pin);
      toast.success(`PIN ${pin} copied`);
    } catch {
      toast.error("Clipboard not available");
    }
  };

  return (
    <>
      <PageHeader
        title={`${greeting(now)}, ${resident.name.split(" ")[0]}`}
        description={
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            {resident.society} · Tower {resident.block} · Flat {resident.flat}
          </span>
        }
        badge={
          <>
            {resident.isAdmin && <Pill tone="blue">RWA committee</Pill>}
            <SourceBadge live={visitorsData.live} error={visitorsData.error} />
          </>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs">
              <a href="/security" target="_blank" rel="noopener" title="Open in a new tab — guard actions appear here live">
                Guard console <ExternalLink className="ml-1 h-3.5 w-3.5" />
              </a>
            </Button>
            <Button asChild size="sm" className="h-8 text-xs">
              <Link href="/user/gatepass">
                <Plus className="mr-1 h-3.5 w-3.5" /> Gate pass
              </Link>
            </Button>
          </>
        }
      />

      {mySos && (
        <Link
          href="/user/sos"
          className="flex items-center justify-between gap-3 rounded-lg bg-red-600 px-4 py-3 text-white transition-colors hover:bg-red-700"
        >
          <span className="flex items-center gap-2.5 text-sm font-semibold">
            <Siren className="h-4 w-4 animate-pulse" />
            {mySos.title} alert active
            <span className="font-normal opacity-90">
              · {mySos.acknowledgedAt ? `${mySos.acknowledgedBy} is responding` : "waiting for the gate desk to respond"}
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      )}

      {waiting.length > 0 && (
        <section className="space-y-3 rounded-lg border border-amber-300 bg-amber-50/80 p-4 dark:border-amber-900/70 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            </span>
            {waiting.length === 1 ? "A visitor is waiting at the gate" : `${waiting.length} visitors are waiting at the gate`}
          </div>
          {waiting.map((v) => (
            <div
              key={v.visitorId}
              className="flex flex-col justify-between gap-3 rounded-md border border-amber-200 bg-white p-3.5 dark:border-amber-900/50 dark:bg-zinc-900 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{visitorLabel(v)}</span>
                  <Pill tone="amber">{v.purpose}</Pill>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {v.phone}
                  </span>
                  {v.vehicleNo && (
                    <span className="flex items-center gap-1 font-mono">
                      <Car className="h-3.5 w-3.5" /> {v.vehicleNo}
                    </span>
                  )}
                  <span className="flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                    <Clock className="h-3.5 w-3.5" /> Arrived {timeAgo(v.createdAt, now)}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" onClick={() => decide(v.visitorId, v.name, true)} className="h-8 bg-emerald-600 text-xs text-white hover:bg-emerald-700">
                  <Check className="mr-1 h-4 w-4" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => decide(v.visitorId, v.name, false)}
                  className="h-8 border-red-200 text-xs text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
                >
                  <X className="mr-1 h-4 w-4" /> Decline
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Maintenance due"
          value={due > 0 ? inr(due) : "All paid"}
          hint={
            nextDue
              ? new Date(nextDue.dueDate).getTime() < now
                ? `Overdue since ${new Date(nextDue.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                : `Due ${relativeDay(nextDue.dueDate, now).toLowerCase()}`
              : "No pending invoices"
          }
          icon={Receipt}
          tone={due > 0 ? "warning" : "success"}
        >
          <Link href="/user/maintenance" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:underline dark:text-zinc-300">
            {due > 0 ? "Pay now" : "View receipts"} <ArrowRight className="h-3 w-3" />
          </Link>
        </StatCard>
        <StatCard label="Active gate passes" value={activePasses.length} hint="Valid PINs for expected guests" icon={QrCode}>
          <Link href="/user/gatepass" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:underline dark:text-zinc-300">
            Issue a pass <ArrowRight className="h-3 w-3" />
          </Link>
        </StatCard>
        <StatCard
          label="Visitors inside"
          value={inside.length}
          hint={inside[0] ? visitorLabel(inside[0]) : "Nobody right now"}
          icon={UserCheck}
          tone={inside.length ? "success" : "default"}
        >
          <Link href="/user/visitors" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:underline dark:text-zinc-300">
            Visitor log <ArrowRight className="h-3 w-3" />
          </Link>
        </StatCard>
        <StatCard label="Good Neighbour points" value={points} hint={lvl.level.name} icon={Trophy}>
          <Progress value={lvl.progress * 100} className="mt-3 h-1.5" aria-label="Progress to next level" />
          <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            {lvl.next ? `${lvl.toNext} pts to ${lvl.next.name}` : "Top level reached"}
          </p>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group rounded-lg border border-zinc-200 bg-white p-3.5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              >
                <a.icon className={`h-5 w-5 ${a.danger ? "text-red-600 dark:text-red-400" : "text-zinc-700 dark:text-zinc-300"}`} />
                <p className="mt-2.5 text-sm font-medium">{a.label}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{a.hint}</p>
              </Link>
            ))}
          </div>

          <Panel
            title="Currently inside your flat"
            description={`Admitted visitors for ${resident.block}-${resident.flat}`}
            action={<Link href="/user/visitors" className="font-medium text-zinc-600 hover:underline dark:text-zinc-300">Full log</Link>}
            bodyClassName="p-0"
          >
            {inside.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                No visitors inside. New arrivals appear here once you approve them.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {inside.map((v) => (
                  <li key={v.visitorId} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{visitorLabel(v)}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {v.purpose} · entered {clock(v.entryAt)}
                        {v.vehicleNo ? ` · ${v.vehicleNo}` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 shrink-0 text-xs"
                      onClick={async () => {
                        await visitorsData.checkout(v.visitorId);
                        toast.success(`${v.name} checked out`);
                      }}
                    >
                      <LogOut className="mr-1 h-3.5 w-3.5" /> Check out
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Your service requests"
            action={<Link href="/user/bookings" className="font-medium text-zinc-600 hover:underline dark:text-zinc-300">Book a service</Link>}
            bodyClassName="p-0"
          >
            {myBookings.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">No open requests.</p>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {myBookings.map((b) => (
                  <li key={b.bookingId} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {b.providerName} · {friendlyDateTime(b.scheduledFor)}
                      </p>
                    </div>
                    <BookingStatusPill status={b.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <Panel
            title="Active gate passes"
            action={
              <Link href="/user/gatepass" className="inline-flex items-center gap-1 font-medium text-zinc-600 hover:underline dark:text-zinc-300">
                <Plus className="h-3.5 w-3.5" /> New
              </Link>
            }
          >
            {activePasses.length === 0 ? (
              <EmptyState icon={QrCode} title="No active passes" description="Expecting someone? Issue a PIN so the guard can let them straight in." className="border-0 py-4" />
            ) : (
              <div className="space-y-2.5">
                {activePasses.slice(0, 3).map((p) => (
                  <div key={p.passId} className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.guestName}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {p.entryType} · {countdown(p.expiresAt, now)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyPin(p.pin)}
                      title="Copy PIN"
                      className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 font-mono text-sm font-bold tracking-widest transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      {p.pin}
                      <Copy className="h-3 w-3 text-zinc-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Coming up" action={<Link href="/user/events" className="font-medium text-zinc-600 hover:underline dark:text-zinc-300">All events</Link>} bodyClassName="p-0">
            {upcoming.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-zinc-500">Nothing scheduled.</p>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {upcoming.map((u) => (
                  <li key={u.id}>
                    <Link href={u.href} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {u.kind === "Meeting" ? <Video className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{u.title}</p>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {friendlyDateTime(u.at)} · {u.where}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Recent activity" bodyClassName="p-0">
            {activity.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-zinc-500">No recent activity.</p>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-4 py-2.5">
                    <BellRing className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <p className="min-w-0 flex-1 text-xs text-zinc-700 dark:text-zinc-300">{a.text}</p>
                    <span className="shrink-0 text-[11px] text-zinc-400">{timeAgo(a.at, now)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
