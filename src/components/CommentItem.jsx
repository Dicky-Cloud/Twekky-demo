import { useState } from "react";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import MentionHashtagText from "./MentionHashtagText";
import StickerBubble from "./StickerBubble";
import ReplyModal from "./ReplyModal";
import { usePostInteractions } from "../context/PostInteractionContext";

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

// Satu komentar. Balasannya TIDAK ditampilkan menjorok di bawahnya; yang
// terlihat hanya jumlah balasan langsung (childrenOf[comment.id]) di samping
// tombol "Balas". Nesting bisa sedalam apa pun karena tiap lapisan dibuka
// lewat ReplyModal.
// Klik "Balas" membuka ReplyModal: tampilan "Utas" seukuran modal utama dengan
// komentar ini di atas, kotak tulis, lalu daftar balasannya.
export default function CommentItem({
  comment,
  childrenOf,
  currentUserId,
  user,
  onLike,
  onDelete,
  onReply,
}) {
  const inter = usePostInteractions();
  const liked = inter ? inter.commentLiked.has(comment.id) : false;
  const [liking, setLiking] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const children = childrenOf[comment.id] || [];

  if (comment.deleted) {
    return (
      <div>
        <div className="flex gap-2.5 py-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-300 shrink-0 text-xs">
            –
          </div>
          <p className="m-0 text-sm text-gray-400 italic py-1.5">Komentar telah dihapus.</p>
        </div>

        {children.length > 0 && (
          <button
            type="button"
            onClick={() => setReplyOpen(true)}
            className="ml-[42px] mt-0.5 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand bg-transparent border-none p-0 cursor-pointer"
          >
            <MessageCircle size={13} strokeWidth={2} />
            {children.length} balasan
          </button>
        )}

        {replyOpen && (
          <ReplyModal
            comment={comment}
            timeLabel={timeAgo(comment.created_at)}
            childrenOf={childrenOf}
            currentUserId={currentUserId}
            user={user}
            onLike={onLike}
            onDelete={onDelete}
            onReply={onReply}
            onClose={() => setReplyOpen(false)}
          />
        )}
      </div>
    );
  }

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      await onLike(comment.id);
    } finally {
      setLiking(false);
    }
  };

  const canDelete = comment.author_id === currentUserId;

  return (
    <div>
      <div className="flex gap-2.5 py-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-soft text-brand font-bold text-xs shrink-0">
          {initialsOf(comment.author_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-gray-900 text-xs">{comment.author_name}</span>
            <span className="text-gray-400 text-[11px]">{timeAgo(comment.created_at)}</span>
          </div>

          {comment.body && (
            <MentionHashtagText text={comment.body} className="text-gray-800 mt-1 leading-normal text-sm" />
          )}
          {comment.sticker && (
            <div className="mt-1.5">
              <StickerBubble sticker={comment.sticker} />
            </div>
          )}

          <div className="flex items-center gap-3.5 mt-1.5">
            <button
              type="button"
              onClick={handleLike}
              disabled={liking || !user}
              title={user ? (liked ? "Batal suka" : "Suka") : "Masuk untuk menyukai"}
              className={`inline-flex items-center gap-1 text-xs bg-transparent border-none p-0 cursor-pointer disabled:cursor-default ${
                liked ? "text-brand" : liking ? "text-gray-300" : "text-gray-500 hover:text-brand"
              }`}
            >
              <Heart size={13} strokeWidth={2} fill={liked ? "currentColor" : "none"} />
              <span>{comment.likes > 0 ? comment.likes : ""} {liked ? "Disukai" : "Suka"}</span>
            </button>

            <button
              type="button"
              onClick={() => setReplyOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand bg-transparent border-none p-0 cursor-pointer"
            >
              <MessageCircle size={13} strokeWidth={2} />
              <span>{children.length > 0 ? children.length : ""} Balas</span>
            </button>

            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-danger bg-transparent border-none p-0 cursor-pointer ml-auto"
                title="Hapus komentar"
              >
                <Trash2 size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>

      {replyOpen && (
        <ReplyModal
          comment={comment}
          timeLabel={timeAgo(comment.created_at)}
          childrenOf={childrenOf}
          currentUserId={currentUserId}
          user={user}
          onLike={onLike}
          onDelete={onDelete}
          onReply={onReply}
          onClose={() => setReplyOpen(false)}
        />
      )}
    </div>
  );
}