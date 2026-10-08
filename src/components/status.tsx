import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { BookingStatus, PassStatus, VisitorStatus } from "@/lib/types";

export type Tone = "neutral" | "amber" | "emerald" | "red" | "blue";

const TONES: Record<Tone, string> = {
  neutral: "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300",
  amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  red: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
  blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
};

export function Pill({ tone = "neutral", children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium",
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const VISITOR: Record<VisitorStatus, [Tone, string]> = {
  waiting: ["amber", "Waiting at gate"],
  inside: ["emerald", "Inside"],
  left: ["neutral", "Checked out"],
  denied: ["red", "Declined"],
};
export const VisitorStatusPill = ({ status }: { status: VisitorStatus }) => (
  <Pill tone={VISITOR[status][0]} dot={status !== "left"}>{VISITOR[status][1]}</Pill>
);

const PASS: Record<PassStatus, [Tone, string]> = {
  active: ["emerald", "Active"],
  used: ["blue", "Used"],
  expired: ["neutral", "Expired"],
  revoked: ["red", "Revoked"],
};
export const PassStatusPill = ({ status }: { status: PassStatus }) => <Pill tone={PASS[status][0]}>{PASS[status][1]}</Pill>;

const BOOKING: Record<BookingStatus, [Tone, string]> = {
  requested: ["amber", "Requested"],
  in_progress: ["blue", "In progress"],
  completed: ["emerald", "Completed"],
  cancelled: ["neutral", "Cancelled"],
};
export const BookingStatusPill = ({ status, labels }: { status: BookingStatus; labels?: Partial<Record<BookingStatus, string>> }) => (
  <Pill tone={BOOKING[status][0]} dot={status === "in_progress"}>{labels?.[status] ?? BOOKING[status][1]}</Pill>
);
