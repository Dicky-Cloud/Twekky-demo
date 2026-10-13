import { createContext, useContext, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Crown } from "lucide-react";
import { useAuth } from "./AuthContext";

// Pintu ke halaman Premium (/premium). Tidak ada modal: fitur terkunci membawa
// pengguna ke halaman itu, lengkap dengan alasan dan halaman asal.
//   openPro(alasan)                       -> halaman Premium, paket Pro disorot
//   openSubscription({ tab, reason })     -> tab "pro" | "business"
const ProContext = createContext({ isPro: false, openPro: () => {}, openSubscription: () => {} });
export const usePro = () => useContext(ProContext);

// Penanda mahkota kecil untuk fitur langganan.
export function ProCrown({ size = 13, className = "" }) {
  return (
    <Crown
      size={size}
      aria-label="Fitur Pro"
      className={`text-yellow-500 fill-yellow-400 shrink-0 ${className}`}
    />
  );
}

export function ProProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const openSubscription = useCallback(
    ({ tab = "pro", reason = "" } = {}) => {
      // Dari halaman Premium sendiri, pertahankan halaman asal yang sudah ada.
      const from =
        location.pathname === "/premium" ? location.state?.from || "" : location.pathname + location.search;
      navigate("/premium", { state: { tab, reason, from } });
    },
    [navigate, location.pathname, location.search, location.state]
  );
  const openPro = useCallback((why = "") => openSubscription({ tab: "pro", reason: why }), [openSubscription]);

  const value = useMemo(
    () => ({ isPro: Boolean(user?.is_pro), openPro, openSubscription }),
    [user?.is_pro, openPro, openSubscription]
  );

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}
