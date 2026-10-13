// src/components/PostMenu.jsx
// Menu titik tiga (⋯) pada post: salin tautan, sembunyikan, laporkan, blokir, hapus.
// Selalu tampil (terjangkau di HP dan keyboard). Daftarnya dirender lewat portal
// supaya tidak terpotong oleh daftar feed yang memakai overflow-hidden.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Link2, EyeOff, Flag, Ban, Trash2 } from "lucide-react";

export default function PostMenu({ post, isOwn, loggedIn, reported, onReport, onHide, onBlock, onDelete, onNotify }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const close = (refocus = false) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  };

  // letakkan menu di bawah tombol (atau di atas bila tidak muat)
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const h = menuRef.current?.offsetHeight || 200;
    const below = r.bottom + 4 + h <= window.innerHeight;
    setPos({
      right: Math.max(8, window.innerWidth - r.right),
      ...(below ? { top: r.bottom + 4 } : { bottom: window.innerHeight - r.top + 4 }),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector('[role="menuitem"]:not([disabled])')?.focus();
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onAway = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onAway, true);
    window.addEventListener("resize", onAway);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onAway, true);
      window.removeEventListener("resize", onAway);
    };
  }, [open, pos !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMenuKey = (e) => {
    const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])') || []);
    const i = items.indexOf(document.activeElement);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const run = (fn) => () => {
    close(true);
    fn?.();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      onNotify?.("Tautan disalin.");
    } catch {
      onNotify?.("Tautan tidak bisa disalin di perangkat ini.");
    }
  };

  const canBlock = loggedIn && !isOwn && !post.is_anonymous && !!post.author_id;
  const item =
    "flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-3.5 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Opsi postingan"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <MoreHorizontal size={18} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Opsi postingan"
            onKeyDown={onMenuKey}
            style={{ position: "fixed", zIndex: 60, visibility: pos ? "visible" : "hidden", ...(pos || { top: 0, right: 0 }) }}
            className="w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          >
            <button type="button" role="menuitem" className={item} onClick={run(copyLink)}>
              <Link2 size={16} /> Salin tautan
            </button>
            <button type="button" role="menuitem" className={item} onClick={run(() => onHide?.(post))}>
              <EyeOff size={16} /> Sembunyikan post
            </button>
            {!isOwn && (
              <button
                type="button"
                role="menuitem"
                className={item}
                disabled={reported}
                onClick={run(() => onReport?.(post))}
              >
                <Flag size={16} /> {reported ? "Sudah dilaporkan" : "Laporkan"}
              </button>
            )}
            {canBlock && (
              <button type="button" role="menuitem" className={`${item} text-red-600`} onClick={run(() => onBlock?.(post))}>
                <Ban size={16} /> Blokir pengguna
              </button>
            )}
            {isOwn && (
              <button type="button" role="menuitem" className={`${item} text-red-600`} onClick={run(() => onDelete?.(post))}>
                <Trash2 size={16} /> Hapus postingan
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
