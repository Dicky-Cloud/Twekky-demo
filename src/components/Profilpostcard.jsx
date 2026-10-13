// Kartu postingan ringkas untuk halaman profil (tab Postingan, Disimpan,
// Dibagikan, Repost). Klik kartu membuka detail/komentar post.
// mobileTile: di HP tampil sebagai kotak thumbnail tanpa card (grid 3 kolom);
// mulai layar sm ke atas kembali ke tampilan kartu biasa.
import { Heart, MessageCircle, Lock, Building2, Play, Trash2 } from "lucide-react";
import { mediaUrl } from "../../api/client";

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

// onDelete (opsional): bila diberikan, tombol hapus tampil di pojok kartu (untuk post milik sendiri).
export default function ProfilePostCard({
  post,
  onOpen,
  selectable = false,
  selected = false,
  onToggle,
  onDelete,
  deleting = false,
  mobileTile = false,
}) {
  const thumb = post.media?.[0];
  const authorName = post.is_anonymous ? "Anonim" : post.author_name;

  return (
    <div className={mobileTile ? "relative bg-white sm:h-full" : "relative h-full"}>
      {selectable && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle?.(post.id)}
          aria-label="Pilih postingan"
          className="absolute left-3 top-3 z-10 h-5 w-5 cursor-pointer"
        />
      )}
      {onDelete && !selectable && (
        <button
          type="button"
          onClick={() => onDelete(post.id)}
          disabled={deleting}
          aria-label="Hapus postingan"
          title="Hapus postingan"
          className="absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white/95 p-0 text-gray-500 shadow-sm transition-colors hover:border-danger hover:text-danger disabled:cursor-default disabled:opacity-50"
        >
          <Trash2 size={15} strokeWidth={2} />
        </button>
      )}
      <button
        type="button"
        onClick={() => (selectable ? onToggle?.(post.id) : onOpen?.(post.id))}
        className={
          mobileTile
            ? "group relative flex aspect-square w-full cursor-pointer flex-col overflow-hidden bg-white p-0 text-left transition-colors sm:aspect-auto sm:h-full sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-sm sm:hover:border-brand/40"
            : `group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white p-0 text-left shadow-sm transition-colors ${
                selected ? "border-brand ring-2 ring-brand/30" : "border-gray-200 hover:border-brand/40"
              }`
        }
      >
      {thumb && (
        <div
          className={
            mobileTile
              ? "absolute inset-0 overflow-hidden bg-gray-100 sm:relative sm:inset-auto sm:aspect-[16/9] sm:w-full"
              : "relative aspect-[16/9] w-full overflow-hidden bg-gray-100"
          }
        >
          {thumb.type === "video" ? (
            <>
              <video
                src={`${mediaUrl(thumb.url)}#t=0.1`}
                preload="metadata"
                muted
                playsInline
                className="pointer-events-none h-full w-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                <Play size={28} fill="currentColor" />
              </span>
            </>
          ) : (
            <img src={mediaUrl(thumb.url)} alt="" loading="lazy" className="h-full w-full object-cover" />
          )}
        </div>
      )}

      {/* HP tanpa gambar: judul ditampilkan sebagai isi kotak */}
      {mobileTile && !thumb && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-soft to-gray-100 p-2 sm:hidden">
          <p className="m-0 line-clamp-4 text-center text-[11px] font-semibold leading-snug text-gray-800">{post.title}</p>
        </div>
      )}

      <div className={`min-w-0 flex-1 flex-col p-4 ${mobileTile ? "hidden sm:flex" : "flex"}`}>
        <div className={`flex items-center gap-1.5 text-[11px] text-gray-400 ${onDelete && !selectable && !thumb ? "pr-9" : ""}`}>
          {post.is_anonymous ? <Lock size={11} /> : post.as_company ? <Building2 size={11} /> : null}
          <span className="truncate font-medium text-gray-500">{authorName}</span>
          <span>·</span>
          <span className="shrink-0">{timeAgo(post.created_at)}</span>
        </div>

        <h3 className="m-0 mt-1.5 line-clamp-2 text-sm font-bold leading-snug text-gray-900 group-hover:text-brand">
          {post.title}
        </h3>
        {post.body && (
          <p className="m-0 mt-1 line-clamp-3 whitespace-pre-line text-xs leading-relaxed text-gray-500">
            {post.body}
          </p>
        )}

        <div className="mt-auto flex items-center gap-4 pt-3 text-[11px] text-gray-400">
          <span className="inline-flex items-center gap-1">
            <Heart size={12} /> {post.likes ?? 0}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle size={12} /> {post.comment_count ?? 0}
          </span>
        </div>
      </div>
      </button>
    </div>
  );
}