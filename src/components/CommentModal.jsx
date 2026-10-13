// src/components/CommentModal.jsx
import { useEffect, useState } from "react";
import { X, Heart, MessageCircle, ArrowLeft } from "lucide-react";
import { api } from "../api/client";
import { usePostInteractions } from "../context/PostInteractionContext";
import { useAuth } from "../context/AuthContext";
import CommentThread from "./CommentThread";
import PostMedia from "./PostMedia";
import { CloseAllContext } from "./ReplyModal";

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

function initialsOf(name) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

// Popup komentar bergaya Threads: satu kolom, post di atas, kotak balas tepat
// di bawahnya, lalu daftar komentar mengalir di bawahnya — semuanya dalam
// satu area yang sama-sama bisa di-scroll.
export default function CommentModal({ postId, onClose, onCommentAdded }) {
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [likes, setLikes] = useState(0);
  const inter = usePostInteractions(); // status suka tersimpan di server, sama dengan Feed
  const [localLiked, setLocalLiked] = useState(false); // hanya bila tanpa provider
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([api.getPost(postId), api.listComments(postId)])
      .then(([p, c]) => {
        if (cancelled) return;
        setPost(p);
        setLikes(p.likes);
        setComments(c || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  // Tutup modal dengan tombol Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const liked = inter ? inter.liked.has(postId) : localLiked;

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      if (inter) {
        const n = await inter.toggleLike(postId); // suka <-> batal suka
        if (typeof n === "number") setLikes(n);
      } else if (!localLiked) {
        await api.likePost(postId);
        setLikes((n) => n + 1);
        setLocalLiked(true);
      }
    } catch (err) {
      /* gagal: keadaan dikembalikan */
    } finally {
      setLiking(false);
    }
  };

  // Komentar baru bertambah lewat CommentThread; kita cuma perlu ikut
  // menaikkan comment_count post ini di sini dan di feed (via onCommentAdded).
  const handleCountChange = (delta) => {
    setPost((p) => (p ? { ...p, comment_count: p.comment_count + delta } : p));
    onCommentAdded?.(postId);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl h-[min(880px,94vh)] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header ala "Thread" di Threads */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 -ml-1.5"
            title="Tutup"
          >
            <ArrowLeft size={19} strokeWidth={2} />
          </button>
          <span className="font-bold text-[15px]">Utas</span>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 -mr-1.5"
            title="Tutup"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Memuat post...
          </div>
        ) : error || !post ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm px-6 text-center">
            {error || "Post tidak ditemukan."}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* post */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-soft text-brand font-bold text-sm shrink-0">
                {post.is_anonymous ? "?" : initialsOf(post.author_name)}
              </div>
              <div>
                <div className="font-semibold text-sm">
                  {post.is_anonymous ? "Anonim" : post.author_name}
                </div>
                <div className="text-gray-500 text-xs">{timeAgo(post.created_at)}</div>
              </div>
            </div>
            <h2 className="text-lg font-bold mb-2">{post.title}</h2>
            <p className="text-gray-900 text-[15px] whitespace-pre-wrap mb-3 leading-relaxed">
              {post.body}
            </p>
            <PostMedia media={post.media} />
            <div className="flex items-center gap-5 pb-4 border-b border-gray-100">
              <button
                className={`inline-flex items-center gap-1.5 text-sm bg-transparent border-none p-0 cursor-pointer disabled:cursor-default ${
                  liked ? "text-brand" : "text-gray-500 hover:text-brand"
                }`}
                onClick={handleLike}
                disabled={!user || liking}
                title={user ? "Sukai post ini" : "Masuk untuk menyukai post"}
              >
                <Heart size={18} strokeWidth={2} fill={liked ? "currentColor" : "none"} />
                <span>{likes}</span>
              </button>
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                <MessageCircle size={17} strokeWidth={2} />
                {post.comment_count}
              </span>
            </div>

            {/* kotak balas + daftar komentar, satu kolom mengalir ke bawah */}
            <div className="pt-4">
              <CloseAllContext.Provider value={onClose}>
                <CommentThread
                  key={postId}
                  postId={postId}
                  initialComments={comments}
                  user={user}
                  onCountChange={handleCountChange}
                  composerPosition="top"
                  composerPlaceholder={
                    post.is_anonymous ? "Balas utas ini..." : `Balas ${post.author_name}...`
                  }
                />
              </CloseAllContext.Provider>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}