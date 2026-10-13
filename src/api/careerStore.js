// ---------------------------------------------------------------------------
// Profil karier. Sumber kebenarannya sekarang di server (/api/profile/career);
// localStorage dipakai sebagai cache supaya tampilan tetap instan:
//   - saveCareer menulis ke cache lalu mengirim ke server (ditunda 700 ms),
//   - syncCareer (dipanggil useCareer) mengambil data server dan menimpa cache,
//   - bila server belum punya data, isi cache lama dipindahkan ke server sekali.
// Komponen tidak perlu tahu semua ini: API ekspor tidak berubah.
// ---------------------------------------------------------------------------
import { useEffect, useState } from "react";
import { api } from "./client";

const key = (uid) => `twekky_career_v1:${uid}`;
const EVT = "twekky-career";

export const LEVELS = [
  { v: "sma", label: "SMA/SMK" },
  { v: "student", label: "Mahasiswa (belum tingkat akhir)" },
  { v: "student-final", label: "Mahasiswa (tingkat akhir)" },
  { v: "fresh", label: "Fresh Graduate" },
  { v: "1-3", label: "1–3 tahun pengalaman" },
  { v: "3-5", label: "3–5 tahun pengalaman" },
  { v: "5+", label: "5+ tahun pengalaman" },
];
export const STATUSES = [
  { v: "active", label: "Aktif mencari" },
  { v: "open", label: "Terbuka untuk peluang" },
  { v: "closed", label: "Tidak terbuka" },
];
export const WORK_MODES = [
  { v: "onsite", label: "Di kantor" },
  { v: "remote", label: "Remote" },
  { v: "hybrid", label: "Hybrid" },
];

export const EMPTY_CAREER = {
  headline: "",
  city: "",
  phone: "", // dipakai mengisi otomatis form lamaran
  share: true, // bagikan profil ke perekrut
  status: null,
  level: null,
  salaryMin: "",
  skills: [],
  roles: [],
  workModes: [],
  locations: [],
  hiddenCompanies: [],
  cvName: "", // nama CV pertama (turunan dari cvs, hanya milik server)
  cvs: [], // CV tersimpan: [{ id, name, size, uploaded_at }], maksimal 4 (hanya milik server)
  portfolio: [],
  pauseEmail: false,
  experience: [],
  organizations: [],
  certifications: [],
  education: [],
};

export function readCareer(uid) {
  try {
    return { ...EMPTY_CAREER, ...JSON.parse(localStorage.getItem(key(uid)) || "{}") };
  } catch {
    return { ...EMPTY_CAREER };
  }
}

// ---- sinkronisasi dengan server ---------------------------------------------
const PUSH_DELAY_MS = 700;
const PULL_EVERY_MS = 30_000;
const sync = new Map(); // uid -> { version, timer, pulledAt }
const st = (uid) => {
  if (!sync.has(uid)) sync.set(uid, { version: 0, timer: null, pulledAt: 0 });
  return sync.get(uid);
};

const LIST_KEYS = ["skills", "roles", "workModes", "locations", "hiddenCompanies", "portfolio", "experience", "organizations", "certifications", "education"];

// Bentuk data server -> bentuk cache/komponen (status & level kosong = null, gaji kosong = "").
function fromServer(s, cvs) {
  const out = { ...EMPTY_CAREER, ...s };
  LIST_KEYS.forEach((k) => { out[k] = Array.isArray(s[k]) ? s[k] : []; });
  out.status = s.status || null;
  out.level = s.level || null;
  out.salaryMin = s.salaryMin ? Number(s.salaryMin) : "";
  out.cvs = Array.isArray(cvs) ? cvs : [];
  out.cvName = out.cvs[0]?.name || "";
  delete out.updated_at;
  return out;
}

// Bentuk cache -> bentuk yang dikirim ke server (cvName hanya milik server).
function toServer(c) {
  const { cvName, cvs, ...rest } = c; // eslint-disable-line no-unused-vars
  return { ...rest, status: rest.status || "", level: rest.level || "", salaryMin: Number(rest.salaryMin) || 0 };
}

const strip = (c) => { const { cvName, cvs, ...rest } = c; return JSON.stringify(rest); }; // eslint-disable-line no-unused-vars
const hasData = (c) => strip(c) !== strip(EMPTY_CAREER);

// Tulis cache dan beri tahu komponen, tanpa mengirim ke server.
function writeLocal(uid, next) {
  try {
    localStorage.setItem(key(uid), JSON.stringify(next));
  } catch {
    /* penyimpanan lokal tidak tersedia */
  }
  window.dispatchEvent(new CustomEvent(EVT, { detail: uid }));
  return next;
}

function schedulePush(uid) {
  const s = st(uid);
  clearTimeout(s.timer);
  s.timer = setTimeout(() => {
    api.saveCareerProfile(toServer(readCareer(uid))).catch(() => {});
  }, PUSH_DELAY_MS);
}

export function saveCareer(uid, patch) {
  const next = writeLocal(uid, { ...readCareer(uid), ...patch });
  st(uid).version += 1;
  schedulePush(uid);
  return next;
}

// Mengubah daftar CV di cache saja (berkas CV dikelola lewat endpoint /api/profile/cv).
export function setCareerCvs(uid, cvs) {
  return writeLocal(uid, { ...readCareer(uid), cvs, cvName: cvs[0]?.name || "" });
}
export const addCareerCv = (uid, cv) => setCareerCvs(uid, [...readCareer(uid).cvs, cv]);
// CV utama = urutan pertama. Cache diubah dulu agar tampilan langsung berganti.
export function setPrimaryCareerCv(uid, id) {
  const cvs = readCareer(uid).cvs;
  const hit = cvs.find((x) => x.id === id);
  if (!hit) return;
  setCareerCvs(uid, [hit, ...cvs.filter((x) => x.id !== id)]);
}
export const removeCareerCv = (uid, id) => setCareerCvs(uid, readCareer(uid).cvs.filter((x) => x.id !== id));

// Ambil data server. Aman dipanggil berkali-kali (dibatasi tiap 30 detik).
export async function syncCareer(uid, { force = false } = {}) {
  if (!uid) return;
  const s = st(uid);
  if (!force && Date.now() - s.pulledAt < PULL_EVERY_MS) return;
  s.pulledAt = Date.now();
  const versionAtStart = s.version;
  try {
    const res = await api.getCareerProfile();
    if (s.version !== versionAtStart) return; // pengguna mengubah data selama menunggu: jangan timpa
    if (res.exists) {
      writeLocal(uid, fromServer(res.career, res.cvs));
      return;
    }
    // Server belum punya profil: pindahkan isi cache lama (migrasi sekali).
    const local = readCareer(uid);
    if (hasData(local)) {
      const saved = await api.saveCareerProfile(toServer(local));
      writeLocal(uid, fromServer(saved.career, saved.cvs || res.cvs));
    } else {
      writeLocal(uid, { ...local, cvs: res.cvs || [], cvName: res.cvs?.[0]?.name || "" });
    }
  } catch {
    s.pulledAt = 0; // gagal: boleh dicoba lagi
  }
}

const newId = () => `e-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// Tambah (tanpa id) atau ubah (dengan id) satu entri di daftar.
export function upsertEntry(uid, list, entry) {
  const cur = readCareer(uid)[list] || [];
  const next = entry.id ? cur.map((e) => (e.id === entry.id ? entry : e)) : [...cur, { ...entry, id: newId() }];
  return saveCareer(uid, { [list]: next });
}

export function removeEntry(uid, list, id) {
  return saveCareer(uid, { [list]: (readCareer(uid)[list] || []).filter((e) => e.id !== id) });
}

export function useCareer(uid) {
  const [career, setCareer] = useState(() => readCareer(uid));
  useEffect(() => {
    setCareer(readCareer(uid));
    syncCareer(uid);
    const h = (e) => {
      if (!e.detail || e.detail === uid) setCareer(readCareer(uid));
    };
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, [uid]);
  return [career, (patch) => saveCareer(uid, patch)];
}

// ---- kelengkapan: dua kelompok ---------------------------------------------
// "Karier lengkap" dipakai untuk panel kelengkapan di formulir Lamar Cepat.
export function careerChecklist(c) {
  return [
    { key: "headline", label: "Headline & kota", done: Boolean(c.headline.trim() && c.city.trim()) },
    { key: "status", label: "Status & level pengalaman", done: Boolean(c.status && c.level) },
    { key: "background", label: "Pendidikan atau pengalaman kerja", done: c.education.length + c.experience.length > 0 },
    { key: "skills", label: "Minimal 3 keahlian", done: c.skills.length >= 3 },
    { key: "prefs", label: "Posisi, lokasi & pengaturan kerja", done: c.roles.length > 0 && c.locations.length > 0 && c.workModes.length > 0 },
    { key: "cv", label: "CV tersimpan", done: c.cvs.length > 0 },
  ];
}

export function careerProgress(c) {
  const items = careerChecklist(c);
  const done = items.filter((i) => i.done).length;
  return { items, done, percent: Math.round((done / items.length) * 100), complete: done === items.length };
}

// Kesiapan profil untuk modal lamar: "complete" (hijau, CV diambil dari profil),
// "partial" (kuning, sebagian terisi), "empty" (merah, belum diisi sama sekali).
export function careerReadiness(c) {
  const { done, complete } = careerProgress(c);
  if (complete) return "complete";
  return done === 0 ? "empty" : "partial";
}

// ---- format tanggal --------------------------------------------------------
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export function fmtMonth(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  return `${MONTHS[Number(m) - 1] || ""} ${y}`.trim();
}

export function durationLabel(start, end, current) {
  if (!start) return "";
  const to = current ? new Date() : end ? new Date(`${end}-01`) : null;
  const left = `${fmtMonth(start)} – ${current ? "Sekarang" : end ? fmtMonth(end) : ""}`;
  if (!to) return left;
  const s = new Date(`${start}-01`);
  const months = Math.max(1, (to.getFullYear() - s.getFullYear()) * 12 + (to.getMonth() - s.getMonth()) + 1);
  const y = Math.floor(months / 12);
  const m = months % 12;
  const len = [y && `${y} thn`, m && `${m} bln`].filter(Boolean).join(" ");
  return `${left} · ${len}`;
}
