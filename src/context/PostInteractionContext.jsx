// Suka, simpan, dan bagikan post. Datanya disimpan di server per akun, jadi
// tetap ada setelah refresh dan tampil di tab Disimpan / Dibagikan profil.
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

const Ctx = createContext(null);

// null bila dipakai di luar provider (PostCard lalu memakai mode lama).
export const usePostInteractions = () => useContext(Ctx);

const flip = (setter, id, on) =>
  setter((prev) => {
    const next = new Set(prev);
    if (on) next.add(id);
    else next.delete(id);
    return next;
  });

export function PostInteractionProvider({ children }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(() => new Set());
  const [saved, setSaved] = useState(() => new Set());
  const [shared, setShared] = useState(() => new Set());
  const [reposted, setReposted] = useState(() => new Set());
  // jumlah suka terbaru per post (dari server); dipakai semua tampilan agar angkanya sama
  const [counts, setCounts] = useState({});
  const [commentLiked, setCommentLiked] = useState(() => new Set()); // komentar & balasan yang saya sukai

  useEffect(() => {
    if (!user?.id) {
      setLiked(new Set());
      setSaved(new Set());
      setShared(new Set());
      setReposted(new Set());
      setCommentLiked(new Set());
      return undefined;
    }
    let alive = true;
    api
      .myPostState()
      .then((d) => {
        if (!alive) return;
        setLiked(new Set(d.liked || []));
        setSaved(new Set(d.saved || []));
        setShared(new Set(d.shared || []));
        setReposted(new Set(d.reposted || []));
        setCommentLiked(new Set(d.comment_liked || []));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user?.id]);

  // Semua aksi memperbarui tampilan dulu (optimistis), lalu dibatalkan bila server menolak.
  const toggleLike = useCallback(
    async (id) => {
      const on = !liked.has(id);
      flip(setLiked, id, on);
      try {
        const res = on ? await api.likePost(id) : await api.unlikePost(id);
        if (typeof res.likes === "number") setCounts((c) => ({ ...c, [id]: res.likes }));
        return res.likes; // jumlah suka terbaru dari server
      } catch (e) {
        flip(setLiked, id, !on);
        throw e;
      }
    },
    [liked]
  );

  const toggleSave = useCallback(
    async (id) => {
      const on = !saved.has(id);
      flip(setSaved, id, on);
      try {
        await (on ? api.savePost(id) : api.unsavePost(id));
        return on;
      } catch (e) {
        flip(setSaved, id, !on);
        throw e;
      }
    },
    [saved]
  );

  // Suka komentar/balasan <-> batal suka. Mengembalikan komentar terbaru dari server.
  const toggleCommentLike = useCallback(
    async (id) => {
      const on = !commentLiked.has(id);
      flip(setCommentLiked, id, on);
      try {
        return await (on ? api.likeComment(id) : api.unlikeComment(id));
      } catch (e) {
        flip(setCommentLiked, id, !on);
        throw e;
      }
    },
    [commentLiked]
  );

  const share = useCallback(async (id) => {
    flip(setShared, id, true);
    try {
      await api.sharePost(id);
    } catch (e) {
      flip(setShared, id, false);
      throw e;
    }
  }, []);

  const unshare = useCallback(async (id) => {
    flip(setShared, id, false);
    try {
      await api.unsharePost(id);
    } catch (e) {
      flip(setShared, id, true);
      throw e;
    }
  }, []);

  // Repost <-> batal repost. Optimistis, dibatalkan bila server menolak.
  const toggleRepost = useCallback(
    async (id) => {
      const on = !reposted.has(id);
      flip(setReposted, id, on);
      try {
        // server mengembalikan { reposted, reposts } (jumlah terbaru)
        return await (on ? api.repostPost(id) : api.unrepostPost(id));
      } catch (e) {
        flip(setReposted, id, !on);
        throw e;
      }
    },
    [reposted]
  );

  // Dipakai setelah post dihapus: bersihkan penanda lokalnya.
  const forget = useCallback((id) => {
    flip(setLiked, id, false);
    flip(setSaved, id, false);
    flip(setShared, id, false);
    flip(setReposted, id, false);
  }, []);

  return (
    <Ctx.Provider value={{ liked, saved, shared, reposted, counts, commentLiked, toggleCommentLike, toggleLike, toggleSave, toggleRepost, share, unshare, forget }}>
      {children}
    </Ctx.Provider>
  );
}