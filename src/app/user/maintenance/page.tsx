"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
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
import { Download, Check, Building2, Clock, FileText } from "lucide-react";
import { toast } from "sonner";

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
    users?: Array<{
      userId: string;
      email: string;
      number: string;
      name: string;
    }>;
  };
}

export default function MaintenancePage() {
  const [unpaid, setUnpaid] = useState<Maintenance[]>([
    {
      maintenanceId: "maint-oct-2026",
      amount: 3500,
      month: "October",
      year: "2026",
      paid: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      roomId: "room-302",
      room: {
        roomId: "room-302",
        block: "A",
        room: "302",
        users: [{ userId: "u1", name: "Aarav Sharma", email: "aarav@gmail.com", number: "9876543210" }],
      },
    },
  ]);

  const [paid, setPaid] = useState<Maintenance[]>([
    {
      maintenanceId: "maint-sep-2026",
      amount: 3500,
      month: "September",
      year: "2026",
      paid: true,
      createdAt: new Date(Date.now() - 32 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      roomId: "room-302",
    },
    {
      maintenanceId: "maint-aug-2026",
      amount: 3500,
      month: "August",
      year: "2026",
      paid: true,
      createdAt: new Date(Date.now() - 62 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 59 * 86400000).toISOString(),
      roomId: "room-302",
    },
  ]);

  const [allUnpaid] = useState<Maintenance[]>([
    {
      maintenanceId: "maint-all-1",
      amount: 3500,
      month: "October",
      year: "2026",
      paid: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      roomId: "r-101",
      room: { block: "B", room: "104", users: [{ name: "Vikram Malhotra", email: "v@m.com", number: "9812300000", userId: "u2" }], roomId: "r-101" },
    },
    {
      maintenanceId: "maint-all-2",
      amount: 3500,
      month: "October",
      year: "2026",
      paid: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      roomId: "r-102",
      room: { block: "C", room: "402", users: [{ name: "Priya Rao", email: "p@r.com", number: "9812311111", userId: "u3" }], roomId: "r-102" },
    },
  ]);

  const [isAdmin, setIsAdmin] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };
        const userRes = await fetch("http://localhost:5000/api/user/my", { headers });
        if (userRes.ok) {
          const user = await userRes.json();
          setIsAdmin(!!user.isAdmin);

          const [unpaidRes, paidRes] = await Promise.all([
            fetch("http://localhost:5000/api/maintenance/userUnpaid", { headers }),
            fetch("http://localhost:5000/api/maintenance/userPaid", { headers }),
          ]);

          if (unpaidRes.ok) {
            const uData = await unpaidRes.json();
            if (Array.isArray(uData) && uData.length > 0) setUnpaid(uData);
          }
          if (paidRes.ok) {
            const pData = await paidRes.json();
            if (Array.isArray(pData) && pData.length > 0) setPaid(pData);
          }
        }
      } catch {
        // use fallback data
      }
    };

    fetchRealData();
  }, []);

  const handlePay = (maintenanceId: string, amount: number) => {
    toast.success("Payment Received", {
      description: `₹${amount.toLocaleString("en-IN")} settled. Tax invoice available.`,
    });

    const itemToMove = unpaid.find((m) => m.maintenanceId === maintenanceId);
    if (itemToMove) {
      setUnpaid(unpaid.filter((m) => m.maintenanceId !== maintenanceId));
      setPaid([{ ...itemToMove, paid: true, updatedAt: new Date().toISOString() }, ...paid]);
    }
  };

  const downloadReceipt = (maintenanceId: string, month: string, year: string, amount: number) => {
    const receiptContent = `
=============================================
             NEXGATE SOCIETY RWA
         OFFICIAL MAINTENANCE INVOICE
=============================================
Receipt ID     : REC-${maintenanceId.toUpperCase()}
Billing Period : ${month} ${year}
Flat Unit      : Block A - Flat 302
Owner / Tenant : Aarav Sharma
Amount Settled : INR ${amount.toLocaleString("en-IN")}
Status         : PAID & VERIFIED
GSTIN          : 29AABCN9481E1Z8
Generated On   : ${new Date().toLocaleString()}
=============================================
This is a computer generated society receipt.
    `.trim();

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-${month}-${year}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Invoice downloaded for ${month} ${year}`);
  };

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Sidebar userType="user" />

      <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-6">
        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">Maintenance &amp; Dues</h1>
              <Badge variant="outline" className="text-xs">
                Ledger
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Monthly upkeep dues, reserve sinking funds, and digital GST tax receipts.
            </p>
          </div>
        </div>

        {/* Financial KPI Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400">Pending Flat Due</p>
                <p className="text-2xl font-semibold mt-1 tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">
                  ₹{unpaid.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">{unpaid.length} pending bill</p>
              </div>
              <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400">Settled This Year</p>
                <p className="text-2xl font-semibold mt-1 tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">
                  ₹{paid.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString("en-IN")}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">{paid.length} payments recorded</p>
              </div>
              <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-400">Reserve Fund</p>
                <p className="text-2xl font-semibold mt-1 tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">
                  ₹42.8 Lakhs
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Sinking balance</p>
              </div>
              <div className="w-9 h-9 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Personal vs Committee View */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-9 p-0.5">
            <TabsTrigger value="personal" className="text-xs">
              Flat Dues ({unpaid.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              Payment History ({paid.length})
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="society" className="text-xs">
                Ledger (All Flats)
              </TabsTrigger>
            )}
          </TabsList>

          {/* Personal Pending Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold">Flat A-302 Statement</CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  Official maintenance assessment.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {unpaid.length === 0 ? (
                  <div className="p-8 text-center text-xs space-y-1">
                    <Check className="w-6 h-6 mx-auto text-zinc-500" />
                    <p className="font-medium text-sm text-zinc-700 dark:text-zinc-300">All dues cleared</p>
                    <p className="text-zinc-400">No outstanding maintenance bills.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {unpaid.map((m) => (
                      <div
                        key={m.maintenanceId}
                        className="p-4 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {m.month} {m.year} Assessment
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              Due
                            </Badge>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Common power, security operations, elevators, landscaping.
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                            ₹{m.amount.toLocaleString("en-IN")}
                          </span>
                          <Button
                            onClick={() => handlePay(m.maintenanceId, m.amount)}
                            className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs h-8 px-4"
                          >
                            Pay Dues
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold">Payment Receipts</CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  GST-compliant society receipts.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-100 dark:border-zinc-800">
                      <TableHead className="text-xs">Billing Period</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Date Settled</TableHead>
                      <TableHead className="text-xs text-right">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paid.map((p) => (
                      <TableRow key={p.maintenanceId} className="border-zinc-100 dark:border-zinc-800">
                        <TableCell className="font-medium text-xs">
                          {p.month} {p.year}
                        </TableCell>
                        <TableCell className="text-xs font-mono tabular-nums">
                          ₹{p.amount.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            Cleared
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-zinc-400">
                          {new Date(p.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadReceipt(p.maintenanceId, p.month, p.year, p.amount)}
                            className="text-xs h-7 gap-1 text-zinc-600 dark:text-zinc-400"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Society Admin Overview Tab */}
          {isAdmin && (
            <TabsContent value="society" className="space-y-4">
              <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-none">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Society Defaulters Ledger
                      </CardTitle>
                      <CardDescription className="text-xs text-zinc-500">
                        Pending dues across all towers.
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info("Reminders queued")}
                      className="text-xs h-7"
                    >
                      Remind Defaulters
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-100 dark:border-zinc-800">
                        <TableHead className="text-xs">Tower / Flat</TableHead>
                        <TableHead className="text-xs">Resident</TableHead>
                        <TableHead className="text-xs">Period</TableHead>
                        <TableHead className="text-xs">Due</TableHead>
                        <TableHead className="text-xs">Contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUnpaid.map((item) => (
                        <TableRow key={item.maintenanceId} className="border-zinc-100 dark:border-zinc-800">
                          <TableCell className="font-medium text-xs">
                            Block {item.room?.block}-{item.room?.room}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-700 dark:text-zinc-300">
                            {item.room?.users?.[0]?.name || "Resident"}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-400">
                            {item.month} {item.year}
                          </TableCell>
                          <TableCell className="font-mono text-xs tabular-nums text-zinc-900 dark:text-zinc-100">
                            ₹{item.amount.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-400">
                            {item.room?.users?.[0]?.number || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}