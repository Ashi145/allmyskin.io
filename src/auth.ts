/* ============================================================
   Auth & Persistent Session Layer
   - localStorage backed
   - Role: guest | user | admin
   ============================================================ */

export type Role = "guest" | "user" | "admin" | "vendor" | "clinic";

export type Session = {
  uid: string;
  name: string;
  email: string;
  role: Role;
  token: string;
  loggedAt: number;
  vendorId?: string;
  clinicId?: string;
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

/* ---------- accounts (demo seed) ---------- */
const SEED_ACCOUNTS: Account[] = [
  { uid: "u_admin", name: "AllMySkin Owner", email: "owner@allmyskin.ug", password: "owner123", role: "admin", phone: "+256 700 100100", city: "Kampala", orders: 0, createdAt: Date.now() - 86400000 * 600 },
  { uid: "u_amina", name: "Amina N.", email: "amina@allmyskin.ug", password: "amina123", role: "user", phone: "+256 776 221144", city: "Ntinda", orders: 7, createdAt: Date.now() - 86400000 * 200 },
  { uid: "u_lillian", name: "Lillian K.", email: "lillian@allmyskin.ug", password: "lillian123", role: "user", phone: "+256 700 998877", city: "Kololo", orders: 3, createdAt: Date.now() - 86400000 * 60 },
  { uid: "u_vendor_main", name: "Flagship Supply Team", email: "vendor@allmyskin.ug", password: "vendor123", role: "vendor", phone: "+256 700 300100", city: "Kampala", orders: 0, createdAt: Date.now() - 86400000 * 400, vendorId: "vendor_main" },
  { uid: "u_vendor_glow", name: "Glow Botanicals Team", email: "vendor2@allmyskin.ug", password: "vendor123", role: "vendor", phone: "+256 700 300200", city: "Entebbe", orders: 0, createdAt: Date.now() - 86400000 * 100, vendorId: "vendor_glow" },
  { uid: "u_clinic_kololo", name: "Kololo Dermatology Front Desk", email: "clinic@allmyskin.ug", password: "clinic123", role: "clinic", phone: "+256 700 200100", city: "Kampala", orders: 0, createdAt: Date.now() - 86400000 * 300, clinicId: "c1" },
];

export function getAccounts(): Account[] {
  const all = lsGet<Account[]>(ACCOUNTS_KEY, []);
  if (!all.length) {
    lsSet(ACCOUNTS_KEY, SEED_ACCOUNTS);
    return SEED_ACCOUNTS;
  }
  return all;
}

export function registerAccount(input: { name: string; email: string; password: string; phone?: string; city?: string }): { ok: boolean; error?: string; account?: Account } {
  const accounts = getAccounts();
  const exists = accounts.find(a => a.email.toLowerCase() === input.email.toLowerCase());
  if (exists) return { ok: false, error: "An account with that email already exists." };
  if (input.password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
  const acc: Account = {
    uid: "u_" + Date.now().toString(36),
    name: input.name.trim(),
    email: input.email.trim(),
    password: input.password,
    role: "user",
    phone: input.phone,
    city: input.city,
    orders: 0,
    createdAt: Date.now(),
  };
  lsSet(ACCOUNTS_KEY, [...accounts, acc]);
  return { ok: true, account: acc };
}

export function loginWithCredentials(email: string, password: string): { ok: boolean; error?: string; session?: Session } {
  const accounts = getAccounts();
  const match = accounts.find(a => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password);
  if (!match) return { ok: false, error: "Invalid email or password." };
  const session: Session = {
    uid: match.uid,
    name: match.name,
    email: match.email,
    role: match.role,
    token: "tk_" + crypto.getRandomValues(new Uint32Array(2)).join(""),
    loggedAt: Date.now(),
    vendorId: match.vendorId,
    clinicId: match.clinicId,
  };
  lsSet(SESSION_KEY, session);
  return { ok: true, session };
}

export function loginAsGuest(): Session {
  const session: Session = {
    uid: "guest_" + Date.now().toString(36),
    name: "Guest Visitor",
    email: "",
    role: "guest",
    token: "guest_token",
    loggedAt: Date.now(),
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
