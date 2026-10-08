"use client";

import { Wrench } from "lucide-react";
import { ServiceConsole } from "@/components/service-console";

export default function PlumberConsole() {
  return (
    <ServiceConsole
      type="plumber"
      copy={{
        icon: Wrench,
        accent: "bg-blue-600 text-white",
        tagline: "Plumbing work orders",
        statusLabels: { requested: "New request", in_progress: "On site", completed: "Done" },
        startLabel: "Accept & start",
        doneLabel: "Mark done",
      }}
    />
  );
}
