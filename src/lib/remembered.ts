const KEY = "xpay_remembered_account";

interface RememberedAccount {
  name: string;
  email: string;
}

/**
 * Purely a UX convenience for the "Welcome back, {name}" screen — stores a
 * display name + email in localStorage so a returning device can be
 * personalized. Never store tokens, passwords, or session data this way;
 * actual auth state lives in the httpOnly session cookie.
 */
export function rememberAccount(account: RememberedAccount) {
  localStorage.setItem(KEY, JSON.stringify(account));
}

export function getRememberedAccount(): RememberedAccount | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function forgetAccount() {
  localStorage.removeItem(KEY);
}
