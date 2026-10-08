"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Car, CheckCircle2, Clock, Copy, ExternalLink, QrCode, Share2, ShieldCheck, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState, PageHeader, Panel } from "@/components/page";
import { PassStatusPill, Pill } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNow } from "@/hooks/use-now";
import { createPass, passStatus, revokePass } from "@/lib/actions";
import { countdown, friendlyDateTime } from "@/lib/format";
import { pointsToast } from "@/lib/notify";
import { useDemoState } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { GatePass, PassType } from "@/lib/types";

const VALIDITY = [
  { value: "1", label: "1 hour" },
  { value: "2", label: "2 hours" },
  { value: "4", label: "4 hours" },
  { value: "8", label: "8 hours" },
  { value: "24", label: "24 hours" },
];

function shareText(p: GatePass, society: string) {
  return [
    `NexGate gate pass — ${society}`,
    `Guest: ${p.guestName}`,
    `Host flat: ${p.block}-${p.flat}`,
    `Entry PIN: ${p.pin}`,
    `Valid until: ${friendlyDateTime(p.expiresAt)}`,
    "",
    "Show this PIN to the guard at the main gate.",
  ].join("\n");
}

export default function GatePassPage() {
  return (
    <AppShell>
      <GatePasses />
    </AppShell>
  );
}

