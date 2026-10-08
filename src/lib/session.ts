// Who is signed in, and whether they're using the real backend ("live") or the offline demo.

import { useSyncExternalStore } from "react";
import type { Role } from "./types";

export const DEMO_PASSWORD = "password123";

export const PERSONAS: Record<
  Role,
  { name: string; displayName: string; label: string; description: string; providerId?: string; home: string }
> = {
  user: { name: "Arjun", displayName: "Arjun Mehta", label: "Resident", description: "Tower A · Flat 304", home: "/user" },
  security: { name: "Vikram", displayName: "Vikram Singh", label: "Guard", description: "North Gate 1 · Duty marshal", home: "/security" },
  plumber: { name: "Raju", displayName: "Raju Sharma", label: "Plumber", description: "QuickPlumb Services", providerId: "p1", home: "/plumber" },
  laundry: { name: "FreshPress", displayName: "FreshPress Laundry", label: "Laundry", description: "FreshPress Care", providerId: "l1", home: "/laundry" },
};

export interface Session {
  role: Role;
  displayName: string;
  token: string;
  mode: "demo" | "live";
  startedAt: string;
}

const KEY = "nexgate:session";
const LEGACY_TOKEN_KEY = "token";

let cache: { raw: string | null; session: Session | null } = { raw: null, session: null };
const listeners = new Set<() => void>();

function read(): Session | null {
  let raw: string | null = null;
  try {
    raw = typeof window === "undefined" ? null : window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw === cache.raw) return cache.session;
  let session: Session | null = null;
  try {
    session = raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    session = null;
  }
  cache = { raw, session };
  return session;
}

function write(session: Session | null) {
  try {
    if (session) {
      window.localStorage.setItem(KEY, JSON.stringify(session));
      window.localStorage.setItem(LEGACY_TOKEN_KEY, session.token);
    } else {
      window.localStorage.removeItem(KEY);
      window.localStorage.removeItem(LEGACY_TOKEN_KEY);
    }
  } catch {
    // storage unavailable — session lives only for this page view
  }
  listeners.forEach((l) => l());
}

export const getSession = read;

export function startDemoSession(role: Role, displayName?: string): Session {
  const session: Session = {
    role,
    displayName: displayName || PERSONAS[role].displayName,
    token: `demo-${role}-${Date.now().toString(36)}`,
    mode: "demo",
    startedAt: new Date().toISOString(),
  };
  write(session);
  return session;
}

export function startLiveSession(role: Role, token: string, displayName: string): Session {
  const session: Session = { role, displayName, token, mode: "live", startedAt: new Date().toISOString() };
  write(session);
  return session;
}

export function endSession() {
  write(null);
}

export function isLiveSession(session: Session | null = read()) {
  return session?.mode === "live";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
