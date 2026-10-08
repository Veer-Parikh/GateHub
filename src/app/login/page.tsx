"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Shield, ShieldCheck, Sparkles, User, Wrench, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setResident } from "@/lib/actions";
import { api, ApiError } from "@/lib/api";
import { fetchProfile } from "@/lib/live";
import { DEMO_PASSWORD, PERSONAS, startDemoSession, startLiveSession } from "@/lib/session";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLES: { id: Role; icon: React.ElementType; blurb: string }[] = [
  { id: "user", icon: User, blurb: "Flat owner & tenant app" },
  { id: "security", icon: ShieldCheck, blurb: "Gate check-in & PIN verify" },
  { id: "plumber", icon: Wrench, blurb: "Service work orders" },
  { id: "laundry", icon: Sparkles, blurb: "Pickup & delivery orders" },
];

type LoginResponse = { token: string; user?: { name: string }; security?: { name: string }; plumber?: { name: string }; laundry?: { name: string } };

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("user");
  const [name, setName] = useState(PERSONAS.user.name);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const launchDemo = (r: Role) => {
    startDemoSession(r);
    toast.success(`Welcome, ${PERSONAS[r].displayName}`, { description: `Demo ${PERSONAS[r].label.toLowerCase()} session — no setup needed.` });
    router.push(PERSONAS[r].home);
  };

  const isDemoPersona = name.trim().toLowerCase() === PERSONAS[role].name.toLowerCase() && password === DEMO_PASSWORD;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<LoginResponse>(`/${role}/login`, { method: "POST", body: { name: name.trim(), password }, token: null, timeoutMs: 3000 });
      const displayName = res.user?.name ?? res.security?.name ?? res.plumber?.name ?? res.laundry?.name ?? name.trim();
      startLiveSession(role, res.token, displayName);
      if (role === "user") {
        try {
          setResident(await fetchProfile());
        } catch {
          // profile is optional for the first render; pages fetch what they need
        }
      }
      toast.success(`Signed in as ${displayName}`, { description: "Connected to the NexGate server." });
      router.push(PERSONAS[role].home);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      if (isDemoPersona) {
        // Demo personas always work, whether or not a server is running.
        launchDemo(role);
        return;
      }
      setError(
        status === 0
          ? "Can't reach the NexGate server. Use one of the demo accounts above, or start the backend."
          : status === 401 || status === 404 || status === 400
            ? "Incorrect name or password."
            : err instanceof Error
              ? err.message
              : "Sign-in failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-zinc-950 lg:flex-row">
      <aside className="relative hidden w-[460px] shrink-0 flex-col justify-between overflow-hidden border-r border-zinc-200 bg-white px-12 py-12 dark:border-zinc-800 dark:bg-zinc-900 lg:flex">
        <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl dark:bg-blue-500/10" />
        <div className="relative">
          <Link href="/" className="mb-14 inline-flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Shield className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold tracking-tight">NexGate</span>
          </Link>
          <h1 className="mb-3 text-3xl font-bold leading-snug tracking-tight">Gated living, simplified.</h1>
          <p className="mb-8 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Gate passes, visitor approvals, maintenance billing and trusted service partners — in one place for residents, guards and partners.
          </p>
          <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2 text-xs dark:border-zinc-800">
              <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Gate pass verified
              </span>
              <span className="font-mono text-[11px] text-zinc-400">GP-9401</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Arjun Verma &amp; Family</p>
                <p className="text-xs text-zinc-400">Guest · Tower A, Flat 304</p>
              </div>
              <div className="rounded bg-zinc-900 px-2.5 py-1 font-mono text-xs font-bold tracking-widest text-white dark:bg-zinc-100 dark:text-zinc-900">482 019</div>
            </div>
          </div>
        </div>
        <div className="relative space-y-3 pt-8">
          {[
            "Try every role instantly — demo data is pre-loaded",
            "Open the guard console in a second tab and watch the resident app update live",
            "Connects to the Express backend when it's running",
          ].map((t) => (
            <p key={t} className="flex items-start gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" /> {t}
            </p>
          ))}
          <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to website
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Shield className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold">NexGate</span>
            </Link>
            <ThemeToggle />
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Jump straight in with a demo account, or use your own credentials.</p>
          </div>

          <section className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 dark:text-blue-300">
              <Zap className="h-4 w-4 fill-current" /> One-click demo accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => launchDemo(r.id)}
                  className="group rounded-lg border border-zinc-200 bg-white p-2.5 text-left transition-all hover:border-blue-500 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-zinc-100 text-zinc-700 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-300">
                      <r.icon className="h-3.5 w-3.5" />
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-blue-600 transition-transform group-hover:translate-x-0.5 dark:text-blue-400" />
                  </div>
                  <p className="text-xs font-semibold">{PERSONAS[r.id].label}</p>
                  <p className="truncate text-[11px] text-zinc-500">{PERSONAS[r.id].displayName} · {r.blurb}</p>
                </button>
              ))}
            </div>
          </section>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">Or sign in as</p>
              <div className="grid grid-cols-4 gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-800/80" role="radiogroup" aria-label="Account type">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    role="radio"
                    aria-checked={role === r.id}
                    onClick={() => {
                      setRole(r.id);
                      setName(PERSONAS[r.id].name);
                      setPassword(DEMO_PASSWORD);
                      setError(null);
                    }}
                    className={cn(
                      "rounded-md px-1 py-1.5 text-xs font-medium transition-all",
                      role === r.id ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200",
                    )}
                  >
                    {PERSONAS[r.id].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-name" className="text-xs">Name</Label>
              <Input id="login-name" autoComplete="username" value={name} onChange={(e) => setName(e.target.value)} className="h-10" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-pass" className="text-xs">Password</Label>
              <div className="relative">
                <Input
                  id="login-pass"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">
                Demo: <span className="font-mono">{PERSONAS[role].name}</span> / <span className="font-mono">{DEMO_PASSWORD}</span>
              </p>
            </div>

            {error && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || !password}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-500">
            New resident?{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
