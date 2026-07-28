import { Product, UGX } from "../data";
import { SafeImage } from "./SafeImage";

export default function WishlistTab({ products, wishlist, onWish, onAdd, onOpen, onShop }: {
  products: Product[];
  wishlist: string[];
  onWish: (id: string) => void;
  onAdd: (id: string) => void;
  onOpen: (id: string) => void;
  onShop: () => void;
}) {
  const items = wishlist.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-12 lg:px-20 py-8 sm:py-14">
      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Saved For You</span>
      <h1 className="font-display text-[clamp(28px,5vw,40px)] text-[var(--color-primary)] mt-2 mb-7 font-semibold">Your wishlist</h1>

      {items.length === 0 ? (
        <div className="bg-[var(--color-surface-cream)] rounded-3xl p-10 text-center">
          <span className="material-symbols-outlined text-[36px] text-[var(--color-primary)]">favorite</span>
          <p className="text-[14px] text-[var(--color-on-surface-variant)] mt-3">Nothing saved yet — tap the heart on any product to keep it here.</p>
          <button onClick={onShop} className="mt-5 bg-[var(--color-primary)] text-white px-6 py-3 rounded-full text-[12px] uppercase tracking-widest font-semibold">
            Browse the shop
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {items.map(product => {
            const soldOut = product.stock <= 0 || !product.inStock;
            return (
              <div key={product.id} className="group flex flex-col">
                <button onClick={() => onOpen(product.id)} className="relative bg-white rounded-3xl aspect-[4/5] mb-4 sm:mb-5 overflow-hidden soft-shadow text-left">
                  <SafeImage src={product.image} alt={product.name} initials={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-3 left-3 bg-[var(--color-tertiary)] text-white px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
                    {soldOut ? "Sold Out" : `${product.stock} Left`}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onWish(product.id); }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 shadow flex items-center justify-center"
                    aria-label="Remove from wishlist"
                  >
                    <span className="material-symbols-outlined icon-fill text-[16px] text-[var(--color-accent-coral)]">favorite</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAdd(product.id); }}
                    disabled={soldOut}
                    className="absolute bottom-3 right-3 bg-[var(--color-primary)] text-white p-2.5 sm:p-3 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:bg-[var(--color-outline)]"
                  >
                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">add_shopping_cart</span>
                  </button>
                </button>
                <h4 className="text-[15px] sm:text-[17px] font-semibold text-[var(--color-on-surface)] mb-0.5 leading-tight">{product.name}</h4>
                <p className="text-[13px] sm:text-[14px] text-[var(--color-on-surface-variant)] mb-2 sm:mb-3">{product.tagline}</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-[18px] sm:text-[22px] text-[var(--color-primary)] font-semibold">{UGX(product.price)}</span>
                  {product.compareAt && <span className="text-[12px] text-[var(--color-on-surface-variant)] line-through">{UGX(product.compareAt)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RECOMMENDED FOR YOU */}
      {(() => {
        const recs = products.filter(p => !wishlist.includes(p.id)).slice(0, 4);
        if (recs.length === 0) return null;
        return (
          <div className="mt-14 sm:mt-20 pt-10 sm:pt-14 border-t border-[var(--color-outline)]/20">
            <div className="flex items-end justify-between mb-7">
              <div>
                <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Discover More</span>
                <h2 className="font-display text-[clamp(22px,3vw,28px)] text-[var(--color-primary)] mt-1 font-semibold">Recommended for you</h2>
              </div>
              <button onClick={onShop} className="text-[13px] text-[var(--color-primary)] font-semibold hover:underline underline-offset-4 hidden sm:block">
                View all →
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {recs.map(product => {
                const soldOut = product.stock <= 0 || !product.inStock;
                return (
                  <div key={product.id} className="group flex flex-col">
                    <button onClick={() => onOpen(product.id)} className="relative bg-white rounded-3xl aspect-[4/5] mb-4 sm:mb-5 overflow-hidden soft-shadow text-left">
                      <SafeImage src={product.image} alt={product.name} initials={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-3 left-3 bg-[var(--color-tertiary)] text-white px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
                        {soldOut ? "Sold Out" : `${product.stock} Left`}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onWish(product.id); }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 shadow flex items-center justify-center"
                        aria-label="Add to wishlist"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)]">favorite</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onAdd(product.id); }}
                        disabled={soldOut}
                        className="absolute bottom-3 right-3 bg-[var(--color-primary)] text-white p-2.5 sm:p-3 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:bg-[var(--color-outline)]"
                      >
                        <span className="material-symbols-outlined text-[18px] sm:text-[20px]">add_shopping_cart</span>
                      </button>
                    </button>
                    <h4 className="text-[15px] sm:text-[17px] font-semibold text-[var(--color-on-surface)] mb-0.5 leading-tight">{product.name}</h4>
                    <p className="text-[13px] sm:text-[14px] text-[var(--color-on-surface-variant)] mb-2 sm:mb-3">{product.tagline}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-[18px] sm:text-[22px] text-[var(--color-primary)] font-semibold">{UGX(product.price)}</span>
                      {product.compareAt && <span className="text-[12px] text-[var(--color-on-surface-variant)] line-through">{UGX(product.compareAt)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={onShop} className="mt-6 w-full sm:hidden bg-[var(--color-primary)] text-white py-3 rounded-full text-[12px] uppercase tracking-widest font-semibold">
              View all
            </button>
          </div>
        );
      })()}
    </div>
  );
}
