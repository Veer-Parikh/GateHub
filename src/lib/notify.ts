import { toast } from "sonner";

/** Celebrate (or quietly note) Good Neighbour points after an action. */
export function pointsToast(points: number, reason?: string) {
  if (!points) return;
  if (points > 0) toast.success(`+${points} Good Neighbour points`, { description: reason, duration: 3500 });
  else toast(`${points} points`, { description: reason });
}
