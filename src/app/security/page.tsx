"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Check,
  CheckCircle2,
  Clock,
  KeyRound,
  LogIn,
  LogOut,
  Phone,
  Plus,
  Search,
  Shield,
  Siren,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import { ConsoleShell } from "@/components/app-shell";
import { EmptyState, Panel, StatCard } from "@/components/page";
import { Pill, VisitorStatusPill } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNow } from "@/hooks/use-now";
import { useNewItems } from "@/hooks/use-new-items";
import {
  acknowledgeSos,
  activeSos,
  checkoutVisitor,
  guardDecide,
  passStatus,
  registerVisitor,
  resolveSos,
  verifyPin,
  visitorLabel,
  type VerifyResult,
} from "@/lib/actions";
import { clock, friendlyDateTime, initials, timeAgo } from "@/lib/format";
import { BLOCKS, demoFlats } from "@/lib/seed";
import { PERSONAS, useSession } from "@/lib/session";
import { useDemoState } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { SosAlert, Visitor, VisitorPurpose } from "@/lib/types";

const PURPOSES: VisitorPurpose[] = ["Guest", "Delivery", "Cab", "Service", "Daily Help"];
const FLATS = demoFlats();
/** How long a visitor can stay before the console flags them, by purpose. */
const OVERSTAY_MIN: Record<VisitorPurpose, number> = { Delivery: 30, Cab: 20, Service: 240, Guest: 480, "Daily Help": 600 };

const isToday = (iso?: string) => !!iso && new Date(iso).toDateString() === new Date().toDateString();

/** Short two-tone alarm. Browsers may block audio until the guard has clicked somewhere — that's fine. */
function playAlarm(ctxRef: React.MutableRefObject<AudioContext | null>) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    ctxRef.current ??= new Ctx();
    const ctx = ctxRef.current;
    void ctx.resume();
    [0, 0.35, 0.7, 1.05].forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = i % 2 ? 660 : 880;
      gain.gain.setValueAtTime(0.06, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.32);
    });
  } catch {
    // audio unavailable
  }
}

export default function SecurityConsole() {
  const session = useSession();
  const guardName = session?.mode === "demo" && session.role === "security" ? session.displayName : PERSONAS.security.displayName;
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);

  return (
    <ConsoleShell
      role="security"
      icon={Shield}
      title={
        <span className="flex items-center gap-2">
          Gate console <Pill tone="emerald" dot>North Gate 1</Pill>
        </span>
      }
      subtitle={`On duty: ${guardName}`}
      banner={<SosBanner guardName={guardName} />}
      actions={
        <>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setVerifyOpen(true)}>
            <KeyRound className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Verify</span> PIN
          </Button>
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setCheckInOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Check in
          </Button>
        </>
      }
    >
      <GateConsole guardName={guardName} onVerify={() => setVerifyOpen(true)} onCheckIn={() => setCheckInOpen(true)} />
      <VerifyPinDialog open={verifyOpen} onOpenChange={setVerifyOpen} guardName={guardName} />
      <CheckInDialog open={checkInOpen} onOpenChange={setCheckInOpen} guardName={guardName} />
    </ConsoleShell>
  );
}

function SosBanner({ guardName }: { guardName: string }) {
  const state = useDemoState();
  const now = useNow(5_000);
  const [muted, setMuted] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const alert = activeSos(state);

  useNewItems(
    state.sos.filter((a) => !a.resolvedAt && !a.cancelledAt),
    (a) => a.alertId,
    (a: SosAlert) => {
      if (!muted) playAlarm(audio);
      toast.error(`SOS: ${a.title} at ${a.block}-${a.flat}`, { description: `${a.residentName} · ${a.phone}`, duration: 15_000 });
    },
  );

  if (!alert) return null;
  return (
    <div className="bg-red-600 text-white" role="alert">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <div className="flex items-start gap-3">
          <Siren className="mt-0.5 h-5 w-5 shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide">
              {alert.title} · Tower {alert.block}, Flat {alert.flat}
            </p>
            <p className="text-xs opacity-90">
              {alert.residentName} ·{" "}
              <a href={`tel:${alert.phone}`} className="underline underline-offset-2">
                {alert.phone}
              </a>{" "}
              · raised {timeAgo(alert.raisedAt, now)}
              {alert.acknowledgedAt && ` · ${alert.acknowledgedBy} responding since ${clock(alert.acknowledgedAt)}`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!alert.acknowledgedAt ? (
            <Button
              size="sm"
              className="h-8 bg-white text-xs font-semibold text-red-700 hover:bg-red-50"
              onClick={() => {
                acknowledgeSos(alert.alertId, guardName);
                toast.success("Response logged", { description: `The resident at ${alert.block}-${alert.flat} has been told help is on the way.` });
              }}
            >
              Respond now
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 bg-white text-xs font-semibold text-red-700 hover:bg-red-50"
              onClick={() => {
                resolveSos(alert.alertId);
                toast.success("SOS resolved");
              }}
            >
              <Check className="mr-1 h-3.5 w-3.5" /> Mark resolved
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-white hover:bg-red-700 hover:text-white"
            onClick={() => setMuted((m) => !m)}
            aria-pressed={muted}
            aria-label={muted ? "Unmute alarm" : "Mute alarm"}
          >
            {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function GateConsole({ guardName, onVerify, onCheckIn }: { guardName: string; onVerify: () => void; onCheckIn: () => void }) {
  const state = useDemoState();
  const now = useNow(15_000);
  const [query, setQuery] = useState("");
  const [purpose, setPurpose] = useState<"all" | VisitorPurpose>("all");

  // Phone numbers we know per flat (from the maintenance ledger) so the guard can call residents.
  const flatPhones = useMemo(() => {
    const m = new Map<string, { name: string; phone: string }>();
    for (const b of state.bills) m.set(`${b.block}-${b.flat}`, { name: b.residentName, phone: b.phone });
    return m;
  }, [state.bills]);

  const waiting = state.visitors.filter((v) => v.status === "waiting");
  const inside = state.visitors.filter((v) => v.status === "inside");
  const entriesToday = state.visitors.filter((v) => isToday(v.entryAt)).length;
  const exitsToday = state.visitors.filter((v) => isToday(v.exitAt)).length;

  // Let the guard know when a resident answers a request from their phone.
  useNewItems(
    state.visitors.filter((v) => v.decidedBy === "resident" && v.decidedAt),
    (v) => v.visitorId,
    (v) =>
      v.status === "denied"
        ? toast.error(`${v.block}-${v.flat} declined ${visitorLabel(v)}`, { description: "Please turn the visitor away politely." })
        : toast.success(`${v.block}-${v.flat} approved ${visitorLabel(v)}`, { description: "Open the barrier — the visitor is now marked inside." }),
  );

  const q = query.trim().toLowerCase();
  const filteredInside = inside
    .filter((v) => purpose === "all" || v.purpose === purpose)
    .filter(
      (v) =>
        !q ||
        v.name.toLowerCase().includes(q) ||
        `${v.block}-${v.flat}`.toLowerCase().includes(q) ||
        (v.vehicleNo ?? "").toLowerCase().replace(/\W/g, "").includes(q.replace(/\W/g, "")) ||
        (v.company ?? "").toLowerCase().includes(q),
    );
  const overstaying = (v: Visitor) => !!v.entryAt && now - new Date(v.entryAt).getTime() > OVERSTAY_MIN[v.purpose] * 60_000;

  const log = state.visitors
    .filter((v) => v.status === "left" || v.status === "denied")
    .sort((a, b) => (b.exitAt ?? b.decidedAt ?? "").localeCompare(a.exitAt ?? a.decidedAt ?? ""))
    .slice(0, 8);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Inside now" value={inside.length} hint={`${inside.filter(overstaying).length} overstaying`} icon={UserCheck} tone="success" />
        <StatCard label="Awaiting residents" value={waiting.length} hint="Approval requests sent" icon={Clock} tone={waiting.length ? "warning" : "default"} />
        <StatCard label="Entries today" value={entriesToday} hint="Approved, pass or guard admits" icon={LogIn} />
        <StatCard label="Exits today" value={exitsToday} hint="Logged departures" icon={LogOut} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:hidden">
        <Button variant="outline" onClick={onVerify} className="h-11 gap-2">
          <KeyRound className="h-4 w-4" /> Verify PIN
        </Button>
        <Button onClick={onCheckIn} className="h-11 gap-2">
          <Plus className="h-4 w-4" /> Check in
        </Button>
      </div>

      {waiting.length > 0 && (
        <Panel
          title={
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" /> Waiting for resident approval ({waiting.length})
            </span>
          }
          description="Residents get a notification. If they confirm by phone instead, admit from here."
          className="border-amber-300 dark:border-amber-900/70"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {waiting.map((v) => {
              const contact = flatPhones.get(`${v.block}-${v.flat}`);
              return (
                <div key={v.visitorId} className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-700/60 dark:bg-zinc-800/40">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{visitorLabel(v)}</p>
                      <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                        <Phone className="h-3 w-3" /> {v.phone}
                        {v.vehicleNo && <span className="ml-2 font-mono">{v.vehicleNo}</span>}
                      </p>
                    </div>
                    <Pill>{v.purpose}</Pill>
                  </div>
                  <div className="flex items-center justify-between rounded border border-zinc-200 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900">
                    <span className="font-medium">
                      Flat {v.block}-{v.flat}
                    </span>
                    <span className="font-medium text-amber-700 dark:text-amber-400">waiting {timeAgo(v.createdAt, now).replace(" ago", "")}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-8 flex-1 gap-1 text-xs"
                      onClick={() => {
                        guardDecide(v.visitorId, true, guardName);
                        toast.success(`${v.name} admitted`, { description: `Logged as confirmed by ${v.block}-${v.flat} over the phone.` });
                      }}
                    >
                      <Check className="h-3.5 w-3.5" /> Admit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-xs"
                      onClick={() => {
                        guardDecide(v.visitorId, false, guardName);
                        toast(`${v.name} turned away`);
                      }}
                    >
                      <X className="h-3.5 w-3.5" /> Turn away
                    </Button>
                    {contact && (
                      <Button asChild size="sm" variant="outline" className="h-8 px-2.5 text-xs" title={`Call ${contact.name}`}>
                        <a href={`tel:${contact.phone}`} aria-label={`Call ${contact.name}`}>
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      <section className="space-y-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-semibold">On the premises</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Everyone admitted and not yet checked out.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input placeholder="Name, flat or vehicle…" value={query} onChange={(e) => setQuery(e.target.value)} className="h-8 pl-9 text-xs" aria-label="Search visitors" />
            </div>
            <Select value={purpose} onValueChange={(v) => setPurpose(v as typeof purpose)}>
              <SelectTrigger className="h-8 w-32 text-xs" aria-label="Filter by purpose">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All purposes</SelectItem>
                {PURPOSES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredInside.length === 0 ? (
          <EmptyState icon={UserCheck} title={q || purpose !== "all" ? "No matches" : "Nobody inside"} description={q ? "Try a different name, flat or vehicle number." : "Admitted visitors appear here until they check out."} />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredInside.map((v) => {
              const over = overstaying(v);
              return (
                <div
                  key={v.visitorId}
                  className={cn(
                    "space-y-3 rounded-lg border bg-white p-4 dark:bg-zinc-900",
                    over ? "border-amber-300 dark:border-amber-900/70" : "border-zinc-200 dark:border-zinc-800",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-zinc-100 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {initials(v.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{visitorLabel(v)}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{v.phone}</p>
                      </div>
                    </div>
                    <Pill>{v.purpose}</Pill>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded bg-zinc-50 p-2 text-xs dark:bg-zinc-800/40">
                    <div>
                      <span className="block text-[10px] text-zinc-400">Flat</span>
                      <span className="font-medium">
                        {v.block}-{v.flat}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-zinc-400">Vehicle</span>
                      <span className="font-mono">{v.vehicleNo ?? "On foot"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-zinc-400">In since</span>
                      <span className="font-medium">{clock(v.entryAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {over ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-3 w-3" /> Overstaying ({timeAgo(v.entryAt, now).replace(" ago", "")})
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400">
                        {v.decidedBy === "pass" ? `Pass ${v.passId}` : v.decidedBy === "guard" ? "Admitted by guard" : "Approved by resident"}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs"
                      onClick={() => {
                        checkoutVisitor(v.visitorId);
                        toast.success(`${v.name} checked out`);
                      }}
                    >
                      <LogOut className="h-3 w-3" /> Check out
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {log.length > 0 && (
        <Panel title="Recent exits & refusals" bodyClassName="p-0">
          <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
            {log.map((v) => (
              <li key={v.visitorId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-medium">{visitorLabel(v)}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {v.purpose} · Flat {v.block}-{v.flat} · {v.status === "left" ? `${clock(v.entryAt)} – ${clock(v.exitAt)}` : friendlyDateTime(v.decidedAt ?? v.createdAt)}
                  </p>
                </div>
                <VisitorStatusPill status={v.status} />
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}

function VerifyPinDialog({ open, onOpenChange, guardName }: { open: boolean; onOpenChange: (o: boolean) => void; guardName: string }) {
  const state = useDemoState();
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const activePins = state.passes.filter((p) => passStatus(p) === "active").slice(0, 4);

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setPin("");
      setResult(null);
    }
  };

  const verify = (value = pin) => {
    if (value.length !== 6) return;
    const r = verifyPin(value, guardName);
    setResult(r);
    if (r.ok) toast.success(`${r.pass.guestName} admitted`, { description: `Pass ${r.pass.passId} for ${r.pass.block}-${r.pass.flat}` });
  };

  const reasons: Record<Exclude<VerifyResult, { ok: true }>["reason"], string> = {
    not_found: "No pass matches this PIN. Ask the visitor to check the PIN, or check them in manually.",
    expired: "This pass has expired.",
    used: "This PIN has already been used.",
    revoked: "The resident revoked this pass.",
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Verify gate pass</DialogTitle>
          <DialogDescription>Enter the 6-digit PIN the visitor shows you.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
          className="space-y-4"
        >
          <Input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="Gate pass PIN"
            placeholder="••••••"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
              setResult(null);
            }}
            className="h-14 text-center font-mono text-3xl font-bold tracking-[0.4em]"
          />

          {result?.ok && (
            <div className="space-y-1 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <p className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Valid — open the barrier
              </p>
              <p className="text-emerald-900 dark:text-emerald-200">
                {result.pass.guestName} · {result.pass.entryType} → Flat {result.pass.block}-{result.pass.flat}
              </p>
              {result.pass.vehicleNo && <p className="font-mono text-xs text-emerald-800 dark:text-emerald-300">Vehicle {result.pass.vehicleNo}</p>}
            </div>
          )}
          {result && !result.ok && (
            <div className="space-y-1 rounded-md border border-red-300 bg-red-50 p-3 text-sm dark:border-red-900/60 dark:bg-red-950/30">
              <p className="flex items-center gap-1.5 font-semibold text-red-800 dark:text-red-300">
                <XCircle className="h-4 w-4" /> Do not admit
              </p>
              <p className="text-red-900 dark:text-red-200">{reasons[result.reason]}</p>
              {result.pass && (
                <p className="text-xs text-red-800 dark:text-red-300">
                  {result.pass.guestName} · Flat {result.pass.block}-{result.pass.flat}
                  {result.reason === "used" && result.pass.usedAt && ` · used ${friendlyDateTime(result.pass.usedAt)}`}
                  {result.reason === "expired" && ` · expired ${friendlyDateTime(result.pass.expiresAt)}`}
                </p>
              )}
            </div>
          )}

          {activePins.length > 0 && !result && (
            <div className="rounded-md bg-zinc-50 p-2.5 text-xs text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
              <span className="font-medium">Demo — active PINs: </span>
              {activePins.map((p) => (
                <button
                  key={p.passId}
                  type="button"
                  onClick={() => setPin(p.pin)}
                  className="mr-1.5 rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  {p.pin}
                </button>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {result ? (
              <>
                <Button type="button" variant="outline" onClick={() => { setPin(""); setResult(null); }}>
                  Verify another
                </Button>
                <Button type="button" onClick={() => close(false)}>
                  Done
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => close(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pin.length !== 6}>
                  Verify &amp; admit
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const EMPTY_VISITOR = { name: "", phone: "", purpose: "Delivery" as VisitorPurpose, company: "", block: "A", flat: "", vehicleNo: "" };

function CheckInDialog({ open, onOpenChange, guardName }: { open: boolean; onOpenChange: (o: boolean) => void; guardName: string }) {
  const { resident } = useDemoState();
  const [v, setV] = useState(EMPTY_VISITOR);
  const [touched, setTouched] = useState(false);
  const phone = v.phone.replace(/\D/g, "");
  const errors = {
    name: v.name.trim().length < 2 ? "Enter the visitor's name" : null,
    phone: phone.length !== 10 ? "Enter a 10-digit mobile number" : null,
    flat: !v.flat ? "Choose a flat" : null,
  };
  const valid = !errors.name && !errors.phone && !errors.flat;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    registerVisitor({ ...v, name: v.name.trim(), phone, company: v.company.trim() }, guardName);
    toast.success("Approval request sent", { description: `${v.name.trim()} is waiting — Flat ${v.block}-${v.flat} has been notified.` });
    setV({ ...EMPTY_VISITOR, purpose: v.purpose });
    setTouched(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Check in a visitor</DialogTitle>
          <DialogDescription>Log the visitor and send an approval request to the flat.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3.5" noValidate>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="ci-name" className="text-xs">Name</Label>
              <Input id="ci-name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Ramesh Kumar" aria-invalid={touched && !!errors.name} />
              {touched && errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="ci-phone" className="text-xs">Mobile</Label>
              <Input id="ci-phone" type="tel" inputMode="numeric" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} placeholder="98765 43210" aria-invalid={touched && !!errors.phone} />
              {touched && errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Purpose</Label>
              <Select value={v.purpose} onValueChange={(p: VisitorPurpose) => setV({ ...v, purpose: p })}>
                <SelectTrigger aria-label="Purpose">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tower</Label>
              <Select value={v.block} onValueChange={(b) => setV({ ...v, block: b })}>
                <SelectTrigger aria-label="Tower">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOCKS.map((b) => (
                    <SelectItem key={b} value={b}>
                      Tower {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Flat</Label>
              <Select value={v.flat} onValueChange={(f) => setV({ ...v, flat: f })}>
                <SelectTrigger aria-label="Flat" aria-invalid={touched && !!errors.flat}>
                  <SelectValue placeholder="Flat" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {FLATS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched && errors.flat && <p className="text-xs text-red-600">{errors.flat}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="ci-company" className="text-xs">Company <span className="font-normal text-zinc-400">(optional)</span></Label>
              <Input id="ci-company" value={v.company} onChange={(e) => setV({ ...v, company: e.target.value })} placeholder="Swiggy, Amazon, Urban Company…" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ci-vehicle" className="text-xs">Vehicle <span className="font-normal text-zinc-400">(optional)</span></Label>
              <Input
                id="ci-vehicle"
                value={v.vehicleNo}
                onChange={(e) => setV({ ...v, vehicleNo: e.target.value.toUpperCase() })}
                placeholder="KA-01-AB-1234"
                className="font-mono"
              />
            </div>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            <Bell className="h-3 w-3 shrink-0" />
            <span>
              Demo tip: check someone in for{" "}
              <button type="button" className="font-semibold underline underline-offset-2" onClick={() => setV({ ...v, block: resident.block, flat: resident.flat })}>
                Flat {resident.block}-{resident.flat}
              </button>{" "}
              and they&apos;ll pop up in the resident app instantly.
            </span>
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={touched && !valid}>
              Send approval request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
