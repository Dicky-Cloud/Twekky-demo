import { useState } from "react";
import { Check } from "lucide-react";
import Modal from "../Modal";
import ThemedBubble from "./ThemedBubble";
import { usePro, ProCrown } from "../../context/ProContext";
import { useMyBubbleTheme } from "../../context/BubbleThemeContext";
import { BUBBLE_THEMES, DEFAULT_THEME_ID } from "../../constants/bubbleThemes";

// Jendela pemilih gaya bubble. Pilihan tersimpan di akun dan langsung berlaku
// di Pesan dan di isi post Feed. Tema Pro boleh dilihat pratinjaunya oleh semua
// orang; memilihnya dari akun non-Pro membawa ke halaman Premium.
export default function BubbleThemePicker({ onClose }) {
  const { openPro } = usePro();
  const { themeId, setTheme, canUse } = useMyBubbleTheme();
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const current = themeId || DEFAULT_THEME_ID;

  const choose = async (theme) => {
    setError("");
    if (!canUse(theme)) {
      onClose();
      openPro("Gaya bubble chat bertema khusus Premium");
      return;
    }
    if (theme.id === current || !setTheme) return;
    setBusyId(theme.id);
    try {
      await setTheme(theme.id);
    } catch (err) {
      setError(err.message || "Gagal menyimpan gaya bubble");
    } finally {
      setBusyId("");
    }
  };

  return (
    <Modal title="Gaya bubble chat" onClose={onClose} maxWidth="max-w-2xl">
      <p className="mb-4 mt-0 text-sm text-gray-600">
        Gaya yang kamu pilih tampil di pesan yang kamu kirim dan di isi post kamu di Feed.
      </p>
      {error && (
        <div className="mb-3 rounded-lg border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>
      )}
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        {BUBBLE_THEMES.map((theme) => {
          const selected = theme.id === current;
          const locked = !canUse(theme);
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => choose(theme)}
              disabled={Boolean(busyId)}
              aria-pressed={selected}
              className={`flex cursor-pointer flex-col gap-2 rounded-xl border bg-white p-3 text-left transition-colors disabled:cursor-wait ${
                selected ? "border-brand ring-2 ring-brand" : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-gray-900">{theme.name}</span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  {theme.pro && <ProCrown size={13} />}
                  {theme.pro ? "Premium" : "Gratis"}
                  {selected && <Check size={15} strokeWidth={2.5} className="text-brand" aria-label="Dipilih" />}
                </span>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 pb-4 pt-9">
                {theme.plain ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-sm text-white">
                    Halo, apa kabar?
                  </div>
                ) : (
                  <ThemedBubble themeId={theme.id} className="max-w-[85%] px-4 py-2.5 text-sm">
                    Halo, apa kabar?
                  </ThemedBubble>
                )}
              </div>
              {locked && <span className="text-xs text-gray-500">Lihat pratinjau, buka dengan Premium</span>}
              {busyId === theme.id && <span className="text-xs text-gray-500">Menyimpan...</span>}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
