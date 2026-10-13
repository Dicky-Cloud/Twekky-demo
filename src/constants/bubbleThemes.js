// Katalog tema bubble chat. Dipakai di halaman Pesan dan di isi post Feed.
//
// PENTING: `id` harus sama dengan kunci `bubbleThemes` di
// internal/handlers/bubble_theme_handler.go (server memvalidasi id dan status
// Pro). Menambah tema baru = tambah satu objek di sini + satu baris di Go.
//
// Bentuk satu tema:
//   id, name, pro        identitas; pro=true berarti khusus akun Pro
//   plain                true = bubble bawaan Twekky (tidak diubah sama sekali)
//   bg, border, text     warna latar (boleh gradien), garis, dan teks
//   shadow               bayangan (opsional), mis. "3px 3px 0 #F2B23C"
//   mono                 true = teks memakai font monospace (opsional)
//   mascot               markup SVG karakter (viewBox 0 0 36 36), opsional
//   decor                hiasan [bentuk, posisi, warna]; bentuk: star | dia | dot |
//                        plus | leaf | bolt | heart; posisi: sd (kanan atas) |
//                        sl (kiri bawah) | bd (bawah kiri) | bd3 (bawah kanan)
//
// Semua SVG di bawah adalah konstanta statis buatan sendiri (bukan input
// pengguna), jadi aman dirender lewat dangerouslySetInnerHTML.

export const DEFAULT_THEME_ID = "polos";

const MASCOT = {
  kucing:
    '<path d="M6 17L7 4l9 6zM30 17l-1-13-9 6z" fill="#F4B46A"/><circle cx="18" cy="21" r="13" fill="#F4B46A"/><circle class="e" cx="13" cy="20" r="1.7"/><circle class="e" cx="23" cy="20" r="1.7"/><path d="M16.5 24h3l-1.5 2z" fill="#E6597A"/><path d="M3 23h7M3 27l7-2M33 23h-7M33 27l-7-2" fill="none" stroke-width="1.4"/>' +
    '<circle cx="31" cy="31" r="5" fill="#E6597A"/><path d="M27 29.5q4 3 8 0M27 33q4 3 8 0" fill="none" stroke-width="1.2"/>',
  ayam:
    '<circle cx="13" cy="8" r="3.5" fill="#E04646"/><circle cx="18" cy="6" r="3.5" fill="#E04646"/><circle cx="23" cy="8" r="3.5" fill="#E04646"/><circle cx="18" cy="21" r="13" fill="#fff"/><circle class="e" cx="12" cy="19" r="1.7"/><circle class="e" cx="24" cy="19" r="1.7"/><path d="M15 23h6l-3 5z" fill="#F2A33C"/>' +
    '<ellipse cx="31" cy="31" rx="4.2" ry="5.2" fill="#fff"/><path d="M27 30.5l2 1.5 2-2 2 2 2-1.5" fill="none" stroke-width="1.2"/>',
  ikan:
    '<path d="M28 21l7-7v14z" fill="#4FB3E8"/><ellipse cx="16" cy="21" rx="13" ry="10" fill="#4FB3E8"/><path d="M12 12q4-6 9 0z" fill="#2E8FEA"/><circle cx="11" cy="19" r="3" fill="#fff"/><circle class="e" cx="10.5" cy="19" r="1.3"/><path d="M4 24q3 2 5 0" fill="none"/>' +
    '<circle cx="10.5" cy="19" r="4.8" fill="#fff" fill-opacity=".4"/><path d="M5.5 19H2M22 10l6-8h4" fill="none" stroke-width="2"/>',
  bebek:
    '<circle cx="18" cy="21" r="13" fill="#FFE066"/><path d="M18 8q-2-4 2-5" fill="none"/><circle class="e" cx="12" cy="18" r="1.7"/><circle class="e" cx="24" cy="18" r="1.7"/><ellipse cx="18" cy="26" rx="8" ry="4.5" fill="#F59E0B"/>' +
    '<path d="M25 30q6-9 12 0z" fill="#38BDF8"/><path d="M31 30v7" fill="none"/>',
  dokter:
    '<circle cx="18" cy="21" r="13" fill="#F1C9A5"/><path d="M5 18q0-12 13-12t13 12q-13-5-26 0z" fill="#fff"/><path d="M18 10v5M15.5 12.5h5" style="stroke:#E04646"/><circle class="e" cx="13" cy="21" r="1.7"/><circle class="e" cx="23" cy="21" r="1.7"/><path d="M15 27q3 3 6 0" fill="none"/>' +
    '<path d="M8 27q0 10 10 10t10-10" fill="none"/><circle cx="28" cy="35" r="2.6" fill="#CBD5E1"/>',
  programmer:
    '<circle cx="18" cy="21" r="13" fill="#F1C9A5"/><path d="M5 19q0-13 13-13t13 13q-4-6-13-6t-13 6z" fill="#2B2F3A"/><path d="M9 19h8v6H9zM19 19h8v6h-8z" fill="#fff" fill-opacity=".75"/><circle class="e" cx="13" cy="21" r="1.7"/><circle class="e" cx="23" cy="21" r="1.7"/><path d="M15 27q3 3 6 0" fill="none"/>' +
    '<rect x="21" y="27" width="17" height="10" rx="1.5" fill="#334155"/><path d="M25 31h6M25 34h9" style="stroke:#22C55E;stroke-width:1.3" fill="none"/>',
  hantu:
    '<path d="M6 32V17q0-12 12-12t12 12v15l-4-3-4 3-4-3-4 3-4-3z" fill="#fff"/><circle class="e" cx="13" cy="17" r="1.8"/><circle class="e" cx="23" cy="17" r="1.8"/><ellipse cx="18" cy="24" rx="2" ry="2.8" fill="#111827"/><circle cx="9.5" cy="22" r="2" style="fill:#FAC5CF;stroke:none"/><circle cx="26.5" cy="22" r="2" style="fill:#FAC5CF;stroke:none"/>' +
    '<rect x="28" y="28" width="6" height="9" fill="#FEF3C7"/><path d="M31 28v-2" fill="none"/><path d="M31 21q-2.5 2.5 0 5 2.5-2.5 0-5z" style="fill:#F59E0B"/>',
  robot:
    '<path d="M18 9V4" fill="none"/><circle cx="18" cy="3.5" r="2" fill="#E04646"/><rect x="5" y="9" width="26" height="23" rx="5" fill="#CBD5E1"/><rect x="9" y="16" width="7" height="6" rx="1.5" fill="#22D3EE"/><rect x="20" y="16" width="7" height="6" rx="1.5" fill="#22D3EE"/><path d="M12 27h12" fill="none"/>' +
    '<circle cx="33" cy="31" r="4" fill="#FDE68A"/><circle cx="33" cy="31" r="1.3" fill="#fff"/><path d="M33 26v1.5M33 34.5V36M28 31h1.5M36.5 31H38" fill="none" stroke-width="1.6"/>',
};

