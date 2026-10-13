import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, GraduationCap, Banknote, BadgeCheck, CalendarDays, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { TOPICS, topicLabel } from "../constants/topics";
import { formatRupiah } from "../constants/mentors";
import { useMentorDb, allMentors, mentorStats, myMentor, myApplication } from "../api/mentorStore";
import Topbar from "../components/Topbar";
import { Avatar, Rating, MentorNav, EmptyState } from "../components/mentor/MentorUi";

const PRICE_OPTIONS = [
  { v: 0, label: "Semua harga" },
  { v: 100000, label: "≤ Rp100.000" },
  { v: 150000, label: "≤ Rp150.000" },
  { v: 200000, label: "≤ Rp200.000" },
];
const RATING_OPTIONS = [
  { v: 0, label: "Semua rating" },
  { v: 4.5, label: "4,5 ke atas" },
  { v: 4.8, label: "4,8 ke atas" },
];
const SORTS = [
  { v: "rating", label: "Rating tertinggi" },
  { v: "sessions", label: "Sesi terbanyak" },
  { v: "price-asc", label: "Harga terendah" },
  { v: "price-desc", label: "Harga tertinggi" },
];

const selectCls =
  "rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand";

export default function MentorPage({ embedded = false }) {
  // Saat beta (halaman utama, bukan embedded) scroll halaman dikunci supaya lapisan blur tetap menutup.
  useEffect(() => {
    if (embedded) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [embedded]);

  const { user } = useAuth();
  const db = useMentorDb();
  const mine = myMentor(db, user?.id);
  const application = myApplication(db, user?.id);

  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [maxPrice, setMaxPrice] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("rating");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = allMentors(db)
      .map((m) => ({ m, stats: mentorStats(db, m) }))
      .filter(({ m }) => !topic || m.topic === topic)
      .filter(({ m }) => !maxPrice || m.price <= maxPrice)
      .filter(({ stats }) => !minRating || stats.rating >= minRating)
      .filter(({ m }) => !onlyAvailable || m.available !== false)
      .filter(({ m }) => {
        if (!q) return true;
        const hay = [m.name, m.title, m.org, m.bio, topicLabel(m.topic), ...m.expertise].join(" ").toLowerCase();
        return hay.includes(q);
      });
    const by = {
      rating: (a, b) => b.stats.rating - a.stats.rating,
      sessions: (a, b) => b.stats.sessions - a.stats.sessions,
      "price-asc": (a, b) => a.m.price - b.m.price,
      "price-desc": (a, b) => b.m.price - a.m.price,
    }[sort];
    return list.sort(by);
  }, [db, query, topic, maxPrice, minRating, sort, onlyAvailable]);

  const reset = () => {
    setQuery(""); setTopic(""); setMaxPrice(0); setMinRating(0); setSort("rating"); setOnlyAvailable(false);
  };
  const filtered = query || topic || maxPrice || minRating || onlyAvailable;

  const cta = mine
    ? { to: "/mentor/dashboard", label: "Buka Dashboard Mentor", icon: LayoutDashboard }
    : { to: "/profil?pengaturan=mentor", label: application ? "Lihat status pengajuan" : "Jadi Mentor", icon: Banknote };

  // Area konten dikunci tingginya dan tidak bisa di-scroll; sidebar dan header tetap terlihat.
  return (
    <div className="relative h-[calc(100vh-6.5rem)] overflow-hidden md:h-[calc(100vh-4rem)]">
      {!embedded && <Topbar title="Mentor" />}
      <div className={embedded ? "w-full" : "mx-auto w-full max-w-6xl p-6 lg:p-8"}>
        <div className="mb-6 flex flex-col gap-5 rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-8 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <GraduationCap size={32} strokeWidth={2} />
              <h2 className="m-0 text-2xl font-bold">Mentor Twekky</h2>
            </div>
            <p className="m-0 max-w-[52ch] text-sm opacity-90">
              Belajar langsung dari profesional lewat sesi 1-on-1: review CV, persiapan wawancara, sampai arah karier. Bayar per sesi, tanpa langganan.
            </p>
          </div>
          {user && (
            <Link to={cta.to} className="flex shrink-0 items-center gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 no-underline md:self-auto">
              <cta.icon size={17} className="text-brand" /> {cta.label}
            </Link>
          )}
        </div>

        <MentorNav />

        <div className="mb-3 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-gray-500">
            <Search size={16} strokeWidth={2} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama, jabatan, perusahaan, atau keahlian..."
              className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>
        </div>
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className={selectCls}>
            <option value="">Semua topik</option>
            {TOPICS.map((t) => <option key={t.slug} value={t.slug}>{t.label}</option>)}
          </select>
          <select value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className={selectCls}>
            {PRICE_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
          </select>
          <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className={selectCls}>
            {RATING_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectCls}>
            {SORTS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
          </select>
          <label className="flex cursor-pointer items-center gap-2 px-2 text-sm text-gray-700">
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} /> Hanya yang menerima pesanan
          </label>
          <span className="ml-auto text-xs text-gray-500">{rows.length} mentor</span>
          {filtered && <button type="button" onClick={reset} className="border-none bg-transparent text-xs font-semibold text-brand hover:underline">Reset</button>}
        </div>

        {rows.length === 0 ? (
          <EmptyState>Belum ada mentor yang cocok dengan filter ini.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rows.map(({ m, stats }) => (
              <Link
                key={m.id}
                to={`/mentor/${m.id}`}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 text-inherit no-underline shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-3.5">
                  <Avatar name={m.name} />
                  <div className="min-w-0">
                    <h3 className="m-0 flex items-center gap-1.5 truncate text-[15px] font-bold text-gray-900">
                      <span className="truncate">{m.name}</span>
                      {m.verified && <BadgeCheck size={15} className="shrink-0 text-success" aria-label="Terverifikasi" />}
                    </h3>
                    <div className="truncate text-[13px] text-gray-600">{m.title}</div>
                    <div className="mt-1"><Rating stats={stats} /></div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">{topicLabel(m.topic)}</span>
                  {m.expertise.slice(0, 2).map((x) => (
                    <span key={x} className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">{x}</span>
                  ))}
                </div>
                <p className="m-0 mt-3 line-clamp-3 text-[13px] leading-relaxed text-gray-600">{m.bio}</p>

                <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                  <div>
                    <div className="text-sm font-bold text-gray-900">{formatRupiah(m.price)}</div>
                    <div className="text-[11px] text-gray-500">per sesi · 60 menit</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[11px] text-gray-500">
                    <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {m.slots.length} jadwal/minggu</span>
                    {m.available === false && <span className="font-semibold text-amber-700">Tidak menerima pesanan</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      {/* Lapisan beta: menutup seluruh konten halaman dengan blur */}
      <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden bg-white/40 p-6 backdrop-blur-md">
        <div className="max-w-sm rounded-2xl bg-white/90 px-6 py-6 text-center shadow-lg ring-1 ring-gray-200">
          <span className="inline-flex items-center rounded-full bg-brand-soft px-3 py-1 text-xs font-bold tracking-wide text-brand">
            FITUR BETA
          </span>
          <h2 className="m-0 mt-3 text-lg font-bold text-gray-900">Mentor sedang dalam tahap beta</h2>
          <p className="m-0 mt-2 text-sm leading-relaxed text-gray-600">
            Fitur bimbingan karier ini masih kami uji. Pengalaman lengkapnya akan segera hadir.
          </p>
        </div>
      </div>
    </div>
  );
}