import { Link } from "react-router-dom";
import { Eye, EyeOff, Lock, BadgeCheck, Building2, Crown } from "lucide-react";
import { usePro } from "../../context/ProContext";

function initialsOf(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

function Stat({ label, value }) {
  return (
    <div className="py-3 text-center">
      <div className="text-xl font-bold text-gray-900 leading-none">{value}</div>
      <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</div>
    </div>
  );
}

function ViewerRow({ item }) {
  const detail = `${item.visit_days > 1 ? `${item.visit_days} hari berkunjung · ` : ""}terakhir ${timeAgo(item.last_viewed_at)}`;
  const avatar = (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
      {item.anonymous ? <EyeOff size={17} /> : initialsOf(item.name)}
    </span>
  );

  if (item.anonymous) {
    return (
      <li className="flex items-center gap-3 px-4 py-3">
        {avatar}
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-700">Pengunjung anonim</div>
          <div className="text-xs text-gray-500">{detail}</div>
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={`/pengguna/${item.viewer_id}`}
        className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-gray-50"
      >
        {avatar}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
            <span className="truncate">{item.name}</span>
            {item.verified && <BadgeCheck size={14} className="shrink-0 text-brand" aria-label="Terverifikasi" />}
            {item.is_pro && (
              <span className="shrink-0 rounded bg-brand-soft px-1.5 py-px text-[10px] font-bold text-brand">PRO</span>
            )}
          </div>
          {item.company_name && (
            <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
              <Building2 size={12} className="shrink-0" /> <span className="truncate">{item.company_name}</span>
            </div>
          )}
          <div className="text-xs text-gray-500">{detail}</div>
        </div>
      </Link>
    </li>
  );
}

// Daftar palsu (tanpa data nyata) sebagai pratinjau terkunci untuk pengguna Gratis.
function LockedPreview({ onUpgrade, proDays }) {
  return (
    <div className="relative overflow-hidden bg-white sm:rounded-2xl sm:border sm:border-gray-200">
      <ul className="m-0 list-none p-0 divide-y divide-gray-100 select-none blur-sm" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3">
            <span className="h-10 w-10 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-gray-200" />
              <div className="h-2.5 w-1/2 rounded bg-gray-100" />
            </div>
          </li>
        ))}
      </ul>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 px-6 text-center">
        <Lock size={20} className="text-brand" />
        <p className="m-0 text-sm font-semibold text-gray-900">Nama pengunjung khusus Pro</p>
        <p className="m-0 max-w-xs text-xs text-gray-600">
          Lihat siapa saja yang membuka profilmu, lengkap dengan nama atau perusahaan, sampai {proDays} hari ke belakang.
        </p>
        <button type="button" className="btn btn-accent btn-sm mt-1" onClick={onUpgrade}>
          <Crown size={14} /> Lihat dengan Pro
        </button>
      </div>
    </div>
  );
}

// Tab "Pengunjung" di ProfilePage. `data` = respons GET /api/pro/profile-views.
export default function ProfileViewsTab({ data, loading, error, onReload, onOpenPrivacy }) {
  const { openPro } = usePro();

  if (loading && !data) return <p className="text-sm text-gray-500">Memuat pengunjung...</p>;

  if (error && !data) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
        <span>{error}</span>
        <button
          type="button"
          onClick={onReload}
          className="font-semibold underline bg-transparent border-none p-0 cursor-pointer text-danger"
        >
          Coba lagi
        </button>
      </div>
    );
  }
  if (!data) return null;

  const reason = data.list_hidden_reason;
  const items = data.items || [];

  return (
    <div className="space-y-4">
      <section className="bg-white p-0 sm:rounded-2xl sm:border sm:border-gray-200 sm:p-5 sm:shadow-sm">
        <div className="flex items-center gap-2">
          <Eye size={18} className="text-brand" />
          <h3 className="m-0 text-base font-bold text-gray-900">Pengunjung profilmu</h3>
        </div>
        <p className="m-0 mt-1 text-sm text-gray-600">
          <span className="text-2xl font-bold text-gray-900">{data.total_viewers}</span>{" "}
          orang melihat profilmu dalam {data.window_days} hari terakhir.
        </p>
        <div className="mt-4 grid grid-cols-3 divide-x divide-gray-200 border-y border-gray-100 sm:rounded-xl sm:border sm:border-gray-200 sm:bg-gray-50/70">
          <Stat label="7 hari" value={data.viewers_7d} />
          <Stat label="Kunjungan" value={data.total_visits} />
          <Stat label="Anonim" value={data.anonymous_viewers} />
        </div>
        <p className="m-0 mt-3 text-xs text-gray-500">
          Kunjungan berulang dari orang yang sama di hari yang sama dihitung satu hari. Profilmu sendiri tidak dihitung.
        </p>
      </section>

      {reason === "pro_required" && <LockedPreview proDays={data.pro_window_days} onUpgrade={() => openPro("Lihat siapa saja yang melihat profilmu")} />}

      {reason === "anonymous_mode" && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <EyeOff size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            <p className="m-0 font-semibold">Mode anonim sedang aktif</p>
            <p className="m-0 mt-0.5 text-xs leading-relaxed">
              Sistemnya timbal balik: karena identitasmu disembunyikan saat melihat profil orang lain, daftar nama
              pengunjung profilmu juga disembunyikan. Jumlahnya tetap terlihat.
            </p>
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="mt-2 font-semibold underline bg-transparent border-none p-0 cursor-pointer text-amber-900 text-xs"
            >
              Ubah di Pengaturan
            </button>
          </div>
        </div>
      )}

      {!reason && (
        items.length === 0 ? (
          <div className="bg-white px-6 py-10 text-center sm:rounded-2xl sm:border sm:border-dashed sm:border-gray-200">
            <p className="m-0 text-sm font-bold text-gray-900">Belum ada pengunjung</p>
            <p className="m-0 mt-1 text-sm text-gray-500">
              Aktif berdiskusi dan lengkapi profilmu agar lebih mudah ditemukan.
            </p>
          </div>
        ) : (
          <ul className="m-0 list-none overflow-hidden bg-white p-0 divide-y divide-gray-100 sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-sm">
            {items.map((it, i) => (
              <ViewerRow key={it.viewer_id || `anon-${i}`} item={it} />
            ))}
          </ul>
        )
      )}
    </div>
  );
}