// Single source of truth for the offline demo. Everything lives under one localStorage key,
// so the resident app, guard console and service consoles stay consistent — and because we
// listen to the `storage` event, two browser tabs (e.g. guard + resident) update each other live.

import { useSyncExternalStore } from "react";
import { createSeed, DEFAULT_RESIDENT, STORE_VERSION } from "./seed";
import type { DemoState, Resident } from "./types";

const KEY = "nexgate:demo";
/** Data untouched for this long is re-seeded so the demo always looks current. */
const STALE_MS = 24 * 60 * 60 * 1000;

let cache: { raw: string | null; state: DemoState } | null = null;
let memoryRaw: string | null = null; // fallback when localStorage is unavailable
const listeners = new Set<() => void>();

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readRaw(): string | null {
  const ls = storage();
  if (!ls) return memoryRaw;
  try {
    return ls.getItem(KEY);
  } catch {
    return memoryRaw;
  }
}

function writeRaw(raw: string) {
  memoryRaw = raw;
  try {
    storage()?.setItem(KEY, raw);
  } catch {
    // Quota exceeded or storage blocked — keep the in-memory copy.
  }
}

function parse(raw: string | null): DemoState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DemoState;
    return parsed?.version === STORE_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

function persist(state: DemoState) {
  const raw = JSON.stringify(state);
  writeRaw(raw);
  cache = { raw, state };
}

function emit() {
  listeners.forEach((l) => l());
}

export function getState(): DemoState {
  const raw = readRaw();
  if (cache && cache.raw === raw) return cache.state;

  const parsed = parse(raw);
  if (parsed && Date.now() - new Date(parsed.updatedAt).getTime() < STALE_MS) {
    cache = { raw, state: parsed };
    return parsed;
  }
  // Missing, corrupt, outdated version or stale: re-seed (keeping the resident's identity if we had one).
  persist(createSeed(parsed?.resident ?? DEFAULT_RESIDENT));
  return cache!.state;
}

/**
 * Apply a mutation to a copy of the state and persist it. The recipe may return a value
 * (e.g. points awarded) which is passed back to the caller.
 */
export function update<T>(recipe: (draft: DemoState) => T): T {
  const draft = structuredClone(getState());
  const result = recipe(draft);
  draft.updatedAt = new Date().toISOString();
  persist(draft);
  emit();
  return result;
}

export function resetDemo(resident?: Resident) {
  persist(createSeed(resident ?? getState().resident));
  emit();
}

function onStorage(e: StorageEvent) {
  if (e.key === KEY || e.key === null) emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

// Never rendered (AppShell waits for mount), but must be stable for hydration.
const SERVER_STATE = createSeed(DEFAULT_RESIDENT, 0);

export function useDemoState(): DemoState {
  return useSyncExternalStore(subscribe, getState, () => SERVER_STATE);
}