function GatePasses() {
  const now = useNow(10_000);
  const state = useDemoState();
  const { resident } = state;
  const [form, setForm] = useState({ guestName: "", guestPhone: "", entryType: "Guest" as PassType, validity: "4", vehicleNo: "" });
  const [touched, setTouched] = useState(false);
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "past">("active");

  const phoneDigits = form.guestPhone.replace(/\D/g, "");
  const errors = {
    guestName: form.guestName.trim().length < 2 ? "Enter the guest's name" : null,
    guestPhone: phoneDigits && phoneDigits.length !== 10 ? "Use a 10-digit mobile number" : null,
  };
  const valid = !errors.guestName && !errors.guestPhone;

  const passes = state.passes.filter((p) => p.block === resident.block && p.flat === resident.flat);
  const active = passes.filter((p) => passStatus(p, now) === "active");
  const past = passes.filter((p) => passStatus(p, now) !== "active");
  const created = passes.find((p) => p.passId === justCreated);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    const { pass, points } = createPass({
      guestName: form.guestName,
      guestPhone: phoneDigits || undefined,
      entryType: form.entryType,
      validityHours: Number(form.validity),
      vehicleNo: form.vehicleNo,
    });
    setJustCreated(pass.passId);
    setTab("active");
    setForm({ guestName: "", guestPhone: "", entryType: form.entryType, validity: form.validity, vehicleNo: "" });
    setTouched(false);
    toast.success(`Pass ${pass.passId} created`, { description: `PIN ${pass.pin} — valid for ${form.validity}h.` });
    pointsToast(points, "Pre-approved a visitor");
  };

  const copy = async (p: GatePass) => {
    try {
      await navigator.clipboard.writeText(shareText(p, resident.society));
      toast.success("Pass details copied");
    } catch {
      toast.error("Clipboard not available");
    }
  };

  const share = (p: GatePass) => {
    const url = `https://wa.me/${p.guestPhone ? `91${p.guestPhone}` : ""}?text=${encodeURIComponent(shareText(p, resident.society))}`;
    window.open(url, "_blank", "noopener");
  };

  return (
    <>
      <PageHeader
        title="Gate passes"
        description="Pre-approve expected visitors with a one-time PIN. The guard verifies it and lets them straight in."
        actions={
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <a href="/security" target="_blank" rel="noopener">
              Try it at the guard console <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </a>
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <Panel title="Issue a pass" description={`For ${resident.block}-${resident.flat}`}>
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="gp-name" className="text-xs">Guest name</Label>
                <Input
                  id="gp-name"
                  placeholder="e.g. Kavya & family, Amazon delivery"
                  value={form.guestName}
                  onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                  aria-invalid={touched && !!errors.guestName}
                />
                {touched && errors.guestName && <p className="text-xs text-red-600">{errors.guestName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gp-phone" className="text-xs">
                  Guest mobile <span className="font-normal text-zinc-400">(optional — lets you share on WhatsApp)</span>
                </Label>
                <Input
                  id="gp-phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="98765 43210"
                  value={form.guestPhone}
                  onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
                  aria-invalid={touched && !!errors.guestPhone}
                />
                {touched && errors.guestPhone && <p className="text-xs text-red-600">{errors.guestPhone}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select value={form.entryType} onValueChange={(v: PassType) => setForm({ ...form, entryType: v })}>
                    <SelectTrigger aria-label="Category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["Guest", "Delivery", "Cab", "Service"] as PassType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Valid for</Label>
                  <Select value={form.validity} onValueChange={(v) => setForm({ ...form, validity: v })}>
                    <SelectTrigger aria-label="Valid for">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VALIDITY.map((v) => (
                        <SelectItem key={v.value} value={v.value}>
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gp-vehicle" className="text-xs">
                  Vehicle number <span className="font-normal text-zinc-400">(optional)</span>
                </Label>
                <Input
                  id="gp-vehicle"
                  placeholder="KA-01-AB-1234"
                  value={form.vehicleNo}
                  onChange={(e) => setForm({ ...form, vehicleNo: e.target.value.toUpperCase() })}
                  className="font-mono"
                />
              </div>
              <Button type="submit" className="w-full" disabled={touched && !valid}>
                <QrCode className="mr-1.5 h-4 w-4" /> Generate pass
              </Button>
            </form>
          </Panel>

          <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-100/60 p-4 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <p className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
              <ShieldCheck className="h-4 w-4" /> How passes work
            </p>
            <ol className="list-decimal space-y-1 pl-4">
              <li>Generate a pass and share the 6-digit PIN with your guest.</li>
              <li>The guard enters the PIN at the gate — no call to your flat needed.</li>
              <li>Each PIN works once and expires automatically. You&apos;ll get a notification when it&apos;s used.</li>
            </ol>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-7">
          {created && passStatus(created, now) === "active" && (
            <div className="rounded-lg border-2 border-emerald-500/70 bg-white p-5 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Pass ready to share
                  </p>
                  <p className="mt-1 text-lg font-semibold">{created.guestName}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {created.entryType} · valid until {friendlyDateTime(created.expiresAt)}
                  </p>
                </div>
                <button type="button" onClick={() => setJustCreated(null)} className="text-xs text-zinc-400 hover:text-zinc-700" aria-label="Dismiss">
                  Dismiss
                </button>
              </div>
              <p className="my-4 text-center font-mono text-4xl font-bold tracking-[0.3em] sm:text-5xl">{created.pin}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={() => share(created)} className="h-8 gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700">
                  <Share2 className="h-3.5 w-3.5" /> Share on WhatsApp
                </Button>
                <Button size="sm" variant="outline" onClick={() => copy(created)} className="h-8 gap-1.5 text-xs">
                  <Copy className="h-3.5 w-3.5" /> Copy details
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5" role="tablist">
            {(
              [
                ["active", `Active (${active.length})`],
                ["past", `Used & expired (${past.length})`],
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

          {tab === "active" &&
            (active.length === 0 ? (
              <EmptyState icon={QrCode} title="No active passes" description="Passes you generate appear here with a live countdown until they're used or expire." />
            ) : (
              <ul className="space-y-3">
                {active.map((p) => {
                  const total = new Date(p.expiresAt).getTime() - new Date(p.createdAt).getTime();
                  const left = new Date(p.expiresAt).getTime() - now;
                  return (
                    <li key={p.passId} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] text-zinc-400">{p.passId}</span>
                            <Pill>{p.entryType}</Pill>
                          </div>
                          <p className="mt-1 truncate font-semibold">{p.guestName}</p>
                          <p className="flex flex-wrap items-center gap-x-3 text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {countdown(p.expiresAt, now)}
                            </span>
                            {p.vehicleNo && (
                              <span className="flex items-center gap-1 font-mono">
                                <Car className="h-3 w-3" /> {p.vehicleNo}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-center dark:border-zinc-700 dark:bg-zinc-800">
                          <span className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-400">PIN</span>
                          <span className="font-mono text-xl font-bold tracking-wider">{p.pin}</span>
                        </div>
                      </div>
                      <Progress value={Math.max(0, (left / total) * 100)} className="h-1" aria-label="Time remaining" />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => share(p)} className="h-7 gap-1 text-xs">
                          <Share2 className="h-3 w-3" /> Share
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => copy(p)} className="h-7 gap-1 text-xs">
                          <Copy className="h-3 w-3" /> Copy
                        </Button>
                        {confirmRevoke === p.passId ? (
                          <span className="ml-auto flex items-center gap-1.5 text-xs">
                            Revoke this pass?
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              onClick={() => {
                                revokePass(p.passId);
                                setConfirmRevoke(null);
                                toast("Pass revoked", { description: `PIN ${p.pin} will no longer open the gate.` });
                              }}
                            >
                              Revoke
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setConfirmRevoke(null)}>
                              Keep
                            </Button>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmRevoke(p.passId)}
                            className="ml-auto h-7 gap-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-3 w-3" /> Revoke
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ))}

          {tab === "past" &&
            (past.length === 0 ? (
              <EmptyState icon={Clock} title="No past passes" description="Used, expired and revoked passes are kept here." />
            ) : (
              <Panel bodyClassName="p-0">
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {past.map((p) => {
                    const status = passStatus(p, now);
                    return (
                      <li key={p.passId} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{p.guestName}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="font-mono">{p.passId}</span> · {p.entryType} ·{" "}
                            {status === "used"
                              ? `entered ${friendlyDateTime(p.usedAt!)}`
                              : status === "revoked"
                                ? `revoked ${friendlyDateTime(p.revokedAt!)}`
                                : `expired ${friendlyDateTime(p.expiresAt)}`}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="hidden font-mono text-xs text-zinc-400 line-through sm:inline">{p.pin}</span>
                          <PassStatusPill status={status} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            ))}
        </div>
      </div>
    </>
  );
}
