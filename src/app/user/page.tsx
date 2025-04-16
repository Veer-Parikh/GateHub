"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface Room {
  room: string
  block: string
  Maintenance: Maintenance[]
}

interface Maintenance {
  maintenanceId: string
  amount: number
  paid: boolean
  month: string
  year: string
}

interface Visitor {
  visitorId: string
  name: string
  age: number
  address: string
  purpose: string
  number: number
  photo?: string
  status: boolean
}

interface UserData {
  userId: string
  email: string
  number: string
  profileUrl: string | null
  name: string
  room: Room
  Visitor: Visitor[]
}

export default function UserDashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) throw new Error("Token not found")

        const res = await fetch("http://localhost:5000/api/user/my", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!res.ok) throw new Error("Failed to fetch user")

        const data = await res.json()
        setUserData(data)
      } catch (err) {
        console.error("Error fetching user:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const unpaidMaintenance = userData?.room?.Maintenance?.filter(m => !m.paid) || []
  const activeVisitors = userData?.Visitor || []

  return (
    <div className="flex h-screen">
      <Sidebar userType="user" />

      <main className="flex-1 p-6 overflow-y-auto bg-background text-foreground">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        ) : userData ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">My Profile</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="flex flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={userData.profileUrl || ""} />
                    <AvatarFallback>
                      {userData.name
                        .split(" ")
                        .map((n) => n[0].toUpperCase())
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-medium">{userData.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Phone Number</Label>
                    <p className="font-medium">{userData.number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{userData.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Room Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Room Information</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Block</Label>
                    <p className="font-medium text-lg">{userData.room.block}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Room No.</Label>
                    <p className="font-medium text-lg">{userData.room.room}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unpaid Maintenance Card */}
            <Card className={cn("border", unpaidMaintenance.length ? "border-red-500" : "")}>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-red-600">Unpaid Maintenance</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-6 space-y-2 text-sm">
                {unpaidMaintenance.length > 0 ? (
                  unpaidMaintenance.map((m) => (
                    <div key={m.maintenanceId} className="flex justify-between">
                      <p className="font-medium">{m.month} {m.year}</p>
                      <p className="font-semibold text-red-600">₹{m.amount}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-green-600 font-medium">No unpaid maintenance</p>
                )}
              </CardContent>
            </Card>

            {/* Current Visitors Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Current Visitors Inside</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-6 space-y-4 text-sm">
                {activeVisitors.length > 0 ? (
                  activeVisitors.map((v) => (
                    <div key={v.visitorId} className="border p-3 rounded-xl space-y-1">
                      <p className="font-semibold text-base">{v.name}</p>
                      <p>Purpose: {v.purpose}</p>
                      <p>Phone: {v.number}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No visitors currently inside.</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-red-500">Failed to load user data.</p>
        )}
      </main>
    </div>
  )
}
