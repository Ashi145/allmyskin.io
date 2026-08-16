import { useEffect, useRef } from "react";
import { GOOGLE_CLIENT_ID, loginWithGoogle, Session } from "../auth";

type GoogleProfile = { googleSub: string; email?: string; name?: string; picture?: string };

/* Decode a Google ID token (JWT). Falls back to GIS's own decoder when present. */
function decodeCredential(credential: string): GoogleProfile {
  const g = window.google?.accounts?.id;
  if (typeof g?.decodeCredential === "function") {
    const p = g.decodeCredential(credential);
    return { googleSub: p.sub, email: p.email, name: p.name, picture: p.picture };
  }
  const parts = credential.split(".");
  if (parts.length < 2) throw new Error("Malformed credential");
  const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(escape(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4))));
  const p = JSON.parse(json) as GsiCredentialPayload;
  return { googleSub: p.sub, email: p.email, name: p.name, picture: p.picture };
}

/* Lazily inject the Google Identity Services script (safe to call repeatedly). */
function loadGsi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

export default function GoogleSignIn({ onAuthed }: { onAuthed: (s: Session) => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onAuthedRef = useRef(onAuthed);
  onAuthedRef.current = onAuthed;
  const configured = GOOGLE_CLIENT_ID.length > 10 && GOOGLE_CLIENT_ID.includes("apps.googleusercontent.com");

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;

    loadGsi().then(() => {
      if (cancelled || !window.google?.accounts?.id) return;
      const el = mountRef.current;
      if (!el) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        ux_mode: "popup",
        callback: (resp) => {
          try {
            const session = loginWithGoogle(decodeCredential(resp.credential));
            onAuthedRef.current(session);
          } catch {
            /* malformed credential – ignore */
          }
        },
      });

      el.innerHTML = "";
      window.google.accounts.id.renderButton(el, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "continue_with",
        logo_alignment: "left",
        width: 344,
      });
    });

    return () => { cancelled = true; };
  }, [configured]);

  if (!configured) {
    return (
      <div className="text-[12px] text-white/50 text-center rounded-2xl border border-dashed border-white/20 py-3 px-4">
        Google sign-in is not configured yet. Add a valid client ID to enable it.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3.5 mt-7 mb-1">
      <div ref={mountRef} className="w-full flex justify-center" />
      <p className="text-[11px] text-white/40 text-center px-2">
        Securely sign in with your Google account — no new password needed.
      </p>
    </div>
  );
}
