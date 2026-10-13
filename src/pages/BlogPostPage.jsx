import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Link2, Check } from "lucide-react";
import Topbar from "../components/Topbar";
import { BLOG_POSTS, CATEGORY_COVER, getPost, getAuthor, formatPostDate } from "../constants/blog";

function initialsOf(name = "") {
  return name.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = getPost(slug);
  const [copied, setCopied] = useState(false);

  if (!post) {
    return (
      <>
        <Topbar title="Blog" />
        <div className="mx-auto max-w-2xl p-6 text-center lg:p-8">
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16">
            <h2 className="m-0 mb-1 text-lg font-bold text-gray-900">Artikel tidak ditemukan</h2>
            <p className="m-0 mb-5 text-sm text-gray-500">Artikel yang kamu cari mungkin sudah dipindahkan atau dihapus.</p>
            <Link to="/blog" className="btn btn-accent btn-sm">
              Kembali ke Blog
            </Link>
          </div>
        </div>
      </>
    );
  }

  const author = getAuthor(post.author);

  // utamakan artikel sekategori, lalu yang terbaru
  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug)
    .sort((a, b) => (b.category === post.category) - (a.category === post.category) || new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard tidak tersedia */
    }
  };

  return (
    <>
      <Topbar title="Blog" />
      <div className="mx-auto w-full max-w-3xl p-6 lg:p-8">
        {/* breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-[13px] text-gray-500" aria-label="Breadcrumb">
          <Link to="/blog" className="inline-flex items-center gap-1.5 font-medium hover:text-brand transition-colors">
            <ArrowLeft size={14} /> Blog
          </Link>
          <span>/</span>
          <span className="font-semibold text-brand">{post.category}</span>
        </nav>

        <article>
          <h1 className="m-0 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">{post.title}</h1>
          <p className="mt-4 mb-0 text-lg leading-relaxed text-gray-600">{post.excerpt}</p>

          {/* penulis & meta */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-gray-200 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-[#6b6b6b] text-sm font-bold text-white">
                {initialsOf(author.name)}
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-gray-900">{author.name}</div>
                <div className="text-xs text-gray-500">{author.role}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[13px] text-gray-500">
              <span>{formatPostDate(post.date)}</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={13} /> {post.readMins} menit baca
              </span>
              <button type="button" onClick={handleCopy} className="btn btn-ghost btn-sm">
                {copied ? <Check size={14} className="text-success" /> : <Link2 size={14} />}
                {copied ? "Tertaut!" : "Salin tautan"}
              </button>
            </div>
          </div>

          {/* sampul */}
          <div
            className={`relative my-8 h-52 overflow-hidden rounded-2xl bg-gradient-to-br sm:h-72 ${CATEGORY_COVER[post.category]}`}
          >
            <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/15" />
            <div className="absolute -bottom-16 left-10 h-52 w-52 rounded-full bg-white/10" />
          </div>

          {/* isi */}
          <div className="flex flex-col gap-5 text-[16px] leading-[1.85] text-gray-700">
            {post.content.map((block, i) => {
              if (block.t === "h")
                return (
                  <h2 key={i} className="m-0 mt-4 text-xl font-bold text-gray-900">
                    {block.text}
                  </h2>
                );
              if (block.t === "q")
                return (
                  <blockquote
                    key={i}
                    className="m-0 border-l-4 border-brand bg-brand-soft/60 px-5 py-3 text-lg font-medium italic text-gray-800"
                  >
                    {block.text}
                  </blockquote>
                );
              if (block.t === "ul")
                return (
                  <ul key={i} className="m-0 flex list-disc flex-col gap-2 pl-6 marker:text-brand">
                    {block.items.map((it, j) => (
                      <li key={j}>{it}</li>
                    ))}
                  </ul>
                );
              return (
                <p key={i} className="m-0">
                  {block.text}
                </p>
              );
            })}
          </div>

          {/* tag */}
          {post.tags?.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span key={t} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* kotak penulis */}
        <div className="mt-8 flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand">
            {initialsOf(author.name)}
          </span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ditulis oleh</div>
            <div className="text-sm font-bold text-gray-900">{author.name}</div>
            <div className="text-xs text-gray-500">{author.role} di Twekky</div>
          </div>
        </div>

        {/* artikel lain */}
        {related.length > 0 && (
          <section className="mt-12">
            <h3 className="m-0 mb-4 text-lg font-bold text-gray-900">Artikel lainnya</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {related.map((p) => (
                <Link key={p.slug} to={`/blog/${p.slug}`} className="group flex flex-col gap-3">
                  <div className={`h-28 rounded-xl bg-gradient-to-br ${CATEGORY_COVER[p.category]}`} />
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-brand">{p.category}</div>
                    <div className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-gray-900 group-hover:text-brand">
                      {p.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
