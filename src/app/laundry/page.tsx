"use client";

import { Sparkles } from "lucide-react";
import { ServiceConsole } from "@/components/service-console";

export default function LaundryConsole() {
  return (
    <ServiceConsole
      type="laundry"
      copy={{
        icon: Sparkles,
        accent: "bg-teal-600 text-white",
        tagline: "Wash, iron & dry-clean orders",
        statusLabels: { requested: "Pickup pending", in_progress: "In wash", completed: "Delivered" },
        startLabel: "Picked up",
        doneLabel: "Mark delivered",
      }}
    />
  );
}
