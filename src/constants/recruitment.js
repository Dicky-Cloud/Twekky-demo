// Konstanta & helper kecil untuk fitur rekrutmen (dipakai halaman /rekrutmen
// dan form lowongan).

export const JOB_TYPES = [
  { value: "", label: "Semua Tipe Pekerjaan" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
];

// Urutan = urutan tahap lamaran.
export const APPLICATION_STATUSES = [
  { value: "new", label: "Baru", badge: "bg-brand-soft text-brand", bar: "bg-brand" },
  { value: "reviewed", label: "Ditinjau", badge: "bg-gray-100 text-gray-600", bar: "bg-gray-400" },
  { value: "interview", label: "Wawancara", badge: "bg-amber-50 text-amber-700", bar: "bg-amber-400" },
  { value: "accepted", label: "Diterima", badge: "bg-green-50 text-success", bar: "bg-success" },
  { value: "rejected", label: "Ditolak", badge: "bg-danger-soft text-danger", bar: "bg-danger" },
];

export const STATUS_MAP = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s.value, s]));

export const ENGLISH_LABELS = {
  none: "Tidak bisa",
  basic: "Dasar",
  conversational: "Percakapan",
  professional: "Profesional",
  native: "Fasih / Native",
};

export const EXPERIENCE_LABELS = {
  "0": "Belum ada / Fresh graduate",
  "1-2": "1 - 2 tahun",
  "3-5": "3 - 5 tahun",
  "5+": "Lebih dari 5 tahun",
};

export function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function formatShortDate(isoDate) {
  // isoDate = "2026-10-02"
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function formatSalary(min, max) {
  if (!min && !max) return null;
  const fmt = (n) => `Rp ${Math.round(n / 1000000)}jt`;
  if (min && max) return `${fmt(min)} - ${fmt(max)} / bulan`;
  return `${fmt(min || max)} / bulan`;
}

export function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

// 0812... / +62812... / 62812... -> https://wa.me/62812...
export function whatsappLink(phone = "") {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = `62${d.slice(1)}`;
  else if (d.startsWith("8")) d = `62${d}`;
  return `https://wa.me/${d}`;
}

export function percent(part, total) {
  if (!total) return "0%";
  const v = (part / total) * 100;
  return `${v >= 10 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, "")}%`;
}

export function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

// Warna aksen halaman perusahaan. Nama kelas ditulis lengkap (bukan disusun
// dari string) supaya terdeteksi oleh Tailwind.
export const COMPANY_ACCENTS = {
  blue: { label: "Biru", banner: "from-blue-600 to-blue-400", swatch: "bg-blue-500" },
  emerald: { label: "Hijau", banner: "from-emerald-600 to-emerald-400", swatch: "bg-emerald-500" },
  violet: { label: "Ungu", banner: "from-violet-600 to-violet-400", swatch: "bg-violet-500" },
  rose: { label: "Merah muda", banner: "from-rose-600 to-rose-400", swatch: "bg-rose-500" },
  amber: { label: "Kuning", banner: "from-amber-500 to-amber-300", swatch: "bg-amber-400" },
  slate: { label: "Abu-abu", banner: "from-slate-700 to-slate-500", swatch: "bg-slate-600" },
};

export const COMPANY_SIZES = [
  { value: "", label: "Pilih ukuran perusahaan" },
  { value: "1-10", label: "1 - 10 karyawan" },
  { value: "11-50", label: "11 - 50 karyawan" },
  { value: "51-200", label: "51 - 200 karyawan" },
  { value: "201-1000", label: "201 - 1.000 karyawan" },
  { value: "1000+", label: "Lebih dari 1.000 karyawan" },
];

// Template pesan perekrut (penolakan & undangan wawancara).
export const TEMPLATE_KINDS = [
  { value: "rejection", label: "Penolakan" },
  { value: "interview", label: "Undangan wawancara" },
];

// Placeholder yang diisi server saat template dipakai pada seorang pelamar.
export const TEMPLATE_PLACEHOLDERS = [
  { token: "{{nama}}", hint: "Nama pelamar" },
  { token: "{{posisi}}", hint: "Judul lowongan" },
  { token: "{{perusahaan}}", hint: "Nama perusahaan" },
];
