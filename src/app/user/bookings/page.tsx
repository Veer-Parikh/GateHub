"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Calendar, Clock } from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface ServiceProvider {
  plumberId?: string
  laundryId?: string
  name: string
  generalCost: number
  serviceHours: string
  number: string
}

interface Booking {
  bookingId: string
  date: string
  description: string
  createdAt: string
  updatedAt: string
  plumberId: string | null
  laundryId: string | null
  plumber: ServiceProvider | null
  laundry: ServiceProvider | null
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<"plumber" | "laundry">("plumber")
  const [plumbers, setPlumbers] = useState<ServiceProvider[]>([])
  const [laundries, setLaundries] = useState<ServiceProvider[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentService, setCurrentService] = useState<{id: string, type: "plumber" | "laundry"}>()
  const [newBooking, setNewBooking] = useState({
    date: "",
    description: ""
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) throw new Error("Token not found")

        const [plumbersRes, laundriesRes, bookingsRes] = await Promise.all([
          fetch("http://localhost:5000/api/plumber/get", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/laundry/get", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/booking/getUser", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ])

        if (!plumbersRes.ok || !laundriesRes.ok || !bookingsRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const [plumbersData, laundriesData, bookingsData] = await Promise.all([
          plumbersRes.json(),
          laundriesRes.json(),
          bookingsRes.json()
        ])

        setPlumbers(plumbersData)
        setLaundries(laundriesData)
        setBookings(bookingsData)
      } catch (err) {
        console.error("Error fetching data:", err)
        toast({
          title: "Error",
          description: "Failed to load booking data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewBooking(prev => ({ ...prev, [name]: value }))
  }

  const createBooking = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No authentication token found")
      if (!currentService) throw new Error("No service selected")

      // Validate inputs
      if (!newBooking.date) throw new Error("Please select a date and time")
      if (!newBooking.description) throw new Error("Please enter a description")

      // Format the payload
      const payload = {
        date: new Date(newBooking.date).toISOString(),
        description: newBooking.description,
        [currentService.type + "Id"]: currentService.id
      }

      console.log("Creating booking with payload:", payload)

      const response = await fetch("http://localhost:5000/api/booking/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      })

      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(responseData.message || "Failed to create booking")
      }

      setBookings(prev => [responseData.booking, ...prev])
      setIsDialogOpen(false)
      setNewBooking({
        date: "",
        description: ""
      })

      toast({
        title: "Success",
        description: "Booking created successfully",
      })
    } catch (error) {
      console.error("Booking error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create booking",
        variant: "destructive",
      })
    }
  }

  const filteredBookings = bookings.filter(booking => 
    activeTab === "plumber" ? booking.plumberId : booking.laundryId
  )

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar userType="user" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={`service-skeleton-${i}`} className="h-60 rounded-xl" />
            ))}
          </div>
          <div className="mt-8">
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={`booking-skeleton-${i}`} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar userType="user" />
      
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="plumber" onValueChange={(value) => setActiveTab(value as "plumber" | "laundry")}>
            <div className="flex justify-between items-center mb-8">
              <TabsList>
                <TabsTrigger value="plumber">Plumber</TabsTrigger>
                <TabsTrigger value="laundry">Laundry</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="plumber">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plumbers.map((plumber) => (
                  <Card key={`plumber-${plumber.plumberId}`}>
                    <CardHeader>
                      <CardTitle>{plumber.name}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">₹{plumber.generalCost}</span>
                          <span>per service</span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium">Hours:</span> {plumber.serviceHours}</p>
                        <p className="text-sm"><span className="font-medium">Contact:</span> {plumber.number}</p>
                      </div>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full mt-4"
                            onClick={() => {
                              console.log("Setting current service:", plumber.plumberId)
                              setCurrentService({
                                id: plumber.plumberId!,
                                type: "plumber"
                              })
                            }}
                          >
                            Book Now
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Book Plumber Service</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="date" className="text-right">
                                Date & Time *
                              </Label>
                              <Input
                                id="date"
                                name="date"
                                type="datetime-local"
                                value={newBooking.date}
                                onChange={handleInputChange}
                                className="col-span-3"
                                min={new Date().toISOString().slice(0, 16)}
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="description" className="text-right">
                                Description *
                              </Label>
                              <Textarea
                                id="description"
                                name="description"
                                value={newBooking.description}
                                onChange={handleInputChange}
                                className="col-span-3"
                                rows={3}
                                required
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={createBooking}
                              disabled={!newBooking.date || !newBooking.description}
                            >
                              Confirm Booking
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-12">
                <h2 className="text-xl font-bold mb-4">Previous Bookings</h2>
                <div className="space-y-4">
                  {filteredBookings
                    .filter(booking => booking.plumberId)
                    .map((booking) => (
                      <Card key={`plumber-booking-${booking.bookingId}`} className="w-full p-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          <div className="md:col-span-5">
                            <div className="text-lg font-semibold">{booking.plumber?.name}</div>
                            <div className="text-sm text-muted-foreground">{booking.description}</div>
                          </div>
                          <div className="md:col-span-4 flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{format(new Date(booking.date), "PPP")}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(booking.date), "p")}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="md:col-span-3">
                            <Badge 
                              variant={new Date(booking.date) > new Date() ? "default" : "secondary"}
                              className="text-sm"
                            >
                              {new Date(booking.date) > new Date() ? "Upcoming" : "Completed"}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="laundry">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {laundries.map((laundry) => (
                  <Card key={`laundry-${laundry.laundryId}`}>
                    <CardHeader>
                      <CardTitle>{laundry.name}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">₹{laundry.generalCost}</span>
                          <span>per service</span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium">Hours:</span> {laundry.serviceHours}</p>
                        <p className="text-sm"><span className="font-medium">Contact:</span> {laundry.number}</p>
                      </div>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full mt-4"
                            onClick={() => {
                              console.log("Setting current service:", laundry.laundryId)
                              setCurrentService({
                                id: laundry.laundryId!,
                                type: "laundry"
                              })
                            }}
                          >
                            Book Now
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Book Laundry Service</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="date" className="text-right">
                                Date & Time *
                              </Label>
                              <Input
                                id="date"
                                name="date"
                                type="datetime-local"
                                value={newBooking.date}
                                onChange={handleInputChange}
                                className="col-span-3"
                                min={new Date().toISOString().slice(0, 16)}
                                required
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="description" className="text-right">
                                Description *
                              </Label>
                              <Textarea
                                id="description"
                                name="description"
                                value={newBooking.description}
                                onChange={handleInputChange}
                                className="col-span-3"
                                rows={3}
                                required
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={createBooking}
                              disabled={!newBooking.date || !newBooking.description}
                            >
                              Confirm Booking
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-12">
                <h2 className="text-xl font-bold mb-4">Previous Bookings</h2>
                <div className="space-y-4">
                  {filteredBookings
                    .filter(booking => booking.laundryId)
                    .map((booking) => (
                      <Card key={`laundry-booking-${booking.bookingId}`} className="w-full p-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          <div className="md:col-span-5">
                            <div className="text-lg font-semibold">{booking.laundry?.name}</div>
                            <div className="text-sm text-muted-foreground">{booking.description}</div>
                          </div>
                          <div className="md:col-span-4 flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{format(new Date(booking.date), "PPP")}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(booking.date), "p")}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="md:col-span-3">
                            <Badge 
                              variant={new Date(booking.date) > new Date() ? "default" : "secondary"}
                              className="text-sm"
                            >
                              {new Date(booking.date) > new Date() ? "Upcoming" : "Completed"}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}