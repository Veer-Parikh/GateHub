"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

/**
 * Uses `resolvedTheme` so the first click always flips what the user actually sees,
 * even when the stored preference is "system".
 */
export function ThemeToggle({ variant = "icon", className }: { variant?: "icon" | "row"; className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
          className,
        )}
      >
        <Sun className="hidden h-4 w-4 shrink-0 dark:block" strokeWidth={1.75} />
        <Moon className="h-4 w-4 shrink-0 dark:hidden" strokeWidth={1.75} />
        <span className="dark:hidden">Dark mode</span>
        <span className="hidden dark:inline">Light mode</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
        className,
      )}
    >
      <Sun className="hidden h-4 w-4 dark:block" />
      <Moon className="h-4 w-4 dark:hidden" />
    </button>
  );
}
