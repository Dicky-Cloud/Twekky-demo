// src/components/ScrollTabs.jsx
// Deretan tab yang bisa digeser tanpa scrollbar: jari di HP, seret dengan mouse di desktop.
// Tepi yang masih menyimpan tab memudar sebagai petunjuk, dan tab aktif otomatis
// digulir ke tengah (activeKey berubah -> posisi menyesuaikan).
import { useCallback, useEffect, useState, Children } from "react";
import { useDragScroll } from "./PostMedia";

const FADE = 28; // lebar pemudaran di tepi (px)

export default function ScrollTabs({ activeKey, className = "", children, ...rest }) {
  const { ref, movedRef, dragging, onPointerDown } = useDragScroll();
  const [edge, setEdge] = useState({ left: false, right: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setEdge((p) => (p.left === left && p.right === right ? p : { left, right }));
  }, [ref]);

  const count = Children.count(children);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [ref, measure, count]);

  useEffect(() => {
    const el = ref.current;
    const tab = el?.querySelector('[aria-selected="true"]');
    if (!el || !tab) return;
    const target = tab.offsetLeft - (el.clientWidth - tab.offsetWidth) / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [ref, activeKey]);

  const l = edge.left ? `transparent 0, black ${FADE}px` : "black 0";
  const r = edge.right ? `black calc(100% - ${FADE}px), transparent 100%` : "black 100%";
  const mask = `linear-gradient(to right, ${l}, ${r})`;

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      // setelah menyeret, jangan teruskan klik ke tab di bawah kursor
      onClickCapture={(e) => {
        if (movedRef.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      style={{ WebkitMaskImage: mask, maskImage: mask }}
      className={`relative flex max-w-full min-w-0 select-none items-center gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        dragging ? "cursor-grabbing" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
