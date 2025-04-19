"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

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

// Add this declare global for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function UserDashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  
  const handleApproveVisitor = async (visitorId: string) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("http://localhost:5000/api/visitor/inside", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ visitorId })
      })
      if (!res.ok) throw new Error("Failed to approve visitor")
      const updatedVisitor = await res.json()
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              Visitor: prev.Visitor.map((v) =>
                v.visitorId === visitorId ? { ...v, status: true } : v
              ),
            }
          : null
      )
    } catch (err) {
      console.error(err)
    }
  }

  // Updated handlePayMaintenance for Razorpay
  const handlePayMaintenance = async (maintenanceId: string, amount: number) => {
    try {
      if (!userData?.userId) {
        console.error("User ID not available");
        return;
      }
      
      // Create a Razorpay order
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maintenanceId,
          amount,
          userId: userData.userId,
        }),
      });
  
      const data = await res.json();
      
      if (!data.id) {
        throw new Error(data.error || "Failed to create payment");
      }
      
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      document.body.appendChild(script);
      
      script.onload = () => {
        const token = localStorage.getItem("token")
        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          name: "Society Maintenance",
          description: `Maintenance Payment for ${maintenanceId}`,
          order_id: data.id,
          handler: async (response: any) => {
            try {
              // Verify payment on your server
              const verifyResponse = await fetch('/api/payment', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              
              const verifyData = await verifyResponse.json();
              
              if (verifyData.success) {
                  await fetch("http://localhost:5000/api/maintenance/update", {
                  method: "PATCH",
                  headers: {"Content-Type": "application/json",Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ maintenanceId }),
                  });
              
                  // Step 3: Inform user and refresh
                  alert("Payment successful!");
                // Update local state to mark maintenance as paid
                setUserData((prev) => {
                  if (!prev) return null;
                  
                  return {
                    ...prev,
                    room: {
                      ...prev.room,
                      Maintenance: prev.room.Maintenance.map(m => 
                        m.maintenanceId === maintenanceId ? {...m, paid: true} : m
                      )
                    }
                  };
                });
                
                alert("Payment successful!");
              } else {
                alert("Payment verification failed. Please contact support.");
              }
            } catch (error) {
              console.error("Payment verification error:", error);
              alert("Error processing payment verification");
            }
          },
          prefill: {
            name: userData.name,
            email: userData.email,
            contact: userData.number,
          },
          theme: {
            color: "#3399cc",
          },
          modal: {
            ondismiss: function() {
              console.log("Payment cancelled");
            },
          },
        };
        
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      };
      
      script.onerror = () => {
        alert("Failed to load Razorpay. Please try again.");
        document.body.removeChild(script);
      };
      
    } catch (err) {
      console.error("Error initiating payment:", err);
      alert("Failed to initiate payment. Please try again later.");
    }
  };
  
  const handleRejectVisitor = async (visitorId: string) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("http://localhost:5000/api/visitor/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ visitorId })
      })
      if (!res.ok) throw new Error("Failed to reject visitor")
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              Visitor: prev.Visitor.filter((v) => v.visitorId !== visitorId),
            }
          : null
      )
    } catch (err) {
      console.error(err)
    }
  }

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
                    <div key={m.maintenanceId} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{m.month} {m.year}</p>
                        <p className="font-semibold text-red-600">₹{m.amount}</p>
                      </div>
                      <Button onClick={() => handlePayMaintenance(m.maintenanceId, m.amount)} size="sm">
                        Pay Now
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-green-600 font-medium">No unpaid maintenance</p>
                )}
              </CardContent>
            </Card>

            {/* Current Visitors Card */}
            <Link href="/user/visitors">
              <Card className="rounded-2xl shadow-md border border-border bg-background transition hover:shadow-lg cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold text-foreground">Visitors</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="px-4 py-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left text-muted-foreground">Name</TableHead>
                        <TableHead className="text-left text-muted-foreground">Purpose</TableHead>
                        <TableHead className="text-left text-muted-foreground">Phone Number</TableHead>
                        <TableHead className="text-left text-muted-foreground">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeVisitors.length > 0 ? (
                        activeVisitors.map((v) => (
                          <TableRow key={v.visitorId} className="transition rounded-lg">
                            <TableCell className="font-medium text-foreground">{v.name}</TableCell>
                            <TableCell className="text-muted-foreground">{v.purpose}</TableCell>
                            <TableCell className="text-foreground">{v.number}</TableCell>
                            <TableCell>
                              <span
                                className={`font-semibold ${v.status ? "text-green-500" : "text-yellow-500"}`}
                              >
                                {v.status ? "Inside" : "Pending"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-sm text-muted-foreground py-4"
                          >
                            No visitors currently inside.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Link>
          </div>
        ) : (
          <p className="text-red-500">Failed to load user data.</p>
        )}
      </main>
    </div>
  )
}
// "use client"

// import { useEffect, useState } from "react"
// import { Sidebar } from "@/components/sidebar"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Skeleton } from "@/components/ui/skeleton"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Separator } from "@/components/ui/separator"
// import { Label } from "@/components/ui/label"
// import { cn } from "@/lib/utils"
// import Link from "next/link"

// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table"
// import { Button } from "@/components/ui/button"
// import { Check, X } from "lucide-react"

// interface Room {
//   room: string
//   block: string
//   Maintenance: Maintenance[]
// }

// interface Maintenance {
//   maintenanceId: string
//   amount: number
//   paid: boolean
//   month: string
//   year: string
// }

// interface Visitor {
//   visitorId: string
//   name: string
//   age: number
//   address: string
//   purpose: string
//   number: number
//   photo?: string
//   status: boolean
// }

// interface UserData {
//   userId: string
//   email: string
//   number: string
//   profileUrl: string | null
//   name: string
//   room: Room
//   Visitor: Visitor[]
// }

// export default function UserDashboardPage() {
//   const [userData, setUserData] = useState<UserData | null>(null)
//   const [loading, setLoading] = useState(true)
//   const handleApproveVisitor = async (visitorId: string) => {
//     try {
//       const token = localStorage.getItem("token")
//       const res = await fetch("http://localhost:5000/api/visitor/inside", {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`
//         },
//         body: JSON.stringify({ visitorId })
//       })
//       if (!res.ok) throw new Error("Failed to approve visitor")
//       const updatedVisitor = await res.json()
//       setUserData((prev) =>
//         prev
//           ? {
//               ...prev,
//               Visitor: prev.Visitor.map((v) =>
//                 v.visitorId === visitorId ? { ...v, status: true } : v
//               ),
//             }
//           : null
//       )
//     } catch (err) {
//       console.error(err)
//     }
//   }

//   const handlePayMaintenance = async (maintenanceId: string, amount: number) => {
//     try {
//       const token = localStorage.getItem("token");
  
//       const res = await fetch("/api/payment", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           maintenanceId,
//           amount,
//           userId: userData?.userId,
//         }),
//       });
  
//       const data = await res.json();
  
//       if (data.id) {
//         window.location.href = `https://checkout.stripe.com/pay/${data.id}`;
//       } else {
//         console.error("Payment initiation failed");
//       }
//     } catch (err) {
//       console.error("Error:", err);
//     }
//   };
  
  
//   const handleRejectVisitor = async (visitorId: string) => {
//     try {
//       const token = localStorage.getItem("token")
//       const res = await fetch("http://localhost:5000/api/visitor/delete", {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`
//         },
//         body: JSON.stringify({ visitorId })
//       })
//       if (!res.ok) throw new Error("Failed to reject visitor")
//       setUserData((prev) =>
//         prev
//           ? {
//               ...prev,
//               Visitor: prev.Visitor.filter((v) => v.visitorId !== visitorId),
//             }
//           : null
//       )
//     } catch (err) {
//       console.error(err)
//     }
//   }

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const token = localStorage.getItem("token")
//         if (!token) throw new Error("Token not found")

//         const res = await fetch("http://localhost:5000/api/user/my", {
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         })

//         if (!res.ok) throw new Error("Failed to fetch user")

//         const data = await res.json()
//         setUserData(data)
//       } catch (err) {
//         console.error("Error fetching user:", err)
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchUser()
//   }, [])

//   const unpaidMaintenance = userData?.room?.Maintenance?.filter(m => !m.paid) || []
//   const activeVisitors = userData?.Visitor || []

//   return (
//     <div className="flex h-screen">
//       <Sidebar userType="user" />

//       <main className="flex-1 p-6 overflow-y-auto bg-background text-foreground">
//         <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

//         {loading ? (
//           <div className="grid gap-6 md:grid-cols-2">
//             <Skeleton className="h-40 rounded-xl" />
//             <Skeleton className="h-40 rounded-xl" />
//           </div>
//         ) : userData ? (
//           <div className="grid gap-6 md:grid-cols-2">
//             {/* Profile Card */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="text-xl font-semibold">My Profile</CardTitle>
//               </CardHeader>
//               <Separator />
//               <CardContent className="flex flex-col gap-6 p-6">
//                 <div className="flex items-center gap-4">
//                   <Avatar className="h-16 w-16">
//                     <AvatarImage src={userData.profileUrl || ""} />
//                     <AvatarFallback>
//                       {userData.name
//                         .split(" ")
//                         .map((n) => n[0].toUpperCase())
//                         .join("")}
//                     </AvatarFallback>
//                   </Avatar>
//                   <div>
//                     <p className="text-lg font-medium">{userData.name}</p>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 text-sm">
//                   <div>
//                     <Label className="text-muted-foreground">Phone Number</Label>
//                     <p className="font-medium">{userData.number}</p>
//                   </div>
//                   <div>
//                     <Label className="text-muted-foreground">Email</Label>
//                     <p className="font-medium">{userData.email}</p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Room Info Card */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="text-xl font-semibold">Room Information</CardTitle>
//               </CardHeader>
//               <Separator />
//               <CardContent className="p-6 space-y-4 text-sm">
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <Label className="text-muted-foreground">Block</Label>
//                     <p className="font-medium text-lg">{userData.room.block}</p>
//                   </div>
//                   <div>
//                     <Label className="text-muted-foreground">Room No.</Label>
//                     <p className="font-medium text-lg">{userData.room.room}</p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Unpaid Maintenance Card */}
//             <Card className={cn("border", unpaidMaintenance.length ? "border-red-500" : "")}>
//               <CardHeader>
//                 <CardTitle className="text-xl font-semibold text-red-600">Unpaid Maintenance</CardTitle>
//               </CardHeader>
//               <Separator />
//               <CardContent className="p-6 space-y-2 text-sm">
//                 {/* {unpaidMaintenance.length > 0 ? (
//                   unpaidMaintenance.map((m) => (
//                     <div key={m.maintenanceId} className="flex justify-between">
//                       <p className="font-medium">{m.month} {m.year}</p>
//                       <p className="font-semibold text-red-600">₹{m.amount}</p>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-green-600 font-medium">No unpaid maintenance</p>
//                 )} */}
//                 {unpaidMaintenance.length > 0 ? (
//                   unpaidMaintenance.map((m) => (
//                     <div key={m.maintenanceId} className="flex justify-between items-center">
//                       <div>
//                         <p className="font-medium">{m.month} {m.year}</p>
//                         <p className="font-semibold text-red-600">₹{m.amount}</p>
//                       </div>
//                       <Button onClick={() => handlePayMaintenance(m.maintenanceId, m.amount)} size="sm">
//                         Pay Now
//                       </Button>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-green-600 font-medium">No unpaid maintenance</p>
//                 )}
//               </CardContent>
//             </Card>

