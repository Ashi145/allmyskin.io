import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  getSession, logout, Session,
  ADMIN_STRING_KEY, getAdminString, setAdminString,
  CART_KEY, WISH_KEY, lsGet, lsSet,
  getAccounts, Account, Withdrawal, getWithdrawals, saveWithdrawal, updateWithdrawal,
} from "./auth";
import {
  PRODUCTS, UGX, HERO_IMAGE, LIFESTYLE_IMAGE, JOURNAL_IMAGE, PROMO_IMAGE_1, PROMO_IMAGE_2, Product,
  VENDORS, Order, OrderItem, Review, CLINICS, Appointment, ORDER_STATUS_LABEL,
} from "./data";
import { SafeImage } from "./components/SafeImage";
import { BrandLogo } from "./components/BrandLogo";
import { AliaBot, logPurchase } from "./components/AliaBot";
import LoginGateway from "./components/LoginGateway";
import { ORDERS_KEY, REVIEWS_KEY, APPOINTMENTS_KEY } from "./auth";
import OrdersTab from "./components/OrdersTab";
import WishlistTab from "./components/WishlistTab";
import VendorPortal from "./components/VendorPortal";
import ClinicDirectory from "./components/ClinicDirectory";
import ClinicPortal from "./components/ClinicPortal";
import { Breadcrumbs } from "./components/Breadcrumbs";
import CheckoutPage from "./components/CheckoutPage";
import { subscribeToNewsletter } from "./newsletter";

type TabKey = "home" | "shop" | "about" | "contact" | "account" | "admin" | "journal" | "faq" | "store" | "shipping" | "sustainability" | "verification" | "privacy" | "terms" | "accessibility" | "orders" | "wishlist" | "vendor" | "clinics" | "clinicportal" | "reviews" | "cases" | "thankyou";
type ContentTabKey = Exclude<TabKey, "home" | "shop" | "about" | "contact" | "account" | "admin" | "orders" | "wishlist" | "vendor" | "clinics" | "clinicportal" | "reviews" | "faq" | "cases" | "thankyou">;

type CartItem = { productId: string; qty: number };
const INVENTORY_KEY = "ams_app_v5_inventory";

/* Privacy: never render a full email address — only a masked preview. */
function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const keep = local.length <= 2 ? 1 : 2;
  return local.slice(0, keep) + "***" + domain;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => getSession());
  const [tab, setTab] = useState<TabKey>("home");

  /* Theme (persistent, applies globally) */
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    try { return (localStorage.getItem("ams_theme") as "light" | "dark" | "system") || "light"; } catch { return "light"; }
  });
  useEffect(() => {
    localStorage.setItem("ams_theme", theme);
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  /* SEO — per-viewpage titles */
  const PAGE_TITLES: Record<TabKey, string> = {
    home: "All My Skin — Dermatologist-Verified Skincare for African Skin",
    shop: "Shop Skincare — Serums, Oils, Masks & SPF | All My Skin",
    about: "About Us — All My Skin",
    contact: "Contact — All My Skin",
    account: "My Account — All My Skin",
    admin: "Admin Dashboard — All My Skin",
    journal: "The Journal — Skin Science & Routines | All My Skin",
    faq: "FAQs — All My Skin",
    store: "Store Locator — Visit Us in Kampala | All My Skin",
    shipping: "Shipping & Returns — All My Skin",
    sustainability: "Sustainability — All My Skin",
    verification: "Dermatologist Verified — All My Skin",
    privacy: "Privacy Policy — All My Skin",
    terms: "Terms & Conditions — All My Skin",
    accessibility: "Accessibility — All My Skin",
    orders: "My Orders — All My Skin",
    wishlist: "My Wishlist — All My Skin",
    vendor: "Vendor Portal — All My Skin",
    clinics: "Skin Clinics in Kampala — Dermatologists & Aesthetics | All My Skin",
    clinicportal: "Clinic Portal — All My Skin",
    reviews: "Customer Reviews & Testimonials — All My Skin",
    cases: "Case Studies — Real Skincare Results | All My Skin",
    thankyou: "Thank You — All My Skin",
  };

  const BASE_URL = "https://allmyskin.ug";
  const BREADCRUMBS: Record<TabKey, { name: string; url: string }[]> = {
    home: [{ name: "Home", url: "/" }],
    shop: [{ name: "Home", url: "/" }, { name: "Shop", url: "/shop" }],
    about: [{ name: "Home", url: "/" }, { name: "About Us", url: "/about" }],
    contact: [{ name: "Home", url: "/" }, { name: "Contact", url: "/contact" }],
    faq: [{ name: "Home", url: "/" }, { name: "FAQs", url: "/faq" }],
    reviews: [{ name: "Home", url: "/" }, { name: "Customer Reviews", url: "/reviews" }],
    cases: [{ name: "Home", url: "/" }, { name: "Case Studies", url: "/cases" }],
    clinics: [{ name: "Home", url: "/" }, { name: "Skin Clinics", url: "/clinics" }],
    journal: [{ name: "Home", url: "/" }, { name: "The Journal", url: "/journal" }],
    store: [{ name: "Home", url: "/" }, { name: "Store Locator", url: "/store" }],
    shipping: [{ name: "Home", url: "/" }, { name: "Shipping & Returns", url: "/shipping" }],
    sustainability: [{ name: "Home", url: "/" }, { name: "Sustainability", url: "/sustainability" }],
    verification: [{ name: "Home", url: "/" }, { name: "Dermatologist Verified", url: "/verification" }],
    privacy: [{ name: "Home", url: "/" }, { name: "Privacy Policy", url: "/privacy" }],
    terms: [{ name: "Home", url: "/" }, { name: "Terms & Conditions", url: "/terms" }],
    accessibility: [{ name: "Home", url: "/" }, { name: "Accessibility", url: "/accessibility" }],
    account: [{ name: "Home", url: "/" }, { name: "My Account", url: "/account" }],
    orders: [{ name: "Home", url: "/" }, { name: "My Orders", url: "/orders" }],
    wishlist: [{ name: "Home", url: "/" }, { name: "My Wishlist", url: "/wishlist" }],
    vendor: [{ name: "Home", url: "/" }, { name: "Vendor Portal", url: "/vendor" }],
    clinicportal: [{ name: "Home", url: "/" }, { name: "Clinic Portal", url: "/clinicportal" }],
    admin: [{ name: "Home", url: "/" }, { name: "Admin Dashboard", url: "/admin" }],
    thankyou: [{ name: "Home", url: "/" }, { name: "Thank You", url: "/thankyou" }],
  };

  useEffect(() => {
    document.title = PAGE_TITLES[tab];
    const trail = BREADCRUMBS[tab].map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${BASE_URL}${c.url}`,
    }));
    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: trail,
    };
    let el = document.getElementById("breadcrumb-schema") as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.id = "breadcrumb-schema";
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(schema);
  }, [tab]);

  /* Cart + wishlist persistent storage */
  const [cart, setCart] = useState<CartItem[]>(() => lsGet<CartItem[]>(CART_KEY, []));
  const [wishlist, setWishlist] = useState<string[]>(() => lsGet<string[]>(WISH_KEY, []));
  const [products, setProducts] = useState<Product[]>(() => {
    const stored = lsGet<Product[]>(INVENTORY_KEY, []);
    if (!stored.length) return PRODUCTS;
    return stored.map((p) => ({ ...p, stock: p.stock ?? (p.inStock ? 10 : 0), inStock: (p.stock ?? 0) > 0 || p.inStock }));
  });
  useEffect(() => lsSet(CART_KEY, cart), [cart]);
  useEffect(() => lsSet(WISH_KEY, wishlist), [wishlist]);
  useEffect(() => lsSet(INVENTORY_KEY, products), [products]);

  /* Orders, reviews, clinic appointments – persistent */
  const [orders, setOrders] = useState<Order[]>(() => lsGet<Order[]>(ORDERS_KEY, []));
  const [reviews, setReviews] = useState<Review[]>(() => lsGet<Review[]>(REVIEWS_KEY, []));
  const [appointments, setAppointments] = useState<Appointment[]>(() => lsGet<Appointment[]>(APPOINTMENTS_KEY, []));
  useEffect(() => lsSet(ORDERS_KEY, orders), [orders]);
  useEffect(() => lsSet(REVIEWS_KEY, reviews), [reviews]);
  useEffect(() => lsSet(APPOINTMENTS_KEY, appointments), [appointments]);

  /* Admin config string – persistent */
  const [adminString, setAdminStringState] = useState<string>(() => getAdminString());
  useEffect(() => {
    // Live sync across tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === ADMIN_STRING_KEY) setAdminStringState(getAdminString());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 2400); return () => clearTimeout(t); }
  }, [toast]);

  const [productOpen, setProductOpen] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [signedOutModal, setSignedOutModal] = useState(false);
  const [justCheckedOut, setJustCheckedOut] = useState(false);

  /* If no session OR guest mode but they try to reach admin – snap them out */
  useEffect(() => {
    if (!session) return;
    if (tab === "admin" && session.role !== "admin") setTab("home");
    if (tab === "vendor" && session.role !== "vendor") setTab("home");
    if (tab === "clinicportal" && session.role !== "clinic") setTab("home");
    if ((tab === "account" || tab === "orders" || tab === "wishlist") && session.role === "guest") {
      setSignedOutModal(true);
      setTab("home");
    }
  }, [tab, session]);

  /* ============================ AUTH GATE ============================ */
  if (!session) {
    return <LoginGateway onAuthed={(s) => { setSession(s); setTab("home"); }} />;
  }

  /* ============================ HELPERS ============================ */
  const role = session.role;
  const isGuest = role === "guest";
  const isUser = role !== "guest";
  const isAdmin = role === "admin";
  const isVendor = role === "vendor";
  const isClinic = role === "clinic";

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartFull = cart.map(c => ({ ...c, p: products.find(p => p.id === c.productId)! })).filter(c => c.p);
  const subtotal = cartFull.reduce((s, c) => s + c.p.price * c.qty, 0);
  const shipping = subtotal >= 100000 ? 0 : 10000;
  const total = subtotal + shipping;

  const requireUser = (action: string): boolean => {
    if (isGuest) {
      setSignedOutModal(true);
      setToast(`Sign in to ${action}`);
      return false;
    }
    return true;
  };

  const addToCart = (id: string) => {
    if (!requireUser("add items to your bag")) return;
    const product = products.find(p => p.id === id);
    if (!product || product.stock <= 0 || !product.inStock) {
      setToast("That item is currently sold out");
      return;
    }
    setCart(prev => {
      const ex = prev.find(c => c.productId === id);
      if (ex) {
        if (ex.qty >= product.stock) {
          setToast(`Only ${product.stock} available`);
          return prev;
        }
        return prev.map(c => c.productId === id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { productId: id, qty: 1 }];
    });
    setToast("Added to bag");
    setCartOpen(true);
  };

  const toggleWish = (id: string) => {
    if (!requireUser("save to wishlist")) return;
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleLogout = () => {
    logout();
    setCart([]); setWishlist([]);
    setSession(null);
    setTab("home");
  };

  const activeProduct = productOpen ? products.find(p => p.id === productOpen) : null;
  const goTo = (next: TabKey) => {
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ============================ MAIN SHELL ============================ */
  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)] flex flex-col">
      {/* ============ TOP HEADER (desktop centered pill, mobile sticky bar) ============ */}
      <DesktopHeader
        tab={tab} setTab={goTo}
        isAdmin={isAdmin}
        isVendor={isVendor}
        isClinic={isClinic}
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
        session={session}
        onLogout={handleLogout}
      />

      <MobileHeader
        session={session}
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
        onLogout={handleLogout}
      />

      {/* ============ TABBED VIEWPORT BODY ============ */}
      <main className="flex-1 pt-[88px] md:pt-[136px] pb-[88px] md:pb-12">
        {/* HOME */}
        <section className={`tab-panel ${tab === "home" ? "is-active animate-fadeUp" : ""}`}>
          <HomeTab
            adminString={adminString}
            products={products}
            onShop={() => goTo("shop")}
            onAbout={() => goTo("about")}
            onJournal={() => goTo("journal")}
            onReviews={() => goTo("reviews")}
            onThanks={() => goTo("thankyou")}
            onNewsletterSubscribe={subscribeToNewsletter}
            onProduct={(id) => setProductOpen(id)}
            onAddToCart={addToCart}
          />
        </section>

        {/* SHOP */}
        <section className={`tab-panel ${tab === "shop" ? "is-active animate-fadeUp" : ""}`}>
          <ShopTab
            onProduct={(id) => setProductOpen(id)}
            onAddToCart={addToCart}
            wishlist={wishlist}
            onWish={toggleWish}
            products={products}
            onHome={() => goTo("home")}
          />
        </section>

        {/* ABOUT */}
        <section className={`tab-panel ${tab === "about" ? "is-active animate-fadeUp" : ""}`}>
          <AboutTab onHome={() => goTo("home")} />
        </section>

        {/* CONTACT */}
        <section className={`tab-panel ${tab === "contact" ? "is-active animate-fadeUp" : ""}`}>
          <ContactTab session={session} onThanks={() => goTo("thankyou")} onHome={() => goTo("home")} />
        </section>

        {tab === "faq" && (
          <section className="tab-panel is-active animate-fadeUp">
            <FaqTab
              onHome={() => goTo("home")}
              onContact={() => goTo("contact")}
              onShipping={() => goTo("shipping")}
              onPrivacy={() => goTo("privacy")}
              onTerms={() => goTo("terms")}
              onShop={() => goTo("shop")}
            />
          </section>
        )}

        {["journal", "store", "shipping", "sustainability", "verification", "privacy", "terms", "accessibility"].includes(tab) && (
          <section className="tab-panel is-active animate-fadeUp">
            <ContentTab tab={tab as ContentTabKey} onShop={() => goTo("shop")} onContact={() => goTo("contact")} onHome={() => goTo("home")} />
          </section>
        )}

        {/* REVIEWS (public testimonials + trust signals) */}
        <section className={`tab-panel ${tab === "reviews" ? "is-active animate-fadeUp" : ""}`}>
          <ReviewsTab onShop={() => goTo("shop")} onFaq={() => goTo("faq")} onCases={() => goTo("cases")} onHome={() => goTo("home")} />
        </section>

        {/* CASE STUDIES (public) */}
        <section className={`tab-panel ${tab === "cases" ? "is-active animate-fadeUp" : ""}`}>
          <CasesTab onHome={() => goTo("home")} onShop={() => goTo("shop")} onReviews={() => goTo("reviews")} onBook={() => goTo("clinics")} />
        </section>

        {/* THANK YOU (post-submission) */}
        <section className={`tab-panel ${tab === "thankyou" ? "is-active animate-fadeUp" : ""}`}>
          <ThankYouTab onHome={() => goTo("home")} onShop={() => goTo("shop")} onReviews={() => goTo("reviews")} onContact={() => goTo("contact")} onFaq={() => goTo("faq")} />
        </section>

        {/* ACCOUNT (verified user/admin only) */}
        {isUser && (
          <section className={`tab-panel ${tab === "account" ? "is-active animate-fadeUp" : ""}`}>
            <AccountTab session={session} onLogout={handleLogout} orders={orders} products={products} theme={theme} setTheme={setTheme} />
          </section>
        )}

        {/* ORDERS (verified users only) */}
        {isUser && (
          <section className={`tab-panel ${tab === "orders" ? "is-active animate-fadeUp" : ""}`}>
            <OrdersTab
              orders={orders.filter(o => o.uid === session.uid)}
              onRequestReturn={(orderId) => setOrders(prev => prev.map(o => o.id === orderId
                ? { ...o, status: "return_requested", updatedAt: Date.now(), history: [...o.history, { status: "return_requested", at: Date.now() }] }
                : o))}
              onShop={() => goTo("shop")}
            />
          </section>
        )}

        {/* WISHLIST (verified users only) */}
        {isUser && (
          <section className={`tab-panel ${tab === "wishlist" ? "is-active animate-fadeUp" : ""}`}>
            <WishlistTab
              products={products}
              wishlist={wishlist}
              onWish={toggleWish}
              onAdd={addToCart}
              onOpen={(id) => setProductOpen(id)}
              onShop={() => goTo("shop")}
            />
          </section>
        )}

        {/* CLINICS (public directory + referral/appointment booking) */}
        <section className={`tab-panel ${tab === "clinics" ? "is-active animate-fadeUp" : ""}`}>
          <ClinicDirectory
            clinics={CLINICS}
            isGuest={isGuest}
            session={session}
            onRequireUser={() => requireUser("book a clinic appointment")}
            onNavigate={(t) => goTo(t as TabKey)}
            onSubmit={(clinicId, payload) => {
              setAppointments(prev => [{
                id: "apt_" + Date.now().toString(36),
                clinicId,
                uid: session.uid,
                name: session.name,
                contact: payload.contact,
                reason: payload.reason,
                preferredDate: payload.preferredDate,
                status: "requested",
                createdAt: Date.now(),
              }, ...prev]);
              goTo("thankyou");
            }}
          />
        </section>

        {/* VENDOR PORTAL (private, vendor role only) */}
        {isVendor && (
          <section className={`tab-panel ${tab === "vendor" ? "is-active animate-fadeUp" : ""}`}>
            <VendorPortal
              vendorId={session.vendorId || ""}
              vendors={VENDORS}
              products={products}
              setProducts={setProducts}
              orders={orders}
              setOrders={setOrders}
            />
          </section>
        )}

        {/* CLINIC PORTAL (private, clinic role only) */}
        {isClinic && (
          <section className={`tab-panel ${tab === "clinicportal" ? "is-active animate-fadeUp" : ""}`}>
            <ClinicPortal
              clinicId={session.clinicId || ""}
              clinics={CLINICS}
              appointments={appointments}
              setAppointments={setAppointments}
            />
          </section>
        )}

        {/* ADMIN (admin only - strict isolation) */}
        {isAdmin && (
          <section className={`tab-panel ${tab === "admin" ? "is-active animate-fadeUp" : ""}`}>
            <AdminPanel
              adminString={adminString}
              setAdminString={(v) => { setAdminString(v); setAdminStringState(v); setToast("Configuration saved to localStorage"); }}
              products={products}
              setProducts={setProducts}
              orders={orders}
            />
          </section>
        )}
      </main>

      {/* ============ FOOTER (only on home/about/contact for marketing) ============ */}
      {!["shop", "account", "admin", "orders", "wishlist", "vendor", "clinicportal"].includes(tab) && (
        <Footer setTab={goTo} />
      )}

      {/* ============ BOTTOM NAV (mobile only) ============ */}
      <BottomNav tab={tab} setTab={goTo} isAdmin={isAdmin} isVendor={isVendor} isClinic={isClinic} cartCount={cartCount} />

      {/* ============ STICKY SHOP CTA (mobile marketing pages) ============ */}
      <StickyMobileCTA tab={tab} onShop={() => goTo("shop")} />

      {/* ============ PRODUCT MODAL ============ */}
      {activeProduct && (
        <ProductModal
          product={activeProduct}
          isGuest={isGuest}
          inWish={wishlist.includes(activeProduct.id)}
          onWish={() => toggleWish(activeProduct.id)}
          onAdd={() => { addToCart(activeProduct.id); setProductOpen(null); }}
          onClose={() => setProductOpen(null)}
          reviews={reviews}
          canReview={!isGuest && orders.some(o => o.uid === session.uid && o.status === "delivered" && o.items.some(i => i.productId === activeProduct.id))}
          onSubmitReview={(rating, comment) => {
            setReviews(prev => [{
              id: "rev_" + Date.now().toString(36),
              productId: activeProduct.id,
              uid: session.uid,
              name: session.name,
              rating, comment,
              createdAt: Date.now(),
              verifiedPurchase: true,
            }, ...prev]);
          }}
        />
      )}

      {/* ============ CART DRAWER ============ */}
      {cartOpen && (
        <CartDrawer
          cartFull={cartFull}
          subtotal={subtotal}
          isGuest={isGuest}
          onClose={() => setCartOpen(false)}
          onCheckout={() => {
            if (!requireUser("complete checkout")) return;
            if (!cartFull.length) return;
            setCartOpen(false);
            setCheckoutOpen(true);
          }}
          onRemove={(id) => setCart(prev => prev.filter(c => c.productId !== id))}
          onQty={(id, delta) => setCart(prev => prev.map(c => {
            if (c.productId !== id) return c;
            const stock = products.find(p => p.id === id)?.stock ?? 1;
            return { ...c, qty: Math.min(stock, Math.max(1, c.qty + delta)) };
          }))}
        />
      )}

      {/* Payment is collected by the selected provider before this creates the order. */}
      {checkoutOpen && (
        <CheckoutPage
          session={session}
          cartFull={cartFull}
          subtotal={subtotal}
          shipping={shipping}
          total={total}
          onCancel={() => setCheckoutOpen(false)}
          onConfirm={(payment) => {
            setProducts(prev => prev.map(p => {
              const item = cart.find(c => c.productId === p.id);
              if (!item) return p;
              const stock = Math.max(0, p.stock - item.qty);
              return { ...p, stock, inStock: stock > 0 };
            }));
            cart.forEach(c => logPurchase(c.productId));

            const now = Date.now();
            const orderItems: OrderItem[] = cartFull.map(c => ({
              productId: c.p.id, name: c.p.name, price: c.p.price, qty: c.qty, vendorId: c.p.vendorId || "vendor_main",
            }));
            const newOrder: Order = {
              id: "ord_" + now.toString(36) + Math.random().toString(36).slice(2, 6),
              uid: session.uid,
              customerName: payment.name || session.name,
              items: orderItems,
              subtotal,
              phone: payment.phone,
              address: payment.address,
              paymentMethod: payment.paymentMethod,
              paymentReference: payment.paymentReference,
              status: "placed",
              placedAt: now,
              updatedAt: now,
              history: [{ status: "placed", at: now }],
            };
            setOrders(prev => [newOrder, ...prev]);

            setJustCheckedOut(true);
            const hadPurchases = session.role !== "guest";
            setToast(hadPurchases ? "Order placed! Alia's full protocols are now unlocked." : `Order placed for ${UGX(total)} - Asante! Delivery within 24h.`);
            setCart([]); setCheckoutOpen(false);
          }}
        />
      )}

      {/* Sign-in required modal (for guests trying to act) */}
      {signedOutModal && (
        <SignInPromptModal
          onClose={() => setSignedOutModal(false)}
          onSignIn={() => { logout(); setSession(null); }}
        />
      )}

      {/* ALIA — SKIN AI */}
      {session && (
        <AliaBot
          session={session}
          products={products}
          tab={tab}
          justCheckedOut={justCheckedOut}
          onDismissCheckout={() => setJustCheckedOut(false)}
          onSelectProduct={(id) => setProductOpen(id)}
        />
      )}

      {/* TOAST */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-[96px] md:bottom-8 z-[200] transition-all duration-300 ${toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"}`}
      >
        <div className="px-5 py-3 rounded-full bg-[var(--color-primary)] text-white text-[13px] font-semibold shadow-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toast}
        </div>
      </div>
    </div>
  );
}

/* ============================ DESKTOP HEADER ============================ */
function DesktopHeader({
  tab, setTab, isAdmin, isVendor, isClinic, cartCount, onCartClick, session, onLogout,
}: {
  tab: TabKey; setTab: (t: TabKey) => void;
  isAdmin: boolean;
  isVendor: boolean;
  isClinic: boolean;
  cartCount: number;
  onCartClick: () => void;
  session: Session;
  onLogout: () => void;
}) {
  const navL = [
    { id: "home", icon: "home", label: "Home" },
    { id: "shop", icon: "shopping_bag", label: "Shop" },
    { id: "clinics", icon: "local_hospital", label: "Clinics" },
  ] as const;
  const navR = [
    { id: "about", icon: "info", label: "About" },
    { id: "reviews", icon: "rate_review", label: "Reviews" },
    { id: "contact", icon: "email", label: "Contact" },
  ] as const;

  return (
    <header className="hidden md:block fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-5xl">
      <div className="relative glass-nav-light border border-[var(--color-outline-variant)]/40 rounded-full px-6 py-3 soft-shadow flex items-center justify-between">
        {/* Left Nav */}
        <nav className="flex items-center gap-6 lg:gap-8 flex-1 justify-start">
          {navL.map(n => <NavBtn key={n.id} active={tab === n.id} onClick={() => setTab(n.id as TabKey)} icon={n.icon} label={n.label} />)}
          {session.role !== "guest" && (
            <>
              <NavBtn active={tab === "orders"} onClick={() => setTab("orders")} icon="receipt_long" label="Orders" />
              <NavBtn active={tab === "wishlist"} onClick={() => setTab("wishlist")} icon="favorite" label="Wishlist" />
              <NavBtn active={tab === "account"} onClick={() => setTab("account")} icon="person" label="Account" />
            </>
          )}
        </nav>

        {/* Centerpiece logo */}
        <button onClick={() => setTab("home")} className="relative -top-6 lg:-top-8 shrink-0 group">
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-white p-2 shadow-xl border-4 border-[var(--color-surface-cream)] overflow-hidden flex items-center justify-center group-hover:scale-105 transition">
            <BrandLogo size={42} variant="icon" />
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white px-3 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter whitespace-nowrap shadow-md">All My Skin</div>
        </button>

        {/* Right Nav */}
        <nav className="flex items-center gap-6 lg:gap-8 flex-1 justify-end">
          {navR.map(n => <NavBtn key={n.id} active={tab === n.id} onClick={() => setTab(n.id as TabKey)} icon={n.icon} label={n.label} />)}
          {/* Vendor only */}
          {isVendor && (
            <NavBtn active={tab === "vendor"} onClick={() => setTab("vendor")} icon="storefront" label="Vendor" highlight />
          )}
          {/* Clinic only */}
          {isClinic && (
            <NavBtn active={tab === "clinicportal"} onClick={() => setTab("clinicportal")} icon="medical_services" label="Clinic" highlight />
          )}
          {/* Admin only */}
          {isAdmin && (
            <NavBtn active={tab === "admin"} onClick={() => setTab("admin")} icon="shield" label="Admin" highlight />
          )}
          {/* Cart */}
          <button onClick={onCartClick} className="relative group flex flex-col items-center gap-1">
            <span className="material-symbols-outlined text-[var(--color-primary)] group-hover:text-[var(--color-accent-coral)] transition-colors">shopping_cart</span>
            <span className="text-[10px] uppercase tracking-widest font-semibold text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]">Bag</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--color-accent-coral)] text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">{cartCount}</span>
            )}
          </button>
          {/* User chip */}
          <button onClick={onLogout} title="Sign out" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-[var(--color-outline-variant)] text-[var(--color-primary)] hover:bg-white transition">
            <span className="w-6 h-6 rounded-full bg-[var(--color-primary-fixed)] flex items-center justify-center text-[10px] font-bold text-[var(--color-primary)]">
              {(session.name || "G")[0]}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider">{session.role === "guest" ? "Sign in" : "Exit"}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

function NavBtn({ active, onClick, icon, label, highlight = false }: { active: boolean; onClick: () => void; icon: string; label: string; highlight?: boolean }) {
  return (
    <button onClick={onClick} className="group flex flex-col items-center gap-1 transition">
      <span className={`material-symbols-outlined transition-colors ${active ? "text-[var(--color-accent-coral)] icon-fill" : highlight ? "text-[var(--color-primary)]" : "text-[var(--color-primary)] group-hover:text-[var(--color-accent-coral)]"}`}>{icon}</span>
      <span className={`text-[10px] uppercase tracking-widest font-semibold transition-colors ${active ? "text-[var(--color-accent-coral)]" : "text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]"}`}>
        {label}
      </span>
    </button>
  );
}

/* ============================ MOBILE HEADER ============================ */
function MobileHeader({ session, cartCount, onCartClick, onLogout }: { session: Session; cartCount: number; onCartClick: () => void; onLogout: () => void }) {
  return (
    <header className="md:hidden fixed top-0 inset-x-0 z-50 glass-nav-light border-b border-[var(--color-outline-variant)]/50 h-[64px] flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-white shadow-md p-1.5 flex items-center justify-center">
          <BrandLogo size={20} variant="icon" />
        </div>
        <div className="leading-none">
          <div className="font-display text-[15px] text-[var(--color-primary)] font-semibold">All My Skin</div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-[var(--color-on-surface-variant)]">Luminous</div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onCartClick} className="relative p-2 text-[var(--color-primary)]">
          <span className="material-symbols-outlined">shopping_cart</span>
          {cartCount > 0 && <span className="absolute top-1 right-1 bg-[var(--color-accent-coral)] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>}
        </button>
        <button onClick={onLogout} title={session.role === "guest" ? "Sign in" : "Sign out"} className="p-2 text-[var(--color-primary)]">
          <span className="material-symbols-outlined">{session.role === "guest" ? "login" : "logout"}</span>
        </button>
      </div>
    </header>
  );
}

/* ============================ BOTTOM NAV ============================ */
function BottomNav({ tab, setTab, isAdmin, isVendor, isClinic, cartCount }: { tab: TabKey; setTab: (t: TabKey) => void; isAdmin: boolean; isVendor: boolean; isClinic: boolean; cartCount: number }) {
  const tabs: { id: TabKey; icon: string; label: string }[] = [
    { id: "home", icon: "home", label: "Home" },
    { id: "shop", icon: "shopping_bag", label: "Shop" },
    { id: "clinics", icon: "local_hospital", label: "Clinics" },
    { id: "reviews", icon: "rate_review", label: "Reviews" },
    { id: "orders", icon: "receipt_long", label: "Orders" },
    { id: "account", icon: "person", label: "Account" },
  ];
  if (isVendor) tabs.push({ id: "vendor", icon: "storefront", label: "Vendor" });
  if (isClinic) tabs.push({ id: "clinicportal", icon: "medical_services", label: "Clinic" });
  if (isAdmin) tabs.push({ id: "admin", icon: "shield", label: "Admin" });

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-nav-light border-t border-[var(--color-outline-variant)]/50 h-[68px] pb-safe flex items-center justify-around px-2">
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="relative flex flex-col items-center justify-center gap-0.5 flex-1 max-w-[80px] h-full"
          >
            <span className={`material-symbols-outlined text-[22px] transition-colors ${active ? "text-[var(--color-accent-coral)] icon-fill" : "text-[var(--color-primary)]"}`}>{t.icon}</span>
            <span className={`text-[9.5px] font-semibold tracking-wide uppercase ${active ? "text-[var(--color-accent-coral)]" : "text-[var(--color-on-surface-variant)]"}`}>{t.label}</span>
            {t.id === "shop" && cartCount > 0 && (
              <span className="absolute top-2 right-3 bg-[var(--color-accent-coral)] text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">{cartCount}</span>
            )}
            {active && <span className="absolute -top-[2px] w-8 h-[3px] rounded-full bg-[var(--color-accent-coral)]" />}
          </button>
        );
      })}
    </nav>
  );
}

