"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
    Home,
    Calendar,
    Users,
    Settings,
    LogOut,
    LineChart,
    FileText,
} from "lucide-react";

interface SidebarProps {
  userType: "user" | "security" | "plumber" | "laundry"
}

export function Sidebar({ userType }: SidebarProps) {
  const pathname = usePathname()
  const { theme } = useTheme()

  const userLinks = [
    { label: "Dashboard", icon: Home, href: "/user" },
    { label: "My Bookings", icon: Calendar, href: "/user/bookings" },
    { label: "My Visitors", icon: Users, href: "/user/visitors" },
    { label: "Maintenance", icon: FileText, href: "/user/maintenance" },
    { label: "Events", icon: Calendar, href: "/user/events" },
    { label: "Meeting", icon: Settings, href: "/user/meeting" },
    { label: "Analysis", icon: LineChart, href: "/user/analysis" },
  ]

  const securityLinks = [
    { label: "Dashboard", icon: Home, href: "/security" },
    { label: "Visitors", icon: Users, href: "/security/visitors" },
    // { href: "/security/logs", label: "Logs" }
  ]

//   const plumberLinks = [
//     { href: "/plumber", label: "Dashboard" },
//     { href: "/plumber/jobs", label: "Jobs" },
//     { href: "/plumber/schedule", label: "Schedule" }
//   ]

//   const laundryLinks = [
//     { href: "/laundry", label: "Dashboard" },
//     { href: "/laundry/orders", label: "Orders" },
//     { href: "/laundry/inventory", label: "Inventory" }
//   ]

  let links = userLinks
  switch (userType) {
    case "security":
      links = securityLinks
      break
    // case "plumber":
    //   links = plumberLinks
    //   break
    // case "laundry":
    //   links = laundryLinks
    //   break
  }

  return (
    <aside className="w-64 h-screen border-r bg-white text-black dark:bg-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4 capitalize">{userType} Dashboard</h2>
        <nav className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-4 py-2 rounded-md transition-all ${
                pathname === link.href
                  ? "bg-zinc-200 text-black dark:bg-zinc-700 dark:text-white font-medium"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
                {link.icon && <link.icon className="inline-block mr-2" />}
                {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="block px-4 py-2 rounded-md text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 mt-4"
          >
            Logout
          </Link>
        </nav>
      </div>
    </aside>
  )
}
