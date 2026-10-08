"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Shield } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setResident } from "@/lib/actions";
import { api, ApiError } from "@/lib/api";
import { uid } from "@/lib/format";
import { fetchProfile } from "@/lib/live";
import { BLOCKS, DEFAULT_RESIDENT, demoFlats } from "@/lib/seed";
import { startDemoSession, startLiveSession } from "@/lib/session";

interface Room {
  roomId: string;
  room: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"checking" | "live" | "demo">("checking");
  const [blocks, setBlocks] = useState<string[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", block: "", roomId: "" });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Blocks come from GET /api/user/blocks; fall back to demo towers when the server is offline.
  useEffect(() => {
    api<{ blocks: string[] }>("/user/blocks", { token: null, timeoutMs: 2500 })
      .then((r) => {
        if (!r.blocks?.length) throw new Error("no blocks");
        setBlocks([...r.blocks].sort());
        setMode("live");
      })
      .catch(() => {
        setBlocks(BLOCKS);
        setMode("demo");
      });
  }, []);

  // Flats for the chosen block come from GET /api/user/rooms?block=X.
  useEffect(() => {
    if (!form.block) return;
    setForm((f) => ({ ...f, roomId: "" }));
    if (mode === "demo") {
      setRooms(demoFlats().map((r) => ({ roomId: r, room: r })));
      return;
    }
    setRoomsLoading(true);
    api<Room[]>(`/user/rooms?block=${encodeURIComponent(form.block)}`, { token: null })
      .then((r) => setRooms([...r].sort((a, b) => a.room.localeCompare(b.room, undefined, { numeric: true }))))
      .catch(() => setRooms([]))
      .finally(() => setRoomsLoading(false));
  }, [form.block, mode]);

  const phone = form.phone.replace(/\D/g, "");
  const errors = {
    name: form.name.trim().length < 2 ? "Enter your full name" : null,
    email: /^\S+@\S+\.\S+$/.test(form.email.trim()) ? null : "Enter a valid email",
    phone: phone.length === 10 ? null : "Enter a 10-digit mobile number",
    password: form.password.length >= 8 ? null : "Use at least 8 characters",
    block: form.block ? null : "Choose your tower",
    roomId: form.roomId ? null : "Choose your flat",
  };
  const valid = Object.values(errors).every((e) => !e);
  const err = (k: keyof typeof errors) => touched && errors[k] && <p className="text-xs text-red-600">{errors[k]}</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!valid) return;
    setSubmitting(true);
    const name = form.name.trim();
    try {
      if (mode === "live") {
        await api("/user/signup", { method: "POST", token: null, body: { name, email: form.email.trim(), number: phone, password: form.password, roomId: form.roomId } });
        const res = await api<{ token: string }>("/user/login", { method: "POST", token: null, body: { name, password: form.password } });
        startLiveSession("user", res.token, name);
        setResident(await fetchProfile());
        toast.success(`Welcome to NexGate, ${name.split(" ")[0]}`);
      } else {
        const flat = rooms.find((r) => r.roomId === form.roomId)?.room ?? form.roomId;
        setResident({ ...DEFAULT_RESIDENT, userId: uid("res"), name, email: form.email.trim(), phone, block: form.block, flat });
        startDemoSession("user", name);
        toast.success(`Welcome, ${name.split(" ")[0]}`, { description: `Demo account for Tower ${form.block}, Flat ${flat} — with committee access so you can try everything.` });
      }
      router.push("/user");
    } catch (e) {
      setError(e instanceof ApiError && e.status === 0 ? "Can't reach the server. Try again in a moment." : e instanceof Error ? e.message : "Sign-up failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold">NexGate</span>
          </Link>
          <ThemeToggle />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create your resident account</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Link your account to your flat to approve visitors, pay dues and more.</p>
        </div>

        {mode === "demo" && (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            The NexGate server isn&apos;t reachable, so this creates a <b>demo account</b> stored in your browser.
          </p>
        )}

        <form onSubmit={submit} noValidate className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-1.5">
            <Label htmlFor="rg-name" className="text-xs">Full name</Label>
            <Input id="rg-name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {err("name")}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rg-email" className="text-xs">Email</Label>
              <Input id="rg-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {err("email")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rg-phone" className="text-xs">Mobile</Label>
              <Input id="rg-phone" type="tel" inputMode="numeric" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              {err("phone")}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Tower / block</Label>
              <Select value={form.block} onValueChange={(b) => setForm({ ...form, block: b })} disabled={mode === "checking"}>
                <SelectTrigger aria-label="Tower or block">
                  <SelectValue placeholder={mode === "checking" ? "Loading…" : "Select"} />
                </SelectTrigger>
                <SelectContent>
                  {blocks.map((b) => (
                    <SelectItem key={b} value={b}>
                      Block {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err("block")}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Flat</Label>
              <Select value={form.roomId} onValueChange={(r) => setForm({ ...form, roomId: r })} disabled={!form.block || roomsLoading}>
                <SelectTrigger aria-label="Flat">
                  <SelectValue placeholder={!form.block ? "Pick a block first" : roomsLoading ? "Loading…" : rooms.length ? "Select" : "No flats found"} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {rooms.map((r) => (
                    <SelectItem key={r.roomId} value={r.roomId}>
                      {r.room}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {err("roomId")}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rg-pass" className="text-xs">Password</Label>
            <Input id="rg-pass" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {err("password")}
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          )}

          <Button type="submit" className="h-10 w-full" disabled={submitting || mode === "checking" || (touched && !valid)}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <div className="flex items-center justify-between text-xs">
          <Link href="/login" className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
          <span className="text-zinc-400">You&apos;ll sign in by name + password</span>
        </div>
      </div>
    </div>
  );
}
