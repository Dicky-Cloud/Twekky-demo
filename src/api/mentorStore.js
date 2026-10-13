// ---------------------------------------------------------------------------
// DATA DUMMY untuk fitur Mentor. Semua disimpan di localStorage (satu "database"
// bersama untuk browser ini), jadi alurnya benar-benar berfungsi dari ujung ke
// ujung: ajukan jadi mentor -> disetujui -> dipesan -> diterima -> selesai ->
// penghasilan & ulasan.
//
// Saat backend siap, cukup ganti isi fungsi-fungsi di file ini dengan panggilan
// API (api/client.js). Halaman tidak perlu diubah. Tanda "DEMO" di UI menandai
// hal yang nantinya dikerjakan server / admin / payment gateway.
// ---------------------------------------------------------------------------
import { useEffect, useState } from "react";
import { MENTORS, MENTOR_FEE_PERCENT, mentorFee, mentorNet } from "../constants/mentors";

const KEY = "twekky_mentor_db_v1";
const EVT = "twekky-mentor-db";
const EMPTY = { applications: [], mentors: [], sessions: [], reviews: [] };

let memory = null; // cadangan bila localStorage tidak tersedia

export function readDb() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw) return { ...EMPTY, ...raw };
  } catch {
    /* abaikan */
  }
  return memory ? { ...EMPTY, ...memory } : { ...EMPTY };
}

function write(db) {
  memory = db;
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* penyimpanan lokal tidak tersedia */
  }
  window.dispatchEvent(new Event(EVT));
}

// fn menerima db, mengembalikan db baru. Error dari fn membatalkan penyimpanan.
function update(fn) {
  const next = fn(readDb());
  write(next);
  return next;
}

export function useMentorDb() {
  const [db, setDb] = useState(readDb);
  useEffect(() => {
    const h = () => setDb(readDb());
    window.addEventListener(EVT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(EVT, h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return db;
}

const uid = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();

// ---- mentor ----------------------------------------------------------------
const SEED = MENTORS.map((m) => ({ ...m, userId: null, seeded: true, verified: true, available: true }));

export const allMentors = (db) => [...SEED, ...db.mentors];
export const getMentor = (db, id) => allMentors(db).find((m) => m.id === id) || null;
export const myMentor = (db, userId) => (userId ? db.mentors.find((m) => m.userId === userId) || null : null);
export const myApplication = (db, userId) => (userId ? db.applications.find((a) => a.userId === userId) || null : null);

// Rating gabungan: data awal (rating & sesi contoh) + ulasan nyata.
export function mentorStats(db, m) {
  const reviews = db.reviews.filter((r) => r.mentorId === m.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const done = db.sessions.filter((s) => s.mentorId === m.id && s.status === "completed").length;
  const baseS = m.sessions || 0;
  const baseR = m.rating || 0;
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  const denom = baseS + reviews.length;
  return {
    rating: denom ? (baseR * baseS + sum) / denom : 0,
    sessions: baseS + done,
    reviewCount: reviews.length,
    reviews,
  };
}

// ---- pengajuan jadi mentor -------------------------------------------------
export function submitApplication(userId, userName, data) {
  return update((db) => {
    const app = { ...data, id: uid("app"), userId, name: userName, status: "pending", reason: "", createdAt: nowIso() };
    return { ...db, applications: [app, ...db.applications.filter((a) => a.userId !== userId)] };
  });
}

export function withdrawApplication(userId) {
  return update((db) => ({ ...db, applications: db.applications.filter((a) => a.userId !== userId) }));
}

// DEMO: menggantikan peninjauan admin. decision = "approve" | "revision"
export function demoDecide(userId, decision, reason = "") {
  return update((db) => {
    const app = db.applications.find((a) => a.userId === userId);
    if (!app) throw new Error("Pengajuan tidak ditemukan.");
    if (decision === "revision") {
      return {
        ...db,
        applications: db.applications.map((a) => (a.userId === userId ? { ...a, status: "revision", reason } : a)),
      };
    }
    const mentor = {
      id: `u-${userId}`,
      userId,
      name: app.name,
      title: app.title,
      org: app.org,
      topic: app.topic,
      expertise: app.expertise,
      bio: app.bio,
      price: app.price,
      slots: app.slots,
      rating: 0,
      sessions: 0,
      verified: true,
      available: true,
      approvedAt: nowIso(),
    };
    return {
      ...db,
      mentors: [mentor, ...db.mentors.filter((m) => m.userId !== userId)],
      applications: db.applications.map((a) => (a.userId === userId ? { ...a, status: "approved", reason: "" } : a)),
    };
  });
}

export function updateMentor(mentorId, patch) {
  const allowed = ["title", "org", "expertise", "bio", "price", "slots", "available"];
  return update((db) => ({
    ...db,
    mentors: db.mentors.map((m) => {
      if (m.id !== mentorId) return m;
      const next = { ...m };
      allowed.forEach((k) => {
        if (k in patch) next[k] = patch[k];
      });
      return next;
    }),
  }));
}

// ---- sesi ------------------------------------------------------------------
export const ACTIVE = ["requested", "confirmed"];

export function bookSession({ mentorId, menteeId, menteeName, slot, goal }) {
  let created;
  update((db) => {
    const m = getMentor(db, mentorId);
    if (!m) throw new Error("Mentor tidak ditemukan.");
    if (m.userId && m.userId === menteeId) throw new Error("Kamu tidak bisa memesan sesi dengan dirimu sendiri.");
    if (m.available === false) throw new Error("Mentor sedang tidak menerima pesanan baru.");
    if (!slot) throw new Error("Pilih jadwal terlebih dahulu.");
    if (db.sessions.some((s) => s.mentorId === mentorId && s.menteeId === menteeId && s.slot === slot && ACTIVE.includes(s.status))) {
      throw new Error("Kamu sudah mengajukan jadwal ini.");
    }
    // Harga, komisi, dan bersih DIKUNCI saat pemesanan. Perubahan persentase
    // atau harga di kemudian hari tidak mengubah riwayat.
    created = {
      id: uid("s"),
      mentorId,
      mentorUserId: m.userId,
      mentorName: m.name,
      menteeId,
      menteeName,
      slot,
      goal,
      price: m.price,
      feePercent: MENTOR_FEE_PERCENT,
      fee: mentorFee(m.price),
      net: mentorNet(m.price),
      status: "requested",
      meetingLink: "",
      reviewed: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    return { ...db, sessions: [created, ...db.sessions] };
  });
  return created;
}

const FLOW = {
  requested: ["confirmed", "declined", "cancelled"],
  confirmed: ["completed", "cancelled"],
};

export function setSessionStatus(id, status, extra = {}) {
  return update((db) => {
    const s = db.sessions.find((x) => x.id === id);
    if (!s) throw new Error("Sesi tidak ditemukan.");
    if (!(FLOW[s.status] || []).includes(status)) throw new Error("Status sesi tidak bisa diubah.");
    return {
      ...db,
      sessions: db.sessions.map((x) =>
        x.id === id
          ? { ...x, ...extra, status, updatedAt: nowIso(), completedAt: status === "completed" ? nowIso() : x.completedAt }
          : x
      ),
    };
  });
}

export function setMeetingLink(id, meetingLink) {
  return update((db) => ({
    ...db,
    sessions: db.sessions.map((x) => (x.id === id ? { ...x, meetingLink: meetingLink.trim(), updatedAt: nowIso() } : x)),
  }));
}

export function addReview({ sessionId, rating, comment }) {
  return update((db) => {
    const s = db.sessions.find((x) => x.id === sessionId);
    if (!s || s.status !== "completed") throw new Error("Ulasan hanya bisa diberikan setelah sesi selesai.");
    if (s.reviewed) throw new Error("Sesi ini sudah diulas.");
    const review = {
      id: uid("r"),
      sessionId,
      mentorId: s.mentorId,
      menteeId: s.menteeId,
      menteeName: s.menteeName,
      rating,
      comment: comment.trim(),
      createdAt: nowIso(),
    };
    return {
      ...db,
      reviews: [review, ...db.reviews],
      sessions: db.sessions.map((x) => (x.id === sessionId ? { ...x, reviewed: true } : x)),
    };
  });
}

// DEMO: membuat permintaan masuk dari peserta fiktif, supaya dashboard bisa dicoba.
const DEMO_NAMES = ["Andi Pratama", "Sari Wulandari", "Budi Santoso", "Citra Lestari", "Eko Saputra"];
const DEMO_GOALS = [
  "Mohon review CV dan portofolio saya sebelum melamar.",
  "Persiapan wawancara untuk posisi yang sedang saya lamar.",
  "Bingung memilih arah karier dalam 2 tahun ke depan.",
  "Ingin belajar negosiasi gaji untuk tawaran kerja pertama.",
];
export function simulateIncomingRequest(mentorId) {
  return update((db) => {
    const m = getMentor(db, mentorId);
    if (!m) throw new Error("Mentor tidak ditemukan.");
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const s = {
      id: uid("s"),
      mentorId,
      mentorUserId: m.userId,
      mentorName: m.name,
      menteeId: uid("demo"),
      menteeName: pick(DEMO_NAMES),
      slot: pick(m.slots),
      goal: pick(DEMO_GOALS),
      price: m.price,
      feePercent: MENTOR_FEE_PERCENT,
      fee: mentorFee(m.price),
      net: mentorNet(m.price),
      status: "requested",
      meetingLink: "",
      reviewed: false,
      isDemo: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    return { ...db, sessions: [s, ...db.sessions] };
  });
}

// ---- turunan ---------------------------------------------------------------
export const sessionsAsMentee = (db, userId) => db.sessions.filter((s) => s.menteeId === userId);
export const sessionsOfMentor = (db, mentorId) => db.sessions.filter((s) => s.mentorId === mentorId);

export function mentorEarnings(db, mentorId) {
  const all = sessionsOfMentor(db, mentorId);
  const sum = (arr, k) => arr.reduce((a, s) => a + s[k], 0);
  const completed = all.filter((s) => s.status === "completed");
  const confirmed = all.filter((s) => s.status === "confirmed");
  const now = new Date();
  const thisMonth = completed.filter((s) => {
    const d = new Date(s.completedAt || s.updatedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  return {
    completed,
    totalGross: sum(completed, "price"),
    totalFee: sum(completed, "fee"),
    totalNet: sum(completed, "net"),
    monthNet: sum(thisMonth, "net"),
    pendingNet: sum(confirmed, "net"),
  };
}
