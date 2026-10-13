import { useEffect, useRef } from "react";
import { X } from "lucide-react";

// Modal dasar: klik di luar kotak atau tekan Escape untuk menutup.
export default function Modal({ title, onClose, children, maxWidth = "max-w-md" }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Focus trap: fokus masuk ke dialog, Tab berputar di dalamnya, lalu kembali ke pemicu saat ditutup.
  const dialogRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const el = dialogRef.current;
    if (el && !el.contains(document.activeElement)) el.focus();
    return () => previous?.focus?.();
  }, []);

  const trapTab = (e) => {
    if (e.key !== "Tab") return;
    const el = dialogRef.current;
    if (!el) return;
    const list = Array.from(
      el.querySelectorAll('a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')
    ).filter((n) => n.offsetParent !== null);
    if (list.length === 0) {
      e.preventDefault();
      el.focus();
      return;
    }
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={trapTab}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${maxWidth} outline-none max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="m-0 text-base font-bold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <X size={17} strokeWidth={2} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
