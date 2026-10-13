import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Building2 } from "lucide-react";
import { api } from "../api/client";

export const USER_SEARCH_MIN = 2;
const DEBOUNCE_MS = 300;

export function initialsOf(name) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

// Daftar hasil pencarian pengguna untuk kata kunci `query`. Komponen ini hanya
// mengurus pengambilan data dan tampilan hasil; kolom ketiknya disediakan oleh
// pemakai (Topbar, halaman Pesan). Klik satu hasil memanggil onSelect(user).
// onOpenProfile (opsional): bila diberikan, klik baris membuka profil dan tombol
// "Pesan" terpisah memanggil onSelect. Tanpa onOpenProfile, klik baris langsung
// memanggil onSelect (perilaku lama, dipakai halaman Pesan).
export default function UserSearchResults({ query, onSelect, onOpenProfile, onSeeAll, className = "" }) {
  const q = (query || "").trim();
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [error, setError] = useState("");
  const seq = useRef(0);

  useEffect(() => {
    if (q.length < USER_SEARCH_MIN) {
      seq.current += 1;
      setStatus("idle");
      setResults([]);
      return undefined;
    }
    const mine = ++seq.current;
    setStatus("loading");
    const t = setTimeout(async () => {
      try {
        const data = await api.searchUsers(q);
        if (seq.current !== mine) return; // sudah ada pencarian yang lebih baru
        setResults(Array.isArray(data) ? data : []);
        setStatus("done");
      } catch (err) {
        if (seq.current !== mine) return;
        setError(err.message || "Gagal mencari pengguna");
        setStatus("error");
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q]);

  if (status === "idle") return null;

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden text-left ${className}`}
      role="listbox"
      aria-label="Hasil pencarian pengguna"
    >
      <div className="px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
        Pengguna
      </div>

      {status === "loading" && results.length === 0 && (
        <div className="px-3.5 py-3 text-sm text-gray-500">Mencari...</div>
      )}
      {status === "error" && <div className="px-3.5 py-3 text-sm text-danger">{error}</div>}
      {status === "done" && results.length === 0 && (
        <div className="px-3.5 py-3 text-sm text-gray-500">
          Tidak ada pengguna dengan nama &ldquo;{q}&rdquo;.
        </div>
      )}

      <ul className="m-0 p-0 list-none max-h-80 overflow-y-auto">
        {results.map((u) => (
          <li key={u.id} className={onOpenProfile ? "flex items-center hover:bg-gray-50" : undefined}>
            <button
              type="button"
              role="option"
              onClick={() => (onOpenProfile ? onOpenProfile(u) : onSelect(u))}
              title={onOpenProfile ? "Buka profil" : undefined}
              className={`flex ${onOpenProfile ? "min-w-0 flex-1" : "w-full"} items-center gap-3 border-0 bg-transparent px-3.5 py-2.5 text-left cursor-pointer ${onOpenProfile ? "" : "hover:bg-gray-50"}`}
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-soft text-brand font-bold text-xs shrink-0">
                {initialsOf(u.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <span className="truncate">{u.name}</span>
                  {u.verification_status === "verified" && (
                    <BadgeCheck size={15} className="text-brand shrink-0" aria-label="Terverifikasi" />
                  )}
                  {u.is_pro && (
                    <span className="rounded bg-brand-soft px-1.5 py-px text-[10px] font-bold text-brand shrink-0">
                      PRO
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500 truncate">
                  {u.account_type === "business" && u.company_name ? (
                    <>
                      <Building2 size={12} className="shrink-0" />
                      <span className="truncate">{u.company_name}</span>
                    </>
                  ) : (
                    <span className="truncate">{u.bio || "Pengguna Twekky"}</span>
                  )}
                </span>
              </span>
              {!onOpenProfile && <span className="text-xs font-semibold text-brand shrink-0">Pesan</span>}
            </button>
            {onOpenProfile && (
              <button
                type="button"
                onClick={() => onSelect(u)}
                className="mr-2.5 shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-transparent px-2.5 py-1 text-xs font-semibold text-brand hover:bg-white"
              >
                Pesan
              </button>
            )}
          </li>
        ))}
      </ul>

      {onSeeAll && (
        <button
          type="button"
          onClick={onSeeAll}
          className="w-full cursor-pointer border-0 border-t border-gray-100 bg-transparent px-3.5 py-2.5 text-left text-sm font-semibold text-brand hover:bg-gray-50"
        >
          Lihat semua hasil untuk &ldquo;{q}&rdquo;
        </button>
      )}
    </div>
  );
}
