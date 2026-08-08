/**
 * Thin wrapper around fetch() for talking to the /api/* Cloudflare Pages
 * Functions. Sessions are a signed, httpOnly cookie (see functions/api/lib/
 * session.ts), so we always send credentials and never touch tokens here.
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiError(body?.error ?? res.statusText, res.status);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
};

// ---- Shared types, mirrored from the Functions layer ----

export type MoneyProvider = "mpesa" | "airtel";

export interface SessionUser {
  id: string;
  clientNickname: string; // e.g. "client_96c2a0a62" — see functions/api/lib/deriv.ts
  name: string | null;
  country: string | null;
  derivEmail: string | null;
  phone: string | null;
  provider: MoneyProvider | null;
  onboardingStep:
    | "profile"
    | "mpesa"
    | "password"
    | "complete";
}

export interface WalletBalance {
  currency: string;
  amount: number;
  asOf: string;
}

export interface Transaction {
  id: string;
  type: "deposit" | "withdraw";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
}
