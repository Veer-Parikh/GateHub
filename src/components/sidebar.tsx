// "use client"

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
  Menu,
} from "lucide-react"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { SheetTitle } from "@/components/ui/sheet"

interface SidebarProps {
  userType: "user" | "security" | "plumber" | "laundry"
}

export function Sidebar({ userType }: SidebarProps) {
  const pathname = usePathname()
  const { theme } = useTheme()
  const [open, setOpen] = useState(false)

  const userLinks = [
    { label: "Dashboard", icon: Home, href: "/user" },
    { label: "My Bookings", icon: Calendar, href: "/user/bookings" },
    { label: "My Visitors", icon: Users, href: "/user/visitors" },
    { label: "Maintenance", icon: FileText, href: "/user/maintenance" },
    { label: "Events", icon: Calendar, href: "/user/events" },
    { label: "Meeting", icon: Settings, href: "/user/meetings" },
    { label: "Analysis", icon: LineChart, href: "/user/analysis" },
  ]

  const securityLinks = [
    { label: "Dashboard", icon: Home, href: "/security" },
    { label: "Visitors", icon: Users, href: "/security/visitors" },
  ]

  let links = userLinks
  if (userType === "security") links = securityLinks

  const renderLinks = () =>
    links.map((link) => (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => setOpen(false)} // close on mobile click
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
          pathname === link.href
            ? "bg-zinc-200 text-black dark:bg-zinc-700 dark:text-white font-medium"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
      >
        {link.icon && <link.icon className="w-5 h-5" />}
        {link.label}
      </Link>
    ))

    const logoutLink = (
      <Link
        href="/login"
        className="flex items-center gap-2 px-4 py-2 rounded-md text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 mt-4"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </Link>
    )

  return (
    <>
      {/* Mobile Trigger */}
      <div className="md:hidden p-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4">
            <SheetTitle className="mb-4 capitalize text-lg font-bold">
              {userType} Dashboard
            </SheetTitle>
            <h2 className="text-lg font-bold mb-4 capitalize">{userType} Dashboard</h2>
            <nav className="space-y-2">
              {renderLinks()}
              {logoutLink}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen border-r bg-white text-black dark:bg-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700">
        <div className="p-4">
          <h2 className="text-lg font-bold mb-4 capitalize">{userType} Dashboard</h2>
          <nav className="space-y-2">
            {renderLinks()}
            {logoutLink}
          </nav>
        </div>
      </aside>
    </>
  )
}
