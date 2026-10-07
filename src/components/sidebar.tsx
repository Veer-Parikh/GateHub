"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  QrCode,
  Users,
  ShoppingBag,
  Siren,
  Receipt,
  Wrench,
  CalendarDays,
  Video,
  Shield,
  LogOut,
  Menu,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import { useTheme } from "next-themes";

interface NavLink {
  label: string;
  icon: React.ElementType;
  href: string;
  alert?: boolean;
}

interface NavGroup {
  links: NavLink[];
}

interface SidebarProps {
  userType: "user" | "security" | "plumber" | "laundry";
}

const USER_GROUPS: NavGroup[] = [
  {
    links: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/user" },
      { label: "Gate Pass", icon: QrCode, href: "/user/gatepass" },
      { label: "Visitors", icon: Users, href: "/user/visitors" },
      { label: "Marketplace", icon: ShoppingBag, href: "/user/marketplace" },
      { label: "Emergency", icon: Siren, href: "/user/sos", alert: true },
    ],
  },
  {
    links: [
      { label: "Maintenance", icon: Receipt, href: "/user/maintenance" },
      { label: "Bookings", icon: Wrench, href: "/user/bookings" },
      { label: "Events", icon: CalendarDays, href: "/user/events" },
      { label: "Meetings", icon: Video, href: "/user/meetings" },
    ],
  },
];

const SECURITY_GROUPS: NavGroup[] = [
  {
    links: [
      { label: "Gate Console", icon: Shield, href: "/security" },
      { label: "Verify Pass", icon: QrCode, href: "/security" },
      { label: "Registry", icon: Users, href: "/security" },
    ],
  },
];

const PLUMBER_GROUPS: NavGroup[] = [
  {
    links: [
      { label: "Work Orders", icon: Wrench, href: "/plumber" },
      { label: "Resident Portal", icon: LayoutDashboard, href: "/user" },
      { label: "Guard Console", icon: Shield, href: "/security" },
    ],
  },
];

const LAUNDRY_GROUPS: NavGroup[] = [
  {
    links: [
      { label: "Laundry Orders", icon: Sparkles, href: "/laundry" },
      { label: "Resident Portal", icon: LayoutDashboard, href: "/user" },
      { label: "Guard Console", icon: Shield, href: "/security" },
    ],
  },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all w-full"
      title={isDark ? "Switch to light" : "Switch to dark"}
    >
      {isDark
        ? <Sun className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        : <Moon className="w-4 h-4 shrink-0" strokeWidth={1.75} />}
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}

function NavItem({ link, onClick }: { link: NavLink; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === link.href;
  const Icon = link.icon;

  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${
        isActive
          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium"
          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      }`}
    >
      <Icon
        className={`w-4 h-4 shrink-0 ${
          isActive
            ? "text-white dark:text-zinc-900"
            : link.alert
            ? "text-red-500"
            : "text-zinc-400 dark:text-zinc-500"
        }`}
        strokeWidth={isActive ? 2 : 1.75}
      />
      <span>{link.label}</span>
      {link.alert && !isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500" />
      )}
    </Link>
  );
}

function SidebarContent({
  userType,
  onClose,
}: {
  userType: SidebarProps["userType"];
  onClose?: () => void;
}) {
  const groups =
    userType === "security"
      ? SECURITY_GROUPS
      : userType === "plumber"
      ? PLUMBER_GROUPS
      : userType === "laundry"
      ? LAUNDRY_GROUPS
      : USER_GROUPS;

  const handleSignOut = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
      {/* Brand */}
      <div className="px-3 py-5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-zinc-900 dark:bg-white rounded flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-white dark:text-zinc-900" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
            NexGate
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {groups.map((group, gi) => (
          <div key={gi} className="space-y-0.5">
            {group.links.map(link => (
              <NavItem key={link.href + link.label} link={link} onClick={onClose} />
            ))}
            {gi < groups.length - 1 && (
              <div className="pt-4">
                <div className="border-t border-zinc-100 dark:border-zinc-800" />
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-zinc-100 dark:border-zinc-800 space-y-0.5">
        <ThemeToggle />
        {userType === "user" && (
          <>
            <Link
              href="/security"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <Shield className="w-4 h-4" strokeWidth={1.75} />
              Guard console
            </Link>
            <Link
              href="/plumber"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <Wrench className="w-4 h-4" strokeWidth={1.75} />
              Plumber console
            </Link>
          </>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-400 dark:text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ userType }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="w-9 h-9 flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <Menu className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-60 p-0 border-zinc-200 dark:border-zinc-800"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent userType={userType} onClose={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col h-screen w-56 shrink-0 border-r border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0">
        <SidebarContent userType={userType} />
      </aside>
    </>
  );
}
