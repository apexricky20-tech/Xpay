/**
 * Auth primitives for the Workers runtime. No native bcrypt/argon2 here —
 * Workers ship the standard Web Crypto API, so we use PBKDF2-SHA256 with a
 * high iteration count, which is a supported, dependency-free choice for
 * this environment.
 */

const PBKDF2_ITERATIONS = 210_000;
const SESSION_COOKIE = "xpay_session";
const SESSION_TTL_DAYS = 30;

function toHex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toHex(salt.buffer)}$${toHex(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [, iterStr, saltHex, hashHex] = stored.split("$");
  const iterations = Number(iterStr);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromHex(saltHex), iterations, hash: "SHA-256" },
    key,
    256
  );
  return toHex(bits) === hashHex;
}

export function newSessionToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)).buffer);
}

export function sessionCookieHeader(token: string, maxAgeDays = SESSION_TTL_DAYS): string {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  // Secure + HttpOnly + SameSite=Lax: never readable from client JS, and
  // sent on top-level navigation (needed for the Deriv OAuth redirect back).
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export function readSessionToken(request: Request): string | null {
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}

export const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
