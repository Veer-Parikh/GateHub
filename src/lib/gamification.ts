// "Good Neighbour" points: residents earn points for actions that make the society run
// smoother (paying on time, pre-approving guests, answering the gate quickly, reviewing
// service partners…). Levels and badges are derived from the points ledger.

import type { DemoState, PointsEntry, PointsKind } from "./types";

export const POINTS = {
  paymentOnTime: 50,
  paymentLate: 15,
  visitorQuick: 5,
  visitorSlow: 2,
  gatepass: 5,
  listing: 10,
  giveaway: 40,
  review: 15,
  rsvp: 10,
  meeting: 20,
} as const;

/** A visitor decision within this window counts as a "quick response". */
export const QUICK_RESPONSE_MS = 2 * 60_000;

export const LEVELS = [
  { name: "Newcomer", min: 0 },
  { name: "Good Neighbour", min: 150 },
  { name: "Community Champion", min: 400 },
  { name: "Society Legend", min: 800 },
] as const;

export function totalPoints(points: PointsEntry[]) {
  return points.reduce((s, p) => s + p.points, 0);
}

export function levelFor(total: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => {
    if (total >= l.min) idx = i;
  });
  const level = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const progress = next ? (total - level.min) / (next.min - level.min) : 1;
  return { level, next, index: idx, progress: Math.max(0, Math.min(1, progress)), toNext: next ? next.min - total : 0 };
}

interface BadgeRule {
  id: string;
  name: string;
  description: string;
  goal: number;
  count: (points: PointsEntry[]) => number;
}

const countKind = (kind: PointsKind, bonusOnly = false) => (points: PointsEntry[]) =>
  points.filter((p) => p.kind === kind && (!bonusOnly || p.bonus)).length;

export const BADGES: BadgeRule[] = [
  { id: "early-bird", name: "Early Bird", description: "Pay 3 maintenance bills before the due date", goal: 3, count: countKind("payment", true) },
  { id: "gatekeeper", name: "Gatekeeper", description: "Pre-approve 5 visitors with gate passes", goal: 5, count: countKind("gatepass") },
  { id: "quick-responder", name: "Quick Responder", description: "Answer 5 gate requests within 2 minutes", goal: 5, count: countKind("visitor", true) },
  { id: "generous", name: "Generous Neighbour", description: "Give away an item for free on the marketplace", goal: 1, count: countKind("giveaway") },
  { id: "fair-reviewer", name: "Fair Reviewer", description: "Rate 2 completed service bookings", goal: 2, count: countKind("review") },
  { id: "social", name: "Social Butterfly", description: "RSVP to 3 society events", goal: 3, count: countKind("rsvp") },
  { id: "civic", name: "Civic Voice", description: "Join 2 society meetings", goal: 2, count: countKind("meeting") },
];

export function badgeProgress(points: PointsEntry[]) {
  return BADGES.map((b) => {
    const count = b.count(points);
    return { ...b, count: Math.min(count, b.goal), earned: count >= b.goal };
  });
}

/** Other flats on the society leaderboard (static demo data). */
const NEIGHBOURS = [
  { name: "Dr. K. Raman", block: "B", flat: "502", points: 520 },
  { name: "Sneha Nair", block: "C", flat: "108", points: 410 },
  { name: "Vikram Roy", block: "A", flat: "101", points: 290 },
  { name: "Pooja Hegde", block: "B", flat: "303", points: 240 },
  { name: "Karthik Nair", block: "D", flat: "105", points: 205 },
  { name: "Aditya Roy", block: "A", flat: "201", points: 140 },
  { name: "Anita Bose", block: "D", flat: "306", points: 120 },
  { name: "Pooja Varma", block: "C", flat: "702", points: 95 },
  { name: "Neha Mathur", block: "B", flat: "404", points: 70 },
];

export function leaderboard(state: DemoState) {
  const { resident } = state;
  const rows = [
    ...NEIGHBOURS.filter((n) => !(n.block === resident.block && n.flat === resident.flat)).map((n) => ({ ...n, me: false })),
    { name: resident.name, block: resident.block, flat: resident.flat, points: totalPoints(state.points), me: true },
  ];
  rows.sort((a, b) => b.points - a.points || Number(b.me) - Number(a.me));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

/** Tower standings: average points per flat on the leaderboard, by block. */
export function towerStandings(state: DemoState) {
  const by = new Map<string, { total: number; flats: number }>();
  for (const row of leaderboard(state)) {
    const cur = by.get(row.block) ?? { total: 0, flats: 0 };
    by.set(row.block, { total: cur.total + row.points, flats: cur.flats + 1 });
  }
  return [...by.entries()]
    .map(([block, v]) => ({ block, average: Math.round(v.total / v.flats), flats: v.flats }))
    .sort((a, b) => b.average - a.average);
}
