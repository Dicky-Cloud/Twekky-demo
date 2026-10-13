// Fondasi mini backend demo: error HTTP, tabel rute, dan fungsi bantu bersama.
import { nowIso, uid } from "./db";
import { emit } from "./bus";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const fail = (status, message) => {
  throw new HttpError(status, message);
};

export const routes = new Map();
export const on = (method, path, fn) => routes.set(`${method} ${path}`, fn);
export const downloads = new Map();
export const onDownload = (path, fn) => downloads.set(path, fn);

export const need = (c) => c.user || fail(401, "Silakan masuk terlebih dahulu");
export const needBiz = (c) => {
  need(c);
  if (c.user.account_type !== "business") fail(403, "Fitur ini hanya untuk akun Bisnis");
  return c.user;
};

export const str = (v) => (typeof v === "string" ? v.trim() : "");
export const byNewest = (a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0);

export const pubUser = (u) => {
  const { pw, ...rest } = u; // eslint-disable-line no-unused-vars
  return rest;
};
export const summary = (u) => ({
  id: u.id, name: u.name, bio: (u.bio || "").slice(0, 160), avatar: u.avatar || "", banner: u.banner || "",
  account_type: u.account_type, company_name: u.company_name || "",
  verification_status: u.verification_status, is_pro: !!u.is_pro, bubble_theme: u.bubble_theme || "",
});
export const userById = (db, id) => db.users.find((u) => u.id === id);

// ---- interaksi (like, simpan, follow, ...) ----
export const hasInter = (db, k, u, t) => db.inter.some((i) => i.k === k && i.u === u && i.t === t);
export const addInter = (db, k, u, t) => {
  if (!hasInter(db, k, u, t)) db.inter.push({ k, u, t });
};
export const delInter = (db, k, u, t) => {
  db.inter = db.inter.filter((i) => !(i.k === k && i.u === u && i.t === t));
};
export const idsOf = (db, k, u) => db.inter.filter((i) => i.k === k && i.u === u).map((i) => i.t);
export const usersWith = (db, k, t) => db.inter.filter((i) => i.k === k && i.t === t).map((i) => i.u);

// ---- blokir, komunitas, privasi post ----
export const blockedEither = (db, a, b) =>
  db.blocks.some((x) => (x.blocker_id === a && x.blocked_id === b) || (x.blocker_id === b && x.blocked_id === a));
export const isMember = (db, cid, uidv) => db.members.some((m) => m.community_id === cid && m.user_id === uidv);
export const commOf = (db, id) => db.communities.find((c) => c.id === id);
export const commOut = (db, c) => ({ ...c, member_count: db.members.filter((m) => m.community_id === c.id).length });
export const roleIn = (db, c, userId) => {
  if (!userId) return "";
  if (c.owner_id === userId) return "owner";
  return db.members.find((m) => m.community_id === c.id && m.user_id === userId)?.role || "";
};
export const isCommAdmin = (db, c, userId) => ["owner", "admin"].includes(roleIn(db, c, userId));

export function canSee(db, p, viewerId) {
  if (viewerId && p.author_id === viewerId) return true;
  if (p.community_id) {
    const c = commOf(db, p.community_id);
    if (c && c.join_type === "approval") {
      if (!viewerId) return false;
      if (c.owner_id !== viewerId && !isMember(db, c.id, viewerId)) return false;
    }
  }
  if (viewerId && !p.is_anonymous && blockedEither(db, viewerId, p.author_id)) return false;
  return true;
}
export function viewPost(p, viewerId) {
  const out = { ...p };
  if (out.is_anonymous && (!viewerId || out.author_id !== viewerId)) {
    out.author_id = "";
    out.author_name = "Anonim";
  }
  return out;
}
export const visiblePosts = (db, posts, viewerId) =>
  posts.filter((p) => canSee(db, p, viewerId)).map((p) => viewPost(p, viewerId));

// ---- notifikasi ----
export function notify(db, userId, type, text, link = "") {
  if (!userId) return;
  db.notifications.push({ id: uid("n_"), user_id: userId, type, text, link, read: false, created_at: nowIso() });
  emit("notification", { user_id: userId });
}

// ---- berkas ----
export const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

// Gambar diperkecil supaya muat di localStorage (batas ~5 MB untuk seluruh data demo).
export async function imageToDataUrl(file, maxDim = 1024, quality = 0.8) {
  const src = await readAsDataUrl(file);
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return src;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, maxDim / Math.max(img.width, img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(img.width * s));
      cv.height = Math.max(1, Math.round(img.height * s));
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      resolve(cv.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

export const fileOf = (c, key) => c.body?.__files?.[key]?.[0] || null;

export async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

// PDF sederhana (teks saja) untuk surat pengantar & dokumen contoh.
export function makePdf(title, lines) {
  const esc = (s) => String(s).replace(/[^\x20-\x7E]/g, "?").replace(/([\\()])/g, "\\$1");
  const wrap = [];
  for (const raw of [title, "", ...lines]) {
    const text = String(raw);
    if (!text) wrap.push("");
    for (let i = 0; i < text.length; i += 90) wrap.push(text.slice(i, i + 90));
  }
  const content = ["BT", "/F1 11 Tf", "14 TL", "50 780 Td", ...wrap.slice(0, 48).map((l) => `(${esc(l)}) Tj T*`), "ET"].join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => {
    pdf += `${String(o).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}
