import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";
import { mediaUrl } from "../api/client";

// Hook: geser dengan kursor (klik-tahan lalu seret) untuk elemen yang bisa di-scroll
// horizontal. Di layar sentuh scroll bawaan browser yang dipakai, jadi tidak perlu tombol.
// `movedRef.current` bernilai true kalau barusan terjadi seretan, supaya klik setelah
// menyeret tidak dianggap klik "buka gambar".
export function useDragScroll() {
  const ref = useRef(null);
  const movedRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = ref.current;
    if (!el) return;
    const startX = e.clientX;
    const startLeft = el.scrollLeft;
    movedRef.current = false;

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      if (Math.abs(dx) > 4) {
        movedRef.current = true;
        setDragging(true);
      }
      el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setDragging(false);
      // reset sesudah event click (jika ada) selesai diproses
      setTimeout(() => {
        movedRef.current = false;
      }, 0);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  return { ref, movedRef, dragging, onPointerDown };
}

// Tampilan gambar penuh. Geser kiri/kanan dengan kursor atau jari untuk pindah gambar,
// panah keyboard juga bisa, Esc / klik latar / tombol X untuk menutup.
function Lightbox({ images, index, setIndex, onClose }) {
  const count = images.length;
  const go = (d) => setIndex((i) => (i + d + count) % count);
  const startX = useRef(null);
  const moved = useRef(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation(); // jangan ikut menutup popup komentar di belakang
        onClose();
      } else if (count > 1 && e.key === "ArrowLeft") go(-1);
      else if (count > 1 && e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, onClose]);

  return createPortal(
    <div
      className={`fixed inset-0 z-[80] flex touch-none select-none items-center justify-center bg-black/85 ${
        count > 1 ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      onPointerDown={(e) => {
        startX.current = e.clientX;
        moved.current = false;
      }}
      onPointerUp={(e) => {
        if (startX.current == null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (count > 1 && Math.abs(dx) > 50) {
          moved.current = true;
          go(dx < 0 ? 1 : -1);
        }
      }}
      // klik di latar menutup; stopPropagation supaya tidak "tembus" ke popup di bawahnya
      onClick={(e) => {
        e.stopPropagation();
        if (moved.current) {
          moved.current = false;
          return;
        }
        onClose();
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Tutup"
        className="absolute right-4 top-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-black/55 p-0 text-white hover:bg-black/70"
      >
        <X size={18} strokeWidth={2.25} />
      </button>

      <img
        src={mediaUrl(images[index].url)}
        alt={`Gambar ${index + 1} dari ${count}`}
        draggable={false}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[92vw] object-contain"
      />

      {count > 1 && (
        <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
          {index + 1} / {count}
        </span>
      )}
    </div>,
    document.body
  );
}

// Deretan gambar ala Threads untuk 2+ gambar: tinggi seragam, lebar mengikuti
// rasio asli tiap gambar, gambar berikutnya terlihat sebagian sebagai petunjuk,
// digeser dengan kursor (seret) atau jari. Tanpa tombol panah.
function ImageStrip({ images, onOpen }) {
  const { ref, movedRef, dragging, onPointerDown } = useDragScroll();

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      // setelah menyeret, jangan teruskan klik ke gambar
      onClickCapture={(e) => {
        if (movedRef.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      className={`mb-3 flex select-none gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        dragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {images.map((m, i) => (
        <button
          key={m.url}
          type="button"
          onClick={() => onOpen(i)}
          aria-label={`Perbesar gambar ${i + 1}`}
          className="block h-64 flex-none cursor-[inherit] overflow-hidden rounded-lg border border-gray-100 bg-gray-100 p-0 sm:h-72"
        >
          <img
            src={mediaUrl(m.url)}
            alt={`Lampiran post ${i + 1}`}
            draggable={false}
            className="block h-full w-auto max-w-none"
          />
        </button>
      ))}
    </div>
  );
}

// Format detik menjadi "0:07", "1:05", atau "1:02:03".
function formatDuration(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "";
  const total = Math.round(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// Pemutar video minimalis: tanpa kontrol bawaan browser (tanpa titik tiga, volume,
// layar penuh, atau bilah progres). Klik video untuk memutar / menjeda. Lencana di
// pojok kiri bawah menampilkan durasi; saat diputar, lencana menghitung mundur sisa waktu.
function VideoPlayer({ src }) {
  const ref = useRef(null);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Tanpa kontrol, video yang tak terlihat tidak bisa dijeda manual, jadi jeda otomatis
  // saat keluar dari layar dan saat video lain mulai diputar.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let io;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) el.pause();
      }, { threshold: 0.25 });
      io.observe(el);
    }
    const onOtherPlay = (e) => {
      if (e.target !== el) el.pause();
    };
    document.addEventListener("play", onOtherPlay, true);
    return () => {
      if (io) io.disconnect();
      document.removeEventListener("play", onOtherPlay, true);
    };
  }, []);

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation(); // jangan ikut membuka kartu / popup di belakangnya
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  const syncDuration = (e) => {
    const d = e.currentTarget.duration;
    if (Number.isFinite(d)) setDuration(d);
  };

  const shown = playing ? Math.max(duration - current, 0) : duration;

  return (
    <div
      className="relative mb-3 inline-block max-w-full overflow-hidden rounded-lg bg-black align-top"
      onClick={(e) => e.stopPropagation()}
    >
      <video
        ref={ref}
        // #t=0.001 supaya browser menampilkan frame pertama sebagai sampul
        src={`${src}#t=0.001`}
        preload="metadata"
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload nofullscreen noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        onLoadedMetadata={syncDuration}
        onDurationChange={syncDuration}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={(e) => {
          setPlaying(false);
          e.currentTarget.currentTime = 0;
        }}
        className="block max-h-[480px] max-w-full"
      />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Jeda video" : "Putar video"}
        className="absolute inset-0 flex cursor-pointer items-center justify-center border-0 bg-transparent p-0"
      >
        {!playing && (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/55 text-white">
            <Play size={26} fill="currentColor" className="ml-0.5" />
          </span>
        )}
      </button>

      {duration > 0 && (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/65 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-white">
          {formatDuration(shown)}
        </span>
      )}
    </div>
  );
}

// Lampiran sebuah post: satu video, satu gambar, atau deretan geser untuk 2+ gambar.
// Klik gambar membuka tampilan penuh (lightbox) di halaman yang sama.
export default function PostMedia({ media }) {
  const [lightboxAt, setLightboxAt] = useState(null);
  if (!media || media.length === 0) return null;

  const video = media.find((m) => m.type === "video");
  if (video) return <VideoPlayer src={mediaUrl(video.url)} />;

  const images = media.filter((m) => m.type === "image");
  if (images.length === 0) return null;

  return (
    <>
      {images.length === 1 ? (
        // satu gambar: ukuran mengikuti gambar (tidak dipaksa selebar kolom)
        <button
          type="button"
          onClick={() => setLightboxAt(0)}
          aria-label="Perbesar gambar"
          className="mb-3 block max-w-full cursor-zoom-in overflow-hidden rounded-lg border border-gray-100 bg-gray-50 p-0"
        >
          <img
            src={mediaUrl(images[0].url)}
            alt="Lampiran post"
            loading="lazy"
            className="block h-auto max-h-[480px] w-auto max-w-full"
          />
        </button>
      ) : (
        <ImageStrip images={images} onOpen={setLightboxAt} />
      )}

      {lightboxAt !== null && (
        <Lightbox
          images={images}
          index={lightboxAt}
          setIndex={setLightboxAt}
          onClose={() => setLightboxAt(null)}
        />
      )}
    </>
  );
}