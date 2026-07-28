import { useState, useRef, useEffect } from "react";
import { Session } from "../auth";
import { Product, UGX } from "../data";

const PURCHASE_LOG_KEY = "ams_alia_purchases";

export function logPurchase(productId: string) {
  try {
    const raw = localStorage.getItem(PURCHASE_LOG_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    arr.push(productId);
    localStorage.setItem(PURCHASE_LOG_KEY, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

type Message = { role: "user" | "assistant"; text: string };

function getReply(
  input: string,
  products: Product[],
  purchaseIds: string[],
): string {
  const q = input.toLowerCase();

  const purchased = purchaseIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  if (q.includes("recommend") || q.includes("suggestion") || q.includes("what should")) {
    const available = products.filter((p) => p.inStock && p.stock > 0);
    if (available.length === 0) return "All products are currently out of stock. Check back soon!";
    const pick = available[Math.floor(Math.random() * available.length)];
    return `I'd recommend the **${pick.name}** — ${pick.tagline}. It's ${UGX(pick.price)} and has ${pick.stock} in stock.`;
  }

  if (q.includes("order") || q.includes("purchase") || q.includes("bought")) {
    if (purchased.length === 0)
      return "You haven't logged any purchases yet. Once you check out, I'll track your orders here!";
    const names = purchased.map((p) => p.name).join(", ");
    return `Based on your history, you've purchased: ${names}. Would you like a complementary product suggestion?`;
  }

  if (q.includes("price") || q.includes("cost") || q.includes("how much")) {
    const matches = products.filter(
      (p) =>
        p.name.toLowerCase().split(" ").some((w) => q.includes(w)) ||
        q.includes(p.category),
    );
    if (matches.length === 0) return "Could you be more specific about which product you're asking about?";
    return matches.map((p) => `**${p.name}** — ${UGX(p.price)}`).join("\n\n");
  }

  if (q.includes("ingredient") || q.includes("contains")) {
    const matches = products.filter((p) =>
      p.name.toLowerCase().split(" ").some((w) => q.includes(w)),
    );
    if (matches.length === 0) return "Tell me which product you're curious about and I'll list its key ingredients.";
    return matches
      .map((p) => `**${p.name}**: ${p.ingredients.join(", ")}`)
      .join("\n\n");
  }

  if (q.includes("hello") || q.includes("hi") || q.includes("hey")) {
    return "Hey there! I'm Alia, your skin advisor. Ask me about products, ingredients, or what to try next.";
  }

  if (q.includes("thank")) {
    return "You're welcome! Let me know if there's anything else I can help with.";
  }

  const match = products.find((p) =>
    p.name.toLowerCase().split(" ").some((w) => q.includes(w)),
  );
  if (match) {
    return `**${match.name}** — ${match.tagline}\n${match.description}\nPrice: ${UGX(match.price)}${match.compareAt ? ` (was ${UGX(match.compareAt)})` : ""}\nKey ingredients: ${match.ingredients.join(", ")}`;
  }

  return "I can help with product recommendations, ingredients, pricing, and order history. What would you like to know?";
}

export function AliaBot({
  session,
  products,
  justCheckedOut,
  onDismissCheckout,
}: {
  session: Session;
  products: Product[];
  justCheckedOut: boolean;
  onDismissCheckout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (justCheckedOut) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Nice purchase! I've logged that. Want me to suggest something complementary?" },
      ]);
      onDismissCheckout();
      setOpen(true);
    }
  }, [justCheckedOut, onDismissCheckout]);

  const purchaseIds: string[] = (() => {
    try {
      const raw = localStorage.getItem(PURCHASE_LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { role: "user", text };
    const reply = getReply(text, products, purchaseIds);
    setMessages((prev) => [...prev, userMsg, { role: "assistant", text: reply }]);
    setInput("");
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-20 right-5 z-[150] w-14 h-14 rounded-full bg-[var(--color-primary)] text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Alia Skin Advisor"
      >
        <span className="material-symbols-outlined text-[26px]">smart_toy</span>
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-[180px] right-5 z-[150] w-[340px] max-w-[calc(100vw-40px)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ height: 420 }}>
          {/* Header */}
          <div className="px-5 py-4 bg-[var(--color-primary)] text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px]">smart_toy</span>
            <div>
              <p className="text-sm font-semibold leading-tight">Alia</p>
              <p className="text-[11px] opacity-80">Skin advisor</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-[13px] leading-relaxed">
            {messages.length === 0 && (
              <p className="text-gray-400 text-center mt-12">Ask me about products, ingredients, or recommendations.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl whitespace-pre-line ${
                    m.role === "user"
                      ? "bg-[var(--color-primary)] text-white rounded-br-md"
                      : "bg-gray-100 text-gray-800 rounded-bl-md"
                  }`}
                >
                  {m.text.split("**").map((part, j) =>
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-1 border-t border-gray-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask Alia..."
              className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 text-[13px] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <button
              onClick={send}
              className="w-9 h-9 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
