// Stiker bawaan Twekky. Belum ada aset gambar khusus dari desainer, jadi
// stiker ini dibuat dari emoji besar di atas bubble berwarna — bukan
// ilustrasi buatan tangan. Gampang diganti nanti: cukup arahkan `emoji`
// ke URL gambar kalau aset aslinya sudah ada.
export const TWEKKY_STICKERS = [
  { id: "high-five", emoji: "🙌", label: "Tos!", bg: "#eaf0fe" },
  { id: "laugh", emoji: "😂", label: "Ngakak", bg: "#fff4e0" },
  { id: "fire", emoji: "🔥", label: "Mantap", bg: "#ffe9e0" },
  { id: "thumbs-up", emoji: "👍", label: "Setuju", bg: "#e6f7ec" },
  { id: "mind-blown", emoji: "🤯", label: "Gila sih", bg: "#f3e8ff" },
  { id: "clap", emoji: "👏", label: "Keren", bg: "#e0f7fa" },
  { id: "thinking", emoji: "🤔", label: "Hmm...", bg: "#fef9e0" },
  { id: "heart-eyes", emoji: "😍", label: "Cinta ini", bg: "#ffe0ec" },
  { id: "skull", emoji: "💀", label: "Mati aku", bg: "#eceff1" },
  { id: "party", emoji: "🎉", label: "Rayakan", bg: "#e0fff0" },
];

export function findTwekkySticker(id) {
  return TWEKKY_STICKERS.find((s) => s.id === id);
}

// Emoji picker: daftar emoji umum untuk disisipkan ke teks komentar.
export const EMOJI_PALETTE = [
  "😀", "😂", "🥹", "😍", "😎", "🤔", "😴", "😭",
  "😡", "🙄", "😅", "🥳", "😱", "🤗", "🫡", "😇",
  "👍", "👎", "🙌", "👏", "🙏", "💪", "🤝", "✌️",
  "❤️", "🔥", "💯", "✨", "🎉", "😢", "😆", "🤯",
];
