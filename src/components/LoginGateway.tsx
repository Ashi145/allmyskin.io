import { useState } from "react";
import { loginWithCredentials, loginAsGuest, registerAccount, Session } from "../auth";
import { BrandLogo } from "./BrandLogo";

type Props = {
  onAuthed: (s: Session) => void;
};

export default function LoginGateway({ onAuthed }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");

  // login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // register state
  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPassword, setRPassword] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rCategory, setRCategory] = useState<"buyer" | "seller">("buyer");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    setTimeout(() => {
      const r = loginWithCredentials(email, password);
      setBusy(false);
      if (!r.ok || !r.session) { setError(r.error || "Login failed"); return; }
      onAuthed(r.session);
    }, 280);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    setTimeout(() => {
      const r = registerAccount({ name: rName, email: rEmail, password: rPassword, phone: rPhone, category: rCategory });
      if (!r.ok || !r.account) { setBusy(false); setError(r.error || "Registration failed"); return; }
      const login = loginWithCredentials(rEmail, rPassword);
      setBusy(false);
      if (!login.ok || !login.session) { setError(login.error || "Auto-login failed"); return; }
      onAuthed(login.session);
    }, 320);
  };

  const handleGuest = () => {
    const s = loginAsGuest();
    onAuthed(s);
  };

  return (
    <div className="min-h-screen w-full bg-[#0f172a] text-white flex relative overflow-hidden font-body">
      {/* Decorative coral / cream glows */}
      <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-[#7b5455]/30 blur-[120px]" />
      <div className="absolute -bottom-32 -right-32 w-[460px] h-[460px] rounded-full bg-[#FA9090]/20 blur-[140px]" />

      {/* Left brand panel (desktop only) */}
      <div className="hidden lg:flex flex-col w-1/2 relative p-12 xl:p-16 justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-32 rounded-2xl bg-white flex items-center justify-center px-3 shadow-xl">
            <BrandLogo size={34} variant="card" />
          </div>
          <div>
            <div className="font-display text-[26px] leading-none">All My Skin</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/60 mt-1">Luminous Alabaster Skincare</div>
          </div>
        </div>

        <div className="relative">
          <div className="font-display text-[44px] xl:text-[56px] leading-[1.05] text-white">Discover the<br/>secrets of<br/><span className="text-[#FA9090]">radiant skin</span>.</div>
          <p className="mt-6 text-white/70 text-[15px] max-w-md leading-relaxed">
            Expertly curated skincare rituals that harmonize clinical precision with empathetic care.
            Sign in for full access, or browse as a guest to explore our collection.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
            {[
              ["spa", "Clinical care"],
              ["eco", "Empathetic"],
              ["verified", "Authentic"],
            ].map(([ic, label]) => (
              <div key={label} className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-md">
                <span className="material-symbols-outlined text-[#FA9090] text-[22px]">{ic}</span>
                <div className="text-[12px] text-white/80 mt-2">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-white/40">© 2026 All My Skin e-commerce Inc. · Kampala, Uganda</div>
      </div>

      {/* Right auth gateway */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative z-10">
        <div className="w-full max-w-[440px]">
          {/* Mobile branded header */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="h-16 w-40 rounded-2xl bg-white flex items-center justify-center px-4 shadow-xl">
              <BrandLogo size={42} variant="card" />
            </div>
            <div className="font-display text-[26px] mt-3">All My Skin</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/60">Luminous Alabaster</div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#FA9090] font-semibold">Secure Gateway</div>
              <h1 className="font-display text-[28px] sm:text-[32px] mt-1">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-[13px] text-white/60 mt-2 leading-relaxed">
                {mode === "login"
                  ? "Sign in to your All My Skin profile to checkout, save your routine, and access concierge support."
                  : "Join the inner circle for personalized rituals and 10% off your first order."}
              </p>
            </div>

            {/* Toggle pill */}
            <div className="bg-white/[0.06] rounded-full p-1 flex text-[12px] font-semibold mb-6 border border-white/10">
              <button
                type="button"
                onClick={() => { setMode("login"); setError(null); }}
                className={`flex-1 py-2.5 rounded-full transition ${mode === "login" ? "bg-white text-[#0f172a]" : "text-white/70"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); setError(null); }}
                className={`flex-1 py-2.5 rounded-full transition ${mode === "register" ? "bg-white text-[#0f172a]" : "text-white/70"}`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="mb-4 text-[12.5px] bg-red-500/10 text-red-300 border border-red-500/20 rounded-xl px-3 py-2.5 flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] mt-[1px]">error</span>
                <span>{error}</span>
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Field
                  label="Email"
                  icon="mail"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
                <Field
                  label="Password"
                  icon="lock"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />

                <div className="flex items-center justify-between text-[12px] text-white/60">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-[#FA9090]" defaultChecked />
                    Remember me
                  </label>
                  <button type="button" className="hover:text-white">Forgot?</button>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3.5 rounded-full bg-[#FA9090] text-[#2D2926] font-semibold text-[14px] hover:bg-[#ff9d9d] transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {busy ? <span className="pulse-soft">Authenticating…</span> : (<><span>Sign in securely</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></>)}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <Field label="Full name" icon="person" value={rName} onChange={setRName} placeholder="Amina Nakato" required />
                <Field label="Email" icon="mail" type="email" value={rEmail} onChange={setREmail} placeholder="you@example.com" required />
                <Field label="Phone (optional)" icon="call" value={rPhone} onChange={setRPhone} placeholder="+256 7XX XXX XXX" />
                <Field label="Password" icon="lock" type="password" value={rPassword} onChange={setRPassword} placeholder="Min. 6 characters" required />

                <div className="bg-white/[0.06] rounded-2xl p-4 border border-white/10">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold mb-3">I'm here to</div>
                  <div className="flex gap-2">
                    {[
                      { value: "buyer" as const, icon: "shopping_bag", label: "Buy products" },
                      { value: "seller" as const, icon: "storefront", label: "Sell products" },
                    ].map(opt => (
                      <button key={opt.value} type="button" onClick={() => setRCategory(opt.value)}
                        className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-3 rounded-xl border transition ${
                          rCategory === opt.value ? "bg-white/10 border-white/30 text-white" : "border-white/10 text-white/50 hover:border-white/20"
                        }`}>
                        <span className="material-symbols-outlined text-[20px]">{opt.icon}</span>
                        <span className="text-[11px] font-semibold">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={busy}
                  className="w-full py-3.5 rounded-full bg-[#FA9090] text-[#2D2926] font-semibold text-[14px] hover:bg-[#ff9d9d] transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {busy ? "Creating account…" : (<><span>Create my account</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></>)}
                </button>
              </form>
            )}

            {/* divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] uppercase tracking-widest text-white/40">Or continue</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Guest bypass */}
            <button
              onClick={handleGuest}
              className="w-full py-3 rounded-full border border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.07] transition text-[13.5px] font-medium flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              Browse as Guest
            </button>

            <p className="text-[11px] text-white/40 text-center mt-3 leading-relaxed">
              Guests can browse the catalog and read content.<br/>
              <strong className="text-white/60">Checkout and AI clinical mode require a verified account.</strong>
            </p>
          </div>

          {/* Demo creds hint — user only */}
          <div className="mt-4 text-center text-[11px] text-white/40 leading-relaxed">
            <div>Demo: <span className="text-white/60">amina@allmyskin.ug / amina123</span> (user)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, icon, value, onChange, placeholder, type = "text", required, autoComplete,
}: {
  label: string; icon: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; autoComplete?: string;
}) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-white/50 mb-1.5">{label}</div>
      <div className="flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-3 focus-within:border-[#FA9090] transition">
        <span className="material-symbols-outlined text-white/40 text-[18px]">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex-1 bg-transparent text-[14px] text-white placeholder-white/30 outline-none"
        />
      </div>
    </label>
  );
}
