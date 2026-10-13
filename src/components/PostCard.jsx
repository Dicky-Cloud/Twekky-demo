// src/components/PostCard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PostCommunityTag from "./PostCommunityTag";
import { topicColor, topicLabel } from "../constants/topics";
import PostMedia from "./PostMedia";
import { mediaUrl, profileImageUrl } from "../api/client";
import { usePostInteractions } from "../context/PostInteractionContext";
import { useBubbleTheme, useUserAvatar } from "../context/BubbleThemeContext";
import ThemedAvatar, { ThemeDecor, ThemeSparkle, postFrame, themedNameStyle } from "./bubble/ThemedAvatar";
import { Heart, MessageCircle, Share2, Bookmark, Trash2, Building2, BadgeCheck, Play, Repeat2 } from "lucide-react";

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function initialsOf(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// variant="card" (default): kartu terpisah dengan border, dipakai di Profil & Komunitas.
// variant="flat": tanpa border/kartu, untuk daftar menyatu yang dipisahkan garis (Feed).
// community (opsional): objek komunitas asal post; bila ada, tampil penanda "di <komunitas>" + tombol Gabung.
// compact: tampilan padat ala Reddit; lampiran jadi thumbnail kecil di kanan, isi dipotong 2 baris.
// onDelete (opsional): bila diberikan, tombol hapus tampil (dipakai untuk post milik sendiri).
// onSaveChange (opsional): dipanggil (true/false) setelah simpan/batal simpan, mis. untuk toast.
// menu (opsional): elemen di pojok kanan atas kartu (mis. <PostMenu />).
// footer (opsional): elemen yang tampil di dasar kartu, di dalam kotak (mis. "Tampilkan lebih banyak").
export default function PostCard({ post, onLike, canLike, onOpenComments, variant = "card", community, compact = false, onDelete, onSaveChange, footer, plain = false, menu }) {
  const flat = variant === "flat";
  const inter = usePostInteractions(); // suka/simpan/bagikan tersimpan di server per akun
  const [likes, setLikes] = useState(post.likes);
  const [liking, setLiking] = useState(false);
  const [localLiked, setLocalLiked] = useState(false); // hanya dipakai bila tanpa provider
  const [copied, setCopied] = useState(false);
  const [busySave, setBusySave] = useState(false);
  const liked = inter ? inter.liked.has(post.id) : localLiked;
  const saved = inter ? inter.saved.has(post.id) : false;
  const shared = inter ? inter.shared.has(post.id) : false;
  const reposted = inter ? inter.reposted.has(post.id) : false;
  const [busyRepost, setBusyRepost] = useState(false);
  const [repostCount, setRepostCount] = useState(post.reposts || 0);
  useEffect(() => setRepostCount(post.reposts || 0), [post.reposts]);

  // jumlah suka ikut berubah saat data post diperbarui (mis. real-time)
  useEffect(() => setLikes(post.likes), [post.likes]);
  // suka dari tempat lain (mis. modal komentar) langsung tampil di kartu ini
  const serverCount = inter?.counts?.[post.id];
  useEffect(() => {
    if (typeof serverCount === "number") setLikes(serverCount);
  }, [serverCount]);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      if (inter) {
        const n = await inter.toggleLike(post.id); // suka <-> batal suka
        if (typeof n === "number") setLikes(n);
      } else if (!localLiked) {
        await onLike(post.id);
        setLikes((n) => n + 1);
        setLocalLiked(true);
      }
    } catch {
      // gagal: tombol kembali ke keadaan semula
    } finally {
      setLiking(false);
    }
  };

  const handleSave = async () => {
    if (!inter || busySave) return;
    setBusySave(true);
    try {
      const on = await inter.toggleSave(post.id);
      onSaveChange?.(on);
    } catch {
      // gagal: keadaan dikembalikan oleh provider
    } finally {
      setBusySave(false);
    }
  };

  const handleRepost = async () => {
    if (!inter || busyRepost) return;
    setBusyRepost(true);
    try {
      const res = await inter.toggleRepost(post.id);
      if (typeof res?.reposts === "number") setRepostCount(res.reposts);
    } catch {
      // gagal: keadaan dikembalikan oleh provider
    } finally {
      setBusyRepost(false);
    }
  };

  // Bagikan: di HP memakai menu bagikan bawaan perangkat; di desktop menyalin tautan.
  // Setiap bagikan dicatat di tab "Dibagikan" profil.
  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    const text = `${post.title}\n\n${url}`;
    let done = false;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.title, url });
        done = true;
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        done = true;
      }
    } catch {
      // dibatalkan pengguna atau clipboard tidak tersedia
    }
    if (done && inter && canLike && !shared) inter.share(post.id).catch(() => {});
  };

  const handleDelete = () => {
    if (window.confirm("Hapus postingan ini? Komentarnya ikut terhapus dan tidak bisa dikembalikan.")) {
      onDelete?.(post.id);
    }
  };

  const displayName = post.is_anonymous ? "Anonim" : post.author_name;
  // gaya bubble pilihan penulis; post anonim dan atas nama perusahaan tetap polos
  const bubbleThemeId = useBubbleTheme(post.is_anonymous || post.as_company ? null : post.author_id);
  // foto profil penulis; post anonim dan atas nama perusahaan tetap memakai ikon/inisial
  const avatarName = useUserAvatar(post.is_anonymous || post.as_company ? null : post.author_id);
  const avatarSrc = profileImageUrl(avatarName);
  const [avatarBroken, setAvatarBroken] = useState(false);
  useEffect(() => setAvatarBroken(false), [avatarSrc]);
  // kartu stiker hanya di Feed (variant flat); di Profil/Komunitas cukup avatar dan nama
  // plain: tanpa bingkai stiker (dipakai di Komunitas agar tampil polos di HP)
  const frame = flat && !plain ? postFrame(bubbleThemeId) : { className: "", style: undefined };

  // Thumbnail untuk tampilan padat: gambar pertama, atau bingkai awal video.
  const thumb = compact ? post.media?.[0] : null;
  const imageCount = post.media ? post.media.filter((m) => m.type === "image").length : 0;

  return (
    <article
      className={`${
        flat ? (compact ? "px-4 py-3 md:px-5" : "px-4 py-4 md:px-5") : "bg-white border border-gray-200 border-l-4 border-l-gray-200 rounded-xl p-5 mb-3.5"
      } ${frame.className}`}
      style={frame.style}
    >
      <ThemeDecor themeId={frame.className ? bubbleThemeId : null} />
      <div className={compact ? "flex items-start gap-4" : undefined}>
      <div className={compact ? "min-w-0 flex-1" : undefined}>
      <div className="flex items-center gap-2.5 mb-2.5">
          <ThemedAvatar themeId={bubbleThemeId}>
          <div className="flex items-center justify-center w-[38px] h-[38px] rounded-full bg-brand-soft text-brand font-bold text-[13px] shrink-0 overflow-hidden">
            {avatarSrc && !avatarBroken ? (
              <img
                src={avatarSrc}
                alt=""
                loading="lazy"
                onError={() => setAvatarBroken(true)}
                className="h-full w-full object-cover"
              />
            ) : post.as_company ? (
              <Building2 size={17} />
            ) : post.is_anonymous ? (
              "?"
            ) : (
              initialsOf(post.author_name)
            )}
          </div>
          </ThemedAvatar>
          <div>
            {post.as_company ? (
              <div className="flex items-center gap-1.5">
                <Link to={`/perusahaan/${post.author_id}`} className="font-semibold text-sm text-gray-900 no-underline hover:text-brand">
                  {displayName}
                </Link>
                {post.company_verified && (
                  <BadgeCheck size={14} className="shrink-0 text-brand" aria-label="Terverifikasi" />
                )}
                <span className="rounded bg-brand-soft px-1.5 py-px text-[10px] font-bold text-brand">Perusahaan</span>
              </div>
            ) : post.is_anonymous || !post.author_id ? (
              <div className="font-semibold text-sm">{displayName}</div>
            ) : (
              <Link to={`/pengguna/${post.author_id}`} style={themedNameStyle(bubbleThemeId)} className="font-semibold text-sm text-gray-900 no-underline hover:text-brand">
                {displayName}
                {bubbleThemeId && <ThemeSparkle themeId={bubbleThemeId} />}
              </Link>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-500 text-xs">
              <span>{timeAgo(post.created_at)}</span>
              {community && <PostCommunityTag community={community} />}
              {post.topic && topicLabel(post.topic) && (
                <Link
                  to={`/?topik=${post.topic}`}
                  className={`rounded px-1.5 py-px text-[10px] font-semibold no-underline hover:opacity-80 ${topicColor(post.topic)}`}
                  title={`Lihat post di topik ${topicLabel(post.topic)}`}
                >
                  {topicLabel(post.topic)}
                </Link>
              )}
            </div>
          </div>
          {menu && <div className="ml-auto shrink-0 self-start -mr-1.5 -mt-1">{menu}</div>}
      </div>

      <button
        type="button"
        onClick={() => onOpenComments?.(post.id)}
        className="block w-full text-left text-[1.02rem] font-bold mt-0.5 mb-1.5 hover:text-brand bg-transparent border-none p-0 cursor-pointer"
      >
        {post.title}
      </button>

      <p
        className={`text-gray-900 text-sm whitespace-pre-wrap ${compact ? "mb-2" : "mb-3"}`}
        style={
          compact
            ? { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }
            : undefined
        }
      >
        {post.body}
      </p>

      {!compact && <PostMedia media={post.media} />}

      <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5 ${flat ? "" : "border-t border-gray-100 pt-2.5"}`}>
        <button
          className={`inline-flex items-center gap-1.5 text-sm bg-transparent border-none p-0 cursor-pointer disabled:cursor-default ${
            liked ? "text-brand" : "text-gray-500 hover:text-brand"
          }`}
          onClick={handleLike}
          disabled={!canLike || liking}
          title={canLike ? (liked ? "Batal suka" : "Sukai post ini") : "Masuk untuk menyukai post"}
        >
          <Heart size={17} strokeWidth={2} fill={liked ? "currentColor" : "none"} />
          {likes}
        </button>

        <button
          type="button"
          onClick={() => onOpenComments?.(post.id)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand bg-transparent border-none p-0 cursor-pointer"
        >
          <MessageCircle size={17} strokeWidth={2} />
          {post.comment_count}
        </button>

        {inter && (
          <button
            type="button"
            onClick={handleRepost}
            disabled={!canLike || busyRepost}
            className={`inline-flex items-center gap-1.5 text-sm bg-transparent border-none p-0 cursor-pointer disabled:cursor-default ${
              reposted ? "text-success" : "text-gray-500 hover:text-success"
            }`}
            title={canLike ? (reposted ? "Batalkan repost" : "Repost ke pengikutmu") : "Masuk untuk repost"}
            aria-label={reposted ? "Di-repost" : "Repost"}
          >
            <Repeat2 size={17} strokeWidth={2} />
            {repostCount}
          </button>
        )}

        <button
          className={`inline-flex items-center gap-1.5 text-sm bg-transparent border-none p-0 cursor-pointer ${
            shared ? "text-brand" : "text-gray-500 hover:text-brand"
          }`}
          onClick={handleShare}
          title={copied ? "Tautan disalin!" : "Bagikan post"}
          aria-label={copied ? "Tautan disalin" : shared ? "Dibagikan" : "Bagikan"}
        >
          <Share2 size={17} strokeWidth={2} />
        </button>

        {inter && (
          <button
            type="button"
            onClick={handleSave}
            disabled={!canLike || busySave}
            className={`inline-flex items-center gap-1.5 text-sm bg-transparent border-none p-0 cursor-pointer disabled:cursor-default ${
              saved ? "text-brand" : "text-gray-500 hover:text-brand"
            }`}
            title={canLike ? (saved ? "Hapus dari simpanan" : "Simpan post") : "Masuk untuk menyimpan post"}
            aria-label={saved ? "Tersimpan" : "Simpan"}
          >
            <Bookmark size={17} strokeWidth={2} fill={saved ? "currentColor" : "none"} />
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-danger bg-transparent border-none p-0 cursor-pointer"
            title="Hapus postingan"
          >
            <Trash2 size={16} strokeWidth={2} />
            Hapus
          </button>
        )}
      </div>
      </div>

      {thumb && (
        <button
          type="button"
          onClick={() => onOpenComments?.(post.id)}
          aria-label="Buka post"
          className="relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-100 p-0 mt-2"
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
              <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
                <Play size={22} fill="currentColor" />
              </span>
            </>
          ) : (
            <img src={mediaUrl(thumb.url)} alt="" loading="lazy" className="h-full w-full object-cover" />
          )}
          {imageCount > 1 && (
            <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 text-[10px] font-semibold text-white">
              +{imageCount - 1}
            </span>
          )}
        </button>
      )}
      </div>
      {footer}
    </article>
  );
}