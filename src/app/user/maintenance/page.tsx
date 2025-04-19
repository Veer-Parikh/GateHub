// "use client";

// import { useEffect, useState } from "react";
// import { Sidebar } from "@/components/sidebar";
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardContent,
// } from "@/components/ui/card";
// import {
//   Table,
//   TableHeader,
//   TableRow,
//   TableHead,
//   TableBody,
//   TableCell,
// } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// interface Maintenance {
//   maintenanceId: string;
//   amount: number;
//   month: string;
//   year: string;
//   paid: boolean;
//   createdAt: string;
//   updatedAt: string;
//   roomId: string;
//   room?: {
//     roomId: string;
//     block: string;
//     room: string;
//     createdAt: string;
//     updatedAt: string;
//     users: Array<{
//       userId: string;
//       email: string;
//       number: string;
//       profileUrl: string | null;
//       name: string;
//       [key: string]: any;
//     }>;
//   };
// }

// // Add Razorpay type definition
// declare global {
//   interface Window {
//     Razorpay: any;
//   }
// }

// export default function MaintenancePage() {
//   const [unpaid, setUnpaid] = useState<Maintenance[]>([]);
//   const [paid, setPaid] = useState<Maintenance[]>([]);
//   const [allUnpaid, setAllUnpaid] = useState<Maintenance[]>([]);
//   const [userData, setUserData] = useState<{
//     userId: string;
//     email: string;
//     number: string;
//     name: string;
//     isAdmin: boolean;
//   } | null>(null);
//   const [activeTab, setActiveTab] = useState("personal");

//   useEffect(() => {
//     // Fetch user data first
//     const fetchUserData = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         if (!token) throw new Error("Token not found");

//         const res = await fetch("http://localhost:5000/api/user/my", {
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         });

//         if (!res.ok) throw new Error("Failed to fetch user");

//         const data = await res.json();
//         setUserData({
//           userId: data.userId,
//           email: data.email,
//           number: data.number,
//           name: data.name,
//           isAdmin: data.isAdmin
//         });
        
//         // After getting user data, fetch maintenance records
//         fetchMaintenanceRecords(token, data.isAdmin);
//       } catch (err) {
//         console.error("Error fetching user:", err);
//       }
//     };

//     fetchUserData();
//   }, []);

//   const fetchMaintenanceRecords = async (token: string, isAdmin: boolean) => {
//     try {
//       const headers = {
//         Authorization: `Bearer ${token}`,
//       };

//       const endpoints = [
//         fetch("http://localhost:5000/api/maintenance/userUnpaid", { headers }),
//         fetch("http://localhost:5000/api/maintenance/userPaid", { headers }),
//       ];
      
//       // Add the admin endpoint if the user is an admin
//       if (isAdmin) {
//         endpoints.push(fetch("http://localhost:5000/api/maintenance/allUnpaid", { headers }));
//       }

//       const responses = await Promise.all(endpoints);
      
//       // Check if any responses failed
//       if (responses.some(res => !res.ok)) {
//         throw new Error("Failed to fetch maintenance data");
//       }

//       const [unpaidData, paidData, ...rest] = await Promise.all(
//         responses.map(res => res.json())
//       );

//       setUnpaid(unpaidData);
//       setPaid(paidData);
      
//       // Set all unpaid society maintenance data if admin
//       if (isAdmin && rest.length > 0) {
//         setAllUnpaid(rest[0]);
//       }
//     } catch (err) {
//       console.error("Error fetching maintenance data:", err);
//     }
//   };

//   // Updated handlePayment function based on the dashboard page implementation
//   const handlePayment = async (maintenanceId: string, amount: number) => {
//     try {
//       if (!userData?.userId) {
//         console.error("User ID not available");
//         return;
//       }
      
//       // Create a Razorpay order
//       const res = await fetch("/api/payment", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           maintenanceId,
//           amount,
//           userId: userData.userId,
//         }),
//       });
  
//       const data = await res.json();
      
//       if (!data.id) {
//         throw new Error(data.error || "Failed to create payment");
//       }
      
//       // Load Razorpay script
//       const script = document.createElement('script');
//       script.src = 'https://checkout.razorpay.com/v1/checkout.js';
//       script.async = true;
      
//       document.body.appendChild(script);
      
//       script.onload = () => {
//         const token = localStorage.getItem("token");
//         const options = {
//           key: data.key,
//           amount: data.amount,
//           currency: data.currency,
//           name: "Society Maintenance",
//           description: `Maintenance Payment for ${maintenanceId}`,
//           order_id: data.id,
//           handler: async (response: any) => {
//             try {
//               // Verify payment on your server
//               const verifyResponse = await fetch('/api/payment', {
//                 method: 'PUT',
//                 headers: {
//                   'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                   razorpay_order_id: response.razorpay_order_id,
//                   razorpay_payment_id: response.razorpay_payment_id,
//                   razorpay_signature: response.razorpay_signature,
//                 }),
//               });
              
//               const verifyData = await verifyResponse.json();
              
//               if (verifyData.success) {
//                 await fetch("http://localhost:5000/api/maintenance/update", {
//                   method: "PATCH",
//                   headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}` },
//                   body: JSON.stringify({ maintenanceId }),
//                 });
              
//                 // Inform user and refresh
//                 alert("Payment successful!");
                
//                 // Update local state to move maintenance from unpaid to paid
//                 const paidMaintenance = unpaid.find(m => m.maintenanceId === maintenanceId);
//                 if (paidMaintenance) {
//                   const updatedPaidMaintenance = {...paidMaintenance, paid: true};
//                   setUnpaid(prev => prev.filter(m => m.maintenanceId !== maintenanceId));
//                   setPaid(prev => [...prev, updatedPaidMaintenance]);
//                 }
                
//                 // Also update the all unpaid list if the user is admin
//                 if (userData?.isAdmin) {
//                   setAllUnpaid(prev => prev.filter(m => m.maintenanceId !== maintenanceId));
//                 }
//               } else {
//                 alert("Payment verification failed. Please contact support.");
//               }
//             } catch (error) {
//               console.error("Payment verification error:", error);
//               alert("Error processing payment verification");
//             }
//           },
//           prefill: {
//             name: userData.name,
//             email: userData.email,
//             contact: userData.number,
//           },
//           theme: {
//             color: "#3399cc",
//           },
//           modal: {
//             ondismiss: function() {
//               console.log("Payment cancelled");
//             },
//           },
//         };
        
//         const paymentObject = new window.Razorpay(options);
//         paymentObject.open();
//       };
      
//       script.onerror = () => {
//         alert("Failed to load Razorpay. Please try again.");
//         document.body.removeChild(script);
//       };
      
//     } catch (err) {
//       console.error("Error initiating payment:", err);
//       alert("Failed to initiate payment. Please try again later.");
//     }
//   };

//   const formatDate = (dateStr: string) => {
//     const date = new Date(dateStr);
//     return date.toLocaleString('en-IN', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const renderTable = (title: string, data: Maintenance[], isPaid: boolean) => (
//     <Card className="rounded-2xl shadow-lg border mb-6">
//       <CardHeader>
//         <CardTitle className="text-xl font-bold">{title}</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Month</TableHead>
//               <TableHead>Year</TableHead>
//               <TableHead>Amount (₹)</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead>Created Date</TableHead>
//               {isPaid && <TableHead>Paid Date</TableHead>}
//               {!isPaid && <TableHead>Actions</TableHead>}
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {data.map((m) => (
//               <TableRow key={m.maintenanceId} className="align-top">
//                 <TableCell className="font-medium">{m.month}</TableCell>
//                 <TableCell>{m.year}</TableCell>
//                 <TableCell>₹{m.amount.toLocaleString()}</TableCell>
//                 <TableCell>
//                   <Badge
//                     className={
//                       m.paid
//                         ? "bg-green-500 hover:bg-green-600 text-white"
//                         : "bg-red-500 hover:bg-red-600 text-white"
//                     }
//                   >
//                     {m.paid ? "Paid" : "Unpaid"}
//                   </Badge>
//                 </TableCell>
//                 <TableCell>{formatDate(m.createdAt)}</TableCell>
//                 {isPaid && <TableCell>{formatDate(m.updatedAt)}</TableCell>}
//                 {!isPaid && (
//                   <TableCell>
//                     <Button 
//                       onClick={() => handlePayment(m.maintenanceId, m.amount)}
//                       className="bg-blue-500 hover:bg-blue-600 text-white"
//                     >
//                       Pay Now
//                     </Button>
//                   </TableCell>
//                 )}
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//         {data.length === 0 && (
//           <p className="text-center text-sm text-muted-foreground mt-4">No maintenance records found.</p>
//         )}
//       </CardContent>
//     </Card>
//   );

//   const renderSocietyTable = (title: string, data: Maintenance[]) => (
//     <Card className="rounded-2xl shadow-lg border mb-6">
//       <CardHeader>
//         <CardTitle className="text-xl font-bold">{title}</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Month</TableHead>
//               <TableHead>Year</TableHead>
//               <TableHead>Block</TableHead>
//               <TableHead>Room</TableHead>
//               <TableHead>Amount (₹)</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead>Created Date</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {data.map((m) => (
//               <TableRow key={m.maintenanceId} className="align-top">
//                 <TableCell className="font-medium">{m.month}</TableCell>
//                 <TableCell>{m.year}</TableCell>
//                 <TableCell>{m.room?.block || 'N/A'}</TableCell>
//                 <TableCell>{m.room?.room || 'N/A'}</TableCell>
//                 <TableCell>₹{m.amount.toLocaleString()}</TableCell>
//                 <TableCell>
//                   <Badge className="bg-red-500 hover:bg-red-600 text-white">
//                     Unpaid
//                   </Badge>
//                 </TableCell>
//                 <TableCell>{formatDate(m.createdAt)}</TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//         {data.length === 0 && (
//           <p className="text-center text-sm text-muted-foreground mt-4">No maintenance records found.</p>
//         )}
//       </CardContent>
//     </Card>
//   );

//   return (
//     <div className="flex h-screen bg-background text-foreground">
//       <Sidebar userType="user" />
//       <main className="flex-1 p-6 overflow-y-auto space-y-6">
//         <h1 className="text-3xl font-bold mb-4">Maintenance Management</h1>
        
//         {userData?.isAdmin ? (
//           <Tabs defaultValue="personal" className="w-full" value={activeTab} onValueChange={setActiveTab}>
//             <TabsList className="mb-6">
//               <TabsTrigger value="personal">My Maintenance</TabsTrigger>
//               <TabsTrigger value="society">Society Unpaid Maintenance</TabsTrigger>
//             </TabsList>
            
//             <TabsContent value="personal" className="space-y-6">
//               {renderTable("Pending Payments", unpaid, false)}
//               {renderTable("Payment History", paid, true)}
//             </TabsContent>
            
//             <TabsContent value="society" className="space-y-6">
//               {renderSocietyTable("All Society Unpaid Maintenance", allUnpaid)}
//             </TabsContent>
//           </Tabs>
//         ) : (
//           <>
//             {renderTable("Pending Payments", unpaid, false)}
//             {renderTable("Payment History", paid, true)}
//           </>
//         )}
//       </main>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface Maintenance {
  maintenanceId: string;
  amount: number;
  month: string;
  year: string;
  paid: boolean;
  createdAt: string;
  updatedAt: string;
  roomId: string;
  room?: {
    roomId: string;
    block: string;
    room: string;
    createdAt: string;
    updatedAt: string;
    users: Array<{
      userId: string;
      email: string;
      number: string;
      profileUrl: string | null;
      name: string;
      [key: string]: any;
    }>;
  };
}

// Add Razorpay type definition
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function MaintenancePage() {
  const [unpaid, setUnpaid] = useState<Maintenance[]>([]);
  const [paid, setPaid] = useState<Maintenance[]>([]);
  const [allUnpaid, setAllUnpaid] = useState<Maintenance[]>([]);
  const [userData, setUserData] = useState<{
    userId: string;
    email: string;
    number: string;
    name: string;
    isAdmin: boolean;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [showPostForm, setShowPostForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    month: "",
    year: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 10 + i).toString());

  useEffect(() => {
    // Fetch user data first
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token not found");

        const res = await fetch("http://localhost:5000/api/user/my", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error("Failed to fetch user");

        const data = await res.json();
        setUserData({
          userId: data.userId,
          email: data.email,
          number: data.number,
          name: data.name,
          isAdmin: data.isAdmin
        });
        
        // After getting user data, fetch maintenance records
        fetchMaintenanceRecords(token, data.isAdmin);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUserData();
  }, []);

  const fetchMaintenanceRecords = async (token: string, isAdmin: boolean) => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const endpoints = [
        fetch("http://localhost:5000/api/maintenance/userUnpaid", { headers }),
        fetch("http://localhost:5000/api/maintenance/userPaid", { headers }),
      ];
      
      // Add the admin endpoint if the user is an admin
      if (isAdmin) {
        endpoints.push(fetch("http://localhost:5000/api/maintenance/allUnpaid", { headers }));
      }

      const responses = await Promise.all(endpoints);
      
      // Check if any responses failed
      if (responses.some(res => !res.ok)) {
        throw new Error("Failed to fetch maintenance data");
      }

      const [unpaidData, paidData, ...rest] = await Promise.all(
        responses.map(res => res.json())
      );

      setUnpaid(unpaidData);
      setPaid(paidData);
      
      // Set all unpaid society maintenance data if admin
      if (isAdmin && rest.length > 0) {
        setAllUnpaid(rest[0]);
      }
    } catch (err) {
      console.error("Error fetching maintenance data:", err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePostMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token not found");
      
      const response = await fetch("http://localhost:5000/api/maintenance/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(formData.amount),
          month: formData.month,
          year: formData.year
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to post maintenance");
      }
      
      // Reset form
      setFormData({
        amount: "",
        month: "",
        year: ""
      });
      
      setShowPostForm(false);
      
      // Refetch data to show newly added maintenance
      fetchMaintenanceRecords(token, userData?.isAdmin || false);
      
      alert("Maintenance record posted successfully");
    } catch (err) {
      console.error("Error posting maintenance:", err);
      alert("Failed to post maintenance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Updated handlePayment function based on the dashboard page implementation
  const handlePayment = async (maintenanceId: string, amount: number) => {
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
        const token = localStorage.getItem("token");
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
                  headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ maintenanceId }),
                });
              
                // Inform user and refresh
                alert("Payment successful!");
                
                // Update local state to move maintenance from unpaid to paid
                const paidMaintenance = unpaid.find(m => m.maintenanceId === maintenanceId);
                if (paidMaintenance) {
                  const updatedPaidMaintenance = {...paidMaintenance, paid: true};
                  setUnpaid(prev => prev.filter(m => m.maintenanceId !== maintenanceId));
                  setPaid(prev => [...prev, updatedPaidMaintenance]);
                }
                
                // Also update the all unpaid list if the user is admin
                if (userData?.isAdmin) {
                  setAllUnpaid(prev => prev.filter(m => m.maintenanceId !== maintenanceId));
                }
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTable = (title: string, data: Maintenance[], isPaid: boolean) => (
    <Card className="rounded-2xl shadow-lg border mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Amount (₹)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              {isPaid && <TableHead>Paid Date</TableHead>}
              {!isPaid && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((m) => (
              <TableRow key={m.maintenanceId} className="align-top">
                <TableCell className="font-medium">{m.month}</TableCell>
                <TableCell>{m.year}</TableCell>
                <TableCell>₹{m.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      m.paid
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }
                  >
                    {m.paid ? "Paid" : "Unpaid"}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(m.createdAt)}</TableCell>
                {isPaid && <TableCell>{formatDate(m.updatedAt)}</TableCell>}
                {!isPaid && (
                  <TableCell>
                    <Button 
                      onClick={() => handlePayment(m.maintenanceId, m.amount)}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Pay Now
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-4">No maintenance records found.</p>
        )}
      </CardContent>
    </Card>
  );

  const renderSocietyTable = (title: string, data: Maintenance[]) => (
    <Card className="rounded-2xl shadow-lg border mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Block</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Amount (₹)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((m) => (
              <TableRow key={m.maintenanceId} className="align-top">
                <TableCell className="font-medium">{m.month}</TableCell>
                <TableCell>{m.year}</TableCell>
                <TableCell>{m.room?.block || 'N/A'}</TableCell>
                <TableCell>{m.room?.room || 'N/A'}</TableCell>
                <TableCell>₹{m.amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge className="bg-red-500 hover:bg-red-600 text-white">
                    Unpaid
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(m.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-4">No maintenance records found.</p>
        )}
      </CardContent>
    </Card>
  );

  const renderPostMaintenanceForm = () => (
    <Card className="rounded-2xl shadow-lg border mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Post New Maintenance</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowPostForm(false)}
          className="h-8 w-8 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePostMaintenance} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleInputChange}
                required
                min="1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select 
                value={formData.month} 
                onValueChange={(value) => handleSelectChange("month", value)}
                required
              >
                <SelectTrigger id="month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select 
                value={formData.year} 
                onValueChange={(value) => handleSelectChange("year", value)}
                required
              >
                <SelectTrigger id="year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="bg-green-500 hover:bg-green-600 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Posting..." : "Post Maintenance"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar userType="user" />
      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        <div className="flex justify-between items-center mb-4 gap-3">
          <h1 className="text-2xl font-bold">Maintenance Management</h1>
          {userData?.isAdmin && (
            <Button 
              onClick={() => setShowPostForm(true)}
              className="bg-green-500 hover:bg-green-600 text-white mr-20 font-extralight"
              disabled={showPostForm}
            >
              Post Maintenance
            </Button>
          )}
        </div>
        
        {userData?.isAdmin && showPostForm && renderPostMaintenanceForm()}
        
        {userData?.isAdmin ? (
          <Tabs defaultValue="personal" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="personal">My Maintenance</TabsTrigger>
              <TabsTrigger value="society">Society Unpaid Maintenance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="space-y-6">
              {renderTable("Pending Payments", unpaid, false)}
              {renderTable("Payment History", paid, true)}
            </TabsContent>
            
            <TabsContent value="society" className="space-y-6">
              {renderSocietyTable("All Society Unpaid Maintenance", allUnpaid)}
            </TabsContent>
          </Tabs>
        ) : (
          <>
            {renderTable("Pending Payments", unpaid, false)}
            {renderTable("Payment History", paid, true)}
          </>
        )}
      </main>
    </div>
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import { Sidebar } from "@/components/sidebar";
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardContent,
// } from "@/components/ui/card";
// import {
//   Table,
//   TableHeader,
//   TableRow,
//   TableHead,
//   TableBody,
//   TableCell,
// } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";

// interface Maintenance {
//   maintenanceId: string;
//   amount: number;
//   month: string;
//   year: string;
//   paid: boolean;
//   createdAt: string;
//   updatedAt: string;
//   roomId: string;
//   room?: {
//     roomId: string;
//     block: string;
//     room: string;
//     createdAt: string;
//     updatedAt: string;
//     users: Array<{
//       userId: string;
//       email: string;
//       number: string;
//       profileUrl: string | null;
//       name: string;
//       [key: string]: any;
//     }>;
//   };
// }

// // Add Razorpay type definition
// declare global {
//   interface Window {
//     Razorpay: any;
//   }
// }

// export default function MaintenancePage() {
//   const [unpaid, setUnpaid] = useState<Maintenance[]>([]);
//   const [paid, setPaid] = useState<Maintenance[]>([]);
//   const [userData, setUserData] = useState<{
//     userId: string;
//     email: string;
//     number: string;
//     name: string;
//   } | null>(null);

//   useEffect(() => {
//     // Fetch user data first
//     const fetchUserData = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         if (!token) throw new Error("Token not found");

//         const res = await fetch("http://localhost:5000/api/user/my", {
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         });

//         if (!res.ok) throw new Error("Failed to fetch user");

//         const data = await res.json();
//         setUserData({
//           userId: data.userId,
//           email: data.email,
//           number: data.number,
//           name: data.name
//         });
        
//         // After getting user data, fetch maintenance records
//         fetchMaintenanceRecords(token);
//       } catch (err) {
//         console.error("Error fetching user:", err);
//       }
//     };

//     fetchUserData();
//   }, []);

//   const fetchMaintenanceRecords = async (token: string) => {
//     try {
//       const headers = {
//         Authorization: `Bearer ${token}`,
//       };

//       const [unpaidRes, paidRes] = await Promise.all([
//         fetch("http://localhost:5000/api/maintenance/userUnpaid", { headers }),
//         fetch("http://localhost:5000/api/maintenance/userPaid", { headers }),
//       ]);

//       if (!unpaidRes.ok || !paidRes.ok) {
//         throw new Error("Failed to fetch maintenance data");
//       }

//       setUnpaid(await unpaidRes.json());
//       setPaid(await paidRes.json());
//     } catch (err) {
//       console.error("Error fetching maintenance data:", err);
//     }
//   };

//   // Updated handlePayment function based on the dashboard page implementation
//   const handlePayment = async (maintenanceId: string, amount: number) => {
//     try {
//       if (!userData?.userId) {
//         console.error("User ID not available");
//         return;
//       }
      
//       // Create a Razorpay order
//       const res = await fetch("/api/payment", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           maintenanceId,
//           amount,
//           userId: userData.userId,
//         }),
//       });
  
//       const data = await res.json();
      
//       if (!data.id) {
//         throw new Error(data.error || "Failed to create payment");
//       }
      
//       // Load Razorpay script
//       const script = document.createElement('script');
//       script.src = 'https://checkout.razorpay.com/v1/checkout.js';
//       script.async = true;
      
//       document.body.appendChild(script);
      
//       script.onload = () => {
//         const token = localStorage.getItem("token");
//         const options = {
//           key: data.key,
//           amount: data.amount,
//           currency: data.currency,
//           name: "Society Maintenance",
//           description: `Maintenance Payment for ${maintenanceId}`,
//           order_id: data.id,
//           handler: async (response: any) => {
//             try {
//               // Verify payment on your server
//               const verifyResponse = await fetch('/api/payment', {
//                 method: 'PUT',
//                 headers: {
//                   'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                   razorpay_order_id: response.razorpay_order_id,
//                   razorpay_payment_id: response.razorpay_payment_id,
//                   razorpay_signature: response.razorpay_signature,
//                 }),
//               });
              
//               const verifyData = await verifyResponse.json();
              
//               if (verifyData.success) {
//                 await fetch("http://localhost:5000/api/maintenance/update", {
//                   method: "PATCH",
//                   headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}` },
//                   body: JSON.stringify({ maintenanceId }),
//                 });
              
//                 // Inform user and refresh
//                 alert("Payment successful!");
                
//                 // Update local state to move maintenance from unpaid to paid
//                 const paidMaintenance = unpaid.find(m => m.maintenanceId === maintenanceId);
//                 if (paidMaintenance) {
//                   const updatedPaidMaintenance = {...paidMaintenance, paid: true};
//                   setUnpaid(prev => prev.filter(m => m.maintenanceId !== maintenanceId));
//                   setPaid(prev => [...prev, updatedPaidMaintenance]);
//                 }
//               } else {
//                 alert("Payment verification failed. Please contact support.");
//               }
//             } catch (error) {
//               console.error("Payment verification error:", error);
//               alert("Error processing payment verification");
//             }
//           },
//           prefill: {
//             name: userData.name,
//             email: userData.email,
//             contact: userData.number,
//           },
//           theme: {
//             color: "#3399cc",
//           },
//           modal: {
//             ondismiss: function() {
//               console.log("Payment cancelled");
//             },
//           },
//         };
        
//         const paymentObject = new window.Razorpay(options);
//         paymentObject.open();
//       };
      
//       script.onerror = () => {
//         alert("Failed to load Razorpay. Please try again.");
//         document.body.removeChild(script);
//       };
      
//     } catch (err) {
//       console.error("Error initiating payment:", err);
//       alert("Failed to initiate payment. Please try again later.");
//     }
//   };

//   const formatDate = (dateStr: string) => {
//     const date = new Date(dateStr);
//     return date.toLocaleString('en-IN', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const renderTable = (title: string, data: Maintenance[], isPaid: boolean) => (
//     <Card className="rounded-2xl shadow-lg border mb-6">
//       <CardHeader>
//         <CardTitle className="text-xl font-bold">{title}</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Month</TableHead>
//               <TableHead>Year</TableHead>
//               <TableHead>Amount (₹)</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead>Created Date</TableHead>
//               {isPaid && <TableHead>Paid Date</TableHead>}
//               {!isPaid && <TableHead>Actions</TableHead>}
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {data.map((m) => (
//               <TableRow key={m.maintenanceId} className="align-top">
//                 <TableCell className="font-medium">{m.month}</TableCell>
//                 <TableCell>{m.year}</TableCell>
//                 <TableCell>₹{m.amount.toLocaleString()}</TableCell>
//                 <TableCell>
//                   <Badge
//                     className={
//                       m.paid
//                         ? "bg-green-500 hover:bg-green-600 text-white"
//                         : "bg-red-500 hover:bg-red-600 text-white"
//                     }
//                   >
//                     {m.paid ? "Paid" : "Unpaid"}
//                   </Badge>
//                 </TableCell>
//                 <TableCell>{formatDate(m.createdAt)}</TableCell>
//                 {isPaid && <TableCell>{formatDate(m.updatedAt)}</TableCell>}
//                 {!isPaid && (
//                   <TableCell>
//                     <Button 
//                       onClick={() => handlePayment(m.maintenanceId, m.amount)}
//                       className="bg-blue-500 hover:bg-blue-600 text-white"
//                     >
//                       Pay Now
//                     </Button>
//                   </TableCell>
//                 )}
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//         {data.length === 0 && (
//           <p className="text-center text-sm text-muted-foreground mt-4">No maintenance records found.</p>
//         )}
//       </CardContent>
//     </Card>
//   );

//   return (
//     <div className="flex h-screen bg-background text-foreground">
//       <Sidebar userType="user" />
//       <main className="flex-1 p-6 overflow-y-auto space-y-6">
//         <h1 className="text-3xl font-bold mb-4">Maintenance Management</h1>
//         {renderTable("Pending Payments", unpaid, false)}
//         {renderTable("Payment History", paid, true)}
//       </main>
//     </div>
//   );
// }