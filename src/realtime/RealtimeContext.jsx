import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
// Di file /src/api/client.js (baris pertama)
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
import { useAuth } from "../context/AuthContext";
import { USE_MOCK } from "../api/client";
import { onEvent } from "../mock/bus";

// Koneksi real-time ke server lewat Server-Sent Events (GET /api/events).
// Dipakai fetch + ReadableStream (bukan EventSource) supaya header
// Authorization bisa dikirim tanpa menaruh token di URL.
//
// Event yang dikirim server: post_created, post_updated, comment_added,
// comment_updated, message, notification. Ditambah event lokal "reconnected"
// setiap koneksi tersambung ulang, supaya halaman memuat ulang data yang
// mungkin terlewat selama terputus.

const RealtimeContext = createContext(null);

const STALE_MS = 70_000; // server mengirim detak tiap 25 dtk; lewat ini dianggap putus

function sleep(ms, signal) {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true }
    );
  });
}

function parseBlock(block) {
  let type = "message";
  const data = [];
  for (const line of block.split(/\r?\n/)) {
    if (!line || line.startsWith(":")) continue; // komentar / detak
    const i = line.indexOf(":");
    const field = i === -1 ? line : line.slice(0, i);
    const value = i === -1 ? "" : line.slice(i + 1).replace(/^ /, "");
    if (field === "event") type = value;
    else if (field === "data") data.push(value);
  }
  if (data.length === 0) return null;
  try {
    return { type, data: JSON.parse(data.join("\n")) };
  } catch {
    return null;
  }
}

async function readStream(body, onEvent, onActivity) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    onActivity();
    buf += decoder.decode(value, { stream: true });
    for (;;) {
      const m = /\r?\n\r?\n/.exec(buf);
      if (!m) break;
      const block = buf.slice(0, m.index);
      buf = buf.slice(m.index + m[0].length);
      const ev = parseBlock(block);
      if (ev) onEvent(ev.type, ev.data);
    }
  }
}

export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const listeners = useRef(new Map()); // type -> Set<fn>

  const emit = useCallback((type, data) => {
    listeners.current.get(type)?.forEach((fn) => {
      try {
        fn(data);
      } catch (err) {
        console.error("realtime listener error:", err);
      }
    });
  }, []);

  const subscribe = useCallback((type, fn) => {
    let set = listeners.current.get(type);
    if (!set) {
      set = new Set();
      listeners.current.set(type, set);
    }
    set.add(fn);
    return () => set.delete(fn);
  }, []);

  // Sambung ulang saat login/logout agar server tahu siapa pemiliknya
  // (event pribadi seperti pesan dan notifikasi hanya untuk pemiliknya).
  // Mode demo: tidak ada server SSE; event datang dari bus lokal (antar tab lewat BroadcastChannel).
  useEffect(() => {
    if (!USE_MOCK) return undefined;
    return onEvent((type, data) => emit(type, data));
  }, [emit]);

  useEffect(() => {
    if (USE_MOCK) return undefined;
    const root = new AbortController();
    let stopped = false;
    let connectedBefore = false;
    let attempt = 0;

    const run = async () => {
      while (!stopped) {
        const conn = new AbortController();
        const abortConn = () => conn.abort();
        root.signal.addEventListener("abort", abortConn, { once: true });
        let lastActivity = Date.now();
        const watchdog = setInterval(() => {
          if (Date.now() - lastActivity > STALE_MS) conn.abort();
        }, 15_000);

        try {
          const headers = { Accept: "text/event-stream" };
          const token = getToken();
          if (token) headers.Authorization = `Bearer ${token}`;
          const res = await fetch(`${API_URL}/api/events`, { headers, signal: conn.signal });
          if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
          attempt = 0;
          lastActivity = Date.now();
          if (connectedBefore) emit("reconnected", {});
          connectedBefore = true;
          await readStream(res.body, emit, () => {
            lastActivity = Date.now();
          });
        } catch {
          // putus atau gagal tersambung; coba lagi di bawah
        } finally {
          clearInterval(watchdog);
          root.signal.removeEventListener("abort", abortConn);
        }

        if (stopped) return;
        const delay = Math.min(30_000, 1_000 * 2 ** attempt) + Math.random() * 500;
        attempt += 1;
        await sleep(delay, root.signal);
      }
    };
    run();

    return () => {
      stopped = true;
      root.abort();
    };
  }, [userId, emit]);

  const value = useMemo(() => ({ subscribe }), [subscribe]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

// useRealtime("post_created", (data) => ...) — handler selalu versi terbaru,
// jadi tidak perlu dibungkus useCallback.
export function useRealtime(type, handler) {
  const ctx = useContext(RealtimeContext);
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  const subscribe = ctx?.subscribe;
  useEffect(() => {
    if (!subscribe) return undefined;
    return subscribe(type, (data) => ref.current?.(data));
  }, [subscribe, type]);
}