// "Database" demo: satu objek JSON yang disimpan di localStorage.
// Bila kuota penuh, data tetap hidup di memori selama tab terbuka.
import { buildSeed } from "./seed";

const KEY = "twekky_demo_db_v1";
const VERSION = 1;
let db = null;
let timer = null;

export const uid = (prefix = "") =>
  prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const nowIso = () => new Date().toISOString();

// Hash sederhana khusus demo (BUKAN untuk produksi).
export const hashPw = (pw) => {
  try {
    return btoa(unescape(encodeURIComponent("tw-demo:" + pw)));
  } catch {
    return "tw-demo:" + pw;
  }
};

export function getDb() {
  if (db) return db;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.v === VERSION) db = parsed;
    }
  } catch {
    /* data rusak: pakai seed baru */
  }
  if (!db) {
    db = buildSeed(VERSION);
    persistNow();
  }
  return db;
}

function persistNow() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch (err) {
    console.warn("[demo] localStorage penuh, data hanya di memori:", err?.name);
  }
}

// Panggil setelah mengubah data; penulisan ditunda agar tidak berat.
export function save() {
  clearTimeout(timer);
  timer = setTimeout(persistNow, 150);
}

export function resetDemoData() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem("twekky_token");
  } catch {
    /* abaikan */
  }
  db = null;
  location.reload();
}

if (typeof window !== "undefined") {
  window.__twekkyResetDemo = resetDemoData; // jalankan di Console untuk mengembalikan data awal
}
