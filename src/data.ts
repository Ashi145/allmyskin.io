export type Product = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  compareAt?: number;
  category: "serum" | "oil" | "mask" | "spf" | "cleanser" | "body";
  image: string;
  inStock: boolean;
  stock: number;
  description: string;
  ingredients: string[];
  vendorId?: string;
};

/* ---------------- Vendors (private marketplace suppliers) ---------------- */
export type Vendor = {
  id: string;
  name: string;
  contactEmail: string;
  city: string;
  joinedAt: number;
};

export const VENDORS: Vendor[] = [
  { id: "vendor_main", name: "All My Skin Flagship", contactEmail: "supply@allmyskin.ug", city: "Kampala", joinedAt: Date.now() - 86400000 * 500 },
  { id: "vendor_glow", name: "Glow Botanicals Co.", contactEmail: "hello@glowbotanicals.ug", city: "Entebbe", joinedAt: Date.now() - 86400000 * 120 },
];

/* ---------------- Orders ---------------- */
export type OrderStatus = "placed" | "accepted" | "processing" | "shipped" | "delivered" | "cancelled" | "return_requested" | "refunded";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Order placed",
  accepted: "Order confirmed",
  processing: "Preparing your order",
  shipped: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return requested",
  refunded: "Refunded",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = ["placed", "accepted", "processing", "shipped", "delivered"];

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  vendorId: string;
};

export type OrderStatusEvent = { status: OrderStatus; at: number };

export type Order = {
  id: string;
  uid: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  status: OrderStatus;
  placedAt: number;
  updatedAt: number;
  history: OrderStatusEvent[];
};

/* ---------------- Reviews ---------------- */
export type Review = {
  id: string;
  productId: string;
  uid: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: number;
  verifiedPurchase: boolean;
};

/* ---------------- Clinics (publicly featured partners) ---------------- */
export type Clinic = {
  id: string;
  name: string;
  specialty: string;
  area: string;
  address: string;
  hours: string;
  phone: string;
  languages: string[];
  services: string[];
  verified: boolean;
  image: string;
  fee: string;
};

export const CLINICS: Clinic[] = [
  {
    id: "c1",
    name: "Kololo Dermatology Clinic",
    specialty: "Dermatology",
    area: "Kololo, Kampala",
    address: "Plot 14, Kololo Hill Drive, Kampala",
    hours: "Mon–Sat, 9:00–18:00 EAT",
    phone: "+256 700 200100",
    languages: ["English", "Luganda"],
    services: ["Acne & scarring", "Pigmentation review", "Skin cancer screening", "Patch testing"],
    verified: true,
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80",
    fee: "From UGX 60,000 consultation",
  },
  {
    id: "c2",
    name: "Nakasero Skin & Aesthetics",
    specialty: "Cosmetology",
    area: "Nakasero, Kampala",
    address: "Nakasero Road, Kampala",
    hours: "Tue–Sun, 10:00–19:00 EAT",
    phone: "+256 700 200200",
    languages: ["English", "Swahili"],
    services: ["Chemical peels", "Facials", "Laser hair reduction", "Cosmetic consultation"],
    verified: true,
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
    fee: "From UGX 45,000 consultation",
  },
  {
    id: "c3",
    name: "Entebbe Family Dermatology",
    specialty: "Dermatology",
    area: "Entebbe",
    address: "Kampala Road, Entebbe",
    hours: "Mon–Fri, 8:30–17:00 EAT",
    phone: "+256 700 200300",
    languages: ["English", "Luganda"],
    services: ["Eczema & rosacea", "Pediatric skin concerns", "General dermatology"],
    verified: true,
    image: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1200&q=80",
    fee: "From UGX 50,000 consultation",
  },
];

/* ---------------- Referral / Appointment requests to clinics ---------------- */
export type AppointmentStatus = "requested" | "confirmed" | "rescheduled" | "declined" | "completed" | "cancelled";

export type Appointment = {
  id: string;
  clinicId: string;
  uid: string;
  name: string;
  contact: string;
  reason: string;
  preferredDate: string;
  status: AppointmentStatus;
  createdAt: number;
  note?: string;
};

/* Curated Beautifo / themelexus and Pexels imagery — alabaster aesthetic */
export const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Beautifo Regenerative Serum",
    tagline: "Plump & Hydrate",
    price: 110000,
    compareAt: 148000,
    category: "serum",
    image: "https://demo2.themelexus.com/beautifo/wp-content/uploads/2021/04/product-15-1.jpg",
    inStock: true,
    stock: 18,
    description: "A cellular renewal serum with peptides, niacinamide and bakuchiol. Designed to plump, firm and visibly even tone.",
    ingredients: ["Niacinamide 5%", "Bakuchiol", "Peptide Complex", "Hyaluronic Acid"],
    vendorId: "vendor_main",
  },
  {
    id: "p2",
    name: "Botanical Glow Oil",
    tagline: "Deep Nourishment",
    price: 85000,
    category: "oil",
    image: "https://demo2.themelexus.com/beautifo/wp-content/uploads/2021/04/product-7.jpg",
    inStock: true,
    stock: 24,
    description: "Cold-pressed marula, rosehip and squalane facial oil. Restores the lipid barrier without clogging pores.",
    ingredients: ["Marula Oil", "Rosehip", "Squalane", "Vitamin E"],
    vendorId: "vendor_main",
  },
  {
    id: "p3",
    name: "Pink Clay Hydrating Mask",
    tagline: "Pore Refining",
    price: 65000,
    compareAt: 88000,
    category: "mask",
    image: "https://demo2.themelexus.com/beautifo/wp-content/uploads/2021/04/product-11.jpg",
    inStock: true,
    stock: 12,
    description: "Australian pink clay draws out impurities while glycerin and oat cushion the skin barrier.",
    ingredients: ["Australian Pink Clay", "Glycerin", "Colloidal Oat", "Allantoin"],
    vendorId: "vendor_main",
  },
  {
    id: "p4",
    name: "Ultra Light SPF 50+",
    tagline: "Invisible Protection",
    price: 45000,
    category: "spf",
    image: "https://demo2.themelexus.com/beautifo/wp-content/uploads/2021/04/product-12.jpg",
    inStock: true,
    stock: 36,
    description: "Featherweight broad-spectrum sunscreen designed for African undertones – no white cast, melts in.",
    ingredients: ["SPF 50+ Filters", "Niacinamide", "Vitamin E"],
    vendorId: "vendor_main",
  },
  {
    id: "p5",
    name: "Calming Oat Cleanser",
    tagline: "Gentle Daily Wash",
    price: 66000,
    compareAt: 88000,
    category: "cleanser",
    image: "https://demo2.themelexus.com/beautifo/wp-content/uploads/2021/04/product-2.jpg",
    inStock: true,
    stock: 20,
    description: "Cream-to-milk cleanser. Lifts SPF and makeup without stripping the moisture barrier.",
    ingredients: ["Colloidal Oat", "Squalane", "Allantoin"],
    vendorId: "vendor_glow",
  },
  {
    id: "p6",
    name: "Velvet Body Butter",
    tagline: "Total Body Ritual",
    price: 92000,
    category: "body",
    image: "https://demo2.themelexus.com/beautifo/wp-content/uploads/2021/04/product-5.jpg",
    inStock: true,
    stock: 14,
    description: "Whipped shea, mango and cocoa butter for 24-hour silky body hydration.",
    ingredients: ["Shea Butter", "Mango Butter", "Cocoa Butter", "Vitamin E"],
    vendorId: "vendor_glow",
  },
  {
    id: "p7",
    name: "Vitamin C Brightening Serum",
    tagline: "Morning Glow",
    price: 98000,
    category: "serum",
    image: "https://demo2.themelexus.com/beautifo/wp-content/uploads/2021/04/product-6.jpg",
    inStock: true,
    stock: 16,
    description: "Stabilised 15% L-ascorbic + ferulic for that glowy, dewy morning finish.",
    ingredients: ["Vitamin C 15%", "Vitamin E", "Ferulic Acid"],
    vendorId: "vendor_glow",
  },
  {
    id: "p8",
    name: "Hydra Refresh Mask",
    tagline: "SOS Hydration",
    price: 74000,
    compareAt: 91000,
    category: "mask",
    image: "https://demo2.themelexus.com/beautifo/wp-content/uploads/2021/04/product-14.jpg",
    inStock: true,
    stock: 9,
    description: "10-minute moisture rescue mask for dehydrated, tired skin.",
    ingredients: ["Squalane", "Panthenol", "Beta-Glucan"],
    vendorId: "vendor_glow",
  },
];

export const UGX = (n: number) =>
  new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(n);

/* Lifestyle / editorial hero imagery (high quality) */
export const HERO_IMAGE = "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1600&q=70";
export const LIFESTYLE_IMAGE = "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=70";
export const JOURNAL_IMAGE = "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=1200&q=70";
export const PROMO_IMAGE_1 = "https://demo2.themelexus.com/beautifo/wp-content/uploads/2021/04/product-15-2.jpg";
export const PROMO_IMAGE_2 = "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=70";
