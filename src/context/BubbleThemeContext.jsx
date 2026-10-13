import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";
import { customThemeId, findBubbleTheme } from "../constants/bubbleThemes";

// Menyimpan tema bubble per pengguna supaya pilihan yang sama tampil di mana
// pun: pesan di halaman Pesan dan isi post di Feed.
//
//   useBubbleTheme(userId)  -> id tema yang perlu digambar, atau "" (bubble bawaan)
//   useMyBubbleTheme()      -> { themeId, savedId, setTheme, canUse }
//
// Tema pengguna lain diambil lewat /api/users/lookup (sudah ada) dan dikumpulkan
// per 40 ms, jadi puluhan post di Feed hanya memicu satu-dua permintaan.
// Server hanya mengirim tema Pro selama pemiliknya masih Pro.

const BubbleThemeContext = createContext(null);
const LOOKUP_MAX = 50; // sama dengan userLookupMax di user_handler.go

export function BubbleThemeProvider({ children }) {
  const { user, refreshUser } = useAuth();
  const [themes, setThemes] = useState({}); // userId -> id tema mentah ("" = bawaan)
  const [avatars, setAvatars] = useState({}); // userId -> nama berkas foto profil ("" = belum ada)
  const asked = useRef(new Set());
  const pending = useRef(new Set());
  const timer = useRef(null);

  // tema akun sendiri langsung dari data login; tema Pro yang sudah tidak berhak
  // (langganan habis) tidak ikut ditampilkan
  const myId = user?.id;
  const myRaw = user?.bubble_theme || "";
  const myIsPro = Boolean(user?.is_pro);
  useEffect(() => {
    if (!myId) return;
    const t = findBubbleTheme(myRaw);
    const allowed = t && (!t.pro || myIsPro) ? myRaw : "";
    setThemes((prev) => (prev[myId] === allowed ? prev : { ...prev, [myId]: allowed }));
  }, [myId, myRaw, myIsPro]);

  // foto profil akun sendiri langsung dari data login (ikut berubah saat diganti)
  const myAvatar = user?.avatar || "";
  useEffect(() => {
    if (!myId) return;
    setAvatars((prev) => (prev[myId] === myAvatar ? prev : { ...prev, [myId]: myAvatar }));
  }, [myId, myAvatar]);

  const flush = useCallback(async () => {
    timer.current = null;
    const ids = [...pending.current];
    pending.current.clear();
    for (let i = 0; i < ids.length; i += LOOKUP_MAX) {
      const chunk = ids.slice(i, i + LOOKUP_MAX);
      try {
        const list = await api.lookupUsers(chunk);
        setThemes((prev) => {
          const next = { ...prev };
          for (const id of chunk) if (!(id in next)) next[id] = "";
          for (const u of list || []) next[u.id] = u.bubble_theme || "";
          return next;
        });
        setAvatars((prev) => {
          const next = { ...prev };
          for (const id of chunk) if (!(id in next)) next[id] = "";
          for (const u of list || []) next[u.id] = u.avatar || "";
          return next;
        });
      } catch {
        // tidak fatal: tampilan kembali ke bubble bawaan
      }
    }
  }, []);

  const ensure = useCallback(
    (id) => {
      if (!id || !myId || id === myId || asked.current.has(id)) return;
      asked.current.add(id);
      pending.current.add(id);
      if (!timer.current) timer.current = setTimeout(flush, 40);
    },
    [flush, myId]
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  const setTheme = useCallback(
    async (themeId) => {
      const me = await api.setBubbleTheme(themeId); // server menolak tema Pro untuk non-Pro
      setThemes((prev) => ({ ...prev, [me.id]: me.bubble_theme || "" }));
      refreshUser().catch(() => {});
      return me;
    },
    [refreshUser]
  );

  const value = useMemo(() => ({ themes, avatars, ensure, setTheme }), [themes, avatars, ensure, setTheme]);
  return <BubbleThemeContext.Provider value={value}>{children}</BubbleThemeContext.Provider>;
}

// Id tema yang perlu digambar untuk seorang pengguna, "" bila bubble bawaan.
// Berikan null/undefined untuk pengguna yang tidak boleh bergaya (post anonim
// atau atas nama perusahaan).
export function useBubbleTheme(userId) {
  const ctx = useContext(BubbleThemeContext);
  const ensure = ctx?.ensure;
  useEffect(() => {
    if (ensure && userId) ensure(userId);
  }, [ensure, userId]);
  if (!ctx || !userId) return "";
  return customThemeId(ctx.themes[userId]);
}

// Nama berkas foto profil seorang pengguna ("" bila belum ada atau belum dimuat).
// Pakai profileImageUrl(nama) untuk membentuk URL gambarnya. Data diambil lewat
// lookup yang sama dengan tema bubble, jadi tidak menambah permintaan baru.
export function useUserAvatar(userId) {
  const ctx = useContext(BubbleThemeContext);
  const ensure = ctx?.ensure;
  useEffect(() => {
    if (ensure && userId) ensure(userId);
  }, [ensure, userId]);
  if (!ctx || !userId) return "";
  return ctx.avatars[userId] || "";
}

export function useMyBubbleTheme() {
  const ctx = useContext(BubbleThemeContext);
  const { user } = useAuth();
  const isPro = Boolean(user?.is_pro);
  const savedId = ctx && user ? ctx.themes[user.id] || "" : "";
  return {
    themeId: customThemeId(savedId),
    savedId,
    setTheme: ctx?.setTheme,
    // tema Pro hanya boleh dipakai akun Pro
    canUse: (theme) => Boolean(theme) && (!theme.pro || isPro),
  };
}
