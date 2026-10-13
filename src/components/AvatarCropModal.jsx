import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

// Langkah "atur foto" sebelum foto profil masuk ke antrean simpan.
// Pengguna menggeser dan memperbesar foto sampai pas di lingkaran; hasilnya
// dipotong persegi (maks. 512 px, JPEG) lalu dikembalikan lewat onDone(File).
// Tidak ada yang dikirim ke server di sini: foto baru tersimpan saat
// "Simpan Perubahan" di modal Edit Profil ditekan.

const VIEW = 288; // sisi kotak atur foto (px)
const MAX_ZOOM = 4;
const OUT_MAX = 512; // sisi maksimum hasil (px)
const OUT_MIN = 200;
const MAX_BYTES = 2 * 1024 * 1024; // batas unggah foto profil di server
const KEY_STEP = 12;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const toBlob = (canvas, quality) =>
  new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", quality));

export default function AvatarCropModal({ file, onCancel, onDone }) {
  // Alamat sementara foto dibuat DI DALAM efek (bukan useMemo): React StrictMode menjalankan
  // efek dua kali saat komponen muncul, dan pencabutan alamat di cleanup tidak boleh
  // mengenai alamat yang masih dipakai.
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const [dim, setDim] = useState(null); // ukuran asli foto { w, h }
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 }); // pergeseran dari tengah (px)
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const imgRef = useRef(null);
  const boxRef = useRef(null);
  const drag = useRef(null);

  // zoom 1 = foto menutupi seluruh kotak (sisi terpendek pas dengan kotak)
  const base = dim ? VIEW / Math.min(dim.w, dim.h) : 1;
  const scale = base * zoom;
  const w = dim ? dim.w * scale : 0;
  const h = dim ? dim.h * scale : 0;

  // foto tidak boleh digeser sampai ada bagian kotak yang kosong
  const limit = useCallback(
    (p, z) => {
      if (!dim) return p;
      const s = base * z;
      const mx = Math.max(0, (dim.w * s - VIEW) / 2);
      const my = Math.max(0, (dim.h * s - VIEW) / 2);
      return { x: clamp(p.x, -mx, mx), y: clamp(p.y, -my, my) };
    },
    [dim, base]
  );

  const changeZoom = useCallback(
    (next) => {
      const z = clamp(next, 1, MAX_ZOOM);
      setPos((p) => limit({ x: (p.x * z) / zoom, y: (p.y * z) / zoom }, z));
      setZoom(z);
    },
    [limit, zoom]
  );

  // Escape menutup langkah ini saja, bukan seluruh modal Edit Profil
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onCancel]);

  // zoom dengan roda mouse (perlu listener non-pasif agar halaman tidak ikut tergulir)
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      changeZoom(zoom - e.deltaY * 0.002);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [changeZoom, zoom]);

  const onPointerDown = (e) => {
    if (!dim) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    setPos(limit({ x: d.x + e.clientX - d.px, y: d.y + e.clientY - d.py }, zoom));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const onKeyDown = (e) => {
    const move = (dx, dy) => {
      e.preventDefault();
      setPos((p) => limit({ x: p.x + dx, y: p.y + dy }, zoom));
    };
    if (e.key === "ArrowLeft") move(KEY_STEP, 0);
    else if (e.key === "ArrowRight") move(-KEY_STEP, 0);
    else if (e.key === "ArrowUp") move(0, KEY_STEP);
    else if (e.key === "ArrowDown") move(0, -KEY_STEP);
    else if (e.key === "+" || e.key === "=") changeZoom(zoom + 0.2);
    else if (e.key === "-") changeZoom(zoom - 0.2);
  };

  const reset = () => {
    setZoom(1);
    setPos({ x: 0, y: 0 });
  };

  const apply = async () => {
    if (!dim || !imgRef.current || saving) return;
    setSaving(true);
    setError("");
    try {
      // bagian foto asli yang terlihat di kotak
      const sw = VIEW / scale;
      const sx = dim.w / 2 - (VIEW / 2 + pos.x) / scale;
      const sy = dim.h / 2 - (VIEW / 2 + pos.y) / scale;
      const out = Math.round(clamp(sw, OUT_MIN, OUT_MAX));
      const canvas = document.createElement("canvas");
      canvas.width = out;
      canvas.height = out;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; // PNG transparan -> latar putih (hasil JPEG)
      ctx.fillRect(0, 0, out, out);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(imgRef.current, sx, sy, sw, sw, 0, 0, out, out);
      let blob = await toBlob(canvas, 0.92);
      if (blob && blob.size > MAX_BYTES) blob = await toBlob(canvas, 0.75);
      if (!blob || blob.size > MAX_BYTES) throw new Error("gagal");
      onDone(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
    } catch {
      setError("Foto tidak bisa diproses. Coba pilih foto lain.");
      setSaving(false);
    }
  };

  // salinan kecil untuk pratinjau (ukuran sama seperti di profil dan daftar)
  const Preview = ({ size }) => {
    const f = size / VIEW;
    return (
      <div className="relative shrink-0 overflow-hidden rounded-full bg-gray-200" style={{ width: size, height: size }}>
        {dim && url && (
          <img
            src={url}
            alt=""
            draggable={false}
            style={{ position: "absolute", maxWidth: "none", left: size / 2 + pos.x * f - (w * f) / 2, top: size / 2 + pos.y * f - (h * f) / 2, width: w * f, height: h * f }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div role="dialog" aria-modal="true" aria-label="Atur foto profil" className="flex max-h-[92vh] w-full max-w-sm flex-col rounded-2xl bg-white shadow-xl">
        <div className="shrink-0 border-b border-gray-100 px-5 py-4">
          <h3 className="m-0 text-base font-bold">Atur foto profil</h3>
          <p className="m-0 mt-1 text-xs text-gray-500">Geser foto dan atur zoom sampai pas di lingkaran.</p>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div
            ref={boxRef}
            tabIndex={0}
            autoFocus
            role="img"
            aria-label="Area atur foto. Geser dengan mouse, jari, atau tombol panah."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            className="relative mx-auto cursor-grab touch-none select-none overflow-hidden rounded-xl bg-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-brand active:cursor-grabbing"
            style={{ width: VIEW, height: VIEW, maxWidth: "100%" }}
          >
            {url && (
            <img
              ref={imgRef}
              src={url}
              alt=""
              draggable={false}
              onLoad={(e) => setDim({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              onError={() => setError("Foto tidak bisa dibuka. Coba pilih foto lain.")}
              style={
                dim
                  ? { position: "absolute", maxWidth: "none", left: VIEW / 2 + pos.x - w / 2, top: VIEW / 2 + pos.y - h / 2, width: w, height: h }
                  : { position: "absolute", maxWidth: "none", opacity: 0, width: VIEW }
              }
            />
            )}
            {/* lingkaran penanda: bagian di luar lingkaran digelapkan */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ boxShadow: "0 0 0 999px rgba(0,0,0,.55)", border: "2px solid rgba(255,255,255,.9)" }}
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button type="button" onClick={() => changeZoom(zoom - 0.25)} disabled={!dim || zoom <= 1} aria-label="Perkecil" className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
              <Minus size={16} />
            </button>
            <input
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              disabled={!dim}
              onChange={(e) => changeZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="h-9 flex-1 cursor-pointer accent-black"
            />
            <button type="button" onClick={() => changeZoom(zoom + 0.25)} disabled={!dim || zoom >= MAX_ZOOM} aria-label="Perbesar" className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
              <Plus size={16} />
            </button>
            <button type="button" onClick={reset} disabled={!dim} aria-label="Atur ulang posisi" title="Atur ulang posisi" className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">
              <RotateCcw size={15} />
            </button>
          </div>

          <div className="mt-4 flex items-end gap-4">
            <span className="pb-1 text-xs font-semibold text-gray-700">Pratinjau</span>
            <Preview size={72} />
            <Preview size={44} />
            <Preview size={32} />
          </div>

          {error && (
            <div role="alert" className="mt-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2.5 border-t border-gray-100 px-5 py-4">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
            Batal
          </button>
          <button type="button" className="btn btn-accent" onClick={apply} disabled={!dim || saving}>
            {saving ? "Memproses..." : "Terapkan"}
          </button>
        </div>
      </div>
    </div>
  );
}