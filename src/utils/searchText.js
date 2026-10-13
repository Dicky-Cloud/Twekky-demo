// Fungsi teks murni untuk halaman pencarian (tanpa React, supaya mudah diuji).

export function includesText(haystack, needle) {
  const n = String(needle || "").trim().toLowerCase();
  if (!n) return false;
  return String(haystack || "").toLowerCase().includes(n);
}

// Memecah teks menjadi potongan { text, hit } agar bagian yang cocok bisa
// disorot. Pencocokan tidak membedakan huruf besar/kecil.
export function splitHighlight(text, query) {
  const t = String(text || "");
  const q = String(query || "").trim();
  if (!t || !q) return [{ text: t, hit: false }];

  const lower = t.toLowerCase();
  // beberapa huruf Unicode mengubah panjang saat di-lowercase; kalau begitu,
  // lebih aman tidak menyorot daripada menyorot di posisi yang salah
  if (lower.length !== t.length) return [{ text: t, hit: false }];

  const needle = q.toLowerCase();
  const out = [];
  let from = 0;
  for (;;) {
    const i = lower.indexOf(needle, from);
    if (i === -1) break;
    if (i > from) out.push({ text: t.slice(from, i), hit: false });
    out.push({ text: t.slice(i, i + needle.length), hit: true });
    from = i + needle.length;
  }
  if (from < t.length) out.push({ text: t.slice(from), hit: false });
  return out.length ? out : [{ text: t, hit: false }];
}

// Cuplikan teks di sekitar kata yang dicari, supaya hasil menunjukkan
// konteksnya dan bukan hanya awal teks.
export function snippetAround(text, query, maxLen = 160) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (t.length <= maxLen) return t;
  const i = t.toLowerCase().indexOf(String(query || "").trim().toLowerCase());
  if (i < 0 || i < maxLen / 2) return `${t.slice(0, maxLen).trimEnd()}…`;
  const start = Math.max(0, i - Math.floor(maxLen / 3));
  const end = Math.min(t.length, start + maxLen);
  return `${start > 0 ? "…" : ""}${t.slice(start, end).trim()}${end < t.length ? "…" : ""}`;
}

export function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}
