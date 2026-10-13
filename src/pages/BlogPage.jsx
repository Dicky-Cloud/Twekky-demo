import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";
import {
  BLOG_POSTS,
  BLOG_CATEGORIES,
  CATEGORY_COVER,
  getAuthor,
  formatPostDate,
} from "../constants/blog";

const PAGE_SIZE = 6;

function initialsOf(name = "") {
  return name.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
}

function Cover({ post, className = "" }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${CATEGORY_COVER[post.category]} ${className}`}>
      <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/15" />
      <div className="absolute -bottom-14 left-6 h-40 w-40 rounded-full bg-white/10" />
    </div>
  );
}

function ByLine({ post }) {
  const author = getAuthor(post.author);
  return (
    <div className="flex items-center gap-2.5 text-xs text-gray-500">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">
        {initialsOf(author.name)}
      </span>
      <div className="min-w-0 leading-tight">
        <div className="truncate font-semibold text-gray-800">{author.name}</div>
        <div className="flex items-center gap-1.5">
          <span>{formatPostDate(post.date)}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock size={11} /> {post.readMins} mnt
          </span>
        </div>
      </div>
    </div>
  );
}

export default function BlogPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const sorted = useMemo(() => [...BLOG_POSTS].sort((a, b) => new Date(b.date) - new Date(a.date)), []);

  const filtering = category !== "Semua" || query.trim() !== "";

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted
      .filter((p) => category === "Semua" || p.category === category)
      .filter(
        (p) =>
          !q ||
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
  }, [sorted, query, category]);

  // Artikel utama hanya tampil di tampilan awal (tanpa filter/pencarian).
  const featured = !filtering ? sorted.find((p) => p.featured) || sorted[0] : null;
  const gridPosts = featured ? matches.filter((p) => p.slug !== featured.slug) : matches;
  const shown = gridPosts.slice(0, visible);

  const changeCategory = (c) => {
    setCategory(c);
    setVisible(PAGE_SIZE);
  };
  const changeQuery = (v) => {
    setQuery(v);
    setVisible(PAGE_SIZE);
  };

  return (
    <>
      <Topbar title="Blog" />
      <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
        {/* header */}
        <header className="mb-8 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-brand">Blog Twekky</span>
          <h2 className="m-0 mt-2 text-3xl font-bold leading-tight text-gray-900">
            Kabar, cerita, dan pembelajaran dari tim Twekky
          </h2>
          <p className="m-0 mt-3 text-[15px] leading-relaxed text-gray-600">
            Pengumuman produk, panduan komunitas, cerita di balik layar, dan tips karier untuk talenta maupun perusahaan.
          </p>
        </header>

        {/* artikel utama */}
        {featured && (
          <Link
            to={`/blog/${featured.slug}`}
            className="group mb-10 grid overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md md:grid-cols-2"
          >
            <Cover post={featured} className="min-h-[200px] md:min-h-[300px]" />
            <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-bold text-brand">
                  {featured.category}
                </span>
                <span className="text-xs text-gray-400">Artikel utama</span>
              </div>
              <h3 className="m-0 text-2xl font-bold leading-snug text-gray-900 group-hover:text-brand">
                {featured.title}
              </h3>
              <p className="m-0 text-sm leading-relaxed text-gray-600">{featured.excerpt}</p>
              <ByLine post={featured} />
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
                Baca selengkapnya <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        )}

        {/* kategori & pencarian */}
        <div className="mb-6 flex flex-col gap-3 border-b border-gray-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-1 overflow-x-auto">
            {["Semua", ...BLOG_CATEGORIES].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => changeCategory(c)}
                className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-colors cursor-pointer border-none ${
                  category === c ? "bg-brand-soft text-brand" : "bg-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-gray-500 md:w-64">
            <Search size={16} strokeWidth={2} />
            <input
              type="text"
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
              placeholder="Cari artikel atau tag..."
              className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* grid artikel */}
        {gridPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center text-sm text-gray-500">
            Tidak ada artikel yang cocok dengan pencarianmu.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((post) => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="group flex flex-col">
                  <Cover post={post} className="h-44 rounded-2xl" />
                  <div className="mt-4 flex flex-1 flex-col gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-brand">{post.category}</span>
                    <h3 className="m-0 text-[17px] font-bold leading-snug text-gray-900 group-hover:text-brand">
                      {post.title}
                    </h3>
                    <p className="m-0 line-clamp-3 text-[13px] leading-relaxed text-gray-600">{post.excerpt}</p>
                    <div className="mt-auto pt-3">
                      <ByLine post={post} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {gridPosts.length > shown.length && (
              <div className="mt-10 text-center">
                <button type="button" className="btn btn-ghost" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                  Muat lebih banyak
                </button>
                <p className="m-0 mt-2 text-xs text-gray-400">
                  Menampilkan {shown.length} dari {gridPosts.length} artikel
                </p>
              </div>
            )}
          </>
        )}

        {/* ajakan bergabung */}
        <section className="mt-14 flex flex-col items-start justify-between gap-5 rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-8 text-white md:flex-row md:items-center">
          <div>
            <h3 className="m-0 text-xl font-bold">Jadi bagian dari komunitas Twekky</h3>
            <p className="m-0 mt-1.5 max-w-[48ch] text-sm opacity-90">
              Diskusikan karier, temukan lowongan, dan bertumbuh bersama profesional lain.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2.5">
            {user ? (
              <>
                <Link to="/komunitas" className="btn btn-white">
                  Jelajahi Komunitas
                </Link>
                <Link
                  to="/lowongan-kerja"
                  className="btn border border-white/40 bg-transparent text-white hover:bg-white/10"
                >
                  Lihat Lowongan
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-white">
                  Daftar Gratis
                </Link>
                <Link to="/login" className="btn border border-white/40 bg-transparent text-white hover:bg-white/10">
                  Masuk
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