export const BUBBLE_THEMES = [
  { id: "polos", name: "Polos", pro: false, plain: true },
  {
    id: "mint",
    name: "Mint",
    pro: false,
    bg: "#E6F7EC",
    border: "#22A559",
    text: "#0F3D24",
  },
  {
    id: "retro",
    name: "Retro",
    pro: true,
    bg: "#FFFFFF",
    border: "#111827",
    text: "#111827",
    shadow: "3px 3px 0 #F2B23C",
    decor: [["star", "sd", "#F2B23C"], ["dot", "bd", "#F9A8D4"]],
  },
  {
    id: "gradien",
    name: "Gradien",
    pro: true,
    bg: "linear-gradient(135deg,#5B3DF5,#2E8FEA)",
    border: "#4A32D6",
    text: "#FFFFFF",
    decor: [["star", "sd", "#FDE047"], ["dia", "bd", "#C4B5FD"]],
  },
  {
    id: "profesional",
    name: "Profesional",
    pro: true,
    bg: "#E6EEFC",
    border: "#9DB8EE",
    text: "#0B3478",
  },
  {
    id: "glam",
    name: "Glam",
    pro: true,
    bg: "#FFFFFF",
    border: "#111827",
    text: "#111827",
    shadow: "3px 3px 0 #D9306F",
    decor: [["heart", "sd", "#F472B6"], ["star", "sl", "#FCD34D"], ["dot", "bd", "#F9A8D4"], ["star", "bd3", "#D9306F"]],
  },
  {
    id: "kucing",
    name: "Kucing",
    pro: true,
    bg: "#FFF1DF",
    border: "#E9A55B",
    text: "#4A2A0A",
    mascot: MASCOT.kucing,
    decor: [["heart", "sd", "#F472B6"], ["dot", "sl", "#FCD34D"], ["dot", "bd", "#F9A8D4"], ["heart", "bd3", "#E9A55B"]],
  },
  {
    id: "ayam",
    name: "Ayam",
    pro: true,
    bg: "#FFF8D6",
    border: "#F2B23C",
    text: "#4A3500",
    mascot: MASCOT.ayam,
    decor: [["heart", "sd", "#F472B6"], ["leaf", "sl", "#4ADE80"], ["leaf", "bd", "#22A559"], ["dot", "bd3", "#F2B23C"]],
  },
  {
    id: "ikan",
    name: "Ikan",
    pro: true,
    bg: "#E3F4FD",
    border: "#4FB3E8",
    text: "#0B3B57",
    mascot: MASCOT.ikan,
    decor: [["dot", "sd", "#4FB3E8"], ["dot", "sl", "#7DD3FC"], ["dot", "bd", "#38BDF8"], ["leaf", "bd3", "#22A559"]],
  },
  {
    id: "bebek",
    name: "Bebek",
    pro: true,
    bg: "#FFF4BF",
    border: "#E5B800",
    text: "#4A3B00",
    mascot: MASCOT.bebek,
    decor: [["dot", "sd", "#FCD34D"], ["star", "sl", "#38BDF8"], ["dot", "bd", "#F9A8D4"], ["heart", "bd3", "#F59E0B"]],
  },
  {
    id: "dokter",
    name: "Dokter",
    pro: true,
    bg: "#E6F5F0",
    border: "#3AA676",
    text: "#0F4D33",
    mascot: MASCOT.dokter,
    decor: [["plus", "sd", "#E04646"], ["heart", "sl", "#F9A8D4"], ["plus", "bd", "#E04646"], ["dot", "bd3", "#3AA676"]],
  },
  {
    id: "programmer",
    name: "Programmer",
    pro: true,
    bg: "#0F172A",
    border: "#22C55E",
    text: "#A7F3D0",
    mono: true,
    mascot: MASCOT.programmer,
    decor: [["bolt", "sd", "#22D3EE"], ["dia", "sl", "#94A3B8"], ["dot", "bd", "#22C55E"], ["star", "bd3", "#FDE047"]],
  },
  {
    id: "hantu",
    name: "Hantu",
    pro: true,
    bg: "#EDEBFA",
    border: "#8E86D8",
    text: "#2E2A66",
    mascot: MASCOT.hantu,
    decor: [["star", "sd", "#FCD34D"], ["dot", "sl", "#C4B5FD"], ["dia", "bd", "#8E86D8"], ["star", "bd3", "#FAC5CF"]],
  },
  {
    id: "robot",
    name: "Robot",
    pro: true,
    bg: "#E2E8F0",
    border: "#64748B",
    text: "#1E293B",
    mascot: MASCOT.robot,
    decor: [["bolt", "sd", "#22D3EE"], ["plus", "sl", "#94A3B8"], ["dot", "bd", "#22D3EE"], ["dia", "bd3", "#64748B"]],
  },
];

