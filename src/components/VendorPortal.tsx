import { useState, Dispatch, SetStateAction } from "react";
import { Product, Order, OrderStatus, ORDER_STATUS_FLOW, ORDER_STATUS_LABEL, Vendor, UGX } from "../data";
import { SafeImage } from "./SafeImage";

type SubTab = "overview" | "catalog" | "orders";

const CATEGORIES: Product["category"][] = ["serum", "oil", "mask", "spf", "cleanser", "body"];

export default function VendorPortal({ vendorId, vendors, products, setProducts, orders, setOrders }: {
  vendorId: string;
  vendors: Vendor[];
  products: Product[];
  setProducts: Dispatch<SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: Dispatch<SetStateAction<Order[]>>;
}) {
  const [sub, setSub] = useState<SubTab>("overview");
  const vendor = vendors.find(v => v.id === vendorId);
  const myProducts = products.filter(p => p.vendorId === vendorId);
  const myOrders = orders.filter(o => o.items.some(i => i.vendorId === vendorId));

  const myRevenue = myOrders
    .filter(o => o.status !== "cancelled" && o.status !== "refunded")
    .reduce((sum, o) => sum + o.items.filter(i => i.vendorId === vendorId).reduce((s, i) => s + i.price * i.qty, 0), 0);
  const pendingOrders = myOrders.filter(o => o.status === "placed" || o.status === "accepted" || o.status === "processing").length;
  const lowStock = myProducts.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStock = myProducts.filter(p => p.stock <= 0).length;

  const [newProduct, setNewProduct] = useState({
    name: "", tagline: "", price: "", category: "serum" as Product["category"], image: "", stock: "10", description: "", ingredients: "",
  });

  const addProduct = () => {
    if (!newProduct.name.trim() || !newProduct.price) return;
    const p: Product = {
      id: "p_" + Date.now().toString(36),
      name: newProduct.name.trim(),
      tagline: newProduct.tagline.trim() || "New arrival",
      price: Number(newProduct.price) || 0,
      category: newProduct.category,
      image: newProduct.image.trim() || "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
      inStock: Number(newProduct.stock) > 0,
      stock: Number(newProduct.stock) || 0,
      description: newProduct.description.trim() || "Details coming soon.",
      ingredients: newProduct.ingredients.split(",").map(s => s.trim()).filter(Boolean),
      vendorId,
    };
    setProducts(prev => [p, ...prev]);
    setNewProduct({ name: "", tagline: "", price: "", category: "serum", image: "", stock: "10", description: "", ingredients: "" });
  };

  const updateProduct = (id: string, patch: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...patch, inStock: (patch.stock ?? p.stock) > 0 } : p));
  };

  const advanceOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const idx = ORDER_STATUS_FLOW.indexOf(o.status);
      const next = ORDER_STATUS_FLOW[Math.min(idx + 1, ORDER_STATUS_FLOW.length - 1)];
      if (next === o.status) return o;
      return { ...o, status: next, updatedAt: Date.now(), history: [...o.history, { status: next, at: Date.now() }] };
    }));
  };

  const cancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId
      ? { ...o, status: "cancelled" as OrderStatus, updatedAt: Date.now(), history: [...o.history, { status: "cancelled" as OrderStatus, at: Date.now() }] }
      : o));
  };

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-12 lg:px-20 py-8 sm:py-14">
      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Private Vendor Portal</span>
      <h1 className="font-display text-[clamp(28px,5vw,40px)] text-[var(--color-primary)] mt-2 mb-1 font-semibold">{vendor?.name || "Vendor"}</h1>
      <p className="text-[13px] text-[var(--color-on-surface-variant)] mb-7">
        This is a private operational workspace — none of this is visible to customers on the storefront.
      </p>

      <div className="flex gap-2 mb-8 border-b border-[var(--color-outline-variant)]/50 overflow-x-auto">
        {(["overview", "catalog", "orders"] as SubTab[]).map(s => (
          <button
            key={s}
            onClick={() => setSub(s)}
            className={`px-4 py-2.5 text-[12px] uppercase tracking-widest font-semibold whitespace-nowrap border-b-2 transition ${sub === s ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-on-surface-variant)]"}`}
          >
            {s === "overview" ? "Overview" : s === "catalog" ? "Catalog & inventory" : `Orders${pendingOrders ? ` (${pendingOrders})` : ""}`}
          </button>
        ))}
      </div>

      {sub === "overview" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="payments" label="Revenue (active orders)" value={UGX(myRevenue)} />
          <StatCard icon="pending_actions" label="Orders to fulfill" value={String(pendingOrders)} tone={pendingOrders > 0 ? "warn" : "ok"} />
          <StatCard icon="inventory_2" label="Low stock SKUs" value={String(lowStock)} tone={lowStock > 0 ? "warn" : "ok"} />
          <StatCard icon="block" label="Out of stock SKUs" value={String(outOfStock)} tone={outOfStock > 0 ? "bad" : "ok"} />
        </div>
      )}

      {sub === "catalog" && (
        <div className="space-y-8">
          <div className="bg-[var(--color-surface-cream)] rounded-3xl p-6">
            <h3 className="font-display text-[17px] text-[var(--color-primary)] font-semibold mb-4">Submit a new product</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={newProduct.name} onChange={e => setNewProduct(s => ({ ...s, name: e.target.value }))} placeholder="Product name" className="rounded-xl border border-[var(--color-outline-variant)] px-3 py-2.5 text-[13px] bg-white" />
              <input value={newProduct.tagline} onChange={e => setNewProduct(s => ({ ...s, tagline: e.target.value }))} placeholder="Tagline" className="rounded-xl border border-[var(--color-outline-variant)] px-3 py-2.5 text-[13px] bg-white" />
              <input value={newProduct.price} onChange={e => setNewProduct(s => ({ ...s, price: e.target.value }))} type="number" placeholder="Price (UGX)" className="rounded-xl border border-[var(--color-outline-variant)] px-3 py-2.5 text-[13px] bg-white" />
              <select value={newProduct.category} onChange={e => setNewProduct(s => ({ ...s, category: e.target.value as Product["category"] }))} className="rounded-xl border border-[var(--color-outline-variant)] px-3 py-2.5 text-[13px] bg-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={newProduct.stock} onChange={e => setNewProduct(s => ({ ...s, stock: e.target.value }))} type="number" placeholder="Starting stock" className="rounded-xl border border-[var(--color-outline-variant)] px-3 py-2.5 text-[13px] bg-white" />
              <input value={newProduct.image} onChange={e => setNewProduct(s => ({ ...s, image: e.target.value }))} placeholder="Image URL (optional)" className="rounded-xl border border-[var(--color-outline-variant)] px-3 py-2.5 text-[13px] bg-white" />
              <textarea value={newProduct.description} onChange={e => setNewProduct(s => ({ ...s, description: e.target.value }))} placeholder="Description" className="sm:col-span-2 rounded-xl border border-[var(--color-outline-variant)] px-3 py-2.5 text-[13px] bg-white" rows={2} />
              <input value={newProduct.ingredients} onChange={e => setNewProduct(s => ({ ...s, ingredients: e.target.value }))} placeholder="Key ingredients, comma separated" className="sm:col-span-2 rounded-xl border border-[var(--color-outline-variant)] px-3 py-2.5 text-[13px] bg-white" />
            </div>
            <button onClick={addProduct} className="mt-4 bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-full text-[12px] uppercase tracking-widest font-semibold">
              Submit for catalog
            </button>
          </div>

          <div>
            <h3 className="font-display text-[17px] text-[var(--color-primary)] font-semibold mb-4">Your listings ({myProducts.length})</h3>
            {myProducts.length === 0 ? (
              <p className="text-[13px] text-[var(--color-on-surface-variant)]">No listings yet — submit your first product above.</p>
            ) : (
              <div className="space-y-3">
                {myProducts.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl border border-[var(--color-outline-variant)]/40 soft-shadow p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--color-surface-cream)] shrink-0">
                      <SafeImage src={p.image} alt={p.name} initials={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-[var(--color-on-surface)] truncate">{p.name}</div>
                      <div className="text-[12px] text-[var(--color-on-surface-variant)]">{p.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-[var(--color-on-surface-variant)]">Price</label>
                      <input
                        type="number" value={p.price}
                        onChange={e => updateProduct(p.id, { price: Number(e.target.value) })}
                        className="w-24 rounded-lg border border-[var(--color-outline-variant)] px-2 py-1.5 text-[13px]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-[var(--color-on-surface-variant)]">Stock</label>
                      <input
                        type="number" value={p.stock}
                        onChange={e => updateProduct(p.id, { stock: Math.max(0, Number(e.target.value)) })}
                        className="w-20 rounded-lg border border-[var(--color-outline-variant)] px-2 py-1.5 text-[13px]"
                      />
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full ${p.stock <= 0 ? "bg-[var(--color-accent-coral)]/15 text-[var(--color-accent-coral)]" : p.stock <= 5 ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {p.stock <= 0 ? "Out of stock" : p.stock <= 5 ? "Low stock" : "In stock"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {sub === "orders" && (
        <div className="space-y-4">
          {myOrders.length === 0 ? (
            <p className="text-[13px] text-[var(--color-on-surface-variant)]">No orders assigned to you yet.</p>
          ) : (
            [...myOrders].sort((a, b) => b.placedAt - a.placedAt).map(order => {
              const myItems = order.items.filter(i => i.vendorId === vendorId);
              const myTotal = myItems.reduce((s, i) => s + i.price * i.qty, 0);
              const isFinal = order.status === "delivered" || order.status === "cancelled" || order.status === "refunded" || order.status === "return_requested";
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-[var(--color-outline-variant)]/40 soft-shadow p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--color-primary)]">#{order.id.slice(-8).toUpperCase()} · {order.customerName}</div>
                      <div className="text-[11px] text-[var(--color-on-surface-variant)]">{new Date(order.placedAt).toLocaleString()}</div>
                    </div>
                    <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[var(--color-primary-container)]/30 text-[var(--color-primary)]">
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <div className="space-y-1 mb-3">
                    {myItems.map(i => (
                      <div key={i.productId} className="flex justify-between text-[13px]">
                        <span>{i.name} × {i.qty}</span>
                        <span className="text-[var(--color-on-surface-variant)]">{UGX(i.price * i.qty)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[var(--color-primary)]">Your share: {UGX(myTotal)}</span>
                    {!isFinal && (
                      <div className="flex gap-2">
                        <button onClick={() => cancelOrder(order.id)} className="text-[11px] uppercase tracking-widest font-semibold px-4 py-2 rounded-full border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-accent-coral)] hover:text-[var(--color-accent-coral)] transition">
                          Cancel
                        </button>
                        <button onClick={() => advanceOrder(order.id)} className="text-[11px] uppercase tracking-widest font-semibold px-4 py-2 rounded-full bg-[var(--color-primary)] text-white">
                          Mark as {ORDER_STATUS_LABEL[ORDER_STATUS_FLOW[Math.min(ORDER_STATUS_FLOW.indexOf(order.status) + 1, ORDER_STATUS_FLOW.length - 1)]]}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <p className="text-[11px] text-[var(--color-on-surface-variant)] pt-2">
            Note: this prototype updates order status at the whole-order level. A production build would track fulfillment per vendor within a split order.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, tone = "neutral" }: { icon: string; label: string; value: string; tone?: "neutral" | "ok" | "warn" | "bad" }) {
  const toneClass = tone === "warn" ? "text-amber-600 bg-amber-50" : tone === "bad" ? "text-[var(--color-accent-coral)] bg-[var(--color-accent-coral)]/10" : tone === "ok" ? "text-emerald-700 bg-emerald-50" : "text-[var(--color-primary)] bg-[var(--color-primary-container)]/30";
  return (
    <div className="bg-white rounded-3xl soft-shadow border border-[var(--color-outline-variant)]/40 p-5">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${toneClass}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="font-display text-[20px] text-[var(--color-on-surface)] font-semibold">{value}</div>
      <div className="text-[12px] text-[var(--color-on-surface-variant)] mt-0.5">{label}</div>
    </div>
  );
}
