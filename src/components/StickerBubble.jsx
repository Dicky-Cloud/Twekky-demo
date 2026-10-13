import { findTwekkySticker } from "../constants/stickers";

// Menampilkan nilai field `sticker` dari komentar: bisa stiker bawaan Twekky
// ("builtin:<id>") atau hasil upload sendiri (data URL "data:image/...").
export default function StickerBubble({ sticker, size = 84 }) {
  if (!sticker) return null;

  if (sticker.startsWith("data:image")) {
    return (
      <img
        src={sticker}
        alt="Stiker"
        style={{ width: size, height: size }}
        className="rounded-xl object-cover border border-gray-100"
      />
    );
  }

  const id = sticker.startsWith("builtin:") ? sticker.slice("builtin:".length) : sticker;
  const s = findTwekkySticker(id);
  if (!s) return null;

  return (
    <div
      title={s.label}
      style={{ width: size, height: size, background: s.bg, fontSize: size * 0.5 }}
      className="flex items-center justify-center rounded-xl select-none"
    >
      {s.emoji}
    </div>
  );
}
