// Mini backend demo: menjalankan "API" langsung di browser.
// request() di api/client.js memanggil handleRequest(); tidak ada jaringan sama sekali.
import { getDb, save } from "./db";
import { routes, downloads, HttpError } from "./core";
import "./social";
import "./work";

const userFromToken = (db, token) => {
  if (!token || !token.startsWith("demo.")) return null;
  return db.users.find((u) => u.id === token.slice(5)) || null;
};

// FormData -> objek biasa; berkas disimpan di __files agar handler bisa membacanya.
function normalizeBody(body) {
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    const out = { __files: {} };
    for (const [k, v] of body.entries()) {
      if (typeof File !== "undefined" && v instanceof File) (out.__files[k] ||= []).push(v);
      else if (k.endsWith("[]")) (out[k.slice(0, -2)] ||= []).push(v);
      else out[k] = v;
    }
    return out;
  }
  return body && typeof body === "object" ? body : {};
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function context(db, path, method, body) {
  const url = new URL(path, "http://demo.local");
  let token = null;
  try {
    token = localStorage.getItem("twekky_token");
  } catch {
    /* abaikan */
  }
  return { db, method, path: url.pathname, q: url.searchParams, body: normalizeBody(body), user: userFromToken(db, token) };
}

export async function handleRequest(path, { method = "GET", body } = {}) {
  await delay(40 + Math.random() * 60); // sedikit jeda agar terasa seperti jaringan
  const db = getDb();
  const c = context(db, path, method, body);
  const fn = routes.get(`${method} ${c.path}`);
  try {
    let result;
    if (fn) result = await fn(c);
    else if (method === "GET") result = []; // endpoint yang belum ditiru: daftar kosong
    else result = { ok: true };
    save();
    return result === undefined ? null : JSON.parse(JSON.stringify(result));
  } catch (err) {
    if (err instanceof HttpError) throw err;
    console.error("[demo-api]", method, path, err);
    throw new HttpError(500, "Terjadi kesalahan pada mode demo");
  }
}

// Unduhan berkas (CV, surat pengantar, CSV) -> { blob, filename }
export async function handleDownload(path) {
  const db = getDb();
  const c = context(db, path, "GET", null);
  const fn = downloads.get(c.path);
  if (!fn) throw new HttpError(404, "Berkas tidak tersedia di mode demo");
  return fn(c);
}
