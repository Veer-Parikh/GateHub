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
import { Check, X, LogOut } from "lucide-react";

interface Visitor {
  visitorId: string;
  name: string;
  age: number;
  address: string;
  purpose: string;
  number: number;
  photo?: string;
  status: boolean;
  hasLeft: boolean;
  createdAt: string;
  updatedAt: string;
  security?: {
    name: string;
    number: string;
  };
}

export default function VisitorsPage() {
  const [waiting, setWaiting] = useState<Visitor[]>([]);
  const [inside, setInside] = useState<Visitor[]>([]);
  const [previous, setPrevious] = useState<Visitor[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const fetchAll = async () => {
    try {
      const [waitRes, insideRes, prevRes] = await Promise.all([
        fetch("http://localhost:5000/api/visitor/waiting", { headers }),
        fetch("http://localhost:5000/api/visitor/getInside", { headers }),
        fetch("http://localhost:5000/api/visitor/prev", { headers }),
      ]);

      setWaiting(await waitRes.json());
      setInside(await insideRes.json());
      setPrevious(await prevRes.json());
    } catch (err) {
      console.error("Error fetching visitors:", err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const approveVisitor = async (id: string) => {
    await fetch("http://localhost:5000/api/visitor/inside", {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: id }),
    });
    fetchAll();
  };

  const rejectVisitor = async (id: string) => {
    await fetch("http://localhost:5000/api/visitor/delete", {
      method: "DELETE",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: id }),
    });
    fetchAll();
  };

  const markAsLeft = async (id: string) => {
    await fetch("http://localhost:5000/api/visitor/hasLeft", {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: id }),
    });
    fetchAll();
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  const renderTable = (title: string, data: Visitor[], type: "waiting" | "inside" | "prev") => (
    <Card className="rounded-2xl shadow-lg border mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              {/* <TableHead>Status</TableHead> */}
              <TableHead>Security</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((v) => (
              <TableRow key={v.visitorId} className="align-top">
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell>{v.age}</TableCell>
                <TableCell>{v.purpose}</TableCell>
                <TableCell>{v.number}</TableCell>
                <TableCell>{v.address}</TableCell>
                {/* <TableCell> */}
                    {/* <Badge variant={v.status ? "default" : v.hasLeft ? "secondary" : "destructive"}>
                    {v.status ? "Inside" : v.hasLeft ? "Left" : "Pending"}
                    </Badge> */}
                    {/* <Badge
                        className={
                            v.status
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : v.hasLeft
                            ? "bg-gray-500 hover:bg-gray-600 text-white"
                            : "bg-red-500 hover:bg-red-600 text-white"
                        }
                    >
                    {v.status ? "Inside" : v.hasLeft ? "Left" : "Pending"}
                    </Badge> */}
                {/* </TableCell> */}
                <TableCell>{v.security?.name} ({v.security?.number})</TableCell>
                <TableCell>{formatDate(v.createdAt)}</TableCell>
                <TableCell>{formatDate(v.updatedAt)}</TableCell>
                <TableCell>
                  {type === "waiting" && (
                    <div className="flex gap-2">
                      {/* <Button variant="default" size="icon" onClick={() => approveVisitor(v.visitorId)}>
                        <Check className="w-4 h-4" />
                        </Button> */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="text-green-600 border-green-500 hover:bg-green-50 dark:hover:bg-green-900"
                            onClick={() => approveVisitor(v.visitorId)}
                            >
                            <Check className="w-4 h-4" />
                        </Button>
                      <Button variant="destructive" size="icon" onClick={() => rejectVisitor(v.visitorId)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {type === "inside" && (
                    <Button variant="secondary" size="sm" onClick={() => markAsLeft(v.visitorId)}>
                      <LogOut className="w-4 h-4 mr-1" /> Mark as Left
                    </Button>
                  )}
                  {type === "prev" && <span className="text-muted-foreground italic">Completed</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-4">No visitors found.</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar userType="user" />
      <main className="flex-1 p-6 overflow-y-auto space-y-6">
        <h1 className="text-3xl font-bold mb-4">Visitor Management</h1>
        {renderTable("Pending Requests", waiting, "waiting")}
        {renderTable("Visitors Currently Inside", inside, "inside")}
        {renderTable("Previous Visitors", previous, "prev")}
      </main>
    </div>
  );
}