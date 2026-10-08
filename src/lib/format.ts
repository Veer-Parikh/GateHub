import { format, formatDistanceStrict, isToday, isTomorrow, isYesterday } from "date-fns";

export function inr(amount: number) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function timeAgo(iso: string | undefined, now: number = Date.now()) {
  if (!iso) return "—";
  const diff = now - new Date(iso).getTime();
  if (diff < 45_000) return "just now";
  const mins = Math.round(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function clock(iso: string | undefined) {
  if (!iso) return "—";
  return format(new Date(iso), "h:mm a");
}

/** "Today, 4:00 PM" / "Tomorrow, 9:30 AM" / "Mon, 12 Oct, 4:00 PM" */
export function friendlyDateTime(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return `Today, ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return `Tomorrow, ${format(d, "h:mm a")}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, "h:mm a")}`;
  return format(d, "EEE, d MMM, h:mm a");
}

/** "2h 14m left" style countdown; returns null once the target has passed */
export function countdown(iso: string, now: number = Date.now()) {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return null;
  const totalMins = Math.ceil(ms / 60_000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

export function relativeDay(iso: string, now: number = Date.now()) {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isYesterday(d)) return "Yesterday";
  const past = d.getTime() < now;
  const dist = formatDistanceStrict(d, now, { unit: "day", roundingMethod: "ceil" });
  return past ? `${dist} ago` : `In ${dist}`;
}

export function initials(name: string) {
  const parts = name.replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function flatLabel(block: string, flat: string) {
  return `${block}-${flat}`;
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
