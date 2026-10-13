import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { usePostInteractions } from "../context/PostInteractionContext";
import CommentItem from "./CommentItem";
import CommentComposer from "./CommentComposer";
import { SortContext, SortTabs, sortComments } from "./CommentSort";

// Daftar komentar + kotak tulis, dipakai baik di popup komentar (CommentModal)
// maupun di halaman detail post (PostDetailPage). Diberi `key={postId}` oleh
// pemanggilnya supaya state-nya reset bersih setiap ganti post.
//
// Semua balasan ditampilkan LANGSUNG menjorok di bawah komentar induknya, di
// layar yang sama — tidak ada navigasi "masuk ke tampilan lain". Klik "Balas"
// pada komentar mana pun (termasuk pada sebuah balasan) membuka kotak tulis
// tepat di situ, dan hasilnya langsung terlihat menjorok di bawahnya begitu
// terkirim. Lihat CommentItem.jsx untuk render rekursifnya.
export default function CommentThread({
  postId,
  initialComments,
  user,
  onCountChange,
  composerPosition = "bottom",
  composerPlaceholder = "Tulis komentar...",
}) {
  const inter = usePostInteractions(); // status suka komentar tersimpan di server
  const [comments, setComments] = useState(initialComments || []);
  const [error, setError] = useState("");
  // "top" (paling disukai) atau "recent" (terbaru); berlaku di semua tingkat.
  const [sort, setSort] = useState("top");
  const sortCtx = useMemo(() => ({ sort, setSort }), [sort]);

  // dikelompokkan per parent_id: childrenOf[""] = komentar tingkat atas,
  // childrenOf[id] = balasan langsung untuk komentar ber-ID itu.
  const childrenOf = useMemo(() => {
    const map = {};
    for (const c of comments) {
      const key = c.parent_id || "";
      (map[key] ||= []).push(c);
    }
    const replyCount = (id) => map[id]?.length || 0;
    for (const key of Object.keys(map)) {
      map[key] = sortComments(map[key], sort, replyCount);
    }
    return map;
  }, [comments, sort]);

  const submitComment = async (parentId, { body, sticker }) => {
    const created = await api.createComment(postId, { body, sticker, parentId: parentId || "" });
    setComments((prev) => [...prev, created]);
    // komentar baru punya 0 suka, jadi pindah ke "recent" supaya langsung kelihatan
    setSort("recent");
    onCountChange?.(1);
    return created;
  };

  const handleLike = async (id) => {
    setError("");
    try {
      const updated = inter ? await inter.toggleCommentLike(id) : await api.likeComment(id);
      setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus komentar ini?")) return;
    setError("");
    try {
      const updated = await api.deleteComment(id);
      setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      setError(err.message);
    }
  };

  const rootComposer = user ? (
    <CommentComposer onSubmit={(vals) => submitComment(null, vals)} placeholder={composerPlaceholder} />
  ) : (
    <div className="text-sm text-gray-500 text-center py-1">
      <Link to="/login" className="text-brand font-semibold underline">
        Masuk
      </Link>{" "}
      untuk berkomentar
    </div>
  );

  const rootList = childrenOf[""] || [];

  return (
    <SortContext.Provider value={sortCtx}>
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg border border-danger bg-danger-soft px-3.5 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      {composerPosition === "top" && rootComposer}

      {rootList.length > 1 && <SortTabs />}

      {rootList.length === 0 ? (
        <div className="text-gray-400 text-sm text-center py-8">
          Belum ada komentar. Jadilah yang pertama menanggapi.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
        {rootList.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            childrenOf={childrenOf}
            currentUserId={user?.id}
            user={user}
            onLike={handleLike}
            onDelete={handleDelete}
            onReply={submitComment}
          />
        ))}
        </div>
      )}

      {composerPosition === "bottom" && rootComposer}
    </div>
    </SortContext.Provider>
  );
}