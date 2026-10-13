// ---------------------------------------------------------------------------
// Daftar model CV. Tiap model hanyalah konfigurasi: tampilan dirakit oleh
// komponen CvDocument. Menambah model baru = menambah satu objek di CV_TEMPLATES.
//
//   layout  : "single" | "compact" | "sidebarLeft" | "sidebarRight" |
//             "curve" | "wave" | "diagonal" | "timeline" (desain berbentuk, 1 halaman) |
//             "band" (pita warna di atas + dua kolom) |
//             "labels" (bar kontak di atas + judul berlabel + dua kolom) |
//             "darkSide" (sidebar warna penuh, 1 halaman) |
//             "colorCol" (kolom kanan berwarna, 1 halaman) |
//             "batik" | "sideGold" | "elegant" | "terra" | "bluebar" | "dashed" | "bubble" | "exec" |
//             "skillbar" | "ledger" | "organic" | "slider" | "memphis" | "arch" (model tambahan)
//   header  : gaya kepala untuk layout "single"/"compact":
//             "simple" | "center" | "left" | "block" | "rule"
//   heading : gaya judul bagian: "rule" | "plain" | "bar" | "label" | "pill" | "dots" | "square" | "capsule"
//   font    : kunci di CV_FONTS
//   pro     : true = hanya untuk pengguna Pro
//   ats     : true = tata letak sederhana yang mudah dibaca sistem seleksi otomatis
//   onePage : true = model berlatar penuh; isi dibatasi 1 halaman
// ---------------------------------------------------------------------------

export const CV_FONTS = {
  sans: 'Inter, system-ui, sans-serif',
  serif: 'Lora, Georgia, serif',
  humanist: '"Source Sans 3", system-ui, sans-serif',
  book: '"Source Serif 4", Georgia, serif',
};

// Dimuat sekali oleh halaman Pembuat CV (semua berlisensi OFL).
export const CV_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@400;600;700&family=Source+Serif+4:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap";

export const CV_TEMPLATES = [
  // Gratis (3): ramah ATS atau tata letak sederhana
  { id: "sederhana", name: "Sederhana", layout: "single", header: "simple", heading: "rule", font: "sans", ats: true, pro: false },
  { id: "klasik", name: "Klasik", layout: "single", header: "center", heading: "rule", font: "serif", ats: true, pro: false },
  { id: "modern", name: "Modern", layout: "sidebarLeft", heading: "bar", font: "sans", ats: false, pro: false },
  // Pro (25): desain berbentuk, selalu 1 halaman (kecuali Eksekutif dan Klasik Baris yang ramah ATS)
  { id: "lengkung", name: "Lengkung", layout: "curve", heading: "pill", font: "humanist", ats: false, pro: true, onePage: true },
  { id: "diagonal", name: "Diagonal", layout: "diagonal", heading: "bar", font: "book", ats: false, pro: true, onePage: true },
  { id: "garis-waktu", name: "Garis Waktu", layout: "timeline", heading: "pill", font: "sans", ats: false, pro: true, onePage: true },
  { id: "pita", name: "Pita", layout: "ribbon", heading: "ribbon", font: "humanist", ats: false, pro: true, onePage: true },
  { id: "heksagon", name: "Heksagon", layout: "hex", heading: "bar", font: "sans", ats: false, pro: true, onePage: true },
  { id: "monogram", name: "Monogram", layout: "monogram", heading: "plain", font: "serif", ats: false, pro: true, onePage: true },
  { id: "bingkai", name: "Bingkai", layout: "frame", heading: "rule", font: "book", ats: false, pro: true, onePage: true },
  { id: "koran", name: "Koran", layout: "paper", heading: "italic", font: "book", ats: false, pro: true, onePage: true },
  { id: "tab", name: "Tab Vertikal", layout: "tabs", heading: "plain", font: "humanist", ats: false, pro: true, onePage: true },
  { id: "malam", name: "Malam", layout: "night", heading: "bar", font: "sans", ats: false, pro: true, onePage: true },
  { id: "polaroid", name: "Polaroid", layout: "polaroid", heading: "marker", font: "humanist", ats: false, pro: true, onePage: true },
  { id: "hijau-batik", name: "Hijau Batik", layout: "batik", heading: "square", font: "humanist", ats: false, pro: true, onePage: true },
  { id: "navy-emas", name: "Navy Emas", layout: "sideGold", heading: "bar", font: "sans", ats: false, pro: true, onePage: true },
  { id: "elegan", name: "Elegan", layout: "elegant", heading: "rule", font: "serif", ats: false, pro: true, onePage: true },
  { id: "terakota", name: "Terakota", layout: "terra", heading: "plain", font: "humanist", ats: false, pro: true, onePage: true },
  { id: "biru-modern", name: "Biru Modern", layout: "bluebar", heading: "plain", font: "sans", ats: false, pro: true, onePage: true },
  { id: "sage", name: "Sage", layout: "dashed", heading: "dots", font: "humanist", ats: false, pro: true, onePage: true },
  { id: "pink-bulat", name: "Pink Bulat", layout: "bubble", heading: "capsule", font: "humanist", ats: false, pro: true, onePage: true },
  { id: "eksekutif", name: "Eksekutif", layout: "exec", heading: "rule", font: "sans", ats: true, pro: true },
  { id: "bilah-skill", name: "Bilah Skill", layout: "skillbar", heading: "rule", font: "sans", ats: false, pro: true, onePage: true },
  { id: "klasik-baris", name: "Klasik Baris", layout: "ledger", heading: "plain", font: "book", ats: true, pro: true },
  { id: "organik", name: "Organik", layout: "organic", heading: "plain", font: "sans", ats: false, pro: true, onePage: true },
  { id: "pasir", name: "Pasir", layout: "slider", heading: "square", font: "sans", ats: false, pro: true, onePage: true },
  { id: "memphis", name: "Memphis", layout: "memphis", heading: "rule", font: "sans", ats: false, pro: true, onePage: true },
  { id: "arch", name: "Arch", layout: "arch", heading: "bar", font: "sans", ats: false, pro: true, onePage: true },
];
// Layout lain di CvDocument (band, labels, wave, gradient, darkSide, colorCol) sengaja tidak
// ditampilkan di galeri. Untuk memunculkannya lagi, tambahkan satu baris di daftar di atas, mis.:
// { id: "band", name: "Band", layout: "band", heading: "plain", font: "humanist", ats: false, pro: true },
// { id: "label", name: "Label", layout: "labels", heading: "label", font: "sans", ats: false, pro: true },
// { id: "gelombang", name: "Gelombang", layout: "wave", heading: "dots", font: "sans", ats: false, pro: true, onePage: true },
// { id: "gradien", name: "Gradien", layout: "gradient", heading: "label", font: "sans", ats: false, pro: true, onePage: true },
// { id: "samping-gelap", name: "Samping Gelap", layout: "darkSide", heading: "rule", font: "sans", ats: false, pro: true, onePage: true },
// { id: "kolom-warna", name: "Kolom Warna", layout: "colorCol", heading: "bar", font: "humanist", ats: false, pro: true, onePage: true },

// Gratis: hitam. Pro: 20 warna di bawah + warna kustom bebas (spektrum penuh).
// Warna dipakai apa adanya; teks di atas warna terang otomatis menjadi gelap.
export const CV_ACCENTS = [
  { id: "hitam", label: "Hitam", color: "#111111", pro: false },
  { id: "arang", label: "Abu arang", color: "#374151", pro: true },
  { id: "navy", label: "Biru tua", color: "#1e3a8a", pro: true },
  { id: "biru", label: "Biru", color: "#2563eb", pro: true },
  { id: "laut", label: "Biru laut", color: "#0369a1", pro: true },
  { id: "tosca", label: "Tosca", color: "#0d9488", pro: true },
  { id: "teal", label: "Teal tua", color: "#0f5e5a", pro: true },
  { id: "hijau", label: "Hijau", color: "#16a34a", pro: true },
  { id: "hutan", label: "Hijau tua", color: "#14532d", pro: true },
  { id: "lime", label: "Hijau muda", color: "#84cc16", pro: true },
  { id: "kuning", label: "Kuning", color: "#facc15", pro: true },
  { id: "emas", label: "Emas", color: "#d4a017", pro: true },
  { id: "oranye", label: "Oranye", color: "#f97316", pro: true },
  { id: "oranye-tua", label: "Oranye tua", color: "#9a3412", pro: true },
  { id: "merah", label: "Merah", color: "#dc2626", pro: true },
  { id: "marun", label: "Merah marun", color: "#7f1d1d", pro: true },
  { id: "pink", label: "Merah muda", color: "#ec4899", pro: true },
  { id: "ungu", label: "Ungu", color: "#7c3aed", pro: true },
  { id: "ungu-tua", label: "Ungu tua", color: "#581c87", pro: true },
  { id: "cokelat", label: "Cokelat", color: "#78350f", pro: true },
];
export const DEFAULT_ACCENT = "#111111";

// Kombinasi warna (Pro): warna utama + warna pendamping. Warna pendamping dipakai untuk
// latar lembut, garis hiasan, dan bentuk dekoratif; warna utama untuk judul, kepala, dan sidebar.
export const CV_PALETTES = [
  { id: "hijau-tosca", label: "Hijau & Tosca", accent: "#0b4a46", accent2: "#17806f" },
  { id: "navy-emas", label: "Navy & Emas", accent: "#1e2a44", accent2: "#d4a64a" },
  { id: "biru-oranye", label: "Biru & Oranye", accent: "#1e3a8a", accent2: "#f59e0b" },
  { id: "terakota-krem", label: "Terakota & Krem", accent: "#c8553d", accent2: "#e9a98f" },
  { id: "marun-emas", label: "Marun & Emas", accent: "#7f1d1d", accent2: "#d4a017" },
  { id: "ungu-pink", label: "Ungu & Pink", accent: "#581c87", accent2: "#ec4899" },
  { id: "hutan-lime", label: "Hijau & Lime", accent: "#14532d", accent2: "#84cc16" },
  { id: "teal-kuning", label: "Teal & Kuning", accent: "#0f5e5a", accent2: "#facc15" },
  { id: "arang-oranye", label: "Arang & Oranye", accent: "#374151", accent2: "#f97316" },
  { id: "laut-tosca", label: "Biru Laut & Tosca", accent: "#0369a1", accent2: "#0d9488" },
  { id: "cokelat-pasir", label: "Cokelat & Pasir", accent: "#78350f", accent2: "#d6a77a" },
  { id: "pink-lavender", label: "Pink & Lavender", accent: "#be185d", accent2: "#a78bfa" },
];

export const FREE_TEMPLATE_COUNT = CV_TEMPLATES.filter((t) => !t.pro).length;
export const getTemplate = (id) => CV_TEMPLATES.find((t) => t.id === id) || CV_TEMPLATES[0];

// Ukuran kertas A4 pada 96 dpi, dan area isi per halaman (margin cetak 14 mm atas/bawah).
export const A4_W = 794;
export const A4_H = 1123;
export const PAGE_CONTENT_H = 1017;