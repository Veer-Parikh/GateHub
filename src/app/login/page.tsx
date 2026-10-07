'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import {
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  ShieldCheck,
  Wrench,
  Sparkles,
  Zap,
  Building2,
  CheckCircle2,
  ArrowLeft
} from "lucide-react"
import { DEMO_CREDENTIALS, authenticateDemoSession, getOrCreateDemoStore } from "@/lib/mock-data"

type Role = "user" | "security" | "plumber" | "laundry"

const ROLES: { id: Role; label: string; description: string; icon: any }[] = [
  { id: "user", label: "Resident", description: "Flat owner & tenant portal", icon: User },
  { id: "security", label: "Guard Console", description: "Gate check-in & registry", icon: ShieldCheck },
  { id: "plumber", label: "Plumber", description: "Facility service tickets", icon: Wrench },
  { id: "laundry", label: "Laundry", description: "Express wash & pickup", icon: Sparkles },
]

export default function LoginPage() {
  const [role, setRole] = useState<Role>("user")
  const [name, setName] = useState("Arjun")
  const [password, setPassword] = useState("password123")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // 1-Click Instant Demo Login
  const handleInstantDemoLogin = (targetRole: Role) => {
    setLoading(true);
    try {
      getOrCreateDemoStore();
      const session = authenticateDemoSession(targetRole);
      const roleLabel = DEMO_CREDENTIALS[targetRole].label;
      const userName = DEMO_CREDENTIALS[targetRole].displayName;

      toast.success(`Welcome back, ${userName}`, {
        description: `Signed in as ${roleLabel} • Test data initialized.`,
      });

      router.push(`/${targetRole}`);
    } catch {
      toast.error("Could not initialize demo session.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Attempt backend API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);

      const res = await fetch(`http://localhost:5000/api/${role}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token || "jwt-session");
        getOrCreateDemoStore(); // Ensure mock store ready
        toast.success(`Signed in as ${name}`);
        router.push(`/${role}`);
        return;
      }
    } catch {
      // Backend unavailable - fallback to demo mode
    }

    // Seamless fallback to demo authentication
    getOrCreateDemoStore();
    const session = authenticateDemoSession(role, name || DEMO_CREDENTIALS[role].name);
    toast.success(`Signed in as ${name || DEMO_CREDENTIALS[role].displayName}`, {
      description: `Active offline demo session (${ROLES.find(r => r.id === role)?.label}).`,
    });
    setLoading(false);
    router.push(`/${role}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col lg:flex-row">
      {/* Left — High-polish Brand Hero Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[460px] shrink-0 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-12 py-12 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-14 group">
            <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white rounded-lg flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
              NexGate
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 ml-1">
              Township OS
            </span>
          </Link>

          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3 leading-snug">
            Intelligent gated living, simplified.
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
            Effortless gate passes, verified visitor approvals, automated billing, and trusted community service partners.
          </p>

          {/* Interactive Gate Pass Preview Card */}
          <div className="rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 p-4 space-y-3 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200 dark:border-zinc-800">
              <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Gate Console Preview
              </span>
              <span className="font-mono text-zinc-400 text-[11px]">GP-9401</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Arjun Verma &amp; Family</p>
                <p className="text-xs text-zinc-400">Visitor • Tower A, Flat 304</p>
              </div>
              <div className="px-2.5 py-1 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-mono text-xs font-bold tracking-widest">
                482 019
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
              <span>Vehicle: KA-03-NB-4412</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Verified Entry</span>
            </div>
          </div>
        </div>

        {/* Feature bullets */}
        <div className="space-y-4 pt-8 relative z-10">
          {[
            { text: "Zero database setup required — instant test credentials", highlight: true },
            { text: "Persistent mock data across resident & guard consoles", highlight: false },
            { text: "One-click approval simulation & digital gate pass generation", highlight: false },
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
              <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${f.highlight ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`} />
              <span className={f.highlight ? "font-medium text-zinc-800 dark:text-zinc-200" : ""}>{f.text}</span>
            </div>
          ))}

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to website
            </Link>
            <p className="text-xs text-zinc-400">NexGate v2.4</p>
          </div>
        </div>
      </div>

      {/* Right — Interactive Sign-in & Instant Demo Launch Deck */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">

          {/* Mobile brand header */}
          <div className="flex lg:hidden items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm">NexGate</span>
            </Link>
            <Link href="/" className="text-xs text-zinc-500">Back</Link>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Sign in to NexGate
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Select any role below for instant 1-click access, or submit credentials.
            </p>
          </div>

          {/* 1-Click Instant Demo Launch Deck */}
          <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                  Instant 1-Click Demo Accounts
                </span>
              </div>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Ready with test data</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => {
                const cred = DEMO_CREDENTIALS[r.id];
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleInstantDemoLogin(r.id)}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-left hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-6 h-6 rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                        Launch &rarr;
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{r.label}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{cred.name} • {cred.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role selector buttons */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
              Or sign in manually as:
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-800">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setRole(r.id);
                    setName(DEMO_CREDENTIALS[r.id].name);
                    setPassword("password123");
                  }}
                  className={`py-1.5 px-2 rounded-md text-xs font-medium transition-all text-center ${
                    role === r.id
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {r.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                Username / Display Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g. ${DEMO_CREDENTIALS[role].name}`}
                className="h-10 text-sm border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 text-sm pr-10 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in to {ROLES.find((r) => r.id === role)?.label}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
