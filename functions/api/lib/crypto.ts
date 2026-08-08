/**
 * Encrypts the per-user Deriv OAuth token before it's written to D1. The
 * key comes from the TOKEN_ENCRYPTION_KEY secret (never commit it) —
 * generate one with `openssl rand -base64 32` and set it with
 * `wrangler pages secret put TOKEN_ENCRYPTION_KEY`.
 */

import type { Env } from "./db";

async function importKey(env: Env): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(env.TOKEN_ENCRYPTION_KEY), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptToken(env: Env, plaintext: string): Promise<string> {
  const key = await importKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptToken(env: Env, stored: string): Promise<string> {
  const key = await importKey(env);
  const combined = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}