/* ============================ HOME TAB ============================ */
function HomeTab({ adminString, products, onShop, onAbout, onJournal, onReviews, onThanks, onNewsletterSubscribe, onProduct, onAddToCart }: {
  adminString: string;
  products: Product[];
  onShop: () => void;
  onAbout: () => void;
  onJournal: () => void;
  onReviews: () => void;
  onThanks: () => void;
  onNewsletterSubscribe: (email: string) => Promise<void>;
  onProduct: (id: string) => void;
  onAddToCart: (id: string) => void;
}) {
  return (
    <>
      {/* HERO */}
      <section className="relative h-[78vh] sm:h-[85vh] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <SafeImage
            src={HERO_IMAGE}
            alt="Radiant woman in golden hour"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            initials="AS"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-surface)]/70 via-[var(--color-surface)]/30 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto h-full px-5 sm:px-12 lg:px-20 flex flex-col justify-center">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-primary-container)]/40 text-[var(--color-on-primary-container)] text-[11px] sm:text-[12px] font-semibold mb-5 sm:mb-6 tracking-[0.18em] uppercase backdrop-blur-sm">
              The Essence of Glow
            </span>
            <h1 className="font-display text-[clamp(34px,7vw,56px)] leading-[1.05] text-[var(--color-primary)] mb-5 sm:mb-7 font-semibold">
              Skincare, perfected<br/>for African skin
            </h1>
            <p className="text-[15px] sm:text-[17px] text-[var(--color-on-surface-variant)] mb-7 sm:mb-9 max-w-lg leading-relaxed">
              Dermatologist-verified serums, oils, masks and SPF — formulated for African undertones
              and the Kampala climate. No white cast, no guesswork, real results.
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button onClick={onShop} className="bg-[var(--color-primary)] text-white px-7 sm:px-10 py-4 sm:py-5 rounded-full text-[13px] font-bold tracking-wider uppercase hover:scale-[1.02] transition shadow-lg active:scale-95 flex items-center gap-2.5">
                Shop the collection
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
              <button onClick={onAbout} className="border border-[var(--color-outline)] text-[var(--color-primary)] px-7 sm:px-9 py-4 sm:py-5 rounded-full text-[13px] font-semibold tracking-wider uppercase hover:bg-[var(--color-surface-variant)] transition">
                Our Story
              </button>
            </div>
            <div className="mt-7 sm:mt-9 flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-on-surface-variant)]">
                <span className="material-symbols-outlined icon-fill text-[var(--color-accent-coral)] text-[16px]">star</span>
                Rated 4.9 by 3,000+ customers
              </span>
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--color-on-surface-variant)]">
                <span className="material-symbols-outlined icon-fill text-[var(--color-accent-coral)] text-[16px]">local_shipping</span>
                Free same-day delivery in Kampala
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ANNOUNCEMENT STRIP (live admin string) */}
      {adminString && (
        <div className="bg-[var(--color-primary)] text-white text-center text-[12px] sm:text-[13px] font-medium py-2.5 px-4 tracking-wide">
          <span className="material-symbols-outlined text-[14px] align-middle mr-1.5">campaign</span>
          {adminString}
        </div>
      )}

      {/* PROMO BENTO */}
      <section className="py-12 sm:py-20 px-5 sm:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <PromoCard
            image={PROMO_IMAGE_1}
            badge="The Essence of Glow"
            title="Super Natural Beauty"
            sub="Experience nature's purest ingredients."
            highlight="Up to 50% Off"
            onClick={onShop}
            light
          />
          <PromoCard
            image={PROMO_IMAGE_2}
            badge="Body Ritual"
            title="10% Off Body Butter"
            sub="Velvet-smooth hydration for every inch."
            cta="Shop Now"
            onClick={onShop}
          />
        </div>
      </section>

      {/* TRUST SIGNALS */}
      <TrustBar />

      {/* NEW ARRIVALS */}
      <section className="bg-[var(--color-surface-cream)] py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-12 lg:px-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-12 gap-4">
            <div>
              <h2 className="font-display text-[clamp(26px,5vw,32px)] text-[var(--color-primary)] mb-3 font-semibold">New Arrivals</h2>
              <p className="text-[14px] sm:text-[15px] text-[var(--color-on-surface-variant)] max-w-lg">
                Fresh from our laboratory: high-performance formulas designed for your skin's unique needs.
              </p>
            </div>
            <button onClick={onShop} className="hidden sm:inline-flex items-center gap-2 text-[12px] uppercase tracking-widest font-semibold text-[var(--color-primary)] border-b-2 border-[var(--color-primary-container)] pb-1 hover:text-[var(--color-accent-coral)] hover:border-[var(--color-accent-coral)] transition">
              View all <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {products.slice(0, 4).map(p => (
              <ProductCard key={p.id} product={p} onOpen={() => onProduct(p.id)} onAdd={() => onAddToCart(p.id)} />
            ))}
          </div>
        </div>
      </section>

      {/* LIFESTYLE */}
      <section className="relative bg-[var(--color-surface)] overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[600px]">
          <div className="w-full lg:w-1/2 p-8 sm:p-14 lg:p-20 flex items-center">
            <div className="max-w-xl">
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Our Philosophy</span>
              <h2 className="font-display text-[clamp(28px,5vw,44px)] text-[var(--color-primary)] mt-3 mb-7 sm:mb-9 leading-[1.1] font-semibold">
                Clinical Results with Empathetic Care
              </h2>
              <div className="space-y-6 sm:space-y-7">
                <ValueRow
                  icon="science"
                  title="Science-Backed Formulas"
                  desc="Every ingredient is selected based on peer-reviewed clinical research to ensure maximum efficacy without irritation."
                  tone="primary"
                />
                <ValueRow
                  icon="eco"
                  title="Empathetic To Your Journey"
                  desc="We understand skincare is a personal ritual. Our products are designed to soothe the soul as much as they treat the skin."
                  tone="secondary"
                />
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/2 h-[400px] lg:h-auto relative">
            <SafeImage src={LIFESTYLE_IMAGE} alt="Editorial portrait" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* JOURNAL */}
      <section className="py-14 sm:py-20 max-w-7xl mx-auto px-5 sm:px-12 lg:px-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="font-display text-[clamp(26px,5vw,32px)] text-[var(--color-primary)] mb-3 font-semibold">The Journal</h2>
          <p className="text-[15px] sm:text-[17px] text-[var(--color-on-surface-variant)] max-w-2xl mx-auto">Expert advice and skin science decoded for your daily routine.</p>
        </div>

        <div className="bg-[var(--color-surface-cream)] rounded-3xl p-7 sm:p-12 lg:p-16 relative overflow-hidden soft-shadow">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center relative">
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <SafeImage src={JOURNAL_IMAGE} alt="Skincare ritual" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-5 -right-3 sm:-right-5 bg-white p-5 sm:p-7 rounded-3xl shadow-xl max-w-[260px] hidden md:block">
                <span className="text-[var(--color-accent-coral)] text-[11px] font-semibold uppercase tracking-widest mb-2 block">Tip of the Day</span>
                <p className="text-[15px] sm:text-[17px] text-[var(--color-primary)] font-semibold leading-snug">Apply serum to damp skin for 3x better absorption.</p>
              </div>
            </div>
            <div>
              <span className="text-[var(--color-primary)] text-[11px] font-semibold uppercase tracking-[0.2em] mb-3 block">Masterclass</span>
              <h3 className="font-display text-[clamp(26px,5vw,42px)] text-[var(--color-primary)] mb-6 leading-[1.1] font-semibold">The 7-Step Hydration Protocol</h3>
              <p className="text-[15px] sm:text-[17px] text-[var(--color-on-surface-variant)] mb-8 leading-relaxed">
                Our dermatologists breakdown the definitive guide to achieving long-lasting moisture retention.
                From pH balance to occlusive layers, learn how to build a barrier that never breaks.
              </p>
              <button onClick={onJournal} className="inline-flex items-center gap-3 text-[13px] uppercase tracking-widest font-semibold text-[var(--color-primary)] border-b-2 border-[var(--color-primary-container)] pb-1 hover:text-[var(--color-accent-coral)] hover:border-[var(--color-accent-coral)] transition">
                Read the full article
                <span className="material-symbols-outlined text-[18px]">arrow_right_alt</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CUSTOMER LOVE */}
      <section className="py-14 sm:py-20 bg-[var(--color-surface-cream)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-12 lg:px-20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-12 gap-4">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Customer Love</span>
              <h2 className="font-display text-[clamp(26px,5vw,32px)] text-[var(--color-primary)] mt-2 mb-3 font-semibold">Loved by 3,000+ customers</h2>
              <p className="text-[14px] sm:text-[15px] text-[var(--color-on-surface-variant)] max-w-lg">
                Real reviews from real routines across Kampala and beyond. Rated 4.9 out of 5.
              </p>
            </div>
            <button onClick={onReviews} className="hidden sm:inline-flex items-center gap-2 text-[12px] uppercase tracking-widest font-semibold text-[var(--color-primary)] border-b-2 border-[var(--color-primary-container)] pb-1 hover:text-[var(--color-accent-coral)] hover:border-[var(--color-accent-coral)] transition">
              Read all reviews <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {SEED_REVIEWS.slice(0, 3).map(r => (
              <div key={r.name} className="bg-white rounded-3xl p-6 sm:p-7 soft-shadow flex flex-col">
                <StarRow rating={r.rating} size={15} />
                <p className="text-[14px] text-[var(--color-on-surface-variant)] leading-relaxed mt-4 flex-1">"{r.text}"</p>
                <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[var(--color-outline-variant)]/40">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)]/50 text-[var(--color-on-primary-container)] flex items-center justify-center font-bold text-[14px]">{(r.name[0] || "?").toUpperCase()}</div>
                  <div>
                    <div className="text-[14px] font-semibold text-[var(--color-on-surface)]">{r.name}</div>
                    <div className="text-[12px] text-[var(--color-on-surface-variant)]">{r.city} · Verified buyer</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <button onClick={onReviews} className="inline-flex items-center gap-2 text-[12px] uppercase tracking-widest font-semibold text-[var(--color-primary)] border-b-2 border-[var(--color-primary-container)] pb-1">
              Read all reviews <span className="material-symbols-outlined text-[16px]">arrow_right_alt</span>
            </button>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-14 sm:py-20 bg-[var(--color-primary-container)]/25">
        <div className="max-w-4xl mx-auto px-5 sm:px-10 text-center">
          <h2 className="font-display text-[clamp(26px,5vw,32px)] text-[var(--color-primary)] mb-5 font-semibold">Join Our Inner Circle</h2>
          <p className="text-[15px] sm:text-[17px] text-[var(--color-on-surface-variant)] mb-8 max-w-xl mx-auto">
            Sign up now to receive expert tips, exclusive early access to new product launches, and 10% off your first order.
          </p>
          <NewsletterForm onSubscribe={onNewsletterSubscribe} onSuccess={onThanks} />
        </div>
      </section>
    </>
  );
}

function NewsletterForm({ onSubscribe, onSuccess }: { onSubscribe: (email: string) => Promise<void>; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!consent) {
      setStatus("error");
      setMessage("Please confirm that you want to receive product news.");
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      await onSubscribe(email.trim());
      onSuccess();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "We couldn't subscribe you right now.");
    }
  };

  return (
    <form className="max-w-lg mx-auto" onSubmit={submit}>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="flex-1 bg-white border border-[var(--color-outline-variant)] rounded-full px-6 py-4 sm:py-5 text-[14px] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition"
        />
        <button disabled={status === "sending"} className="bg-[var(--color-primary)] text-white px-7 py-4 sm:py-5 rounded-full text-[13px] uppercase tracking-widest font-semibold hover:bg-[var(--color-primary-fixed-dim)] hover:text-[var(--color-primary)] transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-60">
          {status === "sending" ? "Adding…" : "Subscribe"} <span className="material-symbols-outlined text-[18px]">mail</span>
        </button>
      </div>
      <label className="mt-3 flex items-start gap-2 text-left text-[12px] text-[var(--color-on-surface-variant)] cursor-pointer">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[var(--color-primary)]" />
        <span>I agree to receive product news and skincare updates by email. I can unsubscribe at any time.</span>
      </label>
      {status === "error" && <p className="mt-2 text-left text-[12px] text-[var(--color-error)]">{message}</p>}
    </form>
  );
}

function PromoCard({ image, badge, title, sub, highlight, cta, onClick, light }: {
  image: string; badge: string; title: string; sub: string; highlight?: string; cta?: string; onClick?: () => void; light?: boolean;
}) {
  return (
    <button onClick={onClick} className="group relative bg-[var(--color-surface-container-low)] rounded-3xl overflow-hidden h-[340px] sm:h-[440px] soft-shadow text-left">
      <div className="absolute inset-0 z-0 group-hover:scale-105 transition-transform duration-700">
        <SafeImage src={image} alt={title} className="w-full h-full object-cover" initials={title} />
      </div>
      <div className={`absolute inset-0 z-10 ${light ? "bg-black/5" : "bg-[var(--color-primary)]/15 mix-blend-multiply"}`} />
      <div className="relative z-20 p-7 sm:p-10 lg:p-12 h-full flex flex-col justify-end">
        <span className={`text-[10px] uppercase tracking-[0.2em] font-semibold mb-3 ${light ? "text-[var(--color-on-primary-container)]" : "text-white/90"}`}>{badge}</span>
        <h3 className={`font-display text-[clamp(22px,4vw,32px)] mb-2 font-semibold ${light ? "text-[var(--color-primary)]" : "text-white"}`}>{title}</h3>
        <p className={`text-[14px] sm:text-[15px] mb-5 ${light ? "text-[var(--color-on-surface-variant)]" : "text-white/90"}`}>{sub}</p>
        {highlight ? (
          <div className="flex items-center gap-4">
            <span className="font-display text-[20px] sm:text-[24px] text-[var(--color-accent-coral)] font-semibold">{highlight}</span>
            <span className="w-11 h-11 rounded-full bg-white text-[var(--color-primary)] flex items-center justify-center group-hover:bg-[var(--color-primary)] group-hover:text-white transition shadow-md">
              <span className="material-symbols-outlined">arrow_forward</span>
            </span>
          </div>
        ) : cta ? (
          <span className="bg-white text-[var(--color-primary)] px-6 sm:px-8 py-3 sm:py-4 rounded-full text-[12px] uppercase tracking-widest font-semibold self-start hover:bg-[var(--color-primary)] hover:text-white transition shadow-xl">
            {cta}
          </span>
        ) : null}
      </div>
    </button>
  );
}

function ValueRow({ icon, title, desc, tone }: { icon: string; title: string; desc: string; tone: "primary" | "secondary" }) {
  const tones = tone === "primary"
    ? { bg: "bg-[var(--color-primary-container)]/30", text: "text-[var(--color-primary)]" }
    : { bg: "bg-[var(--color-secondary-container)]/40", text: "text-[var(--color-secondary)]" };
  return (
    <div className="flex gap-5">
      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${tones.bg} flex items-center justify-center shrink-0`}>
        <span className={`material-symbols-outlined ${tones.text} icon-fill text-[28px] sm:text-[32px]`}>{icon}</span>
      </div>
      <div>
        <h5 className="text-[17px] sm:text-[19px] font-semibold text-[var(--color-on-surface)] mb-1.5">{title}</h5>
        <p className="text-[14px] sm:text-[15px] text-[var(--color-on-surface-variant)] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ProductCard({ product, onOpen, onAdd }: { product: Product; onOpen: () => void; onAdd: () => void }) {
  const soldOut = product.stock <= 0 || !product.inStock;
  return (
    <div className="group flex flex-col">
      <button onClick={onOpen} className="relative bg-white rounded-3xl aspect-[4/5] mb-4 sm:mb-5 overflow-hidden soft-shadow text-left">
        <SafeImage
          src={product.image}
          alt={product.name}
          initials={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-3 left-3 bg-[var(--color-tertiary)] text-white px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
          {soldOut ? "Sold Out" : `${product.stock} Left`}
        </div>
        {product.compareAt && (
          <div className="absolute top-3 right-3 bg-[var(--color-accent-coral)] text-white px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
            Sale
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onAdd(); }}
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
}

/* ============================ SHOP TAB ============================ */
function ShopTab({ onProduct, onAddToCart, wishlist, onWish, products, onHome }: {
  onProduct: (id: string) => void;
  onAddToCart: (id: string) => void;
  wishlist: string[];
  onWish: (id: string) => void;
  products: Product[];
  onHome: () => void;
}) {
  const [cat, setCat] = useState<"all" | "serum" | "oil" | "mask" | "spf" | "cleanser" | "body">("all");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    let l = [...products];
    if (cat !== "all") l = l.filter(p => p.category === cat);
    if (query.trim()) {
      const q = query.toLowerCase();
      l = l.filter(p => p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q));
    }
    return l;
  }, [cat, query, products]);

  const categories = [
    { id: "all", label: "All" },
    { id: "serum", label: "Serums" },
    { id: "oil", label: "Oils" },
    { id: "mask", label: "Masks" },
    { id: "spf", label: "SPF" },
    { id: "cleanser", label: "Cleansers" },
    { id: "body", label: "Body" },
  ] as const;

  return (
    <>
    <div className="max-w-7xl mx-auto px-5 sm:px-12 lg:px-20 py-6 sm:py-12">
      <Breadcrumbs trail={[{ label: "Home", onClick: onHome }, { label: "Shop" }]} />
      <div className="mb-7 sm:mb-10">
        <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Shop</span>
        <h1 className="font-display text-[clamp(28px,6vw,44px)] text-[var(--color-primary)] mt-2 mb-3 font-semibold">The Collection</h1>
        <p className="text-[14px] sm:text-[16px] text-[var(--color-on-surface-variant)] max-w-xl">
          Clinically calibrated formulas for African undertones and Kampala climate. Authentic, dermatologist-verified.
        </p>
      </div>

      {/* Search + chips */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] text-[18px]">search</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search serums, oils, masks…"
            className="w-full bg-white border border-[var(--color-outline-variant)] rounded-full pl-11 pr-4 py-3 text-[14px] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setCat(c.id as any)}
            className={`px-4 sm:px-5 py-2 rounded-full text-[12px] sm:text-[13px] font-semibold transition border ${
              cat === c.id
                ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                : "bg-white text-[var(--color-on-surface-variant)] border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {list.map(p => (
          <div key={p.id} className="group flex flex-col">
            <div className="relative bg-white rounded-3xl aspect-[4/5] mb-4 overflow-hidden soft-shadow">
              <button onClick={() => onProduct(p.id)} className="absolute inset-0 z-10">
                <SafeImage src={p.image} alt={p.name} initials={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </button>
              <div className="absolute top-3 left-3 bg-[var(--color-tertiary)] text-white px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest z-20">{p.stock <= 0 || !p.inStock ? "Sold Out" : `${p.stock} Left`}</div>
              {p.compareAt && (
                <div className="absolute top-3 right-3 bg-[var(--color-accent-coral)] text-white px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest z-20">Sale</div>
              )}
              <button onClick={() => onWish(p.id)} className="absolute bottom-3 left-3 bg-white text-[var(--color-primary)] w-10 h-10 rounded-full flex items-center justify-center shadow-md z-20 hover:scale-105 transition">
                <span className={`material-symbols-outlined text-[18px] ${wishlist.includes(p.id) ? "icon-fill text-[var(--color-accent-coral)]" : ""}`}>favorite</span>
              </button>
              <button disabled={p.stock <= 0 || !p.inStock} onClick={() => onAddToCart(p.id)} className="absolute bottom-3 right-3 bg-[var(--color-primary)] text-white p-2.5 rounded-full shadow-md z-20 hover:scale-105 transition disabled:opacity-50 disabled:bg-[var(--color-outline)]">
                <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
              </button>
            </div>
            <h4 className="text-[15px] sm:text-[17px] font-semibold text-[var(--color-on-surface)] mb-0.5 leading-tight">{p.name}</h4>
            <p className="text-[13px] text-[var(--color-on-surface-variant)] mb-2">{p.tagline}</p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[18px] sm:text-[22px] text-[var(--color-primary)] font-semibold">{UGX(p.price)}</span>
              {p.compareAt && <span className="text-[12px] text-[var(--color-on-surface-variant)] line-through">{UGX(p.compareAt)}</span>}
            </div>
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <div className="text-center py-16 text-[var(--color-on-surface-variant)]">
          <span className="material-symbols-outlined text-[40px] opacity-50">spa</span>
          <p className="mt-2 text-[14px]">No products matched. Try another filter.</p>
        </div>
      )}
    </div>

    {/* ABOUT OUR SERVICE */}
    <section className="bg-[var(--color-surface-cream)] py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-12 lg:px-20">
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Why All My Skin</span>
          <h2 className="font-display text-[clamp(26px,5vw,36px)] text-[var(--color-primary)] mt-2 mb-4 font-semibold">Skincare rooted in science, delivered with care</h2>
          <p className="text-[15px] sm:text-[17px] text-[var(--color-on-surface-variant)] max-w-2xl mx-auto leading-relaxed">
            We built All My Skin because Kampala deserved better — authentic, dermatologist-verified products formulated for African skin tones and the Ugandan climate, without the guesswork.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { ic: "science", t: "Clinically Verified", d: "Every product passes three independent stability tests. Actives are at effective concentrations — not marketing doses." },
            { ic: "eco", t: "For African Skin", d: "Formulated and tested on Fitzpatrick IV–VI skin tones. No white cast, no irritation stacking, real results." },
            { ic: "local_shipping", t: "Kampala Same-Day", d: "Order before 3pm and receive it the same day. Free delivery above UGX 150,000 within Kampala metro." },
          ].map(b => (
            <div key={b.t} className="bg-white rounded-3xl p-6 sm:p-7 soft-shadow">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary-container)]/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--color-primary)] icon-fill text-[22px]">{b.ic}</span>
              </div>
              <h3 className="font-display text-[19px] text-[var(--color-primary)] font-semibold mt-4">{b.t}</h3>
              <p className="text-[14px] text-[var(--color-on-surface-variant)] mt-2 leading-relaxed">{b.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* WHY WE'RE THE BEST SINCE 2022 */}
    <section className="py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-12 lg:px-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Our Story</span>
            <h2 className="font-display text-[clamp(28px,5vw,40px)] text-[var(--color-primary)] mt-2 mb-6 font-semibold leading-[1.1]">Trusted since 2022 by thousands of Ugandans</h2>
            <p className="text-[15px] sm:text-[17px] text-[var(--color-on-surface-variant)] leading-relaxed mb-6">
              All My Skin started in 2022 with a simple belief: everyone in Kampala deserves access to genuine, effective skincare — not counterfeits, not overpriced imports, but curated formulas that actually work for our skin and our climate.
            </p>
            <p className="text-[15px] sm:text-[17px] text-[var(--color-on-surface-variant)] leading-relaxed mb-8">
              Today, we partner with dermatologists, source directly from brand partners, and have served over 3,000 customers across Kampala, Entebbe, and beyond. Every batch is verified. Every formula is tested. Every delivery is personal.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { v: "3,000+", l: "Happy customers" },
                { v: "100%", l: "Authentic products" },
                { v: "4.9★", l: "Average rating" },
              ].map(s => (
                <div key={s.l} className="text-center">
                  <div className="font-display text-[24px] sm:text-[28px] text-[var(--color-primary)] font-semibold">{s.v}</div>
                  <div className="text-[12px] text-[var(--color-on-surface-variant)] mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden soft-shadow">
              <SafeImage src={LIFESTYLE_IMAGE} alt="Our story" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-5 -left-3 sm:-left-5 bg-white p-5 sm:p-7 rounded-3xl shadow-xl max-w-[260px] hidden md:block">
              <span className="text-[var(--color-accent-coral)] text-[11px] font-semibold uppercase tracking-widest mb-2 block">Our Promise</span>
              <p className="text-[15px] text-[var(--color-primary)] font-semibold leading-snug">Dermatologist-verified. Brand-direct. Never counterfeit.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </>
  );
}

