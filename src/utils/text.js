// src/utils/text.js

// Potong teks sampai maksimal `max` karakter yang terlihat (grapheme, jadi emoji
// dan huruf bertanda tidak terbelah), lalu mundur ke batas kata terdekat.
// Teks yang tidak perlu dipotong dikembalikan apa adanya.
export function truncateText(text, max = 250) {
  if (!text || text.length <= max) return text || ""; // panjang UTF-16 >= jumlah grapheme
  const chars =
    typeof Intl !== "undefined" && Intl.Segmenter
      ? Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment)
      : Array.from(text);
  if (chars.length <= max) return text;
  let cut = chars.slice(0, max).join("");
  const lastSpace = cut.search(/\s\S*$/);
  if (lastSpace > cut.length * 0.6) cut = cut.slice(0, lastSpace);
  return cut.trimEnd() + "...";
}
