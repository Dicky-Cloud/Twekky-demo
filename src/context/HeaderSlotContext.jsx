import { createContext, useContext } from "react";

// Elemen DOM bar navigasi atas (diisi AppShell). Topbar masing-masing halaman
// merender isinya ke elemen ini lewat portal, jadi halaman tidak perlu diubah.
export const HeaderSlotContext = createContext(null);
export const useHeaderSlot = () => useContext(HeaderSlotContext);
