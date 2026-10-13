// Event bus untuk mode demo. Menggantikan koneksi SSE (/api/events) milik server.
// Memakai BroadcastChannel supaya dua tab di browser yang sama saling menerima
// event (post baru, notifikasi, pesan) seperti realtime sungguhan.
const listeners = new Set();
let channel = null;
try {
  channel = new BroadcastChannel("twekky-demo-events");
  channel.onmessage = (e) => listeners.forEach((fn) => fn(e.data.type, e.data.data, true));
} catch {
  /* BroadcastChannel tidak tersedia: event hanya berlaku di tab ini */
}

export function emit(type, data) {
  listeners.forEach((fn) => fn(type, data, false));
  try {
    channel?.postMessage({ type, data });
  } catch {
    /* abaikan */
  }
}

export function onEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
