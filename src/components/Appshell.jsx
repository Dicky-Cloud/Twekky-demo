import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import ComposeFab from "./ComposeFab";
import { HeaderSlotContext } from "../context/HeaderSlotContext";

// Kerangka aplikasi: sidebar setinggi layar di kiri (memuat logo), bar atas tipis di kanan.
// Isi bar (judul halaman, pencarian, notifikasi, akun) berasal dari <Topbar />
// tiap halaman yang dirender ke slot lewat portal. Bar tidak bergaris: garis tipis
// hanya muncul selama halaman sedang di-scroll, lalu memudar saat scroll berhenti.
const SCROLL_IDLE_MS = 250; // jeda tanpa scroll sebelum garis menghilang
export default function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [slot, setSlot] = useState(null);
  const [scrolling, setScrolling] = useState(false);
  const [navHidden, setNavHidden] = useState(false); // bar bawah + tombol melayang (HP)
  const { pathname } = useLocation();

  // pindah halaman: bar bawah selalu tampil lagi
  useEffect(() => setNavHidden(false), [pathname]);

  useEffect(() => {
    let idleTimer;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      // di paling atas halaman tidak ada konten di bawah bar, jadi garis tidak perlu
      setScrolling(y > 4);
      // bar bawah dan tombol melayang: sembunyi saat menggulir ke bawah,
      // muncul lagi saat menggulir ke atas atau saat scroll berhenti
      const dy = y - lastY;
      if (Math.abs(dy) >= 8) {
        setNavHidden(dy > 0 && y > 80);
        lastY = y;
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setScrolling(false);
        setNavHidden(false);
      }, SCROLL_IDLE_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(idleTimer);
    };
  }, []);

  return (
    <HeaderSlotContext.Provider value={slot}>
      <div className="flex min-h-screen bg-white">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={`sticky top-0 z-30 h-[6.5rem] shrink-0 border-b bg-white md:h-16 transition-colors duration-300 ${
              scrolling ? "border-gray-200" : "border-transparent"
            }`}
          >
            <div ref={setSlot} className="h-full min-w-0" />
          </header>
          {/* tinggi minimum halaman dikurangi tinggi bar atas supaya tidak ada scroll berlebih */}
          {/* di HP ada ruang di bawah untuk bar navigasi bawah */}
          <main className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0 [&>*]:!min-h-[calc(100vh-6.5rem)] md:[&>*]:!min-h-[calc(100vh-4rem)]">{children}</main>
        </div>
      </div>
      <MobileNav hidden={navHidden} />
      <ComposeFab hidden={navHidden} />
    </HeaderSlotContext.Provider>
  );
}