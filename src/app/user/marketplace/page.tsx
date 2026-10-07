"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import {
  ShoppingBag,
  Plus,
  Search,
  MessageCircle,
  MapPin,
  Heart,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Listing {
  id: string;
  title: string;
  price: number;
  isFree?: boolean;
  category: "Furniture" | "Electronics" | "Kids" | "Bicycles" | "Appliances" | "Books";
  condition: "Brand New" | "Like New" | "Gently Used";
  sellerName: string;
  sellerFlat: string;
  sellerPhone: string;
  description: string;
  postedAt: string;
  likes: number;
}

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isNewListingOpen, setIsNewListingOpen] = useState(false);

  const [listings, setListings] = useState<Listing[]>([
    {
      id: "m-1",
      title: "IKEA POÄNG Armchair & Footstool (Birch/Ghill)",
      price: 3200,
      category: "Furniture",
      condition: "Like New",
      sellerName: "Neha Mathur",
      sellerFlat: "Tower B - Flat 404",
      sellerPhone: "9871122334",
      description: "Barely used for 4 months. Moving out sale. Pickup directly from 4th floor.",
      postedAt: "2h ago",
      likes: 12,
    },
    {
      id: "m-2",
      title: "Hero Sprint Pro 21-Speed Mountain Bike",
      price: 4500,
      category: "Bicycles",
      condition: "Gently Used",
      sellerName: "Aditya Roy",
      sellerFlat: "Tower A - Flat 201",
      sellerPhone: "9845012399",
      description: "Serviced last month with dual disc brakes. Perfect for riding inside society perimeter.",
      postedAt: "5h ago",
      likes: 8,
    },
    {
      id: "m-3",
      title: "Philips Air Fryer Digital HD9252 (4.1L)",
      price: 2800,
      category: "Appliances",
      condition: "Like New",
      sellerName: "Pooja Varma",
      sellerFlat: "Tower C - Flat 702",
      sellerPhone: "9731201122",
      description: "Under warranty until next year. All original accessories and box included.",
      postedAt: "1d ago",
      likes: 19,
    },
    {
      id: "m-4",
      title: "Chicco Lullaby Baby Crib & Playard",
      price: 0,
      isFree: true,
      category: "Kids",
      condition: "Gently Used",
      sellerName: "Siddharth & Priya",
      sellerFlat: "Tower B - Flat 603",
      sellerPhone: "9900118822",
      description: "Free giveaway to any new parents in our society. Clean and sanitized.",
      postedAt: "1d ago",
      likes: 27,
    },
    {
      id: "m-5",
      title: "Kindle Paperwhite 10th Gen (8GB Backlit)",
      price: 3900,
      category: "Electronics",
      condition: "Like New",
      sellerName: "Karthik Nair",
      sellerFlat: "Tower D - Flat 105",
      sellerPhone: "9820033441",
      description: "Battery lasts 3 weeks easily. Comes with magnetic leather flip cover.",
      postedAt: "2d ago",
      likes: 15,
    },
  ]);

  const [newForm, setNewForm] = useState({
    title: "",
    price: "",
    category: "Furniture" as Listing["category"],
    condition: "Like New" as Listing["condition"],
    description: "",
    sellerName: "Resident (Me)",
    sellerFlat: "Tower A - Flat 302",
    sellerPhone: "9876543210",
  });

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newForm.price) || 0;
    const item: Listing = {
      id: `m-${Date.now()}`,
      title: newForm.title,
      price: priceNum,
      isFree: priceNum === 0,
      category: newForm.category,
      condition: newForm.condition,
      description: newForm.description,
      sellerName: newForm.sellerName,
      sellerFlat: newForm.sellerFlat,
      sellerPhone: newForm.sellerPhone,
      postedAt: "Just now",
      likes: 0,
    };
    setListings([item, ...listings]);
    setIsNewListingOpen(false);
    toast.success("Listing published to community board");
    setNewForm({
      title: "",
      price: "",
      category: "Furniture",
      condition: "Like New",
      description: "",
      sellerName: "Resident (Me)",
      sellerFlat: "Tower A - Flat 302",
      sellerPhone: "9876543210",
    });
  };

  const handleContactSeller = (listing: Listing) => {
    const text = encodeURIComponent(
      `Hello ${listing.sellerName}, neighbor from ${newForm.sellerFlat}. Interested in your listing "${listing.title}" on NexGate Marketplace.`
    );
    window.open(`https://wa.me/91${listing.sellerPhone}?text=${text}`, "_blank");
  };

  const handleLike = (id: string) => {
    setListings(
      listings.map((l) => (l.id === id ? { ...l, likes: l.likes + 1 } : l))
    );
    toast.success("Saved to watchlist");
  };

  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.sellerFlat.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      l.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Sidebar userType="user" />

      <main className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-6 lg:px-10 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">Resident Marketplace</h1>
              <Badge variant="outline" className="text-xs">
                Verified Residents
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Peer-to-peer buy, sell, and giveaway directory exclusive to your gated community.
            </p>
          </div>

          <Dialog open={isNewListingOpen} onOpenChange={setIsNewListingOpen}>
            <DialogTrigger asChild>
              <Button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs h-9 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Create Listing</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">
                  List Item
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Visible strictly within your verified society network.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateListing} className="space-y-3.5 py-2">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-500">Item Title</Label>
                  <Input
                    required
                    placeholder="e.g. Ergonomic Office Chair"
                    value={newForm.title}
                    onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-500">Price (₹) — Enter 0 for Giveaway</Label>
                    <Input
                      required
                      type="number"
                      placeholder="e.g. 2500"
                      value={newForm.price}
                      onChange={(e) => setNewForm({ ...newForm, price: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-500">Category</Label>
                    <Select
                      value={newForm.category}
                      onValueChange={(val: Listing["category"]) => setNewForm({ ...newForm, category: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Bicycles">Bicycles</SelectItem>
                        <SelectItem value="Appliances">Appliances</SelectItem>
                        <SelectItem value="Kids">Kids</SelectItem>
                        <SelectItem value="Books">Books</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-zinc-500">Condition</Label>
                  <Select
                    value={newForm.condition}
                    onValueChange={(val: Listing["condition"]) => setNewForm({ ...newForm, condition: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Brand New">Brand New</SelectItem>
                      <SelectItem value="Like New">Like New</SelectItem>
                      <SelectItem value="Gently Used">Gently Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-zinc-500">Description &amp; Pickup Details</Label>
                  <Textarea
                    rows={3}
                    placeholder="Condition notes, dimensions, tower pickup floor..."
                    value={newForm.description}
                    onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsNewListingOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
                    Publish
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search listings or flat number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["all", "furniture", "electronics", "bicycles", "appliances", "kids"].map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="capitalize text-xs whitespace-nowrap h-7 px-3"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((item) => (
            <Card
              key={item.id}
              className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 transition flex flex-col shadow-none"
            >
              <div className="p-5 bg-zinc-50 dark:bg-zinc-800/40 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-mono uppercase text-zinc-500 tracking-wider">
                    {item.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {item.condition}
                  </Badge>
                  <button
                    onClick={() => handleLike(item.id)}
                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
                    title="Watchlist"
                  >
                    <Heart className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold line-clamp-1">{item.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {item.isFree ? (
                    <Badge variant="secondary" className="font-semibold text-xs">
                      Giveaway
                    </Badge>
                  ) : (
                    <span className="text-lg font-semibold tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">
                      ₹{item.price.toLocaleString("en-IN")}
                    </span>
                  )}
                  <span className="text-xs text-zinc-400">• {item.postedAt}</span>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-1 flex-1 space-y-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {item.description}
                </p>

                <div className="bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-md text-xs space-y-1 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Seller</span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.sellerName}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-500">
                    <span className="flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3 text-zinc-400" /> {item.sellerFlat}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Resident
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <Button
                  onClick={() => handleContactSeller(item)}
                  variant="outline"
                  className="w-full text-xs h-8 flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Contact Resident
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
