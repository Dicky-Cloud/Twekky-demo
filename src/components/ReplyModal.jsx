import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowLeft, MessageCircle, Heart } from "lucide-react";
import { usePostInteractions } from "../context/PostInteractionContext";
import MentionHashtagText from "./MentionHashtagText";
import StickerBubble from "./StickerBubble";
import CommentComposer from "./CommentComposer";
import CommentItem from "./CommentItem";
import { SortTabs } from "./CommentSort";
import { Link } from "react-router-dom";

function initialsOf(name) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

// Fungsi "tutup semua" dari modal induk (CommentModal menyediakannya). Kalau
// tidak ada (mis. dipakai di halaman detail post), tombol X menutup semua
// lapisan balasan saja.
export const CloseAllContext = createContext(null);

// Tumpukan modal balasan yang sedang terbuka: { id, close }. Hanya yang paling
// atas yang bereaksi pada tombol Escape.
const openStack = [];

// Tampilan "Utas" untuk satu komentar, dibuat SAMA dengan modal utama
// (CommentModal): ukuran, header, dan susunan yang sama. Komentar yang
// dibalas tampil di atas seperti sebuah post, lalu kotak tulis balasan, lalu
// daftar balasannya. Overlay-nya sengaja TRANSPARAN: latar gelap sudah dipasang
// modal utama, jadi membuka lapisan yang lebih dalam tidak membuat layar makin
// gelap. Membalas sebuah balasan membuka lapisan berikutnya;
// panah kembali menutup satu lapisan. Dirender lewat portal ke <body>.
export default function ReplyModal({
  comment,
  timeLabel,
  childrenOf,
  currentUserId,
  user,
  onLike,
  onDelete,
  onReply,
  onClose,
}) {
  const closeAllFromParent = useContext(CloseAllContext);
  const entryRef = useRef({ id: Symbol("reply-modal"), close: onClose });
  entryRef.current.close = onClose; // selalu pakai onClose terbaru tanpa mendaftar ulang
  const children = childrenOf[comment.id] || [];
  const inter = usePostInteractions();
  const headerLiked = inter ? inter.commentLiked.has(comment.id) : false;
  const [likingHeader, setLikingHeader] = useState(false);
  const handleHeaderLike = async () => {
    if (likingHeader) return;
    setLikingHeader(true);
    try {
      await onLike(comment.id);
    } finally {
      setLikingHeader(false);
    }
  };

  // Daftar ke tumpukan sekali saja saat dibuka, supaya urutan lapisan tidak
  // tertukar ketika komponen di atasnya re-render.
  useEffect(() => {
    const entry = entryRef.current;
    openStack.push(entry);
    const handleKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation(); // jangan ikut menutup popup komentar di belakang
      if (openStack[openStack.length - 1] === entry) entry.close();
    };
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("keydown", handleKey, true);
      const i = openStack.indexOf(entry);
      if (i >= 0) openStack.splice(i, 1);
    };
  }, []);

  // Tombol X: tutup SEMUA modal (termasuk modal utama kalau ada).
  const handleCloseAll = () => {
    if (closeAllFromParent) closeAllFromParent();
    else [...openStack].forEach((e) => e.close());
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl h-[min(880px,94vh)] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header sama seperti modal utama */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 -ml-1.5"
            title="Kembali"
          >
            <ArrowLeft size={19} strokeWidth={2} />
          </button>
          <span className="font-bold text-[15px]">Utas</span>
          <button
            onClick={handleCloseAll}
            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 -mr-1.5"
            title="Tutup semua"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* komentar yang dibalas, ditampilkan seperti post di modal utama */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-soft text-brand font-bold text-sm shrink-0">
              {initialsOf(comment.author_name)}
            </div>
            <div>
              <div className="font-semibold text-sm">{comment.author_name}</div>
              <div className="text-gray-500 text-xs">{timeLabel}</div>
            </div>
          </div>
          {comment.deleted && (
            <p className="m-0 mb-3 text-sm text-gray-400 italic">Komentar telah dihapus.</p>
          )}
          {comment.body && (
            <MentionHashtagText
              text={comment.body}
              className="text-gray-900 text-[15px] whitespace-pre-wrap mb-3 leading-relaxed"
            />
          )}
          {comment.sticker && (
            <div className="mb-3">
              <StickerBubble sticker={comment.sticker} />
            </div>
          )}
          <div className="flex items-center gap-5 pb-4 border-b border-gray-100">
            {!comment.deleted && (
              <button
                type="button"
                onClick={handleHeaderLike}
                disabled={likingHeader || !user}
                title={user ? (headerLiked ? "Batal suka" : "Suka") : "Masuk untuk menyukai"}
                className={`inline-flex items-center gap-1.5 text-sm bg-transparent border-none p-0 cursor-pointer disabled:cursor-default ${
                  headerLiked ? "text-brand" : "text-gray-500 hover:text-brand"
                }`}
              >
                <Heart size={17} strokeWidth={2} fill={headerLiked ? "currentColor" : "none"} />
                {comment.likes}
              </button>
            )}
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
              <MessageCircle size={17} strokeWidth={2} />
              {children.length}
            </span>
          </div>

          {/* kotak balas + daftar balasan, satu kolom mengalir ke bawah */}
          <div className="pt-4 flex flex-col gap-4">
            {comment.deleted ? null : user ? (
              <CommentComposer
                placeholder={`Balas ${comment.author_name}...`}
                initialValue={`@${comment.author_name} `}
                autoFocus
                onSubmit={(vals) => onReply(comment.id, vals)}
              />
            ) : (
              <div className="text-sm text-gray-500 text-center py-1">
                <Link to="/login" className="text-brand font-semibold underline">
                  Masuk
                </Link>{" "}
                untuk membalas
              </div>
            )}

            {children.length > 1 && <SortTabs />}

            {children.length === 0 ? (
              <div className="text-gray-400 text-sm text-center py-8">
                Belum ada balasan.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
              {children.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  childrenOf={childrenOf}
                  currentUserId={currentUserId}
                  user={user}
                  onLike={onLike}
                  onDelete={onDelete}
                  onReply={onReply}
                />
              ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}