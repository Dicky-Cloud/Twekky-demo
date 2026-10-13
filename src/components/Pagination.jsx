import { ChevronLeft, ChevronRight } from "lucide-react";

// Deret nomor halaman: tampilkan semua jika sedikit, selain itu dengan "…".
function pageItems(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items = [1];
  if (page > 3) items.push("…");
  for (let p = Math.max(2, page - 1); p <= Math.min(total - 1, page + 1); p++) items.push(p);
  if (page < total - 2) items.push("…");
  items.push(total);
  return items;
}

/**
 * Pagination untuk daftar panjang.
 * - page: halaman aktif (mulai dari 1)
 * - totalPages / total / pageSize: untuk teks "Menampilkan x–y dari z"
 * - onChange(page): dipanggil saat halaman diganti
 * Tidak tampil bila hanya ada satu halaman.
 */
export default function Pagination({ page, totalPages, total, pageSize, onChange }) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav aria-label="Halaman lowongan" className="mt-6 flex flex-col items-center gap-3">
      <p className="m-0 text-xs text-gray-500">
        Menampilkan {from}–{to} dari {total} lowongan
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={`${btn} border-gray-200 bg-white text-gray-600 hover:border-brand`}
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>

        {pageItems(page, totalPages).map((item, i) =>
          item === "…" ? (
            <span key={`gap-${i}`} className="px-1.5 text-sm text-gray-400">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              aria-current={item === page ? "page" : undefined}
              className={`${btn} ${
                item === page
                  ? "border-brand bg-brand text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-brand"
              }`}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          className={`${btn} border-gray-200 bg-white text-gray-600 hover:border-brand`}
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
