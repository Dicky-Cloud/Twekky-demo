import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { TWEKKY_STICKERS } from "../constants/stickers";

const MAX_DIMENSION = 320; // px, sisi terpanjang setelah dikecilkan
const UPLOAD_ERROR = "Gagal memproses gambar. Coba file lain.";

// Mengecilkan gambar yang diupload ke kanvas <=320px lalu mengembalikannya
// sebagai data URL JPEG, supaya ukurannya wajar untuk disimpan backend
// (yang saat ini menyimpan stiker langsung di record komentar, in-memory).
function resizeImageToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(UPLOAD_ERROR));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error(UPLOAD_ERROR));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Popover dua tab: pilih dari stiker bawaan Twekky, atau upload gambar
// sendiri (otomatis dikecilkan di browser sebelum dikirim ke backend).
// onSelect dipanggil dengan string siap pakai untuk field `sticker`
// komentar: "builtin:<id>" atau data URL hasil upload.
export default function StickerPickerPopover({ onSelect, onClose }) {
  const [tab, setTab] = useState("twekky"); // "twekky" | "upload"
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [onClose]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("File harus berupa gambar.");
      return;
    }
    setUploadError("");
    setUploading(true);
    try {
      const dataUrl = await resizeImageToDataURL(file);
      onSelect(dataUrl);
    } catch (err) {
      setUploadError(err.message || UPLOAD_ERROR);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 z-20 w-72 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
    >
      <div className="flex border-b border-gray-100">
        <button
          type="button"
          onClick={() => setTab("twekky")}
          className={`flex-1 py-2 text-xs font-semibold transition-colors ${
            tab === "twekky" ? "text-brand border-b-2 border-brand" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Stiker Twekky
        </button>
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex-1 py-2 text-xs font-semibold transition-colors ${
            tab === "upload" ? "text-brand border-b-2 border-brand" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Upload Sendiri
        </button>
      </div>

      {tab === "twekky" ? (
        <div className="grid grid-cols-5 gap-1.5 p-2.5">
          {TWEKKY_STICKERS.map((s) => (
            <button
              key={s.id}
              type="button"
              title={s.label}
              onClick={() => onSelect(`builtin:${s.id}`)}
              style={{ background: s.bg }}
              className="flex items-center justify-center aspect-square rounded-lg text-xl hover:scale-105 transition-transform"
            >
              {s.emoji}
            </button>
          ))}
        </div>
      ) : (
        <div className="p-3.5 flex flex-col items-center gap-2.5">
          <label className="flex flex-col items-center justify-center gap-1.5 w-full h-24 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 cursor-pointer hover:border-brand hover:text-brand transition-colors">
            <Upload size={20} strokeWidth={2} />
            <span className="text-xs font-medium">
              {uploading ? "Memproses..." : "Pilih gambar"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
          {uploadError && <p className="m-0 text-xs text-danger text-center">{uploadError}</p>}
          <p className="m-0 text-[11px] text-gray-400 text-center">
            Gambar otomatis dikecilkan sebelum dikirim.
          </p>
        </div>
      )}
    </div>
  );
}
