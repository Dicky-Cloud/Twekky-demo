// Pembantu warna untuk CV: memastikan warna aksen terbaca dan membuat turunan lembut.
const HEX = /^#[0-9a-f]{6}$/i;
const toRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");

function luminance(hex) {
  const [r, g, b] = toRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Rasio kontras warna terhadap putih (WCAG).
export const contrastWithWhite = (hex) => 1.05 / (luminance(hex) + 0.05);

// Gelapkan warna sampai kontrasnya dengan putih minimal `min` (teks putih di atasnya terbaca).
export function ensureContrast(hex, min = 4.5) {
  let c = HEX.test(hex || "") ? hex.toLowerCase() : "#111111";
  for (let i = 0; i < 60 && contrastWithWhite(c) < min; i++) {
    c = toHex(toRgb(c).map((v) => v * 0.94));
  }
  return c;
}

// Campur warna dengan putih: amt 0 = warna asli, 1 = putih.
export function tint(hex, amt = 0.9) {
  const c = HEX.test(hex || "") ? hex : "#111111";
  return toHex(toRgb(c).map((v) => v + (255 - v) * amt));
}

// Gelapkan warna: amt 0 = warna asli, 1 = hitam.
export function shade(hex, amt = 0.7) {
  const c = HEX.test(hex || "") ? hex : "#111111";
  return toHex(toRgb(c).map((v) => v * (1 - amt)));
}

// Apakah warna ini terang? Jika ya, teks di atasnya sebaiknya gelap (kontras lebih baik daripada putih).
export const isLight = (hex) => luminance(HEX.test(hex || "") ? hex : "#111111") > 0.179;

// Versi warna yang aman dipakai sebagai TEKS di atas latar putih (hanya digelapkan bila terlalu terang).
export const textSafe = (hex, min = 4) => ensureContrast(hex, min);
