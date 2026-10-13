// Konstanta & helper untuk skor kecocokan, penilaian pelamar, talent pool,
// dan wawancara. Nilai "value" harus sama dengan yang dipakai backend
// (internal/models/hiring.go).

// ---------- penilaian pelamar ----------

export const EVAL_LABELS = [
  { value: "strong", label: "Kuat", badge: "bg-green-50 text-success", active: "border-success bg-green-50 text-success" },
  { value: "potential", label: "Potensial", badge: "bg-brand-soft text-brand", active: "border-brand bg-brand-soft text-brand" },
  { value: "backup", label: "Cadangan", badge: "bg-amber-50 text-amber-700", active: "border-amber-500 bg-amber-50 text-amber-700" },
  { value: "not_fit", label: "Kurang cocok", badge: "bg-danger-soft text-danger", active: "border-danger bg-danger-soft text-danger" },
];

export const EVAL_LABEL_MAP = Object.fromEntries(EVAL_LABELS.map((l) => [l.value, l]));

// ---------- wawancara ----------

export const INTERVIEW_MODES = [
  { value: "online", label: "Online (video call)", locationLabel: "Tautan meeting", placeholder: "https://meet.google.com/..." },
  { value: "onsite", label: "Tatap muka", locationLabel: "Alamat lengkap", placeholder: "Nama gedung, jalan, kota" },
  { value: "phone", label: "Telepon", locationLabel: "Nomor yang akan dihubungi", placeholder: "08xxxxxxxxxx" },
];

export const INTERVIEW_MODE_MAP = Object.fromEntries(INTERVIEW_MODES.map((m) => [m.value, m]));

export const INTERVIEW_DURATIONS = [15, 30, 45, 60, 90, 120];

export const INTERVIEW_STATUS = {
  pending: { label: "Menunggu konfirmasi", badge: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Dikonfirmasi", badge: "bg-green-50 text-success" },
  declined: { label: "Tidak bisa hadir", badge: "bg-danger-soft text-danger" },
  cancelled: { label: "Dibatalkan", badge: "bg-gray-100 text-gray-500" },
};

// Jadwal yang masih berlaku (belum ditolak atau dibatalkan).
export function isActiveInterview(iv) {
  return iv.status === "pending" || iv.status === "confirmed";
}

// Jadwal yang akan datang dan masih berlaku.
export function isUpcomingInterview(iv, now = Date.now()) {
  return isActiveInterview(iv) && new Date(iv.starts_at).getTime() > now;
}

// Label zona waktu perangkat: WIB / WITA / WIT, selain itu GMT+x.
export function tzLabel(date) {
  const offset = -date.getTimezoneOffset();
  if (offset === 420) return "WIB";
  if (offset === 480) return "WITA";
  if (offset === 540) return "WIT";
  const sign = offset >= 0 ? "+" : "-";
  const h = Math.floor(Math.abs(offset) / 60);
  const m = Math.abs(offset) % 60;
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

// "Sabtu, 17 Oktober 2026 pukul 14.00 WIB" sesuai zona waktu perangkat.
export function formatDateTime(iso) {
  const d = new Date(iso);
  const text = d.toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${text} ${tzLabel(d)}`;
}

// Nilai untuk <input type="datetime-local"> (zona waktu perangkat).
export function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Tautan hanya dijadikan <a> bila benar-benar http(s); mencegah "javascript:".
export function isHttpUrl(s = "") {
  return /^https?:\/\/\S+$/i.test(s.trim());
}

// ---------- skor kecocokan ----------

export function matchTone(score) {
  if (score >= 75) return { badge: "bg-green-50 text-success", bar: "bg-success" };
  if (score >= 50) return { badge: "bg-amber-50 text-amber-700", bar: "bg-amber-500" };
  return { badge: "bg-gray-100 text-gray-600", bar: "bg-gray-400" };
}
