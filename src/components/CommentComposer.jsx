import { useEffect, useRef, useState } from "react";
import { Smile, Sticker as StickerIcon, X } from "lucide-react";
import EmojiPickerPopover from "./EmojiPickerPopover";
import StickerPickerPopover from "./StickerPickerPopover";
import StickerBubble from "./StickerBubble";

// Kotak tulis komentar, dipakai untuk komentar tingkat atas maupun balasan.
// Sebuah komentar boleh berisi teks saja, stiker saja, atau keduanya.
export default function CommentComposer({
  onSubmit,
  placeholder = "Tulis komentar...",
  initialValue = "",
  autoFocus = false,
  replyingToLabel = null,
  onCancelReply,
}) {
  const [body, setBody] = useState(initialValue);
  const [sticker, setSticker] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setBody(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const insertEmoji = (emoji) => {
    setBody((b) => b + emoji);
    setEmojiOpen(false);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim() && !sticker) return;
    setError("");
    setBusy(true);
    try {
      await onSubmit({ body: body.trim(), sticker });
      setBody("");
      setSticker("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const iconBtnClass =
    "flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-brand hover:bg-brand-soft transition-colors shrink-0";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      {replyingToLabel && (
        <div className="flex items-center justify-between rounded-lg bg-brand-soft px-2.5 py-1.5 text-xs text-brand-dark">
          <span>
            Membalas <strong>{replyingToLabel}</strong>
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-brand-dark hover:underline shrink-0"
          >
            Batal
          </button>
        </div>
      )}

      {sticker && (
        <div className="relative inline-block w-fit">
          <StickerBubble sticker={sticker} size={64} />
          <button
            type="button"
            onClick={() => setSticker("")}
            className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-gray-800 text-white"
          >
            <X size={11} strokeWidth={3} />
          </button>
        </div>
      )}

      {error && <p className="m-0 text-xs text-danger">{error}</p>}

      <div className="flex items-center gap-1.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setEmojiOpen((v) => !v);
              setStickerOpen(false);
            }}
            className={iconBtnClass}
            title="Sisipkan emoji"
          >
            <Smile size={17} strokeWidth={2} />
          </button>
          {emojiOpen && <EmojiPickerPopover onSelect={insertEmoji} onClose={() => setEmojiOpen(false)} />}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setStickerOpen((v) => !v);
              setEmojiOpen(false);
            }}
            className={iconBtnClass}
            title="Kirim stiker"
          >
            <StickerIcon size={17} strokeWidth={2} />
          </button>
          {stickerOpen && (
            <StickerPickerPopover
              onSelect={(value) => {
                setSticker(value);
                setStickerOpen(false);
              }}
              onClose={() => setStickerOpen(false)}
            />
          )}
        </div>

        <input
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={sticker ? "Tambahkan keterangan (opsional)..." : placeholder}
          className="flex-1 min-w-0 text-sm outline-none bg-transparent placeholder:text-gray-400"
        />

        <button
          type="submit"
          disabled={busy || (!body.trim() && !sticker)}
          className={`text-sm font-semibold shrink-0 ${
            busy || (!body.trim() && !sticker)
              ? "text-gray-300 cursor-not-allowed"
              : "text-brand hover:text-brand-dark cursor-pointer"
          }`}
        >
          {busy ? "..." : "Kirim"}
        </button>
      </div>
    </form>
  );
}
