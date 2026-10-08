"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  QrCode,
  Receipt,
  RotateCcw,
  Shield,
  ShoppingBag,
  Siren,
  Trophy,
  Users,
  Video,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { activeSos, resetDemo } from "@/lib/actions";
import { initials } from "@/lib/format";
import { levelFor, totalPoints } from "@/lib/gamification";
import { endSession, useSession } from "@/lib/session";
import { useDemoState } from "@/lib/store";
import { cn } from "@/lib/utils";

interface NavLink {
  label: string;
  icon: React.ElementType;
  href: string;
  count?: number;
  alert?: boolean;
}

function NavItem({ link, onNavigate }: { link: NavLink; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === link.href;
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "" : link.alert ? "text-red-500" : "text-zinc-400 dark:text-zinc-500",
        )}
        strokeWidth={active ? 2 : 1.75}
      />
      <span className="truncate">{link.label}</span>
      {!!link.count && (
        <span
          className={cn(
            "ml-auto min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums",
            active
              ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
          )}
        >
          {link.count}
        </span>
      )}
      {link.alert && !link.count && <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-red-500" />}
    </Link>
  );
}

function ResetDemoButton() {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      onClick={() => {
        if (!armed) return setArmed(true);
        resetDemo();
        setArmed(false);
        toast.success("Demo data reset", { description: "Visitors, passes, bills and bookings are back to their starting state." });
      }}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        armed
          ? "bg-amber-50 font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
      )}
    >
      <RotateCcw className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      {armed ? "Click again to reset" : "Reset demo data"}
    </button>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const state = useDemoState();
  const session = useSession();
  const live = session?.mode === "live";
  const { resident } = state;
  const mine = (x: { block: string; flat: string }) => x.block === resident.block && x.flat === resident.flat;

  const waiting = live ? 0 : state.visitors.filter((v) => v.status === "waiting" && mine(v)).length;
  const unpaid = live ? 0 : state.bills.filter((b) => !b.paidAt && mine(b)).length;
  const sos = activeSos(state);
  const sosMine = !live && !!sos && mine(sos);
  const points = totalPoints(state.points);
  const { level } = levelFor(points);

  const groups: { title?: string; links: NavLink[] }[] = [
    { links: [{ label: "Dashboard", icon: LayoutDashboard, href: "/user" }] },
    {
      title: "Gate & safety",
      links: [
        { label: "Gate passes", icon: QrCode, href: "/user/gatepass" },
        { label: "Visitors", icon: Users, href: "/user/visitors", count: waiting },
        { label: "Emergency SOS", icon: Siren, href: "/user/sos", alert: sosMine },
      ],
    },
    {
      title: "Home",
      links: [
        { label: "Maintenance", icon: Receipt, href: "/user/maintenance", count: unpaid },
        { label: "Services", icon: Wrench, href: "/user/bookings" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Marketplace", icon: ShoppingBag, href: "/user/marketplace" },
        { label: "Events", icon: CalendarDays, href: "/user/events" },
        { label: "Meetings", icon: Video, href: "/user/meetings" },
        { label: "Good Neighbour", icon: Trophy, href: "/user/community" },
      ],
    },
    ...(resident.isAdmin
      ? [{ title: "Committee", links: [{ label: "Analytics", icon: BarChart3, href: "/user/analytics" }] }]
      : []),
  ];

  const signOut = () => {
    endSession();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-900">
      <div className="border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
        <Link href="/" className="flex items-center gap-2.5" onClick={onNavigate}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-zinc-900 dark:bg-white">
            <Shield className="h-4 w-4 text-white dark:text-zinc-900" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100">NexGate</p>
            <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">{resident.society}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4" aria-label="Main">
        {groups.map((group, i) => (
          <div key={group.title ?? i} className="space-y-0.5">
            {group.title && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {group.title}
              </p>
            )}
            {group.links.map((link) => (
              <NavItem key={link.href} link={link} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-zinc-100 px-2 py-3 dark:border-zinc-800">
        <Link
          href="/user/community"
          onClick={onNavigate}
          className="mb-2 flex items-center gap-3 rounded-lg border border-zinc-200 p-2.5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
            {initials(resident.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">{resident.name}</p>
            <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
              {resident.block}-{resident.flat} · {level.name}
            </p>
          </div>
          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">{points} pts</span>
        </Link>

        <a
          href="/security"
          target="_blank"
          rel="noopener"
          title="Open the guard console in a new tab — actions there show up here instantly"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <Shield className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Guard console
          <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-60" />
        </a>
        <ThemeToggle variant="row" />
        {!live && <ResetDemoButton />}
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        >
          <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </div>
  );
}
