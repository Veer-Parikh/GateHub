"use client";

import Link from "next/link";
import { Award, CalendarDays, Crown, HandHeart, MessageSquareQuote, QrCode, Receipt, ShoppingBag, Trophy, Users, Video, Zap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/page";
import { Pill } from "@/components/status";
import { Progress } from "@/components/ui/progress";
import { useNow } from "@/hooks/use-now";
import { timeAgo } from "@/lib/format";
import { badgeProgress, LEVELS, leaderboard, levelFor, POINTS, totalPoints, towerStandings } from "@/lib/gamification";
import { useDemoState } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { PointsKind } from "@/lib/types";

const KIND_ICON: Record<PointsKind, React.ElementType> = {
  payment: Receipt,
  visitor: Zap,
  gatepass: QrCode,
  listing: ShoppingBag,
  giveaway: HandHeart,
  review: MessageSquareQuote,
  rsvp: CalendarDays,
  meeting: Video,
};

const BADGE_ICON: Record<string, React.ElementType> = {
  "early-bird": Receipt,
  gatekeeper: QrCode,
  "quick-responder": Zap,
  generous: HandHeart,
  "fair-reviewer": MessageSquareQuote,
  social: CalendarDays,
  civic: Video,
};

const WAYS = [
  { label: "Pay maintenance before the due date", points: POINTS.paymentOnTime, href: "/user/maintenance" },
  { label: "Give an item away on the marketplace", points: POINTS.giveaway, href: "/user/marketplace" },
  { label: "Join a society meeting", points: POINTS.meeting, href: "/user/meetings" },
  { label: "Rate a completed service", points: POINTS.review, href: "/user/bookings" },
  { label: "RSVP to an event", points: POINTS.rsvp, href: "/user/events" },
  { label: "List an item for sale", points: POINTS.listing, href: "/user/marketplace" },
  { label: "Pre-approve a visitor with a gate pass", points: POINTS.gatepass, href: "/user/gatepass" },
  { label: "Answer a gate request within 2 minutes", points: POINTS.visitorQuick, href: "/user/visitors" },
];

export default function CommunityPage() {
  return (
    <AppShell>
      <Community />
    </AppShell>
  );
}

function Community() {
  const now = useNow(60_000);
  const state = useDemoState();
  const total = totalPoints(state.points);
  const lvl = levelFor(total);
  const badges = badgeProgress(state.points);
  const board = leaderboard(state);
  const me = board.find((r) => r.me)!;
  const towers = towerStandings(state);
  const thisMonth = state.points.filter((p) => new Date(p.at).getMonth() === new Date(now).getMonth() && new Date(p.at).getFullYear() === new Date(now).getFullYear());

  return (
    <>
      <PageHeader
        title="Good Neighbour"
        description="Earn points for the small things that keep the society running smoothly — and see how your flat stacks up."
      />

      <section className="grid grid-cols-1 gap-4 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Your level</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
            <span className="text-2xl font-semibold tracking-tight">{lvl.level.name}</span>
            <span className="text-sm tabular-nums text-zinc-500">{total} points</span>
          </div>
          <Progress value={lvl.progress * 100} className="mt-3 h-2" aria-label="Progress to next level" />
          <div className="mt-2 hidden justify-between text-[11px] text-zinc-500 sm:flex">
            {LEVELS.map((l, i) => (
              <span key={l.name} className={cn(i <= lvl.index && "font-medium text-zinc-900 dark:text-zinc-100")}>
                {l.name} · {l.min}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-300">
            {lvl.next ? (
              <>
                <b>{lvl.toNext} more points</b> to reach {lvl.next.name}.
              </>
            ) : (
              "You've reached the top level — legendary."
            )}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <p className="text-xs text-zinc-500">Society rank</p>
            <p className="text-xl font-semibold tabular-nums">
              #{me.rank} <span className="text-sm font-normal text-zinc-500">of {board.length}</span>
            </p>
          </div>
          <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <p className="text-xs text-zinc-500">Earned this month</p>
            <p className="text-xl font-semibold tabular-nums">+{thisMonth.reduce((s, p) => s + p.points, 0)}</p>
          </div>
        </div>
      </section>

      <Panel title="Badges" description={`${badges.filter((b) => b.earned).length} of ${badges.length} earned`}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b) => {
            const Icon = BADGE_ICON[b.id] ?? Award;
            return (
              <div
                key={b.id}
                className={cn(
                  "rounded-md border p-3",
                  b.earned ? "border-amber-300 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20" : "border-zinc-200 dark:border-zinc-800",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      b.earned ? "bg-amber-400 text-amber-950" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{b.name}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {b.earned ? "Earned" : `${b.count} / ${b.goal}`}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">{b.description}</p>
                {!b.earned && <Progress value={(b.count / b.goal) * 100} className="mt-2 h-1" aria-label={`${b.name} progress`} />}
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <Panel
          title={
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Leaderboard
            </span>
          }
          description="Top flats this season"
          className="lg:col-span-7"
          bodyClassName="p-0"
        >
          <ol className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {board.map((r) => (
              <li key={`${r.block}-${r.flat}`} className={cn("flex items-center gap-3 px-4 py-2.5", r.me && "bg-zinc-50 dark:bg-zinc-800/50")}>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                    r.rank === 1 ? "bg-amber-400 text-amber-950" : r.rank <= 3 ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100" : "text-zinc-500",
                  )}
                >
                  {r.rank === 1 ? <Crown className="h-3.5 w-3.5" /> : r.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.name} {r.me && <Pill tone="blue" className="ml-1">You</Pill>}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Tower {r.block}, Flat {r.flat} · {levelFor(r.points).level.name}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums">{r.points}</span>
              </li>
            ))}
          </ol>
        </Panel>

        <div className="space-y-6 lg:col-span-5">
          <Panel
            title={
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-zinc-500" /> Tower cup
              </span>
            }
            description="Average points per flat"
          >
            <ul className="space-y-2.5">
              {towers.map((t) => (
                <li key={t.block} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">
                      Tower {t.block}
                      {t.block === state.resident.block && <span className="text-zinc-500"> (yours)</span>}
                    </span>
                    <span className="tabular-nums text-zinc-500">{t.average} avg</span>
                  </div>
                  <Progress value={(t.average / towers[0].average) * 100} className="h-1.5" aria-label={`Tower ${t.block}`} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Ways to earn" bodyClassName="p-0">
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {WAYS.map((w) => (
                <li key={w.label}>
                  <Link href={w.href} className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <span className="text-zinc-700 dark:text-zinc-300">{w.label}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">+{w.points}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel title="Points history" bodyClassName="p-0">
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {state.points.slice(0, 15).map((p) => {
            const Icon = KIND_ICON[p.kind];
            return (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                <Icon className="h-4 w-4 shrink-0 text-zinc-400" />
                <span className="min-w-0 flex-1 truncate text-sm">{p.reason}</span>
                <span className="shrink-0 text-[11px] text-zinc-400">{timeAgo(p.at, now)}</span>
                <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">+{p.points}</span>
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
