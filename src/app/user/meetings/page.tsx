"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Sidebar } from "@/components/sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, MapPin, Video, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Meeting {
  id: string
  title: string
  agenda?: string
  timing: string
  location: string
  completed: boolean
  jitsiLink?: string
  jitsiId?: string
}

interface UserData {
  id: string
  name: string
  email: string
  isAdmin: boolean
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    agenda: "",
    timing: "",
    location: ""
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) throw new Error("Token not found")

        const [userRes, meetingsRes] = await Promise.all([
          fetch("http://localhost:5000/api/user/my", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/meeting/all", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ])

        if (!userRes.ok || !meetingsRes.ok) throw new Error("Failed to fetch data")

        const [userData, meetingsData] = await Promise.all([
          userRes.json(),
          meetingsRes.json()
        ])

        setUserData(userData)
        setMeetings(meetingsData)
      } catch (err) {
        console.error("Error fetching data:", err)
        toast({
          title: "Error",
          description: "Failed to load meetings data",
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
    setNewMeeting(prev => ({ ...prev, [name]: value }))
  }

  const generateJitsiLink = (title: string) => {
    // Simple Jitsi link generation without API
    const roomName = title.toLowerCase().replace(/\s+/g, '-') + '-' + 
      Math.random().toString(36).substring(2, 7)
    return `https://meet.jit.si/${roomName}`
  }

  const createMeeting = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token not found")
  
      // Check if location is "online" (case-insensitive)
      const isOnlineMeeting = newMeeting.location.toLowerCase() === "online"
      let jitsiLink;
      let jitsiId;
  
      if (isOnlineMeeting) {
        jitsiLink = generateJitsiLink(newMeeting.title)
        jitsiId = jitsiLink.split('/').pop()
      }
  
      const response = await fetch("http://localhost:5000/api/meeting/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newMeeting,
          jitsiLink: isOnlineMeeting ? jitsiLink : undefined,
          jitsiId: isOnlineMeeting ? jitsiId : undefined
        })
      })
  
      if (!response.ok) throw new Error("Failed to create meeting")
  
      const createdMeeting = await response.json()
      setMeetings(prev => [createdMeeting, ...prev])
      setIsDialogOpen(false)
      setNewMeeting({
        title: "",
        agenda: "",
        timing: "",
        location: ""
      })
  
      toast({
        title: "Success",
        description: "Meeting created successfully",
      })
    } catch (error) {
      console.error("Error creating meeting:", error)
      toast({
        title: "Error",
        description: "Failed to create meeting",
        variant: "destructive",
      })
    }
  }

  const filteredMeetings = meetings.filter((meeting) => {
    const now = new Date()
    const meetingDate = new Date(meeting.timing)
    
    if (filter === "upcoming") return meetingDate >= now && !meeting.completed
    if (filter === "past") return meetingDate < now || meeting.completed
    return true
  })

  const sortedMeetings = [...filteredMeetings].sort((a, b) => 
    new Date(a.timing).getTime() - new Date(b.timing).getTime()
  )

  // Skeletons for loading state
  const loadingSkeletons = [
    { id: "skeleton-1" },
    { id: "skeleton-2" },
    { id: "skeleton-3" }
  ]

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar userType="user" />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingSkeletons.map(skeleton => (
              <Skeleton key={skeleton.id} className="h-60 rounded-xl" />
            ))}
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold">Society Meetings</h1>
            <div className="flex gap-2 mr-12">
              <Select 
                value={filter} 
                onValueChange={(value: "all" | "upcoming" | "past") => setFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter meetings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                  <SelectItem value="all">All Meetings</SelectItem>
                </SelectContent>
              </Select>

              {userData?.isAdmin && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Schedule Meeting
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule New Meeting</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                          Title
                        </Label>
                        <Input
                          id="title"
                          name="title"
                          value={newMeeting.title}
                          onChange={handleInputChange}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="agenda" className="text-right">
                          Agenda
                        </Label>
                        <Textarea
                          id="agenda"
                          name="agenda"
                          value={newMeeting.agenda}
                          onChange={handleInputChange}
                          className="col-span-3"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="timing" className="text-right">
                          Date & Time
                        </Label>
                        <Input
                          id="timing"
                          name="timing"
                          type="datetime-local"
                          value={newMeeting.timing}
                          onChange={handleInputChange}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right">
                          Location
                        </Label>
                        <Input
                          id="location"
                          name="location"
                          value={newMeeting.location}
                          onChange={handleInputChange}
                          className="col-span-3"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createMeeting}>
                        Schedule Meeting
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {sortedMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No meetings found</h3>
              <p className="text-muted-foreground text-center">
                {filter === "upcoming"
                  ? "No upcoming meetings scheduled."
                  : filter === "past"
                  ? "No past meetings found."
                  : "No meetings have been created yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedMeetings.map((meeting) => {
                const meetingDate = new Date(meeting.timing)
                const isPast = meetingDate < new Date() || meeting.completed
                
                // Ensure each meeting has a valid ID
                const meetingKey = meeting.id || `meeting-${Math.random().toString(36).substring(2, 9)}`
                
                return (
                  <Card key={meetingKey} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{meeting.title}</CardTitle>
                          {meeting.agenda && (
                            <CardDescription className="mt-1 line-clamp-2">
                              {meeting.agenda}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant={isPast ? "secondary" : "default"}>
                          {isPast ? "Completed" : "Upcoming"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(meetingDate, "PPP")} at {format(meetingDate, "p")}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm capitalize">{meeting.location}</span>
                      </div>

                      {meeting.jitsiLink && meeting.location.toLowerCase() === "online" && (
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Jitsi Meeting Available</span>
                        </div>
                      )}
                    </CardContent>
                    <CardContent className="pt-0">
                      {meeting.jitsiLink && meeting.location.toLowerCase() === "online" && !isPast && (
                        <Button 
                          className="w-full mt-2 gap-2"
                          asChild
                        >
                          <a href={meeting.jitsiLink} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4" />
                            Join Jitsi Meeting
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
// "use client"

// import { useEffect, useState } from "react"
// import { format } from "date-fns"
// import { Sidebar } from "@/components/sidebar"
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Separator } from "@/components/ui/separator"
// import { Skeleton } from "@/components/ui/skeleton"
// import { Input } from "@/components/ui/input"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import { Calendar, MapPin, Video, Plus } from "lucide-react"
// import { Badge } from "@/components/ui/badge"
// import { toast } from "@/hooks/use-toast"
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"
// import { Textarea } from "@/components/ui/textarea"
// import { Label } from "@/components/ui/label"

// interface Meeting {
//   id: string
//   title: string
//   agenda?: string
//   timing: string
//   location: string
//   completed: boolean
//   jitsiLink?: string
//   jitsiId?: string
// }

// interface UserData {
//   id: string
//   name: string
//   email: string
//   isAdmin: boolean
// }

// export default function MeetingsPage() {
//   const [meetings, setMeetings] = useState<Meeting[]>([])
//   const [loading, setLoading] = useState(true)
//   const [userData, setUserData] = useState<UserData | null>(null)
//   const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming")
//   const [isDialogOpen, setIsDialogOpen] = useState(false)
//   const [newMeeting, setNewMeeting] = useState({
//     title: "",
//     agenda: "",
//     timing: "",
//     location: ""
//   })

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const token = localStorage.getItem("token")
//         if (!token) throw new Error("Token not found")

//         const [userRes, meetingsRes] = await Promise.all([
//           fetch("http://localhost:5000/api/user/my", {
//             headers: { Authorization: `Bearer ${token}` },
//           }),
//           fetch("http://localhost:5000/api/meeting/all", {
//             headers: { Authorization: `Bearer ${token}` },
//           })
//         ])

//         if (!userRes.ok || !meetingsRes.ok) throw new Error("Failed to fetch data")

//         const [userData, meetingsData] = await Promise.all([
//           userRes.json(),
//           meetingsRes.json()
//         ])

//         setUserData(userData)
//         setMeetings(meetingsData)
//       } catch (err) {
//         console.error("Error fetching data:", err)
//         toast({
//           title: "Error",
//           description: "Failed to load meetings data",
//           variant: "destructive",
//         })
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchData()
//   }, [])

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target
//     setNewMeeting(prev => ({ ...prev, [name]: value }))
//   }

//   const generateJitsiLink = (title: string) => {
//     // Simple Jitsi link generation without API
//     const roomName = title.toLowerCase().replace(/\s+/g, '-') + '-' + 
//       Math.random().toString(36).substring(2, 7)
//     return `https://meet.jit.si/${roomName}`
//   }

// //   const createMeeting = async () => {
// //     try {
// //       const token = localStorage.getItem("token")
// //       if (!token) throw new Error("Token not found")

// //       const jitsiLink = generateJitsiLink(newMeeting.title)
// //       const jitsiId = jitsiLink.split('/').pop()

// //       const response = await fetch("http://localhost:5000/api/meeting/create", {
// //         method: "POST",
// //         headers: {
// //           "Content-Type": "application/json",
// //           Authorization: `Bearer ${token}`,
// //         },
// //         body: JSON.stringify({
// //           ...newMeeting,
// //           jitsiLink,
// //           jitsiId
// //         })
// //       })

// //       if (!response.ok) throw new Error("Failed to create meeting")

// //       const createdMeeting = await response.json()
// //       setMeetings(prev => [createdMeeting, ...prev])
// //       setIsDialogOpen(false)
// //       setNewMeeting({
// //         title: "",
// //         agenda: "",
// //         timing: "",
// //         location: ""
// //       })

// //       toast({
// //         title: "Success",
// //         description: "Meeting created successfully",
// //       })
// //     } catch (error) {
// //       console.error("Error creating meeting:", error)
// //       toast({
// //         title: "Error",
// //         description: "Failed to create meeting",
// //         variant: "destructive",
// //       })
// //     }
// //   }
//     const createMeeting = async () => {
//     try {
//       const token = localStorage.getItem("token")
//       if (!token) throw new Error("Token not found")
  
//       // Check if location is "online" (case-insensitive)
//       const isOnlineMeeting = newMeeting.location.toLowerCase() === "online"
//       let jitsiLink;
//       let jitsiId;
  
//       if (isOnlineMeeting) {
//         jitsiLink = generateJitsiLink(newMeeting.title)
//         jitsiId = jitsiLink.split('/').pop()
//       }
  
//       const response = await fetch("http://localhost:5000/api/meeting/create", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           ...newMeeting,
//           jitsiLink: isOnlineMeeting ? jitsiLink : undefined,
//           jitsiId: isOnlineMeeting ? jitsiId : undefined
//         })
//       })
  
//       if (!response.ok) throw new Error("Failed to create meeting")
  
//       const createdMeeting = await response.json()
//       setMeetings(prev => [createdMeeting, ...prev])
//       setIsDialogOpen(false)
//       setNewMeeting({
//         title: "",
//         agenda: "",
//         timing: "",
//         location: ""
//       })
  
//       toast({
//         title: "Success",
//         description: "Meeting created successfully",
//       })
//     } catch (error) {
//       console.error("Error creating meeting:", error)
//       toast({
//         title: "Error",
//         description: "Failed to create meeting",
//         variant: "destructive",
//       })
//     }
//   }

//   const filteredMeetings = meetings.filter((meeting) => {
//     const now = new Date()
//     const meetingDate = new Date(meeting.timing)
    
//     if (filter === "upcoming") return meetingDate >= now && !meeting.completed
//     if (filter === "past") return meetingDate < now || meeting.completed
//     return true
//   })

//   const sortedMeetings = [...filteredMeetings].sort((a, b) => 
//     new Date(a.timing).getTime() - new Date(b.timing).getTime()
//   )

//   if (loading) {
//     return (
//       <div className="flex h-screen">
//         <Sidebar userType="user" />
//         <div className="container mx-auto px-4 py-8">
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//             <Skeleton className="h-10 w-64" />
//             <Skeleton className="h-10 w-32" />
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {[...Array(3)].map((_, i) => (
//               <Skeleton key={i} className="h-60 rounded-xl" />
//             ))}
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="flex h-screen">
//       <Sidebar userType="user" />
      
//       <div className="flex-1 overflow-y-auto">
//         <div className="container mx-auto px-4 py-8">
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//             <h1 className="text-3xl font-bold">Society Meetings</h1>
//             <div className="flex gap-2 mr-12">
//               <Select 
//                 value={filter} 
//                 onValueChange={(value: "all" | "upcoming" | "past") => setFilter(value)}
//               >
//                 <SelectTrigger className="w-[180px]">
//                   <SelectValue placeholder="Filter meetings" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="upcoming">Upcoming</SelectItem>
//                   <SelectItem value="past">Past</SelectItem>
//                   <SelectItem value="all">All Meetings</SelectItem>
//                 </SelectContent>
//               </Select>

//               {userData?.isAdmin && (
//                 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//                   <DialogTrigger asChild>
//                     <Button className="gap-2">
//                       <Plus className="h-4 w-4" />
//                       Schedule Meeting
//                     </Button>
//                   </DialogTrigger>
//                   <DialogContent>
//                     <DialogHeader>
//                       <DialogTitle>Schedule New Meeting</DialogTitle>
//                     </DialogHeader>
//                     <div className="grid gap-4 py-4">
//                       <div className="grid grid-cols-4 items-center gap-4">
//                         <Label htmlFor="title" className="text-right">
//                           Title
//                         </Label>
//                         <Input
//                           id="title"
//                           name="title"
//                           value={newMeeting.title}
//                           onChange={handleInputChange}
//                           className="col-span-3"
//                           required
//                         />
//                       </div>
//                       <div className="grid grid-cols-4 items-center gap-4">
//                         <Label htmlFor="agenda" className="text-right">
//                           Agenda
//                         </Label>
//                         <Textarea
//                           id="agenda"
//                           name="agenda"
//                           value={newMeeting.agenda}
//                           onChange={handleInputChange}
//                           className="col-span-3"
//                           rows={3}
//                         />
//                       </div>
//                       <div className="grid grid-cols-4 items-center gap-4">
//                         <Label htmlFor="timing" className="text-right">
//                           Date & Time
//                         </Label>
//                         <Input
//                           id="timing"
//                           name="timing"
//                           type="datetime-local"
//                           value={newMeeting.timing}
//                           onChange={handleInputChange}
//                           className="col-span-3"
//                           required
//                         />
//                       </div>
//                       <div className="grid grid-cols-4 items-center gap-4">
//                         <Label htmlFor="location" className="text-right">
//                           Location
//                         </Label>
//                         <Input
//                           id="location"
//                           name="location"
//                           value={newMeeting.location}
//                           onChange={handleInputChange}
//                           className="col-span-3"
//                           required
//                         />
//                       </div>
//                     </div>
//                     <div className="flex justify-end gap-2">
//                       <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
//                         Cancel
//                       </Button>
//                       <Button onClick={createMeeting}>
//                         Schedule Meeting
//                       </Button>
//                     </div>
//                   </DialogContent>
//                 </Dialog>
//               )}
//             </div>
//           </div>

//           {sortedMeetings.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-12">
//               <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
//               <h3 className="text-xl font-medium mb-2">No meetings found</h3>
//               <p className="text-muted-foreground text-center">
//                 {filter === "upcoming"
//                   ? "No upcoming meetings scheduled."
//                   : filter === "past"
//                   ? "No past meetings found."
//                   : "No meetings have been created yet."}
//               </p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {sortedMeetings.map((meeting) => {
//                 const meetingDate = new Date(meeting.timing)
//                 const isPast = meetingDate < new Date() || meeting.completed
                
//                 return (
//                   <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
//                     <CardHeader>
//                       <div className="flex justify-between items-start">
//                         <div>
//                           <CardTitle className="text-xl">{meeting.title}</CardTitle>
//                           {meeting.agenda && (
//                             <CardDescription className="mt-1 line-clamp-2">
//                               {meeting.agenda}
//                             </CardDescription>
//                           )}
//                         </div>
//                         <Badge variant={isPast ? "secondary" : "default"}>
//                           {isPast ? "Completed" : "Upcoming"}
//                         </Badge>
//                       </div>
//                     </CardHeader>
//                     <Separator />
//                     <CardContent className="pt-4 space-y-3">
//                       <div className="flex items-center gap-2">
//                         <Calendar className="h-4 w-4 text-muted-foreground" />
//                         <span className="text-sm">
//                           {format(meetingDate, "PPP")} at {format(meetingDate, "p")}
//                         </span>
//                       </div>
                      
//                       <div className="flex items-center gap-2">
//                         <MapPin className="h-4 w-4 text-muted-foreground" />
//                         <span className="text-sm capitalize">{meeting.location}</span>
//                       </div>

//                       {meeting.jitsiLink && meeting.location.toLowerCase() === "online" && (
//                         <div className="flex items-center gap-2">
//                             <Video className="h-4 w-4 text-muted-foreground" />
//                             <span className="text-sm">Jitsi Meeting Available</span>
//                         </div>
//                         )}
//                     </CardContent>
//                     <CardContent className="pt-0">
//                     {meeting.jitsiLink && meeting.location.toLowerCase() === "online" && !isPast && (
//                         <Button 
//                             className="w-full mt-2 gap-2"
//                             asChild
//                         >
//                             <a href={meeting.jitsiLink} target="_blank" rel="noopener noreferrer">
//                             <Video className="h-4 w-4" />
//                             Join Jitsi Meeting
//                             </a>
//                         </Button>
//                         )}
//                     </CardContent>
//                   </Card>
//                 )
//               })}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }