// Small layout primitives shared by every signed-in page, so headers, stat tiles and
// empty states look the same everywhere.

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  badge,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-900 dark:text-zinc-100">{title}</h1>
          {badge}
        </div>
        {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
  children,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: "default" | "warning" | "success" | "danger";
  className?: string;
  children?: ReactNode;
}) {
  const toneClass = {
    default: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    danger: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  }[tone];
  return (
    <div className={cn("rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
            {value}
          </p>
          {hint && <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", toneClass)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      <Icon className="mx-auto mb-2 h-7 w-7 text-zinc-400" />
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** Bordered card with an optional header row (title, description, action link). */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
          </div>
          {action && <div className="shrink-0 text-xs">{action}</div>}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{children}</h2>
      {aside && <div className="text-xs text-zinc-500 dark:text-zinc-400">{aside}</div>}
    </div>
  );
}

/** Data source chip: makes it obvious whether a page shows demo data or the live backend. */
export function SourceBadge({ live, error }: { live: boolean; error?: string | null }) {
  if (live && error)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Server error
      </span>
    );
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        live
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-emerald-500" : "bg-zinc-400")} />
      {live ? "Live" : "Demo data"}
    </span>
  );
}
