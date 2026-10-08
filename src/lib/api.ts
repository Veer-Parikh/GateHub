// Thin client for the Express backend. Only used for "live" sessions — demo sessions never hit the network.

import { getSession } from "./session";

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Defaults to the current session's token. Pass `null` for unauthenticated calls. */
  token?: string | null;
  timeoutMs?: number;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, timeoutMs = 8000 } = opts;
  const token = opts.token === undefined ? getSession()?.token : opts.token;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError("Can't reach the NexGate server", 0);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // plain-text response
  }
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && ("message" in data || "error" in data)
        ? String((data as Record<string, unknown>).message ?? (data as Record<string, unknown>).error)
        : typeof data === "string" && data
          ? data
          : null) ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}
