import { useEffect, useRef } from "react";
import { EMOJI_PALETTE } from "../constants/stickers";

// Popover kecil berisi grid emoji umum. onSelect dipanggil dengan satu
// karakter emoji; penutupan ditangani lewat klik di luar area popover.
export default function EmojiPickerPopover({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 z-20 w-64 rounded-xl border border-gray-200 bg-white p-2.5 shadow-lg grid grid-cols-8 gap-1"
    >
      {EMOJI_PALETTE.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className="flex items-center justify-center w-7 h-7 rounded-md text-lg hover:bg-gray-100 transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
