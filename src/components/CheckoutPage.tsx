import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Product, UGX } from "../data";
import { Session } from "../auth";
import { PAYPAL_CLIENT_ID, PAYMENT_METHODS, PaymentMethodId, BANK_DETAILS, MOBILE_MONEY_DETAILS, formatUsd } from "../payments";
import { SafeImage } from "./SafeImage";
import { Breadcrumbs } from "./Breadcrumbs";

type CartLine = { productId: string; qty: number; p: Product };

type ConfirmInfo = {
  name: string;
  phone?: string;
  address?: string;
  paymentMethod: string;
  paymentReference?: string;
};

type Props = {
  session: Session;
  cartFull: CartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  onConfirm: (info: ConfirmInfo) => void;
  onCancel: () => void;
};

const normPhone = (v: string) => v.replace(/[\s\-()]/g, "");
const validPhone = (v: string) => /^(?:\+256|0)7\d{8}$/.test(normPhone(v));

export default function CheckoutPage({ session, cartFull, subtotal, shipping, total, onConfirm, onCancel }: Props) {
  const [name, setName] = useState(session.name || "");
  const [phone, setPhone] = useState(session.role !== "guest" ? "" : "");
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [momoStage, setMomoStage] = useState<"idle" | "prompt" | "confirming">("idle");
  const [paypalError, setPaypalError] = useState<string | null>(null);

  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;

  const confirmOrder = useCallback((reference?: string) => {
    confirmRef.current({
      name: name.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      paymentMethod: method ? PAYMENT_METHODS.find(m => m.id === method)!.label : "",
      paymentReference: reference,
    });
  }, [name, phone, address, method]);

  const selected = PAYMENT_METHODS.find(m => m.id === method);
  const phoneRequired = method === "mtn" || method === "airtel";
  const phoneInvalid = phoneRequired && !validPhone(phone);
  const momo = method === "mtn" || method === "airtel" ? MOBILE_MONEY_DETAILS[method as "mtn" | "airtel"] : null;

  const momoRef = useRef(method);
  momoRef.current = method;
  const totalRef = useRef(total);
  totalRef.current = total;
  const phoneRef = useRef(phone);
  phoneRef.current = phone;

  useEffect(() => { setMomoStage("idle"); }, [method]);

  const usdAmount = useMemo(() => formatUsd(total), [total]);

  const resetToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const placeMomo = () => {
    if (phoneInvalid) return;
    setMomoStage("prompt");
    resetToTop();
  };

  const confirmMomo = () => {
    setMomoStage("confirming");
    confirmOrder(`MOMO-${Date.now().toString(36).toUpperCase()}`);
  };

  return (
    <div className="fixed inset-0 z-[165] bg-white overflow-y-auto animate-fadeUp">
      <div className="max-w-6xl mx-auto px-5 sm:px-12 lg:px-20 py-6 sm:py-10">
        <Breadcrumbs trail={[{ label: "Home", onClick: onCancel }, { label: "Checkout" }]} />

        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Secure Checkout</span>
            <h1 className="font-display text-[clamp(26px,5vw,36px)] text-[var(--color-primary)] mt-1 font-semibold">Almost there.</h1>
          </div>
          <button onClick={onCancel} className="w-10 h-10 rounded-full bg-[var(--color-surface-cream)] flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-primary-container)]/40 transition">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* LEFT — contact + payment */}
          <div className="space-y-6">
            {/* CONTACT & DELIVERY */}
            <section className="bg-white rounded-3xl soft-shadow border border-[var(--color-outline-variant)]/40 p-6 sm:p-7">
              <div className="flex items-center gap-2.5 mb-5">
                <span className="w-9 h-9 rounded-full bg-[var(--color-primary-container)]/40 text-[var(--color-primary)] flex items-center justify-center text-[14px] font-bold">1</span>
                <h2 className="font-display text-[19px] text-[var(--color-primary)] font-semibold">Contact &amp; delivery</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full name" value={name} onChange={setName} placeholder="Amina Nakato" icon="person" />
                <Field label="Phone (for delivery & MoMo)" value={phone} onChange={setPhone} placeholder="+256 7XX XXX XXX" icon="call" error={phoneInvalid ? "Enter a valid Ugandan number (e.g. +256 7…) — required for mobile money." : undefined} />
                <div className="sm:col-span-2">
                  <Field label="Delivery address (optional)" value={address} onChange={setAddress} placeholder="e.g. Plot 12, Acacia Avenue, Kololo" icon="home_pin" />
                </div>
              </div>
            </section>

            {/* PAYMENT METHOD */}
            <section className="bg-white rounded-3xl soft-shadow border border-[var(--color-outline-variant)]/40 p-6 sm:p-7">
              <div className="flex items-center gap-2.5 mb-5">
                <span className="w-9 h-9 rounded-full bg-[var(--color-primary-container)]/40 text-[var(--color-primary)] flex items-center justify-center text-[14px] font-bold">2</span>
                <h2 className="font-display text-[19px] text-[var(--color-primary)] font-semibold">Payment method</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                      method === m.id ? "border-[var(--color-primary)] bg-[var(--color-primary-container)]/20" : "border-[var(--color-outline-variant)]/50 hover:border-[var(--color-primary)]/50"
                    }`}
                  >
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${method === m.id ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-cream)] text-[var(--color-primary)]"}`}>
                      <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-semibold text-[var(--color-on-surface)]">{m.label}</span>
                      <span className="block text-[11.5px] text-[var(--color-on-surface-variant)]">{m.blurb}</span>
                    </span>
                  </button>
                ))}
              </div>

              {/* Method-specific panel */}
              {selected && (
                <div className="mt-5 rounded-2xl bg-[var(--color-surface-cream)] p-5 animate-fadeUp">
                  {method === "mtn" || method === "airtel" ? (
                    momoStage === "prompt" ? (
                      <div className="text-center">
                        <div className="w-14 h-14 mx-auto rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center animate-pulse">
                          <span className="material-symbols-outlined text-[26px]">phone_android</span>
                        </div>
                        <h3 className="font-display text-[18px] text-[var(--color-primary)] font-semibold mt-4">Check {phone || "your phone"}</h3>
                        <p className="text-[13.5px] text-[var(--color-on-surface-variant)] mt-2 leading-relaxed">
                          {momo!.prompt} Confirm the payment of <strong className="text-[var(--color-primary)]">{UGX(total)}</strong> to {momo!.merchant}.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center mt-5">
                          <button onClick={confirmMomo} className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-full text-[12px] uppercase tracking-widest font-semibold disabled:opacity-50">
                            I've confirmed payment
                          </button>
                          <button onClick={() => setMomoStage("idle")} className="px-6 py-3 rounded-full border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] text-[12px] uppercase tracking-widest font-semibold">
                            Go back
                          </button>
                        </div>
                        <p className="text-[10.5px] text-[var(--color-on-surface-variant)] mt-4">Demo build — live MoMo requires the merchant payment API on a backend.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[13px] text-[var(--color-on-surface-variant)] leading-relaxed mb-4">
                          {momo!.prompt} Amount due: <strong className="text-[var(--color-primary)]">{UGX(total)}</strong>.
                        </p>
                        <button onClick={placeMomo} disabled={phoneInvalid || !name.trim()} className="bg-[var(--color-primary)] text-white px-7 py-3 rounded-full text-[12px] uppercase tracking-widest font-semibold disabled:opacity-40 hover:bg-[var(--color-primary-fixed-dim)] hover:text-[var(--color-primary)] transition">
                          Pay {UGX(total)} with {selected.label}
                        </button>
                        {phoneInvalid && <p className="text-[11.5px] text-[var(--color-error)] mt-2">Enter a valid phone number above to continue.</p>}
                      </div>
                    )
                  ) : method === "bank" ? (
                    <div>
                      <p className="text-[13px] text-[var(--color-on-surface-variant)] leading-relaxed mb-4">Transfer the exact amount and your order will be confirmed once funds reflect (usually within 1 business day).</p>
                      <div className="rounded-2xl bg-white border border-[var(--color-outline-variant)]/40 p-4 space-y-1.5 text-[13.5px]">
                        <div><span className="text-[var(--color-on-surface-variant)]">Bank:</span> <strong className="text-[var(--color-on-surface)]">{BANK_DETAILS.bank}</strong></div>
                        <div><span className="text-[var(--color-on-surface-variant)]">Account name:</span> <strong className="text-[var(--color-on-surface)]">{BANK_DETAILS.accountName}</strong></div>
                        <div><span className="text-[var(--color-on-surface-variant)]">Account number:</span> <strong className="text-[var(--color-on-surface)]">{BANK_DETAILS.accountNumber}</strong></div>
                        <div><span className="text-[var(--color-on-surface-variant)]">Amount:</span> <strong className="text-[var(--color-primary)]">{UGX(total)}</strong></div>
                      </div>
                      <button onClick={() => confirmOrder(`TRF-${Date.now().toString(36).toUpperCase()}`)} className="mt-4 bg-[var(--color-primary)] text-white px-7 py-3 rounded-full text-[12px] uppercase tracking-widest font-semibold hover:bg-[var(--color-primary-fixed-dim)] hover:text-[var(--color-primary)] transition">
                        I've transferred {UGX(total)}
                      </button>
                    </div>
                  ) : method === "paypal" ? (
                    <div>
                      {PAYPAL_CLIENT_ID ? (
                        <>
                          <p className="text-[13px] text-[var(--color-on-surface-variant)] leading-relaxed mb-4">
                            Total ≈ <strong className="text-[var(--color-primary)]">${usdAmount} USD</strong> (PayPal doesn't support UGX). You'll pay securely inside PayPal — your card details are never shared with All My Skin.
                          </p>
                          <PayPalButton amountUsd={usdAmount} onError={setPaypalError} onSuccess={(id) => confirmOrder(`PAYPAL-${id}`)} />
                          {paypalError && <p className="text-[11.5px] text-[var(--color-error)] mt-2">{paypalError}</p>}
                        </>
                      ) : (
                        <p className="text-[13px] text-[var(--color-on-surface-variant)] leading-relaxed">
                          PayPal is being configured for your store. Please choose another method for now — once a PayPal client ID is added, the button will appear here automatically.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-[13px] text-[var(--color-on-surface-variant)] leading-relaxed mb-4">
                        Pay in cash when your order arrives. Have the exact change ready if possible.
                      </p>
                      <button onClick={() => confirmOrder(`COD-${Date.now().toString(36).toUpperCase()}`)} className="bg-[var(--color-primary)] text-white px-7 py-3 rounded-full text-[12px] uppercase tracking-widest font-semibold hover:bg-[var(--color-primary-fixed-dim)] hover:text-[var(--color-primary)] transition">
                        Place order — pay on delivery
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PRIVACY NOTE */}
              <p className="mt-5 text-[11.5px] text-[var(--color-on-surface-variant)] leading-relaxed flex items-start gap-1.5">
                <span className="material-symbols-outlined text-[15px] shrink-0">lock</span>
                <span>Your payment details are protected: card numbers are processed only inside PayPal's secure pages and never stored by All My Skin. Mobile money numbers are used solely for this transaction. No payment credentials are saved on this device.</span>
              </p>
            </section>
          </div>

          {/* RIGHT — summary */}
          <aside className="lg:sticky lg:top-[120px] bg-white rounded-3xl soft-shadow border border-[var(--color-outline-variant)]/40 p-6">
            <h2 className="font-display text-[19px] text-[var(--color-primary)] font-semibold mb-4">Order summary</h2>
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 mb-4">
              {cartFull.map(ci => (
                <div key={ci.productId} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[var(--color-surface-cream)]">
                    <SafeImage src={ci.p.image} alt={ci.p.name} initials={ci.p.name} className="w-full h-full object-cover" />
                    <span className="absolute -top-0 -right-0 w-5 h-5 rounded-bl-lg bg-[var(--color-primary)] text-white text-[10px] font-bold flex items-center justify-center">×{ci.qty}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold text-[var(--color-on-surface)] truncate">{ci.p.name}</div>
                    <div className="text-[11px] text-[var(--color-on-surface-variant)]">{UGX(ci.p.price)}</div>
                  </div>
                  <div className="text-[13px] font-semibold text-[var(--color-primary)]">{UGX(ci.p.price * ci.qty)}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--color-outline-variant)]/60 pt-4 space-y-2 text-[13px]">
              <div className="flex justify-between text-[var(--color-on-surface-variant)]"><span>Subtotal</span><span>{UGX(subtotal)}</span></div>
              <div className="flex justify-between text-[var(--color-on-surface-variant)]"><span>Shipping</span><span>{shipping === 0 ? "FREE" : UGX(shipping)}</span></div>
              <div className="flex justify-between text-[17px] font-semibold text-[var(--color-primary)]"><span>Total</span><span>{UGX(total)}</span></div>
            </div>
            {method && method !== "mtn" && method !== "airtel" && method !== "bank" && method !== "paypal" && method !== "cod" && null}
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ------------------ PayPal client-side buttons ------------------ */
function PayPalButton({ amountUsd, onSuccess, onError }: { amountUsd: string; onSuccess: (orderId: string) => void; onError: (msg: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const boot = () => {
      if (cancelled) return;
      const w = window as unknown as { paypal?: { Buttons: (cfg: Record<string, unknown>) => { render: (el: HTMLElement) => void } } };
      if (!w.paypal) { setState("error"); return; }
      try {
        w.paypal.Buttons({
          style: { layout: "vertical", shape: "pill", color: "gold", height: 45 },
          createOrder: (_d: unknown, actions: { order: { create: (cfg: unknown) => Promise<string> } }) =>
            actions.order.create({
              purchase_units: [{ amount: { value: amountUsd, currency_code: "USD" } }],
              application_context: { shipping_preference: "NO_SHIPPING" },
            }),
          onApprove: (data: { orderID: string }, actions: { order: { capture: () => Promise<unknown> } }) =>
            actions.order.capture().then(() => { if (!cancelled) onSuccess(data.orderID); }),
          onCancel: () => {},
          onError: () => { if (!cancelled) onError("PayPal couldn't complete this payment. Try again or choose another method."); },
        }).render(ref.current as HTMLElement);
        setState("ready");
      } catch {
        setState("error");
      }
    };
    if (!PAYPAL_CLIENT_ID) return;
    if (window && (window as unknown as { paypal?: unknown }).paypal) { boot(); return; }
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
    s.async = true;
    s.onload = boot;
    s.onerror = () => { if (!cancelled) setState("error"); };
    document.head.appendChild(s);
    return () => { cancelled = true; };
  }, [amountUsd, onSuccess, onError]);

  if (state === "loading") return <div className="pulse-soft text-[13px] text-[var(--color-on-surface-variant)] py-4 text-center">Loading PayPal…</div>;
  if (state === "error") return <p className="text-[12.5px] text-[var(--color-error)]">Couldn't load PayPal right now. Please try again or pick another method.</p>;
  return <div ref={ref} />;
}

function Field({ label, value, onChange, placeholder, icon, error }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: string; error?: string }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-on-surface-variant)] mb-1.5">{label}</div>
      <div className={`flex items-center gap-2 bg-white border rounded-xl px-3.5 py-3 transition focus-within:border-[var(--color-primary)] ${error ? "border-[var(--color-error)]" : "border-[var(--color-outline-variant)]"}`}>
        {icon && <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] text-[18px]">{icon}</span>}
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[14px] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)]/50 outline-none"
        />
      </div>
      {error && <div className="text-[11px] text-[var(--color-error)] mt-1">{error}</div>}
    </label>
  );
}
