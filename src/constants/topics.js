import {
  Wallet,
  Megaphone,
  Palette,
  UserCog,
  Building2,
  Cog,
  TrendingUp,
  Wrench,
  Stethoscope,
  Scale,
  GraduationCap,
  Headphones,
  Newspaper,
} from "lucide-react";

// Daftar topik dipakai di Sidebar dan form Buat Komunitas.
// `slug` harus sama dengan models.CommunityTopics di backend.
export const TOPICS = [
  { slug: "finance", label: "Finance", icon: Wallet },
  { slug: "marketing", label: "Marketing", icon: Megaphone },
  { slug: "design", label: "Design", icon: Palette },
  { slug: "hr", label: "HR", icon: UserCog },
  { slug: "business", label: "Business", icon: Building2 },
  { slug: "operations", label: "Operations", icon: Cog },
  { slug: "career", label: "Career", icon: TrendingUp },
  { slug: "engineering", label: "Engineering", icon: Wrench },
  { slug: "healthcare", label: "Healthcare", icon: Stethoscope },
  { slug: "legal", label: "Legal", icon: Scale },
  { slug: "education", label: "Education", icon: GraduationCap },
  { slug: "customer-service", label: "Customer Service", icon: Headphones },
  { slug: "media", label: "Media", icon: Newspaper },
];

export function topicLabel(slug) {
  return TOPICS.find((t) => t.slug === slug)?.label || "";
}

// Warna label per topik (kelas Tailwind ditulis utuh supaya ikut ter-build).
export const TOPIC_COLORS = {
  finance: "bg-emerald-50 text-emerald-800",
  marketing: "bg-orange-50 text-orange-800",
  design: "bg-pink-50 text-pink-800",
  hr: "bg-teal-50 text-teal-800",
  business: "bg-indigo-50 text-indigo-800",
  operations: "bg-slate-100 text-slate-700",
  career: "bg-blue-50 text-blue-800",
  engineering: "bg-violet-50 text-violet-800",
  healthcare: "bg-rose-50 text-rose-800",
  legal: "bg-amber-50 text-amber-800",
  education: "bg-sky-50 text-sky-800",
  "customer-service": "bg-cyan-50 text-cyan-800",
  media: "bg-fuchsia-50 text-fuchsia-800",
};

export function topicColor(slug) {
  return TOPIC_COLORS[slug] || "bg-gray-100 text-gray-700";
}

// Kata kunci untuk mencocokkan lowongan dengan topik komunitas. Lowongan belum
// punya field topik, jadi pencocokan memakai judul, deskripsi, dan skill.
export const TOPIC_KEYWORDS = {
  finance: ["finance", "keuangan", "akuntan", "accounting", "audit", "pajak", "tax", "treasury"],
  marketing: ["marketing", "pemasaran", "seo", "social media", "brand", "digital marketing", "content"],
  design: ["design", "desain", "designer", "ui", "ux", "grafis", "graphic", "creative"],
  hr: ["hr", "hrd", "human resource", "recruiter", "rekrut", "talent", "payroll", "people"],
  business: ["business", "bisnis", "sales", "penjualan", "account executive", "business development"],
  operations: ["operasional", "operations", "logistik", "logistic", "supply chain", "gudang", "warehouse"],
  career: ["fresh graduate", "magang", "intern", "trainee", "management trainee"],
  engineering: ["engineer", "developer", "programmer", "software", "teknik", "backend", "frontend", "devops"],
  healthcare: ["perawat", "nurse", "dokter", "kesehatan", "health", "apoteker", "farmasi", "klinik"],
  legal: ["legal", "hukum", "paralegal", "kepatuhan", "compliance", "lawyer"],
  education: ["guru", "teacher", "dosen", "pendidikan", "education", "tutor", "instruktur", "trainer"],
  "customer-service": ["customer service", "cs", "call center", "customer support", "helpdesk", "layanan pelanggan"],
  media: ["media", "jurnalis", "journalist", "editor", "penulis", "writer", "video", "broadcast"],
};

export function jobMatchesTopic(job, slug) {
  const words = TOPIC_KEYWORDS[slug];
  if (!words) return false;
  const hay = ` ${[job.title, job.description, ...(job.required_skills || [])].join(" ").toLowerCase()} `;
  return words.some((w) => (w.length <= 3 ? hay.includes(` ${w} `) : hay.includes(w)));
}