//             {/* Current Visitors Card */}
//             <Link href="/user/visitors">
//               <Card className="rounded-2xl shadow-md border border-border bg-background transition hover:shadow-lg cursor-pointer">
//                 <CardHeader className="pb-2">
//                   <CardTitle className="text-lg font-bold text-foreground">Visitors</CardTitle>
//                 </CardHeader>
//                 <Separator />
//                 <CardContent className="px-4 py-2">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead className="text-left text-muted-foreground">Name</TableHead>
//                         <TableHead className="text-left text-muted-foreground">Purpose</TableHead>
//                         <TableHead className="text-left text-muted-foreground">Phone Number</TableHead>
//                         <TableHead className="text-left text-muted-foreground">Status</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {activeVisitors.length > 0 ? (
//                         activeVisitors.map((v) => (
//                           <TableRow key={v.visitorId} className="transition rounded-lg">
//                             <TableCell className="font-medium text-foreground">{v.name}</TableCell>
//                             <TableCell className="text-muted-foreground">{v.purpose}</TableCell>
//                             <TableCell className="text-foreground">{v.number}</TableCell>
//                             <TableCell>
//                               <span
//                                 className={`font-semibold ${v.status ? "text-green-500" : "text-yellow-500"}`}
//                               >
//                                 {v.status ? "Inside" : "Pending"}
//                               </span>
//                             </TableCell>
//                           </TableRow>
//                         ))
//                       ) : (
//                         <TableRow>
//                           <TableCell
//                             colSpan={4}
//                             className="text-center text-sm text-muted-foreground py-4"
//                           >
//                             No visitors currently inside.
//                           </TableCell>
//                         </TableRow>
//                       )}
//                     </TableBody>
//                   </Table>
//                 </CardContent>
//               </Card>
//             </Link>
//             {/* <Card className="rounded-2xl shadow-md border border-border bg-background">
//               <CardHeader className="pb-2">
//                 <CardTitle className="text-lg font-bold text-foreground">Visitors</CardTitle>
//               </CardHeader>
//               <Separator />
//               <CardContent className="px-4 py-2">
//                 <Table>
//                   <TableHeader>
//                     <TableRow className="hover:bg-muted/50">
//                       <TableHead className="text-left text-muted-foreground">Name</TableHead>
//                       <TableHead className="text-left text-muted-foreground">Purpose</TableHead>
//                       <TableHead className="text-left text-muted-foreground">Phone Number</TableHead>
//                       <TableHead className="text-left text-muted-foreground">Status</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {activeVisitors.length > 0 ? (
//                       activeVisitors.map((v) => (
//                         <TableRow
//                           key={v.visitorId}
//                           className="transition hover:bg-muted/30 rounded-lg"
//                         >
//                           <TableCell className="font-medium text-foreground">
//                             {v.name}
//                           </TableCell>
//                           <TableCell className="text-muted-foreground">
//                             {v.purpose}
//                           </TableCell>
//                           <TableCell className="font-medium text-foreground">
//                             {v.number}
//                           </TableCell>
//                           <TableCell>
//                             {v.status ? (
//                               <span className="text-green-500 font-semibold">Inside</span>
//                             ) : (
//                               <div className="flex gap-2">
//                                 <Button
//                                   size="icon"
//                                   variant="outline"
//                                   className="h-8 w-8"
//                                   onClick={() => handleApproveVisitor(v.visitorId)}
//                                 >
//                                   <Check className="h-4 w-4" />
//                                 </Button>
//                                 <Button
//                                   size="icon"
//                                   variant="destructive"
//                                   className="h-8 w-8"
//                                   onClick={() => handleRejectVisitor(v.visitorId)}
//                                 >
//                                   <X className="h-4 w-4" />
//                                 </Button>
//                               </div>
//                             )}
//                           </TableCell>
//                         </TableRow>
//                       ))
//                     ) : (
//                       <TableRow>
//                         <TableCell
//                           colSpan={3}
//                           className="text-center text-sm text-muted-foreground py-4"
//                         >
//                           No visitors currently inside.
//                         </TableCell>
//                       </TableRow>
//                     )}
//                   </TableBody>
//                 </Table>
//               </CardContent>
//             </Card> */}
//             {/* <Card>
//               <CardHeader>
//                 <CardTitle className="text-xl font-semibold">Current Visitors Inside</CardTitle>
//               </CardHeader>
//               <Separator />
//               <CardContent className="p-6 space-y-4 text-sm">
//                 {activeVisitors.length > 0 ? (
//                   activeVisitors.map((v) => (
//                     <div key={v.visitorId} className="border p-3 rounded-xl space-y-1">
//                       <p className="font-semibold text-base">{v.name}</p>
//                       <p>Purpose: {v.purpose}</p>
//                       <p>Phone: {v.number}</p>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-muted-foreground">No visitors currently inside.</p>
//                 )}
//               </CardContent>
//             </Card> */}
//           </div>
//         ) : (
//           <p className="text-red-500">Failed to load user data.</p>
//         )}
//       </main>
//     </div>
//   )
// }
