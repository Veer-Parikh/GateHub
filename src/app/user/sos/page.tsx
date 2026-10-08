"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Activity, AlertTriangle, ArrowUpRight, Check, Flame, PhoneCall, Radio, ShieldAlert, Siren } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Panel } from "@/components/page";
import { Pill } from "@/components/status";
import { Button } from "@/components/ui/button";
import { useNow } from "@/hooks/use-now";
import { activeSos, cancelSos, raiseSos, SOS_TITLES } from "@/lib/actions";
import { clock, friendlyDateTime, timeAgo } from "@/lib/format";
import { useDemoState } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { SosType } from "@/lib/types";

const HOLD_MS = 1500;

const TYPES: { type: SosType; icon: React.ElementType; description: string; urgency: string }[] = [
  { type: "medical", icon: Activity, description: "Cardiac event, serious injury or acute medical distress. First-aid team and ambulance are alerted.", urgency: "Immediate" },
  { type: "fire", icon: Flame, description: "Fire, electrical smoke or gas leak. Tower fire marshals and security are alerted.", urgency: "Immediate" },
  { type: "lift", icon: AlertTriangle, description: "Someone trapped in a lift. The lift technician and gate desk are alerted.", urgency: "Urgent" },
  { type: "security", icon: ShieldAlert, description: "Intruder, break-in attempt or altercation. Floor patrol is dispatched.", urgency: "Urgent" },
];

const CONTACTS = [
  { title: "Main gate security desk", number: "+91 80 4910 2001", role: "24×7 guard supervisor" },
  { title: "Facility operations", number: "+91 98450 11992", role: "RWA operations lead" },
  { title: "Lift emergency hotline", number: "1800 120 4455", role: "Technician on call" },
  { title: "Ambulance", number: "108", role: "Emergency medical services" },
  { title: "Police", number: "112", role: "National emergency number" },
  { title: "Fire & rescue", number: "101", role: "Fire station" },
];

/** Press-and-hold button so an SOS can't be raised by an accidental tap. */
function HoldButton({ onComplete, children, disabled }: { onComplete: () => void; children: React.ReactNode; disabled?: boolean }) {
  const [progress, setProgress] = useState(0);
  const start = useRef<number | null>(null);
  const frame = useRef<number>(0);

  const stop = () => {
    start.current = null;
    cancelAnimationFrame(frame.current);
    setProgress(0);
  };

  const tick = () => {
    if (start.current === null) return;
    const p = Math.min(1, (performance.now() - start.current) / HOLD_MS);
    setProgress(p);
    if (p >= 1) {
      stop();
      onComplete();
    } else frame.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const begin = () => {
    if (disabled) return;
    start.current = performance.now();
    frame.current = requestAnimationFrame(tick);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !e.repeat && begin()}
      onKeyUp={stop}
      onContextMenu={(e) => e.preventDefault()}
      className="group relative w-full touch-none select-none overflow-hidden rounded-lg border border-zinc-200 bg-white p-5 text-left transition-colors hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-700"
    >
      <span className="absolute inset-y-0 left-0 bg-red-500/15" style={{ width: `${progress * 100}%` }} aria-hidden />
      <span className="relative block">{children}</span>
    </button>
  );
}

export default function SosPage() {
  return (
    <AppShell>
      <Sos />
    </AppShell>
  );
}

function Sos() {
  const now = useNow(5_000);
  const state = useDemoState();
  const { resident } = state;
  const sos = activeSos(state);
  const mine = sos && sos.block === resident.block && sos.flat === resident.flat ? sos : undefined;
  const history = state.sos.filter((a) => a.block === resident.block && a.flat === resident.flat && a !== mine).slice(0, 5);

  const trigger = (type: SosType) => {
    raiseSos(type);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    toast.error(`${SOS_TITLES[type]} — alert sent`, { description: "The gate desk has your flat and phone number.", duration: 8000 });
  };

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Siren className="h-5 w-5 text-red-600 dark:text-red-500" /> Emergency SOS
          </span>
        }
        description={`Press and hold a button for ${HOLD_MS / 1000} seconds to alert the gate desk with your location — Tower ${resident.block}, Flat ${resident.flat}.`}
      />

      {mine && (
        <section className="space-y-4 rounded-lg bg-red-600 p-5 text-white" role="status" aria-live="polite">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <Radio className="mt-0.5 h-5 w-5 shrink-0 animate-pulse" />
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide">{mine.title} — alert active</h2>
                <p className="text-xs opacity-90">
                  Raised {timeAgo(mine.raisedAt, now)} from Tower {mine.block}, Flat {mine.flat}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 shrink-0 bg-white text-xs text-zinc-900 hover:bg-zinc-100"
              onClick={() => {
                cancelSos(mine.alertId);
                toast.success("Alert cancelled", { description: "The gate desk has been told it was a false alarm." });
              }}
            >
              Cancel — false alarm
            </Button>
          </div>
          <ol className="grid gap-2 text-xs sm:grid-cols-3">
            {[
              { label: "Alert sent to gate desk", at: mine.raisedAt },
              { label: mine.acknowledgedBy ? `${mine.acknowledgedBy} responding` : "Guard responding", at: mine.acknowledgedAt },
              { label: "Resolved", at: mine.resolvedAt },
            ].map((s) => (
              <li key={s.label} className={cn("flex items-center gap-2 rounded-md p-2.5", s.at ? "bg-red-700/80" : "bg-red-700/30")}>
                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full", s.at ? "bg-white text-red-700" : "border border-white/50")}>
                  {s.at && <Check className="h-3 w-3" />}
                </span>
                <span>
                  {s.label}
                  {s.at && <span className="block opacity-80">{clock(s.at)}</span>}
                  {!s.at && s.label.includes("responding") && <span className="block opacity-80">Waiting…</span>}
                </span>
              </li>
            ))}
          </ol>
          <p className="rounded bg-red-700/60 p-2.5 text-xs">If it&apos;s safe, unlock your main door and switch on the lights. Call 108 / 112 directly if needed.</p>
        </section>
      )}

      {sos && !mine && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          An emergency is being handled at Tower {sos.block}. Security response may be slower for a few minutes.
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TYPES.map((t) => (
          <HoldButton key={t.type} onComplete={() => trigger(t.type)} disabled={!!mine}>
            <span className="mb-3 flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <t.icon className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">{t.urgency}</span>
            </span>
            <span className="block text-sm font-semibold">{SOS_TITLES[t.type]}</span>
            <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">{t.description}</span>
            <span className="mt-3 block text-[11px] font-medium text-zinc-400 group-hover:text-red-600 dark:group-hover:text-red-400">
              {mine ? "An alert is already active" : "Press and hold to send"}
            </span>
          </HoldButton>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Panel
          title={
            <span className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-zinc-500" /> Emergency contacts
            </span>
          }
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {CONTACTS.map((c) => (
              <li key={c.title} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{c.role}</p>
                </div>
                <a
                  href={`tel:${c.number.replace(/\s/g, "")}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1 font-mono text-xs transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {c.number} <ArrowUpRight className="h-3 w-3 text-zinc-400" />
                </a>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Your past alerts" bodyClassName="p-0">
          {history.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-zinc-500">No alerts raised from your flat. Stay safe.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {history.map((a) => (
                <li key={a.alertId} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-zinc-500">{friendlyDateTime(a.raisedAt)}</p>
                  </div>
                  {a.cancelledAt ? <Pill>Cancelled</Pill> : <Pill tone="emerald">Resolved</Pill>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
