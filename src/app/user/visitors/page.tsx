"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Car, Check, Clock, History, LogOut, Phone, RefreshCw, Shield, UserCheck, Users, X } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, SourceBadge } from "@/components/page";
import { Pill, VisitorStatusPill } from "@/components/status";
import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import { visitorLabel } from "@/lib/actions";
import { useVisitors } from "@/lib/data";
import { clock, initials, timeAgo } from "@/lib/format";
import { pointsToast } from "@/lib/notify";
import { cn } from "@/lib/utils";
import type { Visitor } from "@/lib/types";

type Tab = "waiting" | "inside" | "history";

export default function VisitorsPage() {
  return (
    <AppShell>
      <Visitors />
    </AppShell>
  );
}

function Visitors() {
  const now = useNow(15_000);
  const data = useVisitors();
  const [tab, setTab] = useState<Tab>("waiting");
  const [busy, setBusy] = useState<string | null>(null);

  const waiting = data.visitors.filter((v) => v.status === "waiting");
  const inside = data.visitors.filter((v) => v.status === "inside");
  const history = data.visitors
    .filter((v) => v.status === "left" || v.status === "denied")
    .sort((a, b) => (b.exitAt ?? b.decidedAt ?? b.createdAt).localeCompare(a.exitAt ?? a.decidedAt ?? a.createdAt));
  const lists: Record<Tab, Visitor[]> = { waiting, inside, history };

  const tabs = [
    { id: "waiting" as const, label: "Awaiting decision", icon: Clock, count: waiting.length },
    { id: "inside" as const, label: "Inside now", icon: UserCheck, count: inside.length },
    { id: "history" as const, label: "History", icon: History, count: history.length },
  ];

  const act = async (v: Visitor, kind: "approve" | "deny" | "checkout") => {
    setBusy(v.visitorId);
    try {
      const res = await data[kind](v.visitorId);
      if (kind === "approve") {
        toast.success(`${v.name} approved`, { description: "The guard has been notified to let them in." });
        pointsToast(res?.points ?? 0, "Quick response at the gate");
      } else if (kind === "deny") toast(`${v.name} declined`, { description: "The guard will turn the visitor away." });
      else toast.success(`${v.name} checked out`);
    } catch (e) {
      toast.error("Action failed", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(null);
    }
  };

  const list = lists[tab];

  return (
    <>
      <PageHeader
        title="Visitors"
        description="Approve gate requests, see who's inside, and review past entries for your flat."
        badge={<SourceBadge live={data.live} error={data.error} />}
        actions={
          data.live && (
            <Button variant="outline" size="sm" onClick={data.refresh} disabled={data.loading} className="h-8 gap-1.5 text-xs">
              <RefreshCw className={cn("h-3.5 w-3.5", data.loading && "animate-spin")} /> Refresh
            </Button>
          )
        }
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-3" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg border bg-white p-3 text-left transition-colors dark:bg-zinc-900 sm:p-3.5",
              tab === t.id
                ? "border-zinc-900 dark:border-zinc-100"
                : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <t.icon className="h-4 w-4 text-zinc-400" />
              <span className="text-lg font-semibold tabular-nums">{t.count}</span>
            </div>
            <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{t.label}</p>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Users}
          title={tab === "waiting" ? "No pending gate requests" : tab === "inside" ? "Nobody inside right now" : "No visitor history yet"}
          description={
            tab === "waiting"
              ? "When the guard logs a visitor for your flat, they'll appear here (and as a notification) for you to approve."
              : tab === "inside"
                ? "Visitors you approve, or who arrive with a gate pass, show up here until they check out."
                : "Checked-out and declined visitors are kept here for your records."
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((v) => (
            <li
              key={v.visitorId}
              className={cn(
                "flex items-start gap-3.5 rounded-lg border bg-white p-4 dark:bg-zinc-900",
                v.status === "waiting" ? "border-amber-300 dark:border-amber-900/70" : "border-zinc-200 dark:border-zinc-800",
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {initials(v.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{visitorLabel(v)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Pill>{v.purpose}</Pill>
                      <VisitorStatusPill status={v.status} />
                      {v.passId && <Pill tone="blue">Pass {v.passId}</Pill>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    {v.status === "waiting" && (
                      <>
                        <Button size="sm" disabled={busy === v.visitorId} onClick={() => act(v, "approve")} className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700">
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" disabled={busy === v.visitorId} onClick={() => act(v, "deny")} className="h-8 gap-1 text-xs text-red-600 dark:text-red-400">
                          <X className="h-3.5 w-3.5" /> Decline
                        </Button>
                      </>
                    )}
                    {v.status === "inside" && (
                      <Button size="sm" variant="outline" disabled={busy === v.visitorId} onClick={() => act(v, "checkout")} className="h-8 gap-1 text-xs">
                        <LogOut className="h-3.5 w-3.5" /> Check out
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {v.phone}
                  </span>
                  {v.vehicleNo && (
                    <span className="flex items-center gap-1 font-mono">
                      <Car className="h-3 w-3" /> {v.vehicleNo}
                    </span>
                  )}
                  {v.guardName && (
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Logged by {v.guardName}
                    </span>
                  )}
                  <span className={cn("flex items-center gap-1", v.status === "waiting" && "font-medium text-amber-700 dark:text-amber-400")}>
                    <Clock className="h-3 w-3" />
                    {v.status === "waiting" && `Arrived ${timeAgo(v.createdAt, now)}`}
                    {v.status === "inside" && `In since ${clock(v.entryAt)} (${timeAgo(v.entryAt, now)})`}
                    {v.status === "left" && `${clock(v.entryAt)} – ${clock(v.exitAt)}`}
                    {v.status === "denied" && `Declined ${timeAgo(v.decidedAt, now)}`}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