/* ============================ ABOUT ============================ */
function AboutTab({ onHome }: { onHome: () => void }) {
  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-12 lg:px-20 py-8 sm:py-14">
      <Breadcrumbs trail={[{ label: "Home", onClick: onHome }, { label: "About Us" }]} />
      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Our Story</span>
      <h1 className="font-display text-[clamp(30px,6vw,48px)] text-[var(--color-primary)] mt-2 mb-6 font-semibold">Empathetic skincare,<br/>clinically engineered.</h1>
      <p className="text-[15px] sm:text-[17px] text-[var(--color-on-surface-variant)] leading-relaxed max-w-3xl">
        All My Skin is a Kampala-based skincare house dedicated to elevating everyday skincare to a mindful ritual.
        We blend dermatologist-grade actives with traditional African botanicals — for visible, luminous results without compromise.
      </p>

      <div className="grid sm:grid-cols-3 gap-5 mt-12">
        {[
          { ic: "spa", t: "Mindful Rituals", d: "Daily routines that calm the nervous system as much as the skin." },
          { ic: "verified", t: "Authentic Only", d: "Direct from brand partners. Every batch is dermatologist-verified." },
          { ic: "local_shipping", t: "Kampala Same-Day", d: "Free delivery on orders above UGX 150,000 within Kampala metro." },
        ].map(b => (
          <div key={b.t} className="bg-[var(--color-surface-cream)] rounded-3xl p-6 sm:p-7 soft-shadow">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary-container)]/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-[var(--color-primary)] icon-fill text-[22px]">{b.ic}</span>
            </div>
            <h3 className="font-display text-[19px] text-[var(--color-primary)] font-semibold mt-4">{b.t}</h3>
            <p className="text-[14px] text-[var(--color-on-surface-variant)] mt-2">{b.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="aspect-[4/3] rounded-3xl overflow-hidden lux-shadow">
          <SafeImage src={LIFESTYLE_IMAGE} alt="Studio portrait" className="w-full h-full object-cover" />
        </div>
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Our Promise</span>
          <h2 className="font-display text-[clamp(24px,4vw,32px)] text-[var(--color-primary)] mt-2 mb-5 font-semibold">Science you can feel.</h2>
          <p className="text-[15px] text-[var(--color-on-surface-variant)] leading-relaxed">
            Every formula passes through three independent stability tests, with peer-reviewed actives at clinically effective concentrations.
            Tested on African skin tones (Fitzpatrick IV–VI) — for inclusive results that actually deliver.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================ CONTACT ============================ */
function ContactTab({ session, onThanks, onHome }: { session: Session; onThanks: () => void; onHome: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-12 lg:px-20 py-8 sm:py-14">
      <Breadcrumbs trail={[{ label: "Home", onClick: onHome }, { label: "Contact" }]} />
      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Connect</span>
      <h1 className="font-display text-[clamp(30px,6vw,48px)] text-[var(--color-primary)] mt-2 mb-6 font-semibold">We're here for your skin journey.</h1>

      {/* RESPONSE TIME PROMISE */}
      <ResponseTimePromise onContact={onThanks} />

      {/* ALIA BOT PROMO */}
      <div className="bg-gradient-to-br from-[var(--color-primary)] to-[#3D6B62] rounded-3xl p-6 sm:p-8 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-white text-[28px]">smart_toy</span>
        </div>
        <div className="flex-1">
          <h3 className="font-display text-[20px] text-white font-semibold">Chat with Alia — your AI skin advisor</h3>
          <p className="text-[14px] text-white/80 mt-1 leading-relaxed">
            Get instant product recommendations, ingredient breakdowns, and skincare advice. Tap the chat button in the bottom-right corner to start a conversation.
          </p>
        </div>
        <button
          onClick={() => {
            const fab = document.querySelector('[aria-label="Alia Skin Advisor"]') as HTMLButtonElement | null;
            fab?.click();
          }}
          className="bg-white text-[var(--color-primary)] px-6 py-3 rounded-full text-[12px] uppercase tracking-widest font-semibold hover:bg-white/90 transition shrink-0"
        >
          Start chatting
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mt-8">
        <div className="space-y-6">
          {[
            { ic: "call", t: "Call us", d: "+256 700 100 100", sub: "Mon–Sat · 9am–7pm EAT" },
            { ic: "mail", t: "Email", d: "concierge@allmyskin.ug", sub: "Reply within 12 hours" },
            { ic: "storefront", t: "Flagship store", d: "Acacia Mall, Kololo", sub: "Kampala, Uganda" },
            { ic: "chat", t: "WhatsApp concierge", d: "+256 700 100 100", sub: "Instant aesthetician chat" },
          ].map(c => (
            <div key={c.t} className="flex gap-5">
              <div className="w-13 h-13 w-[52px] h-[52px] rounded-full bg-[var(--color-primary-container)]/40 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[var(--color-primary)] icon-fill text-[22px]">{c.ic}</span>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest font-semibold text-[var(--color-accent-coral)]">{c.t}</div>
                <div className="text-[17px] font-semibold text-[var(--color-on-surface)] mt-0.5">{c.d}</div>
                <div className="text-[13px] text-[var(--color-on-surface-variant)]">{c.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[var(--color-surface-cream)] rounded-3xl p-6 sm:p-8 soft-shadow">
          <h3 className="font-display text-[22px] text-[var(--color-primary)] font-semibold mb-5">Send us a message</h3>
          {sent ? (
            <div className="bg-[var(--color-primary-container)]/40 text-[var(--color-on-primary-container)] rounded-2xl p-5 flex items-start gap-3">
              <span className="material-symbols-outlined">check_circle</span>
              <div>
                <div className="font-semibold">Thank you — we've got it.</div>
                <div className="text-[13px] mt-1">Our concierge will reply to you within 12 hours.</div>
              </div>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setSent(true); onThanks(); }} className="space-y-4">
              <input defaultValue={session.name !== "Guest Visitor" ? session.name : ""} placeholder="Your name" required className="w-full bg-white border border-[var(--color-outline-variant)] rounded-2xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none" />
              <input type="email" defaultValue={session.email} placeholder="Email" required className="w-full bg-white border border-[var(--color-outline-variant)] rounded-2xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none" />
              <textarea placeholder="How can we help?" rows={5} required className="w-full bg-white border border-[var(--color-outline-variant)] rounded-2xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none resize-none" />
              <button className="w-full bg-[var(--color-primary)] text-white py-4 rounded-full text-[13px] uppercase tracking-widest font-semibold hover:bg-[var(--color-primary-fixed-dim)] hover:text-[var(--color-primary)] transition">
                Send message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================ ACCOUNT ============================ */
function AccountTab({ session, onLogout, orders, products, theme, setTheme }: { session: Session; onLogout: () => void; orders: Order[]; products: Product[]; theme: "light" | "dark" | "system"; setTheme: (v: "light" | "dark" | "system") => void }) {
  const accounts = useMemo(() => getAccounts(), []);
  const me = accounts.find(a => a.uid === session.uid);
  const [subTab, setSubTab] = useState<"overview" | "transactions" | "settings" | "terms">("overview");
  const myOrders = useMemo(() => orders.filter(o => o.uid === session.uid), [orders, session.uid]);

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-12 lg:px-20 py-8 sm:py-14">
      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Your Profile</span>
      <h1 className="font-display text-[clamp(28px,5vw,40px)] text-[var(--color-primary)] mt-2 mb-7 font-semibold">Hello, {session.name.split(" ")[0]}.</h1>

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        {/* SIDEBAR */}
        <aside className="bg-[var(--color-surface-cream)] rounded-3xl p-6 soft-shadow h-fit">
          {session.picture ? (
            <img src={session.picture} alt={session.name} className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full avatar-placeholder text-[28px]">{(session.name[0] || "U").toUpperCase()}</div>
          )}
          <div className="text-[17px] font-semibold text-[var(--color-primary)] mt-4">{session.name}</div>
          <div className="text-[13px] text-[var(--color-on-surface-variant)]">{session.email}</div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold bg-[var(--color-primary-container)]/40 text-[var(--color-on-primary-container)] px-2.5 py-1 rounded-full">
            <span className="material-symbols-outlined text-[12px]">verified</span>
            {me?.category === "seller" ? "Seller" : "Buyer"}
          </div>
          <div className="mt-5 space-y-1">
            {([
              { key: "overview" as const, label: "Overview", icon: "person" },
              { key: "transactions" as const, label: "Transactions", icon: "receipt_long" },
              { key: "settings" as const, label: "Theme & Settings", icon: "palette" },
              { key: "terms" as const, label: "Terms & Conditions", icon: "description" },
            ]).map(item => (
              <button key={item.key} onClick={() => setSubTab(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-[13px] font-medium transition ${
                  subTab === item.key
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-primary-container)]/40"
                }`}>
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
          <button onClick={onLogout} className="mt-4 w-full bg-[var(--color-primary)] text-white py-2.5 rounded-full text-[12px] uppercase tracking-widest font-semibold">Sign out</button>
        </aside>

        {/* MAIN CONTENT */}
        <div className="space-y-5">
          {/* OVERVIEW */}
          {subTab === "overview" && (
            <>
              <div className="bg-white rounded-3xl p-6 soft-shadow border border-[var(--color-outline-variant)]/40">
                <h3 className="font-display text-[20px] text-[var(--color-primary)] font-semibold mb-4">Details</h3>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
                  <Row k="Phone" v={me?.phone || "—"} />
                  <Row k="City" v={me?.city || "—"} />
                  <Row k="Member since" v={new Date(me?.createdAt || Date.now()).toLocaleDateString()} />
                  <Row k="Total orders" v={String(me?.orders ?? 0)} />
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 soft-shadow border border-[var(--color-outline-variant)]/40">
                <h3 className="font-display text-[20px] text-[var(--color-primary)] font-semibold mb-4">Recent activity</h3>
                <div className="text-[14px] text-[var(--color-on-surface-variant)]">
                  {me?.orders ? "Last order delivered to Ntinda on Mar 20, 2026." : "No orders yet — start your ritual today."}
                </div>
              </div>
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { v: String(myOrders.length), l: "Orders", ic: "shopping_bag" },
                  { v: String(myOrders.filter(o => o.status === "delivered").length), l: "Delivered", ic: "local_shipping" },
                  { v: String(myOrders.filter(o => o.status !== "delivered" && o.status !== "cancelled").length), l: "In progress", ic: "pending" },
                ].map(s => (
                  <div key={s.l} className="bg-white rounded-3xl p-5 soft-shadow border border-[var(--color-outline-variant)]/40 text-center">
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-[24px]">{s.ic}</span>
                    <div className="font-display text-[22px] text-[var(--color-primary)] font-semibold mt-1">{s.v}</div>
                    <div className="text-[12px] text-[var(--color-on-surface-variant)] mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TRANSACTIONS */}
          {subTab === "transactions" && (
            <div className="bg-white rounded-3xl p-6 soft-shadow border border-[var(--color-outline-variant)]/40">
              <h3 className="font-display text-[20px] text-[var(--color-primary)] font-semibold mb-5">Transaction History</h3>
              {myOrders.length === 0 ? (
                <div className="text-center py-10 text-[var(--color-on-surface-variant)]">
                  <span className="material-symbols-outlined text-[40px] opacity-50">receipt_long</span>
                  <p className="mt-2 text-[14px]">No transactions yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myOrders.map(order => (
                    <div key={order.id} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-surface-cream)]/50">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)]/40 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[var(--color-primary)] text-[18px]">
                          {order.status === "delivered" ? "check_circle" : order.status === "cancelled" ? "cancel" : "pending"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold text-[var(--color-on-surface)] truncate">
                          {order.items.map(i => i.name).join(", ")}
                        </div>
                        <div className="text-[12px] text-[var(--color-on-surface-variant)]">
                          {new Date(order.placedAt).toLocaleDateString()} · Order #{order.id.slice(-6).toUpperCase()}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[15px] font-semibold text-[var(--color-primary)]">{UGX(order.subtotal)}</div>
                        <div className={`text-[11px] font-semibold uppercase tracking-wider mt-0.5 ${
                          order.status === "delivered" ? "text-green-600" : order.status === "cancelled" ? "text-red-500" : "text-[var(--color-accent-coral)]"
                        }`}>
                          {ORDER_STATUS_LABEL[order.status]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* THEME & SETTINGS */}
          {subTab === "settings" && (
            <div className="space-y-5">
              <div className="bg-white rounded-3xl p-6 soft-shadow border border-[var(--color-outline-variant)]/40">
                <h3 className="font-display text-[20px] text-[var(--color-primary)] font-semibold mb-5">Appearance</h3>
                <p className="text-[14px] text-[var(--color-on-surface-variant)] mb-5">Choose how All My Skin looks on your device.</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { key: "light" as const, label: "Light", icon: "light_mode", desc: "Bright & clean" },
                    { key: "dark" as const, label: "Dark", icon: "dark_mode", desc: "Easy on the eyes" },
                    { key: "system" as const, label: "System", icon: "brightness_auto", desc: "Match your device" },
                  ]).map(opt => (
                    <button key={opt.key} onClick={() => setTheme(opt.key)}
                      className={`rounded-2xl p-5 text-center border-2 transition ${
                        theme === opt.key
                          ? "border-[var(--color-primary)] bg-[var(--color-primary-container)]/20"
                          : "border-[var(--color-outline-variant)]/40 hover:border-[var(--color-primary)]/40"
                      }`}>
                      <span className="material-symbols-outlined text-[28px] text-[var(--color-primary)]">{opt.icon}</span>
                      <div className="text-[14px] font-semibold text-[var(--color-on-surface)] mt-2">{opt.label}</div>
                      <div className="text-[12px] text-[var(--color-on-surface-variant)] mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 soft-shadow border border-[var(--color-outline-variant)]/40">
                <h3 className="font-display text-[20px] text-[var(--color-primary)] font-semibold mb-4">Notifications</h3>
                <div className="space-y-4">
                  <ToggleRow label="Order updates" desc="Get notified when your order status changes" defaultOn />
                  <ToggleRow label="Promotions" desc="Receive exclusive deals and new product alerts" defaultOn />
                  <ToggleRow label="Skin tips" desc="Weekly skincare advice from Alia" defaultOn={false} />
                </div>
              </div>
            </div>
          )}

          {/* TERMS & CONDITIONS */}
          {subTab === "terms" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 soft-shadow border border-[var(--color-outline-variant)]/40">
              <h3 className="font-display text-[20px] text-[var(--color-primary)] font-semibold mb-5">Terms & Conditions</h3>
              <div className="space-y-5 text-[14px] text-[var(--color-on-surface-variant)] leading-relaxed">
                <div>
                  <h4 className="font-semibold text-[var(--color-on-surface)] text-[15px] mb-1">1. Acceptance of Terms</h4>
                  <p>By accessing or using All My Skin ("the Platform"), you agree to be bound by these Terms & Conditions. If you do not agree, please discontinue use of the Platform immediately.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--color-on-surface)] text-[15px] mb-1">2. Products & Authenticity</h4>
                  <p>All products sold on All My Skin are sourced directly from brand partners or authorized distributors. We guarantee 100% authenticity. Any product found to be counterfeit will be fully refunded and reported to relevant authorities.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--color-on-surface)] text-[15px] mb-1">3. Orders & Payment</h4>
                  <p>Orders are confirmed upon successful payment. Prices are listed in Ugandan Shillings (UGX) and include applicable taxes. We accept Mobile Money (MTN, Airtel), Visa, and Mastercard. Orders may be cancelled within 2 hours of placement for a full refund.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--color-on-surface)] text-[15px] mb-1">4. Delivery</h4>
                  <p>Same-day delivery is available within Kampala metro for orders placed before 3:00 PM EAT. Standard delivery takes 1–3 business days within Uganda. Free delivery applies to orders above UGX 150,000 within Kampala.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--color-on-surface)] text-[15px] mb-1">5. Returns & Refunds</h4>
                  <p>Unopened products may be returned within 14 days of delivery for a full refund. Opened products may be returned only if they cause an adverse skin reaction, accompanied by a dermatologist's note. Refunds are processed within 5 business days to the original payment method.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--color-on-surface)] text-[15px] mb-1">6. Privacy</h4>
                  <p>Your personal data is handled in accordance with Uganda's Data Protection and Privacy Act (2019). We do not sell or share your data with third parties for marketing purposes. See our Privacy Policy for full details.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--color-on-surface)] text-[15px] mb-1">7. Liability</h4>
                  <p>All My Skin is not liable for adverse reactions resulting from misuse of products. We recommend patch-testing new products and consulting a dermatologist for specific skin concerns. Product descriptions are for informational purposes and do not constitute medical advice.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--color-on-surface)] text-[15px] mb-1">8. Changes to Terms</h4>
                  <p>We reserve the right to update these terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised terms. Users will be notified of material changes via email.</p>
                </div>
                <p className="text-[12px] pt-2 border-t border-[var(--color-outline-variant)]/30">Last updated: July 2026 · All My Skin Ltd. · Kampala, Uganda</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-[var(--color-on-surface-variant)]">{k}</div>
      <div className="text-[15px] text-[var(--color-on-surface)] font-medium mt-0.5">{v}</div>
    </div>
  );
}
function ToggleRow({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[14px] font-medium text-[var(--color-on-surface)]">{label}</div>
        <div className="text-[12px] text-[var(--color-on-surface-variant)]">{desc}</div>
      </div>
      <button onClick={() => setOn(!on)} className={`relative w-12 h-7 rounded-full transition ${on ? "bg-[var(--color-primary)]" : "bg-[var(--color-outline-variant)]"}`}>
        <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

/* ============================ ADMIN PANEL (dark glass) ============================ */
function AdminPanel({ adminString, setAdminString, products, setProducts, orders }: {
  adminString: string;
  setAdminString: (v: string) => void;
  products: Product[];
  setProducts: (updater: (prev: Product[]) => Product[]) => void;
  orders: Order[];
}) {
  const [draft, setDraft] = useState(adminString);
  useEffect(() => setDraft(adminString), [adminString]);
  const [adminTab, setAdminTab] = useState<"overview" | "inventory" | "vendors" | "withdrawals">("overview");

  const accounts = getAccounts();
  const withdrawals = getWithdrawals();
  const [newProduct, setNewProduct] = useState({
    name: "",
    tagline: "",
    price: "75000",
    stock: "10",
    category: "serum" as Product["category"],
    image: "",
  });
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;

  const updateProduct = (id: string, patch: Partial<Product>) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const next = { ...p, ...patch };
      const stock = Math.max(0, Number(next.stock) || 0);
      return { ...next, stock, inStock: stock > 0 && next.inStock };
    }));
  };

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const stock = Math.max(0, Number(newProduct.stock) || 0);
    const price = Math.max(0, Number(newProduct.price) || 0);
    const name = newProduct.name.trim();
    if (!name || !price) return;
    const product: Product = {
      id: "p_" + Date.now().toString(36),
      name,
      tagline: newProduct.tagline.trim() || "New ritual",
      price,
      category: newProduct.category,
      image: newProduct.image.trim() || "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=80",
      inStock: stock > 0,
      stock,
      description: "A newly added All My Skin product. Update the product details as inventory changes.",
      ingredients: ["Dermatologist verified"],
    };
    setProducts(prev => [product, ...prev]);
    setNewProduct({ name: "", tagline: "", price: "75000", stock: "10", category: "serum", image: "" });
  };

  /* Vendor stats */
  const vendorStats = VENDORS.map(v => {
    const vendorOrders = orders.filter(o => o.items.some(i => i.vendorId === v.id));
    const revenue = vendorOrders
      .filter(o => o.status !== "cancelled" && o.status !== "refunded")
      .reduce((sum, o) => sum + o.items.filter(i => i.vendorId === v.id).reduce((s, i) => s + i.price * i.qty, 0), 0);
    const totalSales = vendorOrders.reduce((sum, o) => sum + o.items.filter(i => i.vendorId === v.id).reduce((s, i) => s + i.qty, 0), 0);
    const vendorProducts = products.filter(p => p.vendorId === v.id);
    const totalInventory = vendorProducts.reduce((sum, p) => sum + p.stock, 0);
    const vendorWithdrawals = withdrawals.filter(w => w.vendorId === v.id);
    const withdrawnAmount = vendorWithdrawals.filter(w => w.status === "approved").reduce((s, w) => s + w.amount, 0);
    return { ...v, revenue, totalSales, totalInventory, vendorProducts, withdrawnAmount, pendingWithdrawals: vendorWithdrawals.filter(w => w.status === "pending").length };
  });

  return (
    <div className="bg-[#0f172a] text-white min-h-[80vh] py-8 px-5 sm:px-12 lg:px-20 rounded-t-3xl md:rounded-3xl md:mt-6 md:mx-6 max-w-[1300px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#FA9090] icon-fill">shield_person</span>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#FA9090] font-semibold">Privileged · Owner Only</div>
            <h1 className="font-display text-[22px] sm:text-[28px] font-semibold">Admin Dashboard</h1>
          </div>
        </div>
        <div className="text-[11px] text-white/40 bg-white/[0.04] border border-white/10 px-3 py-1.5 rounded-full font-mono">
          Session secured · v5.0
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-2 mb-7 border-b border-white/10 overflow-x-auto">
        {([
          { id: "overview" as const, label: "Overview", icon: "dashboard" },
          { id: "inventory" as const, label: "Inventory", icon: "inventory_2" },
          { id: "vendors" as const, label: "Vendors", icon: "storefront" },
          { id: "withdrawals" as const, label: "Withdrawals", icon: "payments" },
        ]).map(t => (
          <button key={t.id} onClick={() => setAdminTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[12px] uppercase tracking-widest font-semibold whitespace-nowrap border-b-2 transition ${
              adminTab === t.id ? "border-[#FA9090] text-[#FA9090]" : "border-transparent text-white/50"
            }`}>
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {adminTab === "overview" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-7">
            {[
              ["Users", String(accounts.length), "person"],
              ["Products", String(products.length), "inventory_2"],
              ["Low stock", String(lowStock), "production_quantity_limits"],
              ["Total revenue", UGX(vendorStats.reduce((s, v) => s + v.revenue, 0)), "payments"],
            ].map(([l, v, ic]) => (
              <div key={l} className="rounded-2xl bg-white/[0.04] border border-white/10 p-4 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FA9090] text-[18px]">{ic}</span>
                  <span className="text-[10px] uppercase tracking-widest text-white/50">{l}</span>
                </div>
                <div className="text-[16px] sm:text-[18px] font-semibold mt-1">{v}</div>
              </div>
            ))}
          </div>

          {/* CONFIG STRING */}
          <section className="rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md p-6 sm:p-7 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="material-symbols-outlined text-[#FA9090] icon-fill text-[22px]">campaign</span>
              <div>
                <h2 className="font-display text-[20px] font-semibold">Global Announcement Banner</h2>
                <p className="text-[12.5px] text-white/60 mt-0.5">
                  This string is persisted to <code className="bg-white/10 px-1.5 py-0.5 rounded text-[#FA9090]">localStorage</code> key
                  <code className="bg-white/10 px-1.5 py-0.5 rounded text-[#FA9090] ml-1">{ADMIN_STRING_KEY}</code>
                  and rendered live on the public Home page.
                </p>
              </div>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full bg-[#0f172a] border border-white/15 rounded-2xl px-4 py-3 text-[14px] text-white placeholder-white/30 focus:border-[#FA9090] outline-none resize-none font-mono"
              placeholder="Type a global message…"
            />
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <button
                onClick={() => setAdminString(draft)}
                className="px-5 py-2.5 rounded-full bg-[#FA9090] text-[#2D2926] font-semibold text-[13px] hover:bg-[#ff9d9d] transition flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                Save to localStorage
              </button>
              <button
                onClick={() => { setDraft(""); setAdminString(""); }}
                className="px-5 py-2.5 rounded-full border border-white/15 bg-white/[0.04] text-white text-[13px] font-semibold hover:bg-white/[0.08]"
              >
                Clear banner
              </button>
              <div className="text-[11px] text-white/40 ml-auto">
                Persisted · {draft.length} chars
              </div>
            </div>
          </section>

          {/* USER TABLE */}
          <section className="rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md p-6 sm:p-7 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined text-[#FA9090] icon-fill text-[22px]">group</span>
              <h2 className="font-display text-[20px] font-semibold">Registered Accounts</h2>
              <span className="text-[11px] text-white/50">({accounts.length})</span>
            </div>
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-[13px] min-w-[640px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-white/40">
                    <th className="py-3 font-semibold">Account</th>
                    <th className="font-semibold">Role</th>
                    <th className="font-semibold">Category</th>
                    <th className="font-semibold">City</th>
                    <th className="font-semibold">Orders</th>
                    <th className="font-semibold">Member since</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a: Account) => (
                    <tr key={a.uid} className="border-t border-white/5">
                      <td className="py-3.5">
                        <div className="font-semibold text-white">{a.name}</div>
                        <div className="text-[11px] text-white/50">{maskEmail(a.email)}</div>
                      </td>
                      <td>
                        <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full ${a.role === "admin" ? "bg-[#FA9090]/20 text-[#FA9090] border border-[#FA9090]/30" : "bg-white/5 text-white/70 border border-white/10"}`}>
                          {a.role}
                        </span>
                      </td>
                      <td>
                        {a.category ? (
                          <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full ${a.category === "seller" ? "bg-emerald-500/20 text-emerald-400" : "bg-sky-500/20 text-sky-400"}`}>
                            {a.category}
                          </span>
                        ) : <span className="text-white/30 text-[11px]">—</span>}
                      </td>
                      <td className="text-white/70">{a.city || "—"}</td>
                      <td className="text-white/70">{a.orders ?? 0}</td>
                      <td className="text-white/50 text-[12px]">{new Date(a.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* INVENTORY TAB */}
      {adminTab === "inventory" && (
        <section className="rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md p-6 sm:p-7 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#FA9090] icon-fill text-[22px]">inventory_2</span>
              <div>
                <h2 className="font-display text-[20px] font-semibold">Inventory</h2>
                <p className="text-[12px] text-white/50">Edit stock, pricing, product images, and sale status. Changes save automatically.</p>
              </div>
            </div>
            <button
              onClick={() => setProducts(() => PRODUCTS)}
              className="px-4 py-2 rounded-full border border-white/15 bg-white/[0.04] text-white text-[12px] font-semibold hover:bg-white/[0.08]"
            >
              Reset catalog
            </button>
          </div>

          <form onSubmit={addProduct} className="grid md:grid-cols-6 gap-3 mb-5">
            <input value={newProduct.name} onChange={e => setNewProduct(v => ({ ...v, name: e.target.value }))} placeholder="Product name" className="md:col-span-2 bg-[#0f172a] border border-white/15 rounded-2xl px-3 py-2.5 text-[13px]" />
            <input value={newProduct.tagline} onChange={e => setNewProduct(v => ({ ...v, tagline: e.target.value }))} placeholder="Tagline" className="bg-[#0f172a] border border-white/15 rounded-2xl px-3 py-2.5 text-[13px]" />
            <select value={newProduct.category} onChange={e => setNewProduct(v => ({ ...v, category: e.target.value as Product["category"] }))} className="bg-[#0f172a] border border-white/15 rounded-2xl px-3 py-2.5 text-[13px]">
              {["serum", "oil", "mask", "spf", "cleanser", "body"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={newProduct.price} onChange={e => setNewProduct(v => ({ ...v, price: e.target.value }))} inputMode="numeric" placeholder="Price" className="bg-[#0f172a] border border-white/15 rounded-2xl px-3 py-2.5 text-[13px]" />
            <input value={newProduct.stock} onChange={e => setNewProduct(v => ({ ...v, stock: e.target.value }))} inputMode="numeric" placeholder="Stock" className="bg-[#0f172a] border border-white/15 rounded-2xl px-3 py-2.5 text-[13px]" />
            <input value={newProduct.image} onChange={e => setNewProduct(v => ({ ...v, image: e.target.value }))} placeholder="Image URL" className="md:col-span-5 bg-[#0f172a] border border-white/15 rounded-2xl px-3 py-2.5 text-[13px]" />
            <button className="rounded-2xl bg-[#FA9090] text-[#2D2926] font-semibold text-[13px] flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add product
            </button>
          </form>

          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-[12.5px] min-w-[920px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-white/40">
                  <th className="py-3 font-semibold">Product</th>
                  <th className="font-semibold">Category</th>
                  <th className="font-semibold">Price</th>
                  <th className="font-semibold">Stock</th>
                  <th className="font-semibold">Status</th>
                  <th className="font-semibold">Image</th>
                  <th className="font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-t border-white/5 align-top">
                    <td className="py-3 pr-3">
                      <input value={p.name} onChange={e => updateProduct(p.id, { name: e.target.value })} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-white font-semibold" />
                      <input value={p.tagline} onChange={e => updateProduct(p.id, { tagline: e.target.value })} className="mt-2 w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-white/70" />
                    </td>
                    <td className="py-3 pr-3">
                      <select value={p.category} onChange={e => updateProduct(p.id, { category: e.target.value as Product["category"] })} className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2">
                        {["serum", "oil", "mask", "spf", "cleanser", "body"].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="py-3 pr-3">
                      <input value={p.price} onChange={e => updateProduct(p.id, { price: Number(e.target.value) || 0 })} inputMode="numeric" className="w-28 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2" />
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateProduct(p.id, { stock: Math.max(0, p.stock - 1), inStock: p.stock - 1 > 0 })} className="w-8 h-8 rounded-full border border-white/15">-</button>
                        <input value={p.stock} onChange={e => updateProduct(p.id, { stock: Number(e.target.value) || 0, inStock: Number(e.target.value) > 0 })} inputMode="numeric" className="w-16 text-center bg-white/[0.04] border border-white/10 rounded-xl px-2 py-2" />
                        <button type="button" onClick={() => updateProduct(p.id, { stock: p.stock + 1, inStock: true })} className="w-8 h-8 rounded-full border border-white/15">+</button>
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <label className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest">
                        <input type="checkbox" checked={p.inStock && p.stock > 0} onChange={e => updateProduct(p.id, { inStock: e.target.checked, stock: e.target.checked && p.stock === 0 ? 1 : p.stock })} className="accent-[#FA9090]" />
                        {p.inStock && p.stock > 0 ? "Live" : "Hidden"}
                      </label>
                    </td>
                    <td className="py-3 pr-3">
                      <input value={p.image} onChange={e => updateProduct(p.id, { image: e.target.value })} className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-white/70" />
                    </td>
                    <td className="py-3 text-right">
                      <button type="button" onClick={() => setProducts(prev => prev.filter(item => item.id !== p.id))} className="text-[#FA9090] text-[11px] uppercase tracking-widest font-semibold">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* VENDORS TAB */}
      {adminTab === "vendors" && (
        <section className="rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md p-6 sm:p-7 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="material-symbols-outlined text-[#FA9090] icon-fill text-[22px]">storefront</span>
            <h2 className="font-display text-[20px] font-semibold">Vendor Performance</h2>
          </div>
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-[13px] min-w-[640px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-white/40">
                  <th className="py-3 font-semibold">Vendor</th>
                  <th className="font-semibold">Products</th>
                  <th className="font-semibold">Inventory</th>
                  <th className="font-semibold">Total Sales</th>
                  <th className="font-semibold">Revenue</th>
                  <th className="font-semibold">Withdrawn</th>
                  <th className="font-semibold">Pending</th>
                </tr>
              </thead>
              <tbody>
                {vendorStats.map(v => (
                  <tr key={v.id} className="border-t border-white/5">
                    <td className="py-3.5">
                      <div className="font-semibold text-white">{v.name}</div>
                      <div className="text-[11px] text-white/50">{v.city}</div>
                    </td>
                    <td className="text-white/70">{v.vendorProducts.length}</td>
                    <td className="text-white/70">{v.totalInventory}</td>
                    <td className="text-white/70">{v.totalSales}</td>
                    <td className="text-white/70">{UGX(v.revenue)}</td>
                    <td className="text-white/70">{UGX(v.withdrawnAmount)}</td>
                    <td>
                      <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full ${v.pendingWithdrawals > 0 ? "bg-amber-500/20 text-amber-400" : "text-white/50 bg-white/5"}`}>
                        {v.pendingWithdrawals} pending
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* WITHDRAWALS TAB */}
      {adminTab === "withdrawals" && (
        <div className="space-y-5">
          <section className="rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md p-6 sm:p-7">
            <div className="flex items-center gap-3 mb-5">
              <span className="material-symbols-outlined text-[#FA9090] icon-fill text-[22px]">payments</span>
              <h2 className="font-display text-[20px] font-semibold">Withdrawal Requests</h2>
              <span className="text-[11px] text-white/50">({withdrawals.length})</span>
            </div>
            {withdrawals.length === 0 ? (
              <p className="text-[13px] text-white/50">No withdrawal requests yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-[13px] min-w-[600px]">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-widest text-white/40">
                      <th className="py-3 font-semibold">Vendor</th>
                      <th className="font-semibold">Amount</th>
                      <th className="font-semibold">Date</th>
                      <th className="font-semibold">Status</th>
                      <th className="font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...withdrawals].sort((a, b) => b.requestedAt - a.requestedAt).map(w => (
                      <tr key={w.id} className="border-t border-white/5">
                        <td className="py-3.5 font-semibold text-white">{w.vendorName}</td>
                        <td className="text-white">{UGX(w.amount)}</td>
                        <td className="text-white/50 text-[12px]">{new Date(w.requestedAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full ${
                            w.status === "approved" ? "bg-emerald-500/20 text-emerald-400" :
                            w.status === "rejected" ? "bg-red-500/20 text-red-400" :
                            "bg-amber-500/20 text-amber-400"
                          }`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="text-right">
                          {w.status === "pending" && (
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => updateWithdrawal(w.id, { status: "approved", resolvedAt: Date.now() })}
                                className="text-[11px] uppercase tracking-widest font-semibold px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                                Approve
                              </button>
                              <button onClick={() => updateWithdrawal(w.id, { status: "rejected", resolvedAt: Date.now() })}
                                className="text-[11px] uppercase tracking-widest font-semibold px-3 py-1.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30">
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      <section className="rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md p-6 sm:p-7">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-[#FA9090] icon-fill text-[22px]">lock</span>
          <h2 className="font-display text-[20px] font-semibold">Security Policy</h2>
        </div>
        <ul className="space-y-2.5 text-[13.5px] text-white/70">
          <li>✓ Admin tab and admin routes are hidden via <code className="bg-white/10 px-1.5 py-0.5 rounded text-[#FA9090]">display: none</code> for non-admin sessions.</li>
          <li>✓ All e-commerce mutations (cart add, checkout, wishlist) gated behind <code className="bg-white/10 px-1.5 py-0.5 rounded text-[#FA9090]">role !== "guest"</code> check with sign-in prompt fallback.</li>
          <li>✓ Session token written to <code className="bg-white/10 px-1.5 py-0.5 rounded text-[#FA9090]">localStorage</code> — survives refresh & network drops.</li>
          <li>✓ Image fetch failures swap to CSS avatar placeholder — no broken icons reach UI.</li>
          <li>✓ Admin configuration variable persisted to <code className="bg-white/10 px-1.5 py-0.5 rounded text-[#FA9090]">{ADMIN_STRING_KEY}</code> with cross-tab sync.</li>
        </ul>
      </section>
    </div>
  );
}

/* ============================ PRODUCT MODAL ============================ */
function StarRow({ rating, size = 16, onPick }: { rating: number; size?: number; onPick?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={onPick ? () => onPick(n) : undefined}
          className={`material-symbols-outlined ${onPick ? "cursor-pointer" : ""} ${n <= rating ? "icon-fill text-[var(--color-accent-coral)]" : "text-[var(--color-outline-variant)]"}`}
          style={{ fontSize: size }}
        >
          star
        </span>
      ))}
    </div>
  );
}

function ProductModal({ product, isGuest, inWish, onWish, onAdd, onClose, reviews, canReview, onSubmitReview }: {
  product: Product; isGuest: boolean; inWish: boolean; onWish: () => void; onAdd: () => void; onClose: () => void;
  reviews: Review[]; canReview: boolean; onSubmitReview: (rating: number, comment: string) => void;
}) {
  const soldOut = product.stock <= 0 || !product.inStock;
  const productReviews = reviews.filter(r => r.productId === product.id).sort((a, b) => b.createdAt - a.createdAt);
  const avgRating = productReviews.length ? productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length : 0;
  const [draftRating, setDraftRating] = useState(5);
  const [draftComment, setDraftComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="fixed inset-0 z-[155] bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeUp" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col sm:flex-row max-h-[92vh]" onClick={e => e.stopPropagation()}>
        <div className="relative w-full sm:w-1/2 aspect-square sm:aspect-auto bg-[var(--color-surface-cream)] shrink-0">
          <SafeImage src={product.image} alt={product.name} initials={product.name} className="w-full h-full object-cover" />
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 text-[var(--color-primary)] shadow flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          {product.compareAt && (
            <div className="absolute top-3 left-3 bg-[var(--color-accent-coral)] text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Sale</div>
          )}
        </div>
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">{product.category}</span>
          <h2 className="font-display text-[24px] sm:text-[28px] text-[var(--color-primary)] font-semibold mt-2 leading-tight">{product.name}</h2>
          <p className="text-[14px] text-[var(--color-on-surface-variant)] mt-1">{product.tagline}</p>

          {productReviews.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <StarRow rating={Math.round(avgRating)} size={15} />
              <span className="text-[12px] text-[var(--color-on-surface-variant)]">{avgRating.toFixed(1)} · {productReviews.length} review{productReviews.length !== 1 ? "s" : ""}</span>
            </div>
          )}

          <div className="flex items-baseline gap-3 mt-4">
            <span className="font-display text-[28px] text-[var(--color-primary)] font-semibold">{UGX(product.price)}</span>
            {product.compareAt && <span className="text-[14px] text-[var(--color-on-surface-variant)] line-through">{UGX(product.compareAt)}</span>}
          </div>

          <p className="text-[14px] text-[var(--color-on-surface-variant)] mt-5 leading-relaxed">{product.description}</p>

          <div className="mt-5">
            <div className="text-[11px] uppercase tracking-widest font-semibold text-[var(--color-primary)] mb-2">Key Actives</div>
            <div className="flex flex-wrap gap-1.5">
              {product.ingredients.map(i => (
                <span key={i} className="text-[11px] px-2.5 py-1 bg-[var(--color-primary-container)]/30 text-[var(--color-on-primary-container)] rounded-full">{i}</span>
              ))}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={onWish} className="w-12 h-12 shrink-0 rounded-full border border-[var(--color-outline-variant)] flex items-center justify-center hover:border-[var(--color-primary)] transition">
              <span className={`material-symbols-outlined ${inWish ? "icon-fill text-[var(--color-accent-coral)]" : "text-[var(--color-primary)]"}`}>favorite</span>
            </button>
            <button disabled={soldOut} onClick={onAdd} className="flex-1 bg-[var(--color-primary)] text-white py-3 rounded-full text-[13px] uppercase tracking-widest font-semibold hover:bg-[var(--color-primary-fixed-dim)] hover:text-[var(--color-primary)] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-[var(--color-primary)] disabled:hover:text-white">
              <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
              {soldOut ? "Sold out" : isGuest ? "Sign in to buy" : "Add to bag"}
            </button>
          </div>

          {/* Reviews */}
          <div className="mt-8 pt-6 border-t border-[var(--color-outline-variant)]/50">
            <h3 className="font-display text-[17px] text-[var(--color-primary)] font-semibold mb-3">Reviews</h3>

            {canReview && !submitted && (
              <div className="bg-[var(--color-surface-cream)] rounded-2xl p-4 mb-4">
                <div className="text-[12px] font-semibold text-[var(--color-primary)] mb-2">Write a review (verified purchase)</div>
                <StarRow rating={draftRating} onPick={setDraftRating} size={20} />
                <textarea
                  value={draftComment}
                  onChange={e => setDraftComment(e.target.value)}
                  placeholder="How did this product work for you?"
                  className="w-full mt-2 rounded-xl border border-[var(--color-outline-variant)] p-2.5 text-[13px] bg-white focus:outline-none focus:border-[var(--color-primary)]"
                  rows={2}
                />
                <button
                  onClick={() => { if (!draftComment.trim()) return; onSubmitReview(draftRating, draftComment.trim()); setSubmitted(true); }}
                  className="mt-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-full text-[11px] uppercase tracking-widest font-semibold"
                >
                  Submit review
                </button>
              </div>
            )}
            {submitted && <div className="text-[13px] text-[var(--color-primary)] mb-4">Thanks — your review has been posted.</div>}

            {productReviews.length === 0 ? (
              <p className="text-[13px] text-[var(--color-on-surface-variant)]">No reviews yet. Verified buyers can be the first to share their experience.</p>
            ) : (
              <div className="space-y-4">
                {productReviews.map(r => (
                  <div key={r.id} className="text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--color-primary)]">{r.name}</span>
                      {r.verifiedPurchase && (
                        <span className="text-[10px] uppercase tracking-widest text-[var(--color-on-primary-container)] bg-[var(--color-primary-container)]/40 px-2 py-0.5 rounded-full">Verified purchase</span>
                      )}
                    </div>
                    <StarRow rating={r.rating} size={13} />
                    <p className="text-[var(--color-on-surface-variant)] mt-1 leading-relaxed">{r.comment}</p>
                    <div className="text-[11px] text-[var(--color-on-surface-variant)]/70 mt-1">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ CART DRAWER ============================ */
function CartDrawer({ cartFull, subtotal, isGuest, onClose, onCheckout, onRemove, onQty }: {
  cartFull: { productId: string; qty: number; p: Product }[];
  subtotal: number;
  isGuest: boolean;
  onClose: () => void;
  onCheckout: () => void;
  onRemove: (id: string) => void;
  onQty: (id: string, delta: number) => void;
}) {
  const shipping = subtotal > 150000 || subtotal === 0 ? 0 : 8000;
  const total = subtotal + shipping;
  return (
    <div className="fixed inset-0 z-[160] flex justify-end animate-fadeUp" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full sm:w-[420px] bg-white h-full flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="h-[64px] px-5 flex items-center justify-between border-b border-[var(--color-outline-variant)]">
          <h2 className="font-display text-[20px] text-[var(--color-primary)] font-semibold">Your Bag</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px] text-[var(--color-primary)]">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {cartFull.length === 0 ? (
            <div className="text-center py-16 text-[var(--color-on-surface-variant)]">
              <span className="material-symbols-outlined text-[40px] opacity-50">shopping_bag</span>
              <p className="mt-2 text-[14px]">Your bag is empty.</p>
            </div>
          ) : (
            cartFull.map(ci => (
              <div key={ci.productId} className="flex gap-3 border-b border-[var(--color-outline-variant)]/50 pb-4">
                <SafeImage src={ci.p.image} alt={ci.p.name} initials={ci.p.name} className="w-16 h-16 rounded-2xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[var(--color-on-surface)] line-clamp-2 leading-tight">{ci.p.name}</div>
                  <div className="text-[12px] text-[var(--color-on-surface-variant)] mt-0.5">{UGX(ci.p.price)}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => onQty(ci.productId, -1)} className="w-7 h-7 rounded-full border border-[var(--color-outline-variant)] text-[var(--color-primary)] text-[16px]">–</button>
                    <span className="text-[13px] w-6 text-center">{ci.qty}</span>
                    <button onClick={() => onQty(ci.productId, 1)} className="w-7 h-7 rounded-full border border-[var(--color-outline-variant)] text-[var(--color-primary)] text-[16px]">+</button>
                    <button onClick={() => onRemove(ci.productId)} className="ml-auto text-[11px] text-[var(--color-error)]">Remove</button>
                  </div>
                </div>
                <div className="text-[14px] font-semibold text-[var(--color-primary)]">{UGX(ci.p.price * ci.qty)}</div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-[var(--color-outline-variant)] p-5 space-y-3 bg-[var(--color-surface-cream)]">
          <Line k="Subtotal" v={UGX(subtotal)} />
          <Line k="Shipping" v={shipping === 0 ? "FREE" : UGX(shipping)} />
          <Line k="Total" v={UGX(total)} bold />
          <button
            disabled={cartFull.length === 0}
            onClick={onCheckout}
            className="w-full bg-[var(--color-primary)] text-white py-3.5 rounded-full text-[13px] uppercase tracking-widest font-semibold disabled:opacity-40 hover:bg-[var(--color-primary-fixed-dim)] hover:text-[var(--color-primary)] transition flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">{isGuest ? "lock" : "credit_card"}</span>
            {isGuest ? "Sign in to checkout" : "Secure checkout"}
          </button>
          <div className="text-[10.5px] text-[var(--color-on-surface-variant)] text-center">MTN MoMo · Airtel Money · Card · Cash on delivery</div>
        </div>
      </div>
    </div>
  );
}
function Line({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-[16px] font-semibold text-[var(--color-primary)]" : "text-[13px] text-[var(--color-on-surface-variant)]"}`}>
      <span>{k}</span><span>{v}</span>
    </div>
  );
}

/* ============================ SIGN-IN PROMPT MODAL ============================ */
function SignInPromptModal({ onClose, onSignIn }: { onClose: () => void; onSignIn: () => void }) {
  return (
    <div className="fixed inset-0 z-[170] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5 animate-fadeUp" onClick={onClose}>
      <div className="bg-[#0f172a] text-white rounded-3xl max-w-[400px] w-full p-7 border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 rounded-full bg-[#FA9090]/20 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[#FA9090] icon-fill">lock</span>
        </div>
        <h3 className="font-display text-[22px] font-semibold">Sign in required</h3>
        <p className="text-[13.5px] text-white/60 mt-2 leading-relaxed">
          This action is reserved for verified accounts. Sign in or create a free account to add items to your bag,
          access checkout, and unlock exclusive concierge features.
        </p>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-full border border-white/15 bg-white/[0.04] text-white text-[13px] font-semibold hover:bg-white/[0.08]">
            Keep browsing
          </button>
          <button onClick={onSignIn} className="flex-1 py-3 rounded-full bg-[#FA9090] text-[#2D2926] text-[13px] font-semibold hover:bg-[#ff9d9d]">
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ CONTENT PAGES ============================ */
function ContentTab({ tab, onShop, onContact, onHome }: { tab: ContentTabKey; onShop: () => void; onContact: () => void; onHome: () => void }) {
  const pages: Record<ContentTabKey, { kicker: string; title: string; body: string; points: string[]; cta?: string }> = {
    journal: {
      kicker: "The Journal",
      title: "The 7-Step Hydration Protocol",
      body: "A practical ritual for Kampala heat, indoor air, and active-rich routines: cleanse gently, mist or dampen, layer humectants, seal with lipids, protect with SPF, repair at night, and review your skin weekly.",
      points: ["Apply serum to damp skin for stronger humectant performance.", "Keep exfoliation to two evenings a week when using active serums.", "SPF is the final morning skincare step, even on cloudy days."],
      cta: "Shop hydration",
    },
    store: {
      kicker: "Visit Us",
      title: "Store Locator",
      body: "Our flagship counter is at Acacia Mall, Kololo, with concierge support available Monday to Saturday, 9am to 7pm EAT.",
      points: ["Acacia Mall, Kololo, Kampala.", "WhatsApp concierge: +256 700 100 100.", "Same-day metro delivery for qualifying orders."],
      cta: "Contact concierge",
    },
    shipping: {
      kicker: "Orders",
      title: "Returns & Shipping",
      body: "We keep fulfillment straightforward: clear delivery windows, careful packing, and returns support for eligible unopened products.",
      points: ["Free Kampala delivery above UGX 150,000.", "UGX 8,000 local delivery below the free-shipping threshold.", "Returns are accepted within 7 days for unopened, unused products."],
      cta: "Start shopping",
    },
    sustainability: {
      kicker: "Information",
      title: "Sustainability",
      body: "All My Skin favors responsible sourcing, refill-aware packaging, and formulas designed to minimize waste through effective, consistent use.",
      points: ["Priority for recyclable packaging where supplier options allow.", "Batch-conscious ordering to reduce expired stock.", "Ingredient choices balanced for efficacy and skin tolerance."],
    },
    verification: {
      kicker: "Clinical Standard",
      title: "Dermatologist Verified",
      body: "Products are selected for ingredient transparency, batch confidence, and suitability for Fitzpatrick IV-VI skin concerns.",
      points: ["Actives are reviewed for practical concentration ranges.", "Product guidance avoids unnecessary irritation stacking.", "Inventory is managed to keep out-of-stock products from checkout."],
      cta: "View collection",
    },
    privacy: {
      kicker: "Policy",
      title: "Privacy",
      body: "This storefront stores account, cart, wishlist, and order data locally in the browser for a seamless experience.",
      points: ["No payment data is collected by this prototype.", "Session state is stored in localStorage on this device.", "Contact form submissions are simulated in the interface."],
    },
    terms: {
      kicker: "Policy",
      title: "Terms",
      body: "All purchases, stock messages, and checkout confirmations in this local build are prototype interactions for validating the storefront flow.",
      points: ["Prices are listed in UGX.", "Checkout confirms the order locally and decrements inventory.", "Final commercial terms should be reviewed before launch."],
    },
    accessibility: {
      kicker: "Policy",
      title: "Accessibility",
      body: "The interface is built with keyboard-accessible buttons, readable contrast, alt text for imagery, and resilient image fallbacks.",
      points: ["Primary actions are native buttons.", "Product images use descriptive alt text and fallbacks.", "Responsive layouts keep content readable on mobile and desktop."],
    },
  };
  const page = pages[tab];
  const action = page.cta?.toLowerCase().includes("contact") ? onContact : onShop;

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-12 lg:px-20 py-8 sm:py-14">
      <Breadcrumbs trail={[{ label: "Home", onClick: onHome }, { label: page.title }]} />
      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">{page.kicker}</span>
      <h1 className="font-display text-[clamp(30px,6vw,48px)] text-[var(--color-primary)] mt-2 mb-6 font-semibold">{page.title}</h1>
      <p className="text-[15px] sm:text-[17px] text-[var(--color-on-surface-variant)] leading-relaxed max-w-3xl">{page.body}</p>
      <div className="grid sm:grid-cols-3 gap-4 mt-10">
        {page.points.map((point, index) => (
          <div key={point} className="bg-[var(--color-surface-cream)] rounded-3xl p-6 soft-shadow">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)]/40 text-[var(--color-primary)] flex items-center justify-center font-semibold">{index + 1}</div>
            <p className="text-[14px] text-[var(--color-on-surface-variant)] mt-4 leading-relaxed">{point}</p>
          </div>
        ))}
      </div>
      {page.cta && (
        <button onClick={action} className="mt-10 bg-[var(--color-primary)] text-white px-8 py-4 rounded-full text-[13px] uppercase tracking-widest font-semibold hover:bg-[var(--color-primary-fixed-dim)] hover:text-[var(--color-primary)] transition">
          {page.cta}
        </button>
      )}
    </div>
  );
}

/* ============================ FAQ ============================ */
const FAQ_ITEMS = [
  { q: "How fast is delivery in Kampala?", a: "Orders confirmed before 3:00 PM EAT are delivered the same day within Kampala metro. Standard delivery takes 1–3 business days across Uganda, and delivery is free on orders above UGX 150,000." },
  { q: "Do I need an account to buy products?", a: "You can browse as a guest, but you'll need a verified account to add items to your bag, checkout, save a wishlist, and unlock Alia's full skincare protocols." },
  { q: "Are your products authentic and dermatologist verified?", a: "Yes. Every product is sourced directly from brand partners or authorized distributors, and formulas are reviewed by dermatologists for suitability on Fitzpatrick IV–VI skin tones. Learn more on our Dermatologist Verified page." },
  { q: "Are the products suitable for African skin tones?", a: "Absolutely. All My Skin is formulated for African undertones and the Ugandan climate — our SPF leaves no white cast, and every formula is tested on deeper skin tones." },
  { q: "What payment methods do you accept?", a: "We accept MTN Mobile Money, Airtel Money, Visa, Mastercard, and cash on delivery within Kampala metro. Checkout is secure and encrypted." },
  { q: "What is your return policy?", a: "Unopened products may be returned within 14 days for a full refund. If a product causes an adverse reaction, return it with a dermatologist's note. See Returns & Shipping for full details." },
  { q: "How do I book a clinic appointment?", a: "Open the Clinics tab, choose a verified partner clinic, and submit a booking request. The clinic will confirm your appointment shortly." },
];

function FaqTab({ onHome, onContact, onShipping, onPrivacy, onTerms, onShop }: {
  onHome: () => void;
  onContact: () => void;
  onShipping: () => void;
  onPrivacy: () => void;
  onTerms: () => void;
  onShop: () => void;
}) {
  const [open, setOpen] = useState<number | null>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("https://formsubmit.co/ajax/allmyskin@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: "New question from allmyskin.ug FAQ",
          _template: "table",
          Name: name || "Anonymous",
          Email: email || "—",
          Question: question,
        }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  const mailto = `mailto:allmyskin@gmail.com?subject=${encodeURIComponent("Question about All My Skin")}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${question}`)}`;

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-12 lg:px-20 py-8 sm:py-14">
      <Breadcrumbs trail={[{ label: "Home", onClick: onHome }, { label: "FAQs" }]} />
      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Customer Care</span>
      <h1 className="font-display text-[clamp(30px,6vw,48px)] text-[var(--color-primary)] mt-2 mb-4 font-semibold">Frequently Asked Questions</h1>
      <p className="text-[15px] sm:text-[17px] text-[var(--color-on-surface-variant)] leading-relaxed max-w-3xl mb-8">
        Quick answers about delivery, authenticity, payment and returns. Can't find what you need? Ask us directly and we'll reply by email.
      </p>

      <ResponseTimePromise onContact={onContact} />

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Accordion */}
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="bg-[var(--color-surface-cream)] rounded-3xl soft-shadow overflow-hidden">
                <button onClick={() => setOpen(isOpen ? null : i)} className="w-full flex items-center gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left">
                  <span className="w-9 h-9 shrink-0 rounded-full bg-[var(--color-primary-container)]/40 text-[var(--color-primary)] flex items-center justify-center font-semibold text-[13px]">{i + 1}</span>
                  <span className="flex-1 text-[15px] font-semibold text-[var(--color-on-surface)]">{item.q}</span>
                  <span className={`material-symbols-outlined text-[var(--color-primary)] transition-transform ${isOpen ? "rotate-180" : ""}`}>expand_more</span>
                </button>
                {isOpen && <div className="px-5 sm:px-6 pb-5 pl-[60px] sm:pl-[72px] text-[14px] text-[var(--color-on-surface-variant)] leading-relaxed animate-fadeUp">{item.a}</div>}
              </div>
            );
          })}
        </div>

        {/* Ask a question — emailed to allmyskin@gmail.com */}
        <div className="bg-[var(--color-surface-cream)] rounded-3xl p-6 sm:p-8 soft-shadow lg:sticky lg:top-36">
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Still have a question?</span>
          <h3 className="font-display text-[22px] text-[var(--color-primary)] font-semibold mt-2 mb-2">Ask us directly</h3>
          <p className="text-[14px] text-[var(--color-on-surface-variant)] mb-6 leading-relaxed">
            Send your question to our concierge and we'll reply from <strong>allmyskin@gmail.com</strong> within 12 hours.
          </p>
          {status === "sent" ? (
            <div className="bg-[var(--color-primary-container)]/40 text-[var(--color-on-primary-container)] rounded-2xl p-5 flex items-start gap-3">
              <span className="material-symbols-outlined">check_circle</span>
              <div>
                <div className="font-semibold">Question sent — thank you!</div>
                <div className="text-[13px] mt-1">Our concierge will reply to your email shortly.</div>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="w-full bg-white border border-[var(--color-outline-variant)] rounded-2xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" required className="w-full bg-white border border-[var(--color-outline-variant)] rounded-2xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none" />
              <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Type your question…" rows={4} required className="w-full bg-white border border-[var(--color-outline-variant)] rounded-2xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none resize-none" />
              <button disabled={status === "sending"} className="w-full bg-[var(--color-primary)] text-white py-3.5 rounded-full text-[13px] uppercase tracking-widest font-semibold hover:bg-[var(--color-primary-fixed-dim)] hover:text-[var(--color-primary)] transition disabled:opacity-60 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">mail</span>
                {status === "sending" ? "Sending…" : "Send question"}
              </button>
              {status === "error" && (
                <a href={mailto} className="block text-center text-[13px] font-semibold text-[var(--color-primary)] underline">Email didn't send? Tap to open your mail app instead</a>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Internal links */}
      <div className="mt-10 flex flex-wrap items-center gap-3 text-[12px] uppercase tracking-widest font-semibold">
        <span className="text-[var(--color-on-surface-variant)]">More help:</span>
        <button onClick={onShipping} className="text-[var(--color-primary)] border-b border-[var(--color-primary-container)] pb-0.5 hover:text-[var(--color-accent-coral)]">Shipping & Returns</button>
        <button onClick={onContact} className="text-[var(--color-primary)] border-b border-[var(--color-primary-container)] pb-0.5 hover:text-[var(--color-accent-coral)]">Contact</button>
        <button onClick={onPrivacy} className="text-[var(--color-primary)] border-b border-[var(--color-primary-container)] pb-0.5 hover:text-[var(--color-accent-coral)]">Privacy Policy</button>
        <button onClick={onTerms} className="text-[var(--color-primary)] border-b border-[var(--color-primary-container)] pb-0.5 hover:text-[var(--color-accent-coral)]">Terms</button>
        <button onClick={onShop} className="text-[var(--color-primary)] border-b border-[var(--color-primary-container)] pb-0.5 hover:text-[var(--color-accent-coral)]">Shop now</button>
      </div>
    </div>
  );
}

/* ============================ CUSTOMER REVIEWS ============================ */
const PAGE_REVIEWS_KEY = "ams_page_reviews";

const SEED_REVIEWS = [
  { name: "Amina N.", city: "Kampala", rating: 5, text: "The Beautifo Regenerative Serum completely changed my routine. My skin has never looked this even and bright." },
  { name: "Brian O.", city: "Entebbe", rating: 5, text: "Ordered at noon, delivered by 4pm. The Ultra Light SPF 50+ genuinely leaves no white cast on my skin." },
  { name: "Sarah K.", city: "Ntinda", rating: 4, text: "Lovely customer care and beautiful products. The Pink Clay Mask is my Sunday ritual now." },
  { name: "Grace M.", city: "Kololo", rating: 5, text: "Finally a brand that understands deep skin tones. The Vitamin C serum gave me the glow I had given up on." },
  { name: "David W.", city: "Kampala", rating: 5, text: "Authentic products, honest prices, and the dermatologist-verified promise is real. Highly recommend." },
  { name: "Joan T.", city: "Makindye", rating: 4, text: "The Velvet Body Butter is divine and delivery was same-day. I'll definitely be a repeat customer." },
];

function ReviewsTab({ onShop, onFaq, onCases, onHome }: { onShop: () => void; onFaq: () => void; onCases: () => void; onHome: () => void }) {
  const [reviews, setReviews] = useState<{ name: string; city: string; rating: number; text: string }[]>(() => {
    try {
      const stored = localStorage.getItem(PAGE_REVIEWS_KEY);
      return stored ? JSON.parse(stored) : SEED_REVIEWS;
    } catch { return SEED_REVIEWS; }
  });
  const [rName, setRName] = useState("");
  const [rCity, setRCity] = useState("");
  const [rRating, setRRating] = useState(5);
  const [rText, setRText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(PAGE_REVIEWS_KEY, JSON.stringify(reviews)); } catch { /* noop */ }
  }, [reviews]);

  const addReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rText.trim()) return;
    setReviews(prev => [{ name: rName.trim() || "Verified buyer", city: rCity.trim() || "Kampala", rating: rRating, text: rText.trim() }, ...prev]);
    setRName(""); setRCity(""); setRText(""); setRRating(5);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-12 lg:px-20 py-8 sm:py-14">
      <Breadcrumbs trail={[{ label: "Home", onClick: onHome }, { label: "Customer Reviews" }]} />
      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Social Proof</span>
      <h1 className="font-display text-[clamp(30px,6vw,48px)] text-[var(--color-primary)] mt-2 mb-4 font-semibold">Customer Reviews</h1>
      <p className="text-[15px] sm:text-[17px] text-[var(--color-on-surface-variant)] leading-relaxed max-w-3xl mb-8">
        Real stories from real customers across Kampala and beyond. Every review comes from a verified buyer of All My Skin.
      </p>

      <TrustBar />

      {/* Rating summary + write review */}
      <div className="grid sm:grid-cols-2 gap-5 mt-8">
        <div className="bg-[var(--color-surface-cream)] rounded-3xl p-6 sm:p-7 soft-shadow flex items-center gap-5">
          <div className="text-center shrink-0">
            <div className="font-display text-[48px] leading-none text-[var(--color-primary)] font-semibold">{avg}</div>
            <StarRow rating={Math.round(Number(avg))} size={16} />
            <div className="text-[12px] text-[var(--color-on-surface-variant)] mt-1.5">{reviews.length} verified reviews</div>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map(star => {
              const count = reviews.filter(r => r.rating === star).length;
              const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-[12px]">
                  <span className="w-3 text-[var(--color-on-surface-variant)]">{star}</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--color-outline-variant)]/40 overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--color-accent-coral)]" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-[var(--color-on-surface-variant)]">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[var(--color-surface-cream)] rounded-3xl p-6 sm:p-7 soft-shadow">
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Write a review</span>
          <h3 className="font-display text-[20px] text-[var(--color-primary)] font-semibold mt-1 mb-4">Share your experience</h3>
          {submitted ? (
            <div className="bg-[var(--color-primary-container)]/40 text-[var(--color-on-primary-container)] rounded-2xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined">check_circle</span>
              <div className="text-[13px]">Thanks — your review is now live on this page.</div>
            </div>
          ) : (
            <form onSubmit={addReview} className="space-y-3">
              <div className="flex gap-3">
                <input value={rName} onChange={e => setRName(e.target.value)} placeholder="Your name" className="flex-1 bg-white border border-[var(--color-outline-variant)] rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[var(--color-primary)]" />
                <input value={rCity} onChange={e => setRCity(e.target.value)} placeholder="City" className="flex-1 bg-white border border-[var(--color-outline-variant)] rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[var(--color-primary)]" />
              </div>
              <StarRow rating={rRating} onPick={setRRating} size={22} />
              <textarea value={rText} onChange={e => setRText(e.target.value)} placeholder="How was your experience?" rows={3} required className="w-full bg-white border border-[var(--color-outline-variant)] rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[var(--color-primary)] resize-none" />
              <button className="w-full bg-[var(--color-primary)] text-white py-2.5 rounded-full text-[12px] uppercase tracking-widest font-semibold hover:bg-[var(--color-primary-fixed-dim)] hover:text-[var(--color-primary)] transition">
                Post review
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Review grid */}
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 mt-8">
        {reviews.map((r, i) => (
          <div key={`${r.name}-${i}`} className="bg-white rounded-3xl p-6 soft-shadow border border-[var(--color-outline-variant)]/40 flex flex-col">
            <div className="flex items-center justify-between">
              <StarRow rating={r.rating} size={14} />
              <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-on-primary-container)] bg-[var(--color-primary-container)]/40 px-2 py-0.5 rounded-full">Verified buyer</span>
            </div>
            <p className="text-[14px] text-[var(--color-on-surface-variant)] leading-relaxed mt-4 flex-1">"{r.text}"</p>
            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[var(--color-outline-variant)]/40">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)]/50 text-[var(--color-on-primary-container)] flex items-center justify-center font-bold text-[14px]">{(r.name[0] || "?").toUpperCase()}</div>
              <div>
                <div className="text-[14px] font-semibold text-[var(--color-on-surface)]">{r.name}</div>
                <div className="text-[12px] text-[var(--color-on-surface-variant)]">{r.city}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Internal links */}
      <div className="mt-12 text-center">
        <button onClick={onShop} className="bg-[var(--color-primary)] text-white px-9 py-4 rounded-full text-[13px] uppercase tracking-widest font-semibold hover:bg-[var(--color-primary-fixed-dim)] hover:text-[var(--color-primary)] transition shadow-lg">
          Shop the collection
        </button>
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-[12px] uppercase tracking-widest font-semibold">
          <button onClick={onFaq} className="text-[var(--color-primary)] border-b border-[var(--color-primary-container)] pb-0.5 hover:text-[var(--color-accent-coral)]">FAQs</button>
          <button onClick={onCases} className="text-[var(--color-primary)] border-b border-[var(--color-primary-container)] pb-0.5 hover:text-[var(--color-accent-coral)]">Case Studies</button>
          <button onClick={onShop} className="text-[var(--color-primary)] border-b border-[var(--color-primary-container)] pb-0.5 hover:text-[var(--color-accent-coral)]">Shop</button>
        </div>
      </div>
    </div>
  );
}

/* ============================ TRUST SIGNALS ============================ */
function TrustBar() {
  const items = [
    { icon: "verified", t: "Dermatologist Verified", d: "Formulas reviewed for African skin" },
    { icon: "shield", t: "100% Authentic", d: "Direct from brand partners" },
    { icon: "local_shipping", t: "Same-Day Kampala", d: "Free delivery over UGX 150,000" },
    { icon: "lock", t: "Secure Payments", d: "MTN MoMo · Airtel · Cards · COD" },
  ];
  return (
    <section className="py-10 sm:py-14 max-w-7xl mx-auto px-5 sm:px-12 lg:px-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {items.map(it => (
          <div key={it.t} className="bg-[var(--color-surface-cream)] rounded-3xl p-5 sm:p-6 soft-shadow flex flex-col items-start gap-3">
            <span className="material-symbols-outlined icon-fill text-[var(--color-accent-coral)] text-[26px]">{it.icon}</span>
            <div>
              <div className="text-[14px] font-semibold text-[var(--color-on-surface)]">{it.t}</div>
              <div className="text-[12px] text-[var(--color-on-surface-variant)] mt-0.5 leading-snug">{it.d}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================ RESPONSE TIME PROMISE ============================ */
function ResponseTimePromise({ onContact }: { onContact: () => void }) {
  return (
    <div className="mb-8 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[#3D6B62] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
      <div className="w-14 h-14 shrink-0 rounded-2xl bg-white/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-[28px]">bolt</span>
      </div>
      <div className="flex-1">
        <div className="font-display text-[20px] font-semibold">Our response-time promise</div>
        <p className="text-[14px] text-white/80 mt-1 leading-relaxed">
          Every message is answered within <strong className="text-white">12 hours, 7 days a week</strong> — by email, WhatsApp or phone.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        <a href="mailto:concierge@allmyskin.ug" className="bg-white text-[var(--color-primary)] px-5 py-2.5 rounded-full text-[11px] uppercase tracking-widest font-semibold hover:bg-white/90 transition flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">mail</span> Email
        </a>
        <a href="https://wa.me/256700100100" target="_blank" rel="noreferrer" className="bg-white/15 border border-white/30 text-white px-5 py-2.5 rounded-full text-[11px] uppercase tracking-widest font-semibold hover:bg-white/25 transition flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">chat</span> WhatsApp
        </a>
      </div>
    </div>
  );
}

/* ============================ CASE STUDIES ============================ */
const CASE_STUDIES = [
  {
    initials: "PN", age: "27", city: "Ntinda, Kampala", rating: 5,
    concern: "Post-inflammatory hyperpigmentation & uneven tone after acne breakouts",
    goal: "Even skin tone within 90 days",
    protocol: ["Calming Oat Cleanser", "Vitamin C Brightening Serum", "Beautifo Regenerative Serum", "Ultra Light SPF 50+"],
    timeline: "12 weeks",
    results: "Visible lightening of dark spots; tone visibly more even",
    quote: "The dark spots that had stayed for two years finally faded. Wearing SPF daily made the biggest difference.",
  },
  {
    initials: "JM", age: "34", city: "Kololo, Kampala", rating: 5,
    concern: "Dehydration, dullness and early fine lines from air-conditioned office life",
    goal: "Bouncier, hydrated, luminous skin",
    protocol: ["Calming Oat Cleanser", "Hydra Refresh Mask", "Botanical Glow Oil", "Beautifo Regenerative Serum"],
    timeline: "8 weeks",
    results: "Firmer, plumper skin; fine lines visibly softened",
    quote: "Months of constant AC left my skin lifeless. The glow oil and mask brought it back within a month.",
  },
  {
    initials: "AK", age: "22", city: "Makerere, Kampala", rating: 4,
    concern: "Oily, congestion-prone skin with monthly breakouts",
    goal: "Clearer, calmer skin with fewer flare-ups",
    protocol: ["Calming Oat Cleanser", "Pink Clay Hydrating Mask", "Beautifo Regenerative Serum", "Ultra Light SPF 50+"],
    timeline: "10 weeks",
    results: "Fewer active breakouts; visibly clearer, tighter pores",
    quote: "A simple, consistent routine with Alia's guidance fixed what years of products couldn't.",
  },
];

function CasesTab({ onHome, onShop, onReviews, onBook }: { onHome: () => void; onShop: () => void; onReviews: () => void; onBook: () => void }) {
  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-12 lg:px-20 py-8 sm:py-14">
      <Breadcrumbs trail={[{ label: "Home", onClick: onHome }, { label: "Case Studies" }]} />
      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--color-accent-coral)]">Real Results</span>
      <h1 className="font-display text-[clamp(30px,6vw,48px)] text-[var(--color-primary)] mt-2 mb-4 font-semibold">Case studies &amp; real results</h1>
      <p className="text-[15px] sm:text-[17px] text-[var(--color-on-surface-variant)] leading-relaxed max-w-3xl mb-10">
        Anonymized journeys from real customers. Each protocol was guided by All My Skin's dermatologist-reviewed guidance — results vary by individual.
      </p>

      <div className="space-y-6">
        {CASE_STUDIES.map(cs => (
          <div key={cs.initials} className="bg-white rounded-3xl soft-shadow border border-[var(--color-outline-variant)]/40 overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-primary-container)]/50 text-[var(--color-on-primary-container)] flex items-center justify-center font-bold">{cs.initials}</div>
                  <div>
                    <div className="text-[14px] font-semibold text-[var(--color-on-surface)]">{cs.age} · {cs.city}</div>
                    <StarRow rating={cs.rating} size={13} />
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-on-primary-container)] bg-[var(--color-primary-container)]/40 px-3 py-1 rounded-full">{cs.timeline}</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 mb-5">
                <div className="bg-[var(--color-surface-cream)] rounded-2xl p-4">
                  <div className="text-[10px] uppercase tracking-widest font-semibold text-[var(--color-accent-coral)] mb-1">The concern</div>
                  <p className="text-[13px] text-[var(--color-on-surface)] leading-relaxed">{cs.concern}</p>
                </div>
                <div className="bg-[var(--color-surface-cream)] rounded-2xl p-4">
                  <div className="text-[10px] uppercase tracking-widest font-semibold text-[var(--color-accent-coral)] mb-1">The goal</div>
                  <p className="text-[13px] text-[var(--color-on-surface)] leading-relaxed">{cs.goal}</p>
                </div>
                <div className="bg-[var(--color-surface-cream)] rounded-2xl p-4">
                  <div className="text-[10px] uppercase tracking-widest font-semibold text-[var(--color-accent-coral)] mb-1">The result</div>
                  <p className="text-[13px] text-[var(--color-on-surface)] leading-relaxed">{cs.results}</p>
                </div>
              </div>
              <div className="mb-5">
                <div className="text-[10px] uppercase tracking-widest font-semibold text-[var(--color-primary)] mb-2">Protocol used</div>
                <div className="flex flex-wrap gap-1.5">
                  {cs.protocol.map(p => (
                    <span key={p} className="text-[11px] px-2.5 py-1 bg-[var(--color-primary-container)]/30 text-[var(--color-on-primary-container)] rounded-full">{p}</span>
                  ))}
                </div>
              </div>
              <blockquote className="border-l-2 border-[var(--color-accent-coral)] pl-4 text-[14px] text-[var(--color-on-surface-variant)] italic leading-relaxed">"{cs.quote}"</blockquote>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <button onClick={onShop} className="bg-[var(--color-primary)] text-white px-9 py-4 rounded-full text-[13px] uppercase tracking-widest font-semibold hover:bg-[var(--color-primary-fixed-dim)] hover:text-[var(--color-primary)] transition shadow-lg">
          Start your own ritual
        </button>
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-[12px] uppercase tracking-widest font-semibold">
          <button onClick={onReviews} className="text-[var(--color-primary)] border-b border-[var(--color-primary-container)] pb-0.5 hover:text-[var(--color-accent-coral)]">Customer Reviews</button>
          <button onClick={onBook} className="text-[var(--color-primary)] border-b border-[var(--color-primary-container)] pb-0.5 hover:text-[var(--color-accent-coral)]">Book a Clinic</button>
        </div>
      </div>
    </div>
  );
}

/* ============================ THANK YOU ============================ */
function ThankYouTab({ onHome, onShop, onReviews, onContact, onFaq }: { onHome: () => void; onShop: () => void; onReviews: () => void; onContact: () => void; onFaq: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-12 lg:px-20 py-14 sm:py-20">
      <Breadcrumbs trail={[{ label: "Home", onClick: onHome }, { label: "Thank You" }]} />
      <div className="text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-[var(--color-primary-container)]/40 flex items-center justify-center">
          <span className="material-symbols-outlined icon-fill text-[var(--color-primary)] text-[40px]">check_circle</span>
        </div>
        <h1 className="font-display text-[clamp(30px,6vw,44px)] text-[var(--color-primary)] mt-6 font-semibold">Thank you!</h1>
        <p className="text-[15px] sm:text-[17px] text-[var(--color-on-surface-variant)] mt-4 max-w-xl mx-auto leading-relaxed">
          We've received your message. Our concierge will get back to you within 12 hours, 7 days a week.
        </p>
      </div>

      <div className="mt-8">
        <ResponseTimePromise onContact={onContact} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-left">
        <button onClick={onShop} className="bg-white rounded-3xl p-6 soft-shadow border border-[var(--color-outline-variant)]/40 hover:border-[var(--color-primary)] transition text-left">
          <span className="material-symbols-outlined icon-fill text-[var(--color-accent-coral)] text-[28px]">shopping_bag</span>
          <div className="text-[15px] font-semibold text-[var(--color-on-surface)] mt-3">Shop the collection</div>
          <div className="text-[12.5px] text-[var(--color-on-surface-variant)] mt-1 leading-relaxed">Browse serums, oils, masks and SPF for your skin.</div>
        </button>
        <button onClick={onReviews} className="bg-white rounded-3xl p-6 soft-shadow border border-[var(--color-outline-variant)]/40 hover:border-[var(--color-primary)] transition text-left">
          <span className="material-symbols-outlined icon-fill text-[var(--color-accent-coral)] text-[28px]">rate_review</span>
          <div className="text-[15px] font-semibold text-[var(--color-on-surface)] mt-3">Read customer reviews</div>
          <div className="text-[12.5px] text-[var(--color-on-surface-variant)] mt-1 leading-relaxed">See what 3,000+ verified buyers are saying.</div>
        </button>
        <button onClick={onFaq} className="bg-white rounded-3xl p-6 soft-shadow border border-[var(--color-outline-variant)]/40 hover:border-[var(--color-primary)] transition text-left">
          <span className="material-symbols-outlined icon-fill text-[var(--color-accent-coral)] text-[28px]">help</span>
          <div className="text-[15px] font-semibold text-[var(--color-on-surface)] mt-3">Explore FAQs</div>
          <div className="text-[12.5px] text-[var(--color-on-surface-variant)] mt-1 leading-relaxed">Quick answers on delivery, returns and payment.</div>
        </button>
      </div>
    </div>
  );
}

/* ============================ STICKY MOBILE CTA ============================ */
function StickyMobileCTA({ tab, onShop }: { tab: TabKey; onShop: () => void }) {
  const show = ["home", "about", "contact", "faq", "reviews", "cases", "clinics", "journal", "store", "shipping", "sustainability", "verification", "privacy", "terms", "accessibility", "thankyou"].includes(tab);
  if (!show) return null;
  return (
    <div className="md:hidden fixed bottom-[84px] left-4 z-[140]">
      <button onClick={onShop} className="flex items-center gap-2 bg-[var(--color-primary)] text-white pl-4 pr-5 py-3 rounded-full shadow-xl hover:scale-105 transition active:scale-95">
        <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
        <span className="text-[12px] font-bold uppercase tracking-widest">Shop now</span>
      </button>
    </div>
  );
}

/* ============================ FOOTER ============================ */
function Footer({ setTab }: { setTab: (tab: TabKey) => void }) {
  const LinkButton = ({ children, tab }: { children: string; tab: TabKey }) => (
    <button onClick={() => setTab(tab)} className="hover:text-[var(--color-primary)] transition text-left">{children}</button>
  );

  return (
    <footer className="bg-[var(--color-surface)] py-12 sm:py-16 border-t border-[var(--color-outline-variant)]/50">
      <div className="max-w-7xl mx-auto px-5 sm:px-12 lg:px-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-10">
          <div className="col-span-2 md:col-span-1">
            <BrandLogo size={36} variant="full" />
            <p className="text-[13.5px] text-[var(--color-on-surface-variant)] mt-5 max-w-xs leading-relaxed">
              Elevating everyday skincare to a mindful ritual of self-care and professional excellence.
            </p>
            <div className="flex gap-2.5 mt-5">
              <a href="https://allmyskin.ug" target="_blank" rel="noreferrer" aria-label="Website" className="w-9 h-9 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition"><span className="material-symbols-outlined text-[18px]">public</span></a>
              <a href="mailto:concierge@allmyskin.ug" aria-label="Email" className="w-9 h-9 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition"><span className="material-symbols-outlined text-[18px]">alternate_email</span></a>
              <a href="https://wa.me/256700100100" target="_blank" rel="noreferrer" aria-label="WhatsApp" className="w-9 h-9 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition"><span className="material-symbols-outlined text-[18px]">chat</span></a>
            </div>
          </div>
          <div>
            <h6 className="text-[11px] uppercase tracking-widest font-semibold text-[var(--color-primary)] mb-4">Shop</h6>
            <ul className="space-y-2.5 text-[14px] text-[var(--color-on-surface-variant)]">
              <li><LinkButton tab="shop">Best Sellers</LinkButton></li>
              <li><LinkButton tab="shop">Serums & Oils</LinkButton></li>
              <li><LinkButton tab="shop">Moisturizers</LinkButton></li>
              <li><LinkButton tab="shop">Kits & Bundles</LinkButton></li>
            </ul>
          </div>
          <div>
            <h6 className="text-[11px] uppercase tracking-widest font-semibold text-[var(--color-primary)] mb-4">Information</h6>
            <ul className="space-y-2.5 text-[14px] text-[var(--color-on-surface-variant)]">
              <li><LinkButton tab="about">Our Philosophy</LinkButton></li>
              <li><LinkButton tab="cases">Case Studies</LinkButton></li>
              <li><LinkButton tab="sustainability">Sustainability</LinkButton></li>
              <li><LinkButton tab="verification">Dermatologist Verified</LinkButton></li>
              <li><LinkButton tab="shipping">Returns & Shipping</LinkButton></li>
            </ul>
          </div>
          <div>
            <h6 className="text-[11px] uppercase tracking-widest font-semibold text-[var(--color-primary)] mb-4">Customer Care</h6>
            <ul className="space-y-2.5 text-[14px] text-[var(--color-on-surface-variant)]">
              <li><LinkButton tab="contact">Contact Us</LinkButton></li>
              <li><LinkButton tab="faq">FAQs</LinkButton></li>
              <li><LinkButton tab="reviews">Customer Reviews</LinkButton></li>
              <li><LinkButton tab="store">Store Locator</LinkButton></li>
              <li><LinkButton tab="account">My Account</LinkButton></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[var(--color-outline-variant)] pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-[var(--color-on-surface-variant)] tracking-wide">Copyright © 2026 All My Skin e-commerce Inc. All rights reserved.</p>
          <div className="flex gap-6 text-[11px] text-[var(--color-on-surface-variant)] uppercase tracking-widest">
            <button onClick={() => setTab("privacy")} className="hover:text-[var(--color-primary)]">Privacy</button>
            <button onClick={() => setTab("terms")} className="hover:text-[var(--color-primary)]">Terms</button>
            <button onClick={() => setTab("accessibility")} className="hover:text-[var(--color-primary)]">Accessibility</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
