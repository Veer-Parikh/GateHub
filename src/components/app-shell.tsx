"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { LogOut, Menu, Shield } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarContent } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMounted } from "@/hooks/use-now";
import { useNewItems } from "@/hooks/use-new-items";
import { residentDecide, visitorLabel } from "@/lib/actions";
import { pointsToast } from "@/lib/notify";
import { endSession, getSession, PERSONAS, startDemoSession, useSession } from "@/lib/session";
import { useDemoState } from "@/lib/store";
import type { Role } from "@/lib/types";

/** Visiting a console without signing in starts a demo session for that role. */
function useEnsureSession(role: Role) {
  useEffect(() => {
    if (!getSession()) startDemoSession(role);
  }, [role]);
}

/** A live (backend) session can only use its own console; demo sessions can roam freely. */
function WrongRole({ role }: { role: Role }) {
  const session = useSession();
  if (!session || session.mode !== "live" || session.role === role) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-50/95 p-6 backdrop-blur dark:bg-zinc-950/95">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Shield className="mx-auto h-8 w-8 text-zinc-400" />
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">This is the {PERSONAS[role].label.toLowerCase()} console</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            You&apos;re signed in as {session.displayName} ({PERSONAS[session.role].label.toLowerCase()}).
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href={PERSONAS[session.role].home}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Back to my dashboard
          </Link>
          <button
            type="button"
            onClick={() => {
              endSession();
              window.location.href = "/login";
            }}
            className="rounded-md border border-zinc-200 px-4 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
          >
            Sign in with another account
          </button>
        </div>
      </div>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

/** Toasts for things that happen elsewhere — e.g. the guard (in another tab) logs a visitor for your flat. */
function ResidentAlerts() {
  const state = useDemoState();
  const session = useSession();
  const enabled = session?.mode !== "live";
  const { resident } = state;
  const mine = <T extends { block: string; flat: string }>(x: T) => x.block === resident.block && x.flat === resident.flat;

  useNewItems(
    state.visitors.filter((v) => v.status === "waiting" && mine(v)),
    (v) => v.visitorId,
    (v) =>
      toast.warning(`${visitorLabel(v)} is at the gate`, {
        description: `${v.purpose}${v.vehicleNo ? ` · ${v.vehicleNo}` : ""} — approve entry?`,
        duration: 20_000,
        action: {
          label: "Approve",
          onClick: () => {
            const { points } = residentDecide(v.visitorId, true);
            toast.success(`${v.name} approved`, { description: "The guard has been notified." });
            pointsToast(points, "Quick response at the gate");
          },
        },
        cancel: { label: "Decline", onClick: () => residentDecide(v.visitorId, false) },
      }),
    enabled,
  );

  useNewItems(
    state.bookings.filter(mine),
    (b) => `${b.bookingId}:${b.status}`,
    (b) => {
      if (b.status === "in_progress") toast.info(`${b.providerName} has started work`, { description: b.title });
      if (b.status === "completed")
        toast.success(`${b.providerName} marked your job complete`, {
          description: "Rate the service on the Services page to earn points.",
          action: { label: "Rate now", onClick: () => (window.location.href = "/user/bookings") },
        });
    },
    enabled,
  );

  useNewItems(
    state.sos.filter((a) => mine(a) && a.acknowledgedAt),
    (a) => a.alertId,
    (a) => toast.success(`${a.acknowledgedBy ?? "Security"} is responding`, { description: `${a.title} — help is on the way.`, duration: 10_000 }),
    enabled,
  );

  useNewItems(
    state.passes.filter((p) => mine(p) && p.usedAt),
    (p) => p.passId,
    (p) => toast.info(`${p.guestName} just entered`, { description: `Gate pass ${p.passId} was verified at the gate.` }),
    enabled,
  );

  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  useEnsureSession("user");

  return (
    <div className="flex h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-zinc-200 dark:border-zinc-800 md:block">
        {mounted && <SidebarContent />}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open navigation"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {mounted && <SidebarContent onNavigate={() => setOpen(false)} />}
            </SheetContent>
          </Sheet>
          <Link href="/user" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 dark:bg-white">
              <Shield className="h-3.5 w-3.5 text-white dark:text-zinc-900" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold">NexGate</span>
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            {mounted ? children : <ContentSkeleton />}
          </div>
        </main>
      </div>

      {mounted && <ResidentAlerts />}
      {mounted && <WrongRole role="user" />}
    </div>
  );
}

/** Top-bar layout for the guard, plumber and laundry consoles. */
export function ConsoleShell({
  role,
  icon: Icon,
  title,
  subtitle,
  accent = "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900",
  actions,
  banner,
  children,
}: {
  role: Role;
  icon: React.ElementType;
  title: ReactNode;
  subtitle?: ReactNode;
  accent?: string;
  actions?: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
}) {
  const mounted = useMounted();
  useEnsureSession(role);

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {mounted && banner}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${accent}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight">{title}</div>
              {subtitle && <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</div>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {mounted && actions}
            <ThemeToggle />
            <button
              type="button"
              onClick={() => {
                endSession();
                window.location.href = "/login";
              }}
              title="Sign out"
              aria-label="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {mounted ? children : <ContentSkeleton />}
      </main>
      {mounted && <WrongRole role={role} />}
    </div>
  );
}
