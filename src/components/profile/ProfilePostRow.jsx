// Baris postingan ringkas untuk halaman profil (hemat tempat dibanding PostCard).
// actions: [{ label, icon: Icon, onClick, danger }]
import { Heart, MessageCircle, Lock } from "lucide-react";
import { mediaUrl } from "../../api/client";

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export default function ProfilePostRow({ post, onOpen, showAuthor = false, actions = [] }) {
  const thumb = post.media?.[0];
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50/60">
      {thumb && (
        <button
          type="button"
          onClick={() => onOpen?.(post.id)}
          aria-label="Buka postingan"
          className="h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-100 p-0"
        >
          {thumb.type === "video" ? (
            <video src={`${mediaUrl(thumb.url)}#t=0.1`} preload="metadata" muted playsInline className="pointer-events-none h-full w-full object-cover" />
          ) : (
            <img src={mediaUrl(thumb.url)} alt="" loading="lazy" className="h-full w-full object-cover" />
          )}
        </button>
      )}

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onOpen?.(post.id)}
          className="block w-full cursor-pointer truncate border-none bg-transparent p-0 text-left text-sm font-semibold text-gray-900 hover:text-brand"
        >
          {post.title}
        </button>
        <p className="m-0 truncate text-xs text-gray-500">{post.body}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-400">
          {post.is_anonymous && <span className="inline-flex items-center gap-1"><Lock size={11} /> Anonim</span>}
          {showAuthor && <span>oleh {post.is_anonymous ? "Anonim" : post.author_name}</span>}
          <span>{timeAgo(post.created_at)}</span>
          <span className="inline-flex items-center gap-1"><Heart size={11} /> {post.likes}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle size={11} /> {post.comment_count}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {actions.map(({ label, icon: Icon, onClick, danger }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border-none bg-transparent px-2 py-1.5 text-xs font-semibold ${
              danger ? "text-gray-400 hover:bg-red-50 hover:text-danger" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            }`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}