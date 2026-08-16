/* ============================================================
   Payment configuration
   - Live payment processing (MTN MoMo / Airtel / PayPal)
     requires merchant credentials + a backend.
   - PayPal uses the official client-side JS SDK. Paste your
     PayPal REST app Client ID below to enable real buttons.
   - Card numbers are NEVER stored locally — PayPal processes
     cards inside its own secure iframe.
   ============================================================ */

export const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";

/* Demo conversion for PayPal (PayPal doesn't support UGX). */
export const UGX_PER_USD = 3700;

export type PaymentMethodId = "mtn" | "airtel" | "bank" | "paypal" | "cod";

export const PAYMENT_METHODS: { id: PaymentMethodId; label: string; icon: string; blurb: string }[] = [
  { id: "mtn", label: "MTN Mobile Money", icon: "smartphone", blurb: "Pay instantly with MTN MoMo" },
  { id: "airtel", label: "Airtel Money", icon: "smartphone", blurb: "Pay instantly with Airtel Money" },
  { id: "bank", label: "Bank Transfer", icon: "account_balance", blurb: "Transfer to our business account" },
  { id: "paypal", label: "PayPal", icon: "payments", blurb: "Cards, PayPal balance & more" },
  { id: "cod", label: "Cash on Delivery", icon: "local_shipping", blurb: "Pay when your order arrives" },
];

export const BANK_DETAILS = {
  bank: "Stanbic Bank Uganda",
  accountName: "All My Skin e-commerce Inc.",
  accountNumber: "9030012-345-67",
  branch: "Acacia Mall, Kololo — Kampala",
};

export const MOBILE_MONEY_DETAILS: Record<"mtn" | "airtel", { merchant: string; prompt: string }> = {
  mtn: { merchant: "All My Skin (MTN MoMo Merchant 555400)", prompt: "Dial *165# → MoMoPay, or confirm the push prompt on your phone." },
  airtel: { merchant: "All My Skin (Airtel Money Merchant 555401)", prompt: "Dial *185# → Airtel Money, or confirm the push prompt on your phone." },
};

export function formatUsd(ugx: number): string {
  return (ugx / UGX_PER_USD).toFixed(2);
}
