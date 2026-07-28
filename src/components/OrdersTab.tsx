import { useState } from "react";
import { Order, OrderStatus, ORDER_STATUS_FLOW, ORDER_STATUS_LABEL, UGX, VENDORS } from "../data";

function statusTone(status: OrderStatus): string {
  if (status === "cancelled" || status === "refunded") return "text-[var(--color-accent-coral)] bg-[var(--color-accent-coral)]/10";
  if (status === "return_requested") return "text-[var(--color-tertiary)] bg-[var(--color-tertiary)]/15";
  if (status === "delivered") return "text-emerald-700 bg-emerald-50";
  return "text-[var(--color-primary)] bg-[var(--color-primary-container)]/30";
}

function OrderTimeline({ order }: { order: Order }) {
  const isTerminalOther = order.status === "cancelled" || order.status === "return_requested" || order.status === "refunded";
  return (
    <div className="mt-5">
      {isTerminalOther ? (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold ${statusTone(order.status)}`}>
          <span className="material-symbols-outlined text-[16px]">
            {order.status === "return_requested" ? "assignment_return" : "cancel"}
          </span>
          {ORDER_STATUS_LABEL[order.status]}
        </div>
      ) : (
        <div className="flex items-center">
          {ORDER_STATUS_FLOW.map((step, i) => {
            const stepIndex = ORDER_STATUS_FLOW.indexOf(step);
            const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status);
            const reached = stepIndex <= currentIndex;
            return (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold ${reached ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-cream)] text-[var(--color-on-surface-variant)]"}`}>
                    {reached ? <span className="material-symbols-outlined text-[15px]">check</span> : i + 1}
                  </div>
                  <span className={`text-[9.5px] uppercase tracking-wider font-semibold text-center max-w-[64px] ${reached ? "text-[var(--color-primary)]" : "text-[var(--color-on-surface-variant)]"}`}>
                    {ORDER_STATUS_LABEL[step].replace("Order ", "")}
                  </span>
                </div>
                {i < ORDER_STATUS_FLOW.length - 1 && (
                  <div className={`h-[2px] flex-1 mx-1 rounded ${reached && stepIndex < currentIndex ? "bg-[var(--color-primary)]" : "bg-[var(--color-outline-variant)]/60"}`} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OrdersTab({ orders, onRequestReturn, onShop }: {
  orders: Order[];
  onRequestReturn: (orderId: string) => void;
  onShop: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(orders[0]?.id ?? null);
  const sorted = [...orders].sort((a, b) => b.placedAt - a.placedAt);

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-12 lg:px-20 py-8 sm:py-14">
      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Your Orders</span>
      <h1 className="font-display text-[clamp(28px,5vw,40px)] text-[var(--color-primary)] mt-2 mb-7 font-semibold">Order history &amp; tracking</h1>

      {sorted.length === 0 ? (
        <div className="bg-[var(--color-surface-cream)] rounded-3xl p-10 text-center">
          <span className="material-symbols-outlined text-[36px] text-[var(--color-primary)]">receipt_long</span>
          <p className="text-[14px] text-[var(--color-on-surface-variant)] mt-3">You haven't placed any orders yet.</p>
          <button onClick={onShop} className="mt-5 bg-[var(--color-primary)] text-white px-6 py-3 rounded-full text-[12px] uppercase tracking-widest font-semibold">
            Start shopping
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {sorted.map(order => {
            const isOpen = expanded === order.id;
            const canReturn = order.status === "delivered";
            const vendorIds = Array.from(new Set(order.items.map(i => i.vendorId)));
            return (
              <div key={order.id} className="bg-white rounded-3xl soft-shadow border border-[var(--color-outline-variant)]/40 overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : order.id)} className="w-full flex items-center justify-between p-5 sm:p-6 text-left">
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--color-primary)]">#{order.id.slice(-8).toUpperCase()}</div>
                    <div className="text-[12px] text-[var(--color-on-surface-variant)] mt-0.5">
                      {new Date(order.placedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} · {order.items.reduce((s, i) => s + i.qty, 0)} item{order.items.reduce((s, i) => s + i.qty, 0) !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${statusTone(order.status)}`}>{ORDER_STATUS_LABEL[order.status]}</span>
                    <span className="font-display text-[16px] text-[var(--color-primary)] font-semibold">{UGX(order.subtotal)}</span>
                    <span className={`material-symbols-outlined text-[var(--color-primary)] transition-transform ${isOpen ? "rotate-180" : ""}`}>expand_more</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 border-t border-[var(--color-outline-variant)]/40 pt-5">
                    <OrderTimeline order={order} />

                    <div className="mt-6 space-y-3">
                      {vendorIds.map(vid => {
                        const vendor = VENDORS.find(v => v.id === vid);
                        const items = order.items.filter(i => i.vendorId === vid);
                        return (
                          <div key={vid} className="bg-[var(--color-surface-cream)] rounded-2xl p-4">
                            <div className="text-[11px] uppercase tracking-widest font-semibold text-[var(--color-on-surface-variant)] mb-2">
                              Shipped by {vendor?.name || "All My Skin"}
                            </div>
                            {items.map(i => (
                              <div key={i.productId} className="flex justify-between text-[13px] py-1">
                                <span className="text-[var(--color-on-surface)]">{i.name} × {i.qty}</span>
                                <span className="text-[var(--color-on-surface-variant)]">{UGX(i.price * i.qty)}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      <span className="text-[13px] text-[var(--color-on-surface-variant)]">Order total</span>
                      <span className="font-display text-[18px] text-[var(--color-primary)] font-semibold">{UGX(order.subtotal)}</span>
                    </div>

                    {canReturn && (
                      <button
                        onClick={() => onRequestReturn(order.id)}
                        className="mt-5 border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-2.5 rounded-full text-[12px] uppercase tracking-widest font-semibold hover:bg-[var(--color-primary)] hover:text-white transition"
                      >
                        Request a return
                      </button>
                    )}
                    {order.status === "return_requested" && (
                      <p className="mt-5 text-[12px] text-[var(--color-on-surface-variant)]">Your return request has been submitted and is being reviewed.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
