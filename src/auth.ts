/* ============================================================
   Auth & Persistent Session Layer
   - localStorage backed
   - Role: guest | user | admin
   ============================================================ */

export type Role = "guest" | "user" | "admin" | "vendor" | "clinic";

/* Google OAuth 2.0 client ID (Sign in with Google – client-side flow needs no secret) */
export const GOOGLE_CLIENT_ID = "1078755435065-eh3fs36hbitib5bssmd83rf5mp13fkto.apps.googleusercontent.com";

export type Session = {
  uid: string;
  name: string;
  email: string;
  role: Role;
  token: string;
  loggedAt: number;
  vendorId?: string;
  clinicId?: string;
  provider?: "credentials" | "google" | "guest";
  picture?: string;
  googleSub?: string;
};

export type Account = {
  uid: string;
  name: string;
  email: string;
  password: string; // demo only – never plaintext in prod
  role: "user" | "admin" | "vendor" | "clinic";
  phone?: string;
  city?: string;
  orders?: number;
  createdAt: number;
  vendorId?: string;
  clinicId?: string;
  category?: "buyer" | "seller";
  provider?: "credentials" | "google" | "guest";
  picture?: string;
  googleSub?: string;
};

const NS = "ams_app_v5_";
export const SESSION_KEY = NS + "session";
export const ACCOUNTS_KEY = NS + "accounts";
export const ADMIN_STRING_KEY = "admin_system_string";
export const CART_KEY = NS + "cart";
export const WISH_KEY = NS + "wish";
export const TRENDS_KEY = NS + "trends";
export const ORDERS_KEY = NS + "orders";
export const REVIEWS_KEY = NS + "reviews";
export const APPOINTMENTS_KEY = NS + "appointments";

/* ---------- low-level storage ---------- */
export function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
export function lsSet<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
export function lsDel(key: string) {
  try { localStorage.removeItem(key); } catch {}
}

export const WITHDRAWALS_KEY = NS + "withdrawals";

export type Withdrawal = {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  requestedAt: number;
  resolvedAt?: number;
};

export function getWithdrawals(): Withdrawal[] {
  return lsGet<Withdrawal[]>(WITHDRAWALS_KEY, []);
}

export function saveWithdrawal(w: Withdrawal) {
  const list = getWithdrawals();
  lsSet(WITHDRAWALS_KEY, [w, ...list]);
}

export function updateWithdrawal(id: string, patch: Partial<Withdrawal>) {
  const list = getWithdrawals();
  lsSet(WITHDRAWALS_KEY, list.map(w => w.id === id ? { ...w, ...patch } : w));
}

/* ---------- password hashing (SHA-256, salted) — never store plaintext ---------- */
const PASSWORD_SALT = "ams::";

export async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(PASSWORD_SALT + pw);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function isHashed(pw: string): boolean {
  return /^[0-9a-f]{64}$/.test(pw);
}

/* ---------- accounts (demo seed) ---------- */
/* Seed passwords are stored as salted SHA-256 hashes, never plaintext. */
const SEED_ACCOUNTS: Account[] = [
  { uid: "u_admin", name: "AllMySkin Owner", email: "owner@allmyskin.ug", password: "5cda515a8aafa7ce5afc21c1f195a556da1b1e8c0d5a134e35b39e9301cf3612", role: "admin", phone: "+256 700 100100", city: "Kampala", orders: 0, createdAt: Date.now() - 86400000 * 600 },
  { uid: "u_amina", name: "Amina N.", email: "amina@allmyskin.ug", password: "d193b3454058cfb1f87474f98c5130de29adf5eecf3867709657e2c668b0d4b7", role: "user", phone: "+256 776 221144", city: "Ntinda", orders: 7, createdAt: Date.now() - 86400000 * 200 },
  { uid: "u_lillian", name: "Lillian K.", email: "lillian@allmyskin.ug", password: "79e0981b82bc9bc8b3cc4d6227c2d93e18fea7000a9c1b6a02c33c65d24c50d6", role: "user", phone: "+256 700 998877", city: "Kololo", orders: 3, createdAt: Date.now() - 86400000 * 60 },
  { uid: "u_vendor_main", name: "Flagship Supply Team", email: "vendor@allmyskin.ug", password: "7976b0fafe088f0162dc8b62607cc6b696fe2abc614debe996e0dc11d1b50ccf", role: "vendor", phone: "+256 700 300100", city: "Kampala", orders: 0, createdAt: Date.now() - 86400000 * 400, vendorId: "vendor_main" },
  { uid: "u_vendor_glow", name: "Glow Botanicals Team", email: "vendor2@allmyskin.ug", password: "7976b0fafe088f0162dc8b62607cc6b696fe2abc614debe996e0dc11d1b50ccf", role: "vendor", phone: "+256 700 300200", city: "Entebbe", orders: 0, createdAt: Date.now() - 86400000 * 100, vendorId: "vendor_glow" },
  { uid: "u_clinic_kololo", name: "Kololo Dermatology Front Desk", email: "clinic@allmyskin.ug", password: "b1bcd5d6a54347d82b02d959755a98f57faec885a0809a190c9b3ced41db960d", role: "clinic", phone: "+256 700 200100", city: "Kampala", orders: 0, createdAt: Date.now() - 86400000 * 300, clinicId: "c1" },
];

export function getAccounts(): Account[] {
  const all = lsGet<Account[]>(ACCOUNTS_KEY, []);
  if (!all.length) {
    lsSet(ACCOUNTS_KEY, SEED_ACCOUNTS);
    return SEED_ACCOUNTS;
  }
  return all;
}

/* Upgrade any accounts saved before password hashing (plaintext → hash). */
export async function migratePasswordHashes(): Promise<void> {
  const accounts = getAccounts();
  let changed = false;
  const migrated = await Promise.all(accounts.map(async (a) => {
    if (!isHashed(a.password)) {
      changed = true;
      return { ...a, password: await hashPassword(a.password) };
    }
    return a;
  }));
  if (changed) lsSet(ACCOUNTS_KEY, migrated);
}

export async function registerAccount(input: { name: string; email: string; password: string; phone?: string; city?: string; category?: "buyer" | "seller" }): Promise<{ ok: boolean; error?: string; account?: Account }> {
  const accounts = getAccounts();
  const exists = accounts.find(a => a.email.toLowerCase() === input.email.toLowerCase());
  if (exists) return { ok: false, error: "An account with that email already exists." };
  if (input.password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
  const acc: Account = {
    uid: "u_" + Date.now().toString(36),
    name: input.name.trim(),
    email: input.email.trim(),
    password: await hashPassword(input.password),
    role: "user",
    phone: input.phone,
    city: input.city,
    orders: 0,
    createdAt: Date.now(),
    category: input.category,
  };
  lsSet(ACCOUNTS_KEY, [...accounts, acc]);
  return { ok: true, account: acc };
}

export async function loginWithCredentials(email: string, password: string): Promise<{ ok: boolean; error?: string; session?: Session }> {
  await migratePasswordHashes();
  const accounts = getAccounts();
  const target = await hashPassword(password);
  const match = accounts.find(a => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === target);
  if (!match) return { ok: false, error: "Invalid email or password." };
  const session: Session = {
    uid: match.uid,
    name: match.name,
    email: match.email,
    role: match.role,
    token: "tk_" + crypto.getRandomValues(new Uint32Array(2)).join(""),
    loggedAt: Date.now(),
    provider: "credentials",
    vendorId: match.vendorId,
    clinicId: match.clinicId,
  };
  lsSet(SESSION_KEY, session);
  return { ok: true, session };
}

/* Sign in (or create) an account from a verified Google profile.
   Existing accounts are matched first by Google sub, then by email. */
export function loginWithGoogle(profile: { googleSub: string; email?: string; name?: string; picture?: string }): Session {
  const accounts = getAccounts();
  let acc = accounts.find(a => a.googleSub === profile.googleSub || (profile.email && a.email.toLowerCase() === profile.email.trim().toLowerCase()));

  if (!acc) {
    acc = {
      uid: "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: profile.name || "Google User",
      email: profile.email || "",
      password: "",
      role: "user",
      orders: 0,
      createdAt: Date.now(),
      category: "buyer",
      provider: "google",
      picture: profile.picture,
      googleSub: profile.googleSub,
    };
    lsSet(ACCOUNTS_KEY, [...accounts, acc]);
  }

  const session: Session = {
    uid: acc.uid,
    name: acc.name,
    email: acc.email,
    role: acc.role,
    token: "tk_" + crypto.getRandomValues(new Uint32Array(2)).join(""),
    loggedAt: Date.now(),
    provider: "google",
    picture: acc.picture,
    googleSub: acc.googleSub,
    vendorId: acc.vendorId,
    clinicId: acc.clinicId,
  };
  lsSet(SESSION_KEY, session);
  return session;
}

export function loginAsGuest(): Session {
  const session: Session = {
    uid: "guest_" + Date.now().toString(36),
    name: "Guest Visitor",
    email: "",
    role: "guest",
    token: "guest_token",
    loggedAt: Date.now(),
    provider: "guest",
  };
  lsSet(SESSION_KEY, session);
  return session;
}

export function getSession(): Session | null {
  return lsGet<Session | null>(SESSION_KEY, null);
}

export function logout() {
  lsDel(SESSION_KEY);
}

/* admin config string */
export function getAdminString(): string {
  return lsGet<string>(ADMIN_STRING_KEY, "Welcome to All My Skin — Kampala flagship store. Free same-day delivery within Kampala on orders above UGX 150,000.");
}
export function setAdminString(v: string) {
  lsSet(ADMIN_STRING_KEY, v);
}
