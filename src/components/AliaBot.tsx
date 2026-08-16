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

type RecommCard = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  reason: string;
  benefit: string;
};

type Message = { role: "user" | "assistant"; text: string; cards?: RecommCard[] };

/* Curated "why it's recommended + what it does for you" for every product */
const REASON_MAP: Record<string, { reason: string; benefit: string }> = {
  p1: {
    reason: "it targets several signs of ageing at once — fine lines, firmness and even tone",
    benefit: "peptides, niacinamide 5% and bakuchiol plump and brighten without irritation",
  },
  p2: {
    reason: "it's the ideal finisher for dry or dehydrated skin, sealing in overnight hydration",
    benefit: "cold-pressed marula, rosehip and squalane restore the lipid barrier without clogging pores",
  },
  p3: {
    reason: "it's a weekly reset for oily or congestion-prone skin",
    benefit: "pink clay lifts impurities while glycerin and colloidal oat keep the barrier calm",
  },
  p4: {
    reason: "it's the non-negotiable morning step, designed specifically for deeper skin tones",
    benefit: "broad-spectrum SPF 50+ with zero white cast, plus niacinamide to help even tone",
  },
  p5: {
    reason: "it's the gentlest first step, especially for sensitive or irritated skin",
    benefit: "a cream-to-milk formula that lifts SPF and makeup without stripping moisture",
  },
  p6: {
    reason: "it completes your ritual from the neck down",
    benefit: "whipped shea, mango and cocoa butters give 24-hour silky hydration",
  },
  p7: {
    reason: "it's the go-to for dark spots, dullness and tired-looking skin",
    benefit: "15% stabilised L-ascorbic acid with ferulic for a dewy morning glow",
  },
  p8: {
    reason: "it's an SOS rescue for dehydrated, stressed skin",
    benefit: "squalane, panthenol and beta-glucan flood the skin with moisture in 10 minutes",
  },
};

const ROUTINES: Record<string, string[]> = {
  acne: ["p3", "p5", "p1"],
  dark: ["p7", "p1", "p4"],
  dry: ["p2", "p8", "p1"],
  oily: ["p3", "p5", "p4"],
  sun: ["p4", "p7", "p5"],
  sensitive: ["p5", "p3", "p2"],
  aging: ["p1", "p7", "p2"],
  default: ["p1", "p7", "p4"],
};

const ROUTINE_INTRO: Record<string, string> = {
  acne: "For clearer, calmer skin, pair these three:",
  dark: "To brighten dark spots and even your tone, start here:",
  dry: "For thirsty, dull skin, this trio will restore the glow:",
  oily: "To manage oil and congestion without over-stripping, try:",
  sun: "Sun protection is non-negotiable — build your base with:",
  sensitive: "For sensitive, reactive skin I'd keep it gentle with:",
  aging: "To firm, plump and smooth over time, go with:",
  default: "Based on what you've told me so far, I'd recommend these three:",
};

function detectConcern(text: string): string | null {
  if (/(acne|breakout|pimple|blemish|congest)/i.test(text)) return "acne";
  if (/(dark spot|hyperpigmentation|uneven|even tone|melasma|pigment|brighten)/i.test(text)) return "dark";
  if (/(dry|dehydrat|tight|flake|dull)/i.test(text)) return "dry";
  if (/(oily|greasy|shiny|shine)/i.test(text)) return "oily";
  if (/(sun|spf|uv|protect)/i.test(text)) return "sun";
  if (/(sensitive|irritat|red|reactive)/i.test(text)) return "sensitive";
  if (/(aging|age|line|wrinkle|firm|plump)/i.test(text)) return "aging";
  return null;
}

function lastCards(history: Message[]): RecommCard[] {
  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    if (m.role === "assistant" && m.cards && m.cards.length) return m.cards;
  }
  return [];
}

function pickCard(q: string, cards: RecommCard[]): RecommCard {
  if (/(second|two|2nd|#2)/.test(q)) return cards[1] || cards[0];
  if (/(third|three|3rd|#3)/.test(q)) return cards[2] || cards[0];
  return cards[0];
}

function toCards(picks: Product[]): RecommCard[] {
  return picks.map((p) => ({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    price: UGX(p.price),
    reason: REASON_MAP[p.id]?.reason ?? "it fits our current skincare ritual",
    benefit: REASON_MAP[p.id]?.benefit ?? p.tagline,
  }));
}

function recommend(input: string, products: Product[], history: Message[]): Message {
  const available = products.filter((p) => p.inStock && p.stock > 0);
  if (available.length === 0)
    return { role: "assistant", text: "All products are currently out of stock. Check back soon!" };

  const past = history.map((m) => m.text).join(" ");
  const concern = detectConcern(input) ?? detectConcern(past) ?? "default";

  const ids = ROUTINES[concern];
  const picked = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p && p.inStock && p.stock > 0);
  const fillers = available.filter((p) => !picked.includes(p));
  const picks = [...picked, ...fillers].slice(0, 3);

  return {
    role: "assistant",
    text: `${ROUTINE_INTRO[concern]}\n\nTap a product to open it, then pick your size and add it to your bag.`,
    cards: toCards(picks),
  };
}

function getReply(
  input: string,
  products: Product[],
  purchaseIds: string[],
  history: Message[],
): Message {
  const q = input.toLowerCase();

  const purchased = purchaseIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  /* Greetings & thanks */
  if (/(^|\b)(hello|hi|hey|good (morning|afternoon|evening))(\b|$)/.test(q))
    return { role: "assistant", text: "Hey there! I'm Alia, your skin advisor. Ask me about products, ingredients, or what to try next." };
  if (q.includes("thank"))
    return { role: "assistant", text: "You're welcome! Let me know if there's anything else I can help with." };

  /* Order / purchase history */
  if (q.includes("order") || q.includes("purchase") || q.includes("bought")) {
    if (purchased.length === 0)
      return { role: "assistant", text: "You haven't logged any purchases yet. Once you check out, I'll track your orders here!" };
    const names = purchased.map((p) => p.name).join(", ");
    return {
      role: "assistant",
      text: `Based on your history, you've purchased: ${names}.\n\nWant me to suggest something to complement those?`,
    };
  }

  /* Specific product mention → full detail */
  const mention = products.find((p) =>
    p.name.toLowerCase().split(" ").some((w) => q.includes(w)),
  );
  if (mention) {
    return {
      role: "assistant",
      text:
        `**${mention.name}** — ${UGX(mention.price)}${mention.compareAt ? ` (was ${UGX(mention.compareAt)})` : ""}\n` +
        `${mention.tagline} — ${mention.description}\n` +
        `Key ingredients: ${mention.ingredients.join(", ")}`,
      cards: toCards([mention]),
    };
  }

  /* Follow-up on an earlier recommendation (conversation memory) */
  const followUp = /(more|detail|about it|tell me|which one|which is|best|first|second|third|number)/.test(q);
  const prior = lastCards(history);
  if (followUp && prior.length > 0) {
    const card = pickCard(q, prior);
    const p = products.find((x) => x.id === card.id);
    return {
      role: "assistant",
      text:
        `**${card.name}** — ${card.price}\n` +
        (p ? `${p.tagline} — ${p.description}\n` : "") +
        `Why I recommend it: ${card.reason}.\n` +
        `Benefit for your skin: ${card.benefit}.`,
      cards: [card],
    };
  }

  /* Recommendations (with reasons, benefits + direct product links) */
  if (q.includes("recommend") || q.includes("suggestion") || q.includes("what should") || q.includes("which product") || q.includes("for my"))
    return recommend(input, products, history);

  /* Price lookups */
  if (q.includes("price") || q.includes("cost") || q.includes("how much")) {
    const matches = products.filter(
      (p) =>
        p.name.toLowerCase().split(" ").some((w) => q.includes(w)) ||
        q.includes(p.category),
    );
    if (matches.length === 0)
      return { role: "assistant", text: "Could you be more specific about which product you're asking about?" };
    return {
      role: "assistant",
      text: matches.map((p) => `**${p.name}** — ${UGX(p.price)}`).join("\n\n"),
      cards: toCards(matches.slice(0, 3)),
    };
  }

  /* Ingredient lookups */
  if (q.includes("ingredient") || q.includes("contains")) {
    const matches = products.filter((p) =>
      p.name.toLowerCase().split(" ").some((w) => q.includes(w)),
    );
    if (matches.length === 0)
      return { role: "assistant", text: "Tell me which product you're curious about and I'll list its key ingredients." };
    return {
      role: "assistant",
      text: matches.map((p) => `**${p.name}**: ${p.ingredients.join(", ")}`).join("\n\n"),
      cards: toCards(matches),
    };
  }

  return { role: "assistant", text: "I can help with product recommendations, ingredients, pricing, and order history. What would you like to know?" };
}

export function AliaBot({
  session,
  products,
  tab,
  justCheckedOut,
  onDismissCheckout,
  onSelectProduct,
}: {
  session: Session;
  products: Product[];
  tab: string;
  justCheckedOut: boolean;
  onDismissCheckout: () => void;
  onSelectProduct: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Session memory is scoped to the current tab + session.
     Leaving the tab (or reopening the page) clears the conversation. */
  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [tab, session.uid]);

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
    const history = [...messages, userMsg];
    const reply = getReply(text, products, purchaseIds, history);
    setMessages(history.concat([reply]));
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
        <div className="fixed bottom-[180px] right-5 z-[150] w-[340px] max-w-[calc(100vw-40px)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ height: 440 }}>
          {/* Header */}
          <div className="px-5 py-4 bg-[var(--color-primary)] text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px]">smart_toy</span>
            <div>
              <p className="text-sm font-semibold leading-tight">Alia</p>
              <p className="text-[11px] opacity-80">Skin advisor · remembers this session</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-[13px] leading-relaxed">
            {messages.length === 0 && (
              <p className="text-gray-400 text-center mt-12">Ask me about products, ingredients, or recommendations.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[88%]">
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl whitespace-pre-line ${
                      m.role === "user"
                        ? "bg-[var(--color-primary)] text-white rounded-br-md"
                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                    }`}
                  >
                    {m.text.split("**").map((part, j) =>
                      j % 2 === 1 ? <strong key={j}>{part}</strong> : part,
                    )}
                  </div>
                  {m.cards && (
                    <div className="space-y-2 mt-2">
                      {m.cards.map((c) => (
                        <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-bold text-[var(--color-primary)] leading-tight">{c.name}</span>
                            <span className="text-[11px] font-semibold text-[var(--color-accent-coral)] shrink-0">{c.price}</span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{c.tagline}</p>
                          <p className="text-[11.5px] text-gray-600 mt-1.5 leading-snug"><strong className="text-gray-800">Why:</strong> {c.reason}</p>
                          <p className="text-[11.5px] text-gray-600 mt-1 leading-snug"><strong className="text-gray-800">Benefit:</strong> {c.benefit}</p>
                          <button
                            onClick={() => onSelectProduct(c.id)}
                            className="mt-2.5 w-full py-2 rounded-full bg-[var(--color-primary)] text-white text-[11px] font-bold uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span> View &amp; select
                          </button>
                        </div>
                      ))}
                    </div>
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
