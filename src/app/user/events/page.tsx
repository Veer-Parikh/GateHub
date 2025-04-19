"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarDays, MapPin, User, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/sidebar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "@/hooks/use-toast"

interface Event {
  eventId: string
  title: string
  details: string
  date: string
  venue: string
  admin: {
    name: string
    profileUrl: string | null
  }
}

interface UserData {
  userId: string
  isAdmin: boolean
  // other user fields...
}

const eventFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  details: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  venue: z.string().min(2, {
    message: "Venue must be at least 2 characters.",
  }),
})

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all")
  const [isFormOpen, setIsFormOpen] = useState(false)

  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      details: "",
      date: "",
      venue: "",
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) throw new Error("Token not found")

        // Fetch user data first to check if admin
        const userRes = await fetch("http://localhost:5000/api/user/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!userRes.ok) throw new Error("Failed to fetch user data")
        const userData = await userRes.json()
        setUserData(userData)

        // Then fetch events
        const eventsRes = await fetch("http://localhost:5000/api/event/all", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!eventsRes.ok) throw new Error("Failed to fetch events")
        const eventsData = await eventsRes.json()
        setEvents(eventsData)
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const onSubmit = async (values: z.infer<typeof eventFormSchema>) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token not found")

      const res = await fetch("http://localhost:5000/api/event/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      })

      if (!res.ok) throw new Error("Failed to create event")

      const newEvent = await res.json()
      setEvents([newEvent, ...events])
      setIsFormOpen(false)
      form.reset()

      toast({
        title: "Event created successfully",
        description: "Your event has been added to the calendar.",
      })
    } catch (err) {
      console.error("Error creating event:", err)
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      })
    }
  }

  // const filteredEvents = events.filter((event) => {
  //   // Filter by search term
  //   const matchesSearch =
  //     event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     event.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     event.venue.toLowerCase().includes(searchTerm.toLowerCase())

  //   // Filter by time
  //   const now = new Date()
  //   const eventDate = new Date(event.date)
  //   let matchesTime = true

  //   if (filter === "upcoming") {
  //     matchesTime = eventDate >= now
  //   } else if (filter === "past") {
  //     matchesTime = eventDate < now
  //   }

  //   return matchesSearch && matchesTime
  // })

  const filteredEvents = events.filter((event) => {
    // Safely handle potentially undefined values
    const eventTitle = event.title || ""
    const eventDetails = event.details || ""
    const eventVenue = event.venue || ""

    // Filter by search term
    const matchesSearch =
      eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eventDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eventVenue.toLowerCase().includes(searchTerm.toLowerCase())

    // Filter by time
    const now = new Date()
    const eventDate = new Date(event.date)
    let matchesTime = true

    if (filter === "upcoming") {
      matchesTime = eventDate >= now
    } else if (filter === "past") {
      matchesTime = eventDate < now
    }

    return matchesSearch && matchesTime
  })
  
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar userType="user" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <Skeleton className="h-10 w-64" />
            <div className="flex gap-2 w-full md:w-auto">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <Sidebar userType="user" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Society Events</h1>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto mr-10">
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64"
            />
            <Select value={filter} onValueChange={(value: "all" | "upcoming" | "past") => setFilter(value)}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
            {userData?.isAdmin && (
              <Button onClick={() => setIsFormOpen(!isFormOpen)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            )}
          </div>
        </div>

        {/* Add Event Form */}
        {userData?.isAdmin && (
          <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
            <CollapsibleContent className="CollapsibleContent mb-6">
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle>Create New Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter event title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="details"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Details (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter event details"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date and Time</FormLabel>
                              <FormControl>
                                <Input
                                  type="datetime-local"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="venue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Venue</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter venue" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsFormOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Create Event</Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}

        {sortedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No events found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm
                ? "No events match your search criteria."
                : filter === "upcoming"
                ? "No upcoming events scheduled."
                : filter === "past"
                ? "No past events found."
                : "No events have been created yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedEvents.map((event) => {
              const eventDate = new Date(event.date)
              const isPast = eventDate < new Date()
              
              return (
                <Card key={event.eventId} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Organized by {event.admin.name}
                        </CardDescription>
                      </div>
                      <Badge variant={isPast ? "secondary" : "default"}>
                        {isPast ? "Past Event" : "Upcoming"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground mb-4">{event.details}</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(eventDate, "PPP")} at {format(eventDate, "p")}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{event.venue}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Organized by {event.admin.name}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// "use client"

// import { useEffect, useState } from "react"
// import Link from "next/link"
// import { format } from "date-fns"
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Separator } from "@/components/ui/separator"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Skeleton } from "@/components/ui/skeleton"
// import { Input } from "@/components/ui/input"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import { CalendarDays, MapPin, User } from "lucide-react"
// import { Badge } from "@/components/ui/badge"
// import { Sidebar } from "@/components/sidebar"

// interface Event {
//   eventId: string
//   title: string
//   details: string
//   date: string
//   venue: string
//   admin: {
//     name: string
//     profileUrl: string | null
//   }
// }

// export default function EventsPage() {
//   const [events, setEvents] = useState<Event[]>([])
//   const [loading, setLoading] = useState(true)
//   const [searchTerm, setSearchTerm] = useState("")
//   const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all")

//   useEffect(() => {
//     const fetchEvents = async () => {
//       try {
//         const token = localStorage.getItem("token")
//         if (!token) throw new Error("Token not found")

//         const res = await fetch("http://localhost:5000/api/event/all", {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         })

//         if (!res.ok) throw new Error("Failed to fetch events")

//         const data = await res.json()
//         setEvents(data)
//       } catch (err) {
//         console.error("Error fetching events:", err)
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchEvents()
//   }, [])

//   const filteredEvents = events.filter((event) => {
//     // Filter by search term
//     const matchesSearch =
//       event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       event.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       event.venue.toLowerCase().includes(searchTerm.toLowerCase())

//     // Filter by time
//     const now = new Date()
//     const eventDate = new Date(event.date)
//     let matchesTime = true

//     if (filter === "upcoming") {
//       matchesTime = eventDate >= now
//     } else if (filter === "past") {
//       matchesTime = eventDate < now
//     }

//     return matchesSearch && matchesTime
//   })

//   const sortedEvents = [...filteredEvents].sort((a, b) => {
//     return new Date(a.date).getTime() - new Date(b.date).getTime()
//   })

//   if (loading) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//           <Skeleton className="h-10 w-64" />
//           <div className="flex gap-2 w-full md:w-auto">
//             <Skeleton className="h-10 w-32" />
//             <Skeleton className="h-10 w-24" />
//           </div>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {[...Array(6)].map((_, i) => (
//             <Skeleton key={i} className="h-80 rounded-xl" />
//           ))}
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="flex h-screen">
//           <Sidebar userType="user" />
//     <div className="container mx-auto px-4 py-8">
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//         <h1 className="text-3xl font-bold">Society Events</h1>
//         <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto mr-10">
//           <Input
//             placeholder="Search events..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full md:w-64"
//           />
//           <Select value={filter} onValueChange={(value: "all" | "upcoming" | "past") => setFilter(value)}>
//             <SelectTrigger className="w-full md:w-32">
//               <SelectValue placeholder="Filter" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All</SelectItem>
//               <SelectItem value="upcoming">Upcoming</SelectItem>
//               <SelectItem value="past">Past</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       {sortedEvents.length === 0 ? (
//         <div className="flex flex-col items-center justify-center py-12">
//           <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
//           <h3 className="text-xl font-medium mb-2">No events found</h3>
//           <p className="text-muted-foreground text-center">
//             {searchTerm
//               ? "No events match your search criteria."
//               : filter === "upcoming"
//               ? "No upcoming events scheduled."
//               : filter === "past"
//               ? "No past events found."
//               : "No events have been created yet."}
//           </p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {sortedEvents.map((event) => {
//             const eventDate = new Date(event.date)
//             const isPast = eventDate < new Date()
            
//             return (
//               <Card key={event.eventId} className="hover:shadow-lg transition-shadow">
//                 <CardHeader>
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <CardTitle className="text-xl">{event.title}</CardTitle>
//                       <CardDescription className="mt-1">
//                         Organized by {event.admin.name}
//                       </CardDescription>
//                     </div>
//                     <Badge variant={isPast ? "secondary" : "default"}>
//                       {isPast ? "Past Event" : "Upcoming"}
//                     </Badge>
//                   </div>
//                 </CardHeader>
//                 <Separator />
//                 <CardContent className="pt-4">
//                   <p className="text-sm text-muted-foreground mb-4">{event.details}</p>
                  
//                   <div className="space-y-3">
//                     <div className="flex items-center gap-2">
//                       <CalendarDays className="h-4 w-4 text-muted-foreground" />
//                       <span className="text-sm">
//                         {format(eventDate, "PPP")} at {format(eventDate, "p")}
//                       </span>
//                     </div>
                    
//                     <div className="flex items-center gap-2">
//                       <MapPin className="h-4 w-4 text-muted-foreground" />
//                       <span className="text-sm capitalize">{event.venue}</span>
//                     </div>
                    
//                     <div className="flex items-center gap-2">
//                       <User className="h-4 w-4 text-muted-foreground" />
//                       <span className="text-sm">Organized by {event.admin.name}</span>
//                     </div>
//                   </div>
//                 </CardContent>
//                 {/* <CardFooter className="flex justify-between">
//                   <Button variant="outline" asChild>
//                     <Link href={`/user/events/${event.eventId}`}>View Details</Link>
//                   </Button>
//                   {!isPast && (
//                     <Button>Register</Button>
//                   )}
//                 </CardFooter> */}
//               </Card>
//             )
//           })}
//         </div>
//       )}
//     </div>
//     </div>
//   )
// }