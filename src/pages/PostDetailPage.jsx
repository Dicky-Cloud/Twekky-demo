// src/pages/PostDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { api } from "../api/client";
import { usePostInteractions } from "../context/PostInteractionContext";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";
import CommentThread from "../components/CommentThread";
import PostMedia from "../components/PostMedia";

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
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [likes, setLikes] = useState(0);
  const inter = usePostInteractions(); // status suka tersimpan di server, sama dengan Feed
  const [localLiked, setLocalLiked] = useState(false); // hanya bila tanpa provider
  const [liking, setLiking] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [p, c] = await Promise.all([api.getPost(id), api.listComments(id)]);
      setPost(p);
      setLikes(p.likes);
      setComments(c || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const liked = inter ? inter.liked.has(id) : localLiked;

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      if (inter) {
        const n = await inter.toggleLike(id); // suka <-> batal suka
        if (typeof n === "number") setLikes(n);
      } else if (!localLiked) {
        await api.likePost(id);
        setLikes((n) => n + 1);
        setLocalLiked(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLiking(false);
    }
  };

  const handleCountChange = (delta) => {
    setPost((p) => (p ? { ...p, comment_count: p.comment_count + delta } : p));
  };

  return (
    <>
      <Topbar title="Detail Utas" />
      <div className="p-6 lg:p-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={16} strokeWidth={2} />
          Kembali
        </button>

        {error && (
          <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger max-w-2xl">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-sm">Memuat post...</p>
        ) : !post ? (
          <div className="rounded-lg border border-dashed border-gray-200 text-gray-500 text-sm text-center py-6 max-w-2xl">
            Post tidak ditemukan.
          </div>
        ) : (
          <div className="flex gap-6 items-start max-w-5xl">
            {/* kiri: isi post */}
            <article className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl p-6">
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
              <h1 className="text-xl font-bold mb-2">{post.title}</h1>
              <p className="text-gray-900 text-[15px] whitespace-pre-wrap mb-4">{post.body}</p>
              <PostMedia media={post.media} />
              <div className="flex items-center gap-5 border-t border-gray-100 pt-3">
                <button
                  className={`inline-flex items-center gap-1.5 text-sm bg-transparent border-none p-0 cursor-pointer disabled:cursor-default ${
                    liked ? "text-brand" : "text-gray-500 hover:text-brand"
                  }`}
                  onClick={handleLike}
                  disabled={!user || liking}
                  title={user ? "Sukai post ini" : "Masuk untuk menyukai post"}
                >
                  <Heart size={17} strokeWidth={2} fill={liked ? "currentColor" : "none"} />
                  {likes}
                </button>
                <span className="text-sm text-gray-500">{post.comment_count} komentar</span>
              </div>
            </article>

            {/* kanan: panel komentar */}
            <aside className="w-96 shrink-0 sticky top-6 h-[calc(100vh-96px)] flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3.5 border-b border-gray-100 font-bold text-sm shrink-0">
                Komentar ({comments.length})
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <CommentThread
                  key={id}
                  postId={id}
                  initialComments={comments}
                  user={user}
                  onCountChange={handleCountChange}
                />
              </div>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}