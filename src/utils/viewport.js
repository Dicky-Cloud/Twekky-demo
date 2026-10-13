import { useEffect, useState } from "react";

// Batas "HP" sama dengan breakpoint md Tailwind (768px): di bawahnya tampilan mobile.
const MOBILE_QUERY = "(max-width: 767px)";

export function isMobileViewport() {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;
}

// Versi hook: komponen ikut render ulang bila layar berubah lebar (mis. HP diputar).
export function useIsMobile() {
  const [mobile, setMobile] = useState(isMobileViewport);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setMobile(e.matches);
    setMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return mobile;
}