// Tampilan di Feed (avatar + nama + kartu post penulis bertema):
//   ring  gradien cincin avatar     name  gradien warna nama (cukup gelap agar terbaca di latar putih)
//   tint  warna dasar kartu post yang muda (teks post tetap gelap, termasuk untuk tema gelap)
const FEED = {
  mint: { ring: ["#86EFAC", "#22A559"], name: ["#0F5132", "#15803D"], tint: "#F0FBF4" },
  retro: { ring: ["#FDE68A", "#111827"], name: ["#111827", "#B45309"], tint: "#FFF9EC" },
  gradien: { ring: ["#818CF8", "#2E8FEA"], name: ["#4338CA", "#7C3AED"], tint: "#F3F1FF" },
  profesional: { ring: ["#BFDBFE", "#6B8FE0"], name: ["#1E3A8A", "#2563EB"], tint: "#EFF4FE" },
  glam: { ring: ["#F9A8D4", "#D9306F"], name: ["#9D174D", "#DB2777"], tint: "#FFF0F6" },
  kucing: { ring: ["#FDBA74", "#EC4899"], name: ["#C2410C", "#DB2777"], tint: "#FFF4E3" },
  ayam: { ring: ["#FDE047", "#F2B23C"], name: ["#A16207", "#C2410C"], tint: "#FFFBE0" },
  ikan: { ring: ["#7DD3FC", "#2E8FEA"], name: ["#0E7490", "#2563EB"], tint: "#EAF7FE" },
  bebek: { ring: ["#FDE047", "#E5B800"], name: ["#92400E", "#B45309"], tint: "#FFF8D0" },
  dokter: { ring: ["#34D399", "#0F766E"], name: ["#0F5132", "#1B7F55"], tint: "#EFF9F5" },
  programmer: { ring: ["#818CF8", "#22C55E"], name: ["#166534", "#0E7490"], tint: "#EFFAF3" },
  hantu: { ring: ["#C4B5FD", "#8E86D8"], name: ["#4C1D95", "#7C3AED"], tint: "#F3F1FC" },
  robot: { ring: ["#67E8F9", "#3B82F6"], name: ["#334155", "#0E7490"], tint: "#EEF2F7" },
};
for (const t of BUBBLE_THEMES) Object.assign(t, FEED[t.id]);

const BY_ID = new Map(BUBBLE_THEMES.map((t) => [t.id, t]));

export function findBubbleTheme(id) {
  return BY_ID.get(id) || null;
}

// Ubah id mentah dari server menjadi id yang benar-benar perlu digambar.
// Mengembalikan "" untuk bubble bawaan, id kosong, atau id yang tidak dikenal,
// sehingga pemanggil cukup memeriksa `if (themeId)`.
export function customThemeId(id) {
  const t = BY_ID.get(id);
  return t && !t.plain ? t.id : "";
}
