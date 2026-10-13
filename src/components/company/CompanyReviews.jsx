import { Pencil, Star, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { timeAgo } from "../../constants/recruitment";
import { Avatar, ErrorBanner } from "../recruitment/StatusBadge";
import { Stars } from "./Stars";

const STATUS_LABEL = { current: "Karyawan saat ini", former: "Mantan karyawan" };
const SORTS = [
  { value: "newest", label: "Terbaru" },
  { value: "highest", label: "Nilai tertinggi" },
  { value: "lowest", label: "Nilai terendah" },
];

// Tampilan kosong: lingkaran merah muda berisi bintang, seperti di Jobstreet.
function EmptyState({ companyName, canWrite, onWrite }) {
  return (
    <div className="flex flex-col items-center text-center py-14">
      <div className="w-24 h-24 rounded-full bg-pink-500 flex flex-col items-center justify-center gap-2.5">
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <Star key={i} size={16} strokeWidth={0} fill="currentColor" className="text-amber-300" />
          ))}
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="block h-[3px] w-10 rounded-full bg-white/90" />
          <span className="block h-[3px] w-7 rounded-full bg-white/90" />
        </div>
      </div>
      <h3 className="text-lg font-bold mt-5 mb-1">Belum ada ulasan</h3>
      <p className="text-sm text-gray-500 m-0 max-w-[40ch]">
        Jadilah yang pertama membagikan pengalaman Anda tentang {companyName}.
      </p>
      {canWrite && (
        <button type="button" className="btn btn-accent mt-5" onClick={onWrite}>
          <Pencil size={15} /> Tulis ulasan
        </button>
      )}
    </div>
  );
}

function Summary({ summary }) {
  return (
    <section className="card grid sm:grid-cols-[auto_1fr_auto] gap-6 items-center">
      <div className="text-center sm:pr-6 sm:border-r border-gray-100">
        <div className="text-5xl font-bold leading-none">{summary.average.toFixed(1)}</div>
        <Stars value={summary.average} size={18} className="mt-2" />
        <div className="text-xs text-gray-500 mt-1.5">{summary.count} ulasan</div>
      </div>

      <div className="flex flex-col gap-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = summary.distribution[star - 1] || 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-3 text-right">{star}</span>
              <Star size={12} strokeWidth={0} fill="currentColor" className="text-amber-400 shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${(n / summary.count) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-gray-400">{n}</span>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <div className="text-3xl font-bold text-brand">{summary.recommend_percent}%</div>
        <div className="text-xs text-gray-500 max-w-[14ch] mx-auto">merekomendasikan perusahaan ini</div>
      </div>
    </section>
  );
}

function Point({ label, tone, children }) {
  return (
    <div className="mt-3">
      <div className={`text-xs font-bold uppercase tracking-wide ${tone === "pro" ? "text-success" : "text-danger"}`}>
        {label}
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed m-0 mt-1">{children}</p>
    </div>
  );
}

function ReviewCard({ review, onEdit, onDelete }) {
  const edited = new Date(review.updated_at) - new Date(review.created_at) > 60000;
  const meta = [STATUS_LABEL[review.employment_status], review.position].filter(Boolean).join(" · ");
  return (
    <article className={`rounded-xl border bg-white p-5 mb-3 ${review.mine ? "border-brand" : "border-gray-200"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={review.anonymous ? "" : review.author_name} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold truncate">{review.author_name}</span>
              {review.mine && (
                <span className="rounded-full bg-brand-soft text-brand text-[11px] font-bold px-2 py-0.5">Ulasan Anda</span>
              )}
            </div>
            {meta && <div className="text-xs text-gray-500">{meta}</div>}
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {timeAgo(review.created_at)}
          {edited ? " (diubah)" : ""}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <Stars value={review.rating} size={16} />
        <h4 className="text-base font-bold m-0">{review.title}</h4>
      </div>

      {review.pros && <Point label="Kelebihan" tone="pro">{review.pros}</Point>}
      {review.cons && <Point label="Kekurangan" tone="con">{review.cons}</Point>}

      <div
        className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium ${
          review.recommend ? "text-success" : "text-gray-500"
        }`}
      >
        {review.recommend ? <ThumbsUp size={15} /> : <ThumbsDown size={15} />}
        {review.recommend ? "Merekomendasikan perusahaan ini" : "Tidak merekomendasikan perusahaan ini"}
      </div>

      {review.mine && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit}>
            <Pencil size={13} /> Ubah
          </button>
          <button type="button" className="btn btn-ghost btn-sm !text-danger" onClick={onDelete}>
            <Trash2 size={13} /> Hapus
          </button>
        </div>
      )}
    </article>
  );
}

// Isi tab "Ulasan" pada halaman perusahaan. State & pemanggilan API ada di CompanyPage.
export default function CompanyReviews({ companyName, data, error, sort, onSort, canWrite, onWrite, onEdit, onDelete }) {
  if (!data) {
    return error ? <ErrorBanner>{error}</ErrorBanner> : <p className="text-gray-500 text-sm">Memuat ulasan...</p>;
  }
  const { summary, reviews } = data;

  if (summary.count === 0) {
    return (
      <>
        <ErrorBanner>{error}</ErrorBanner>
        <EmptyState companyName={companyName} canWrite={canWrite} onWrite={onWrite} />
      </>
    );
  }

  return (
    <>
      <ErrorBanner>{error}</ErrorBanner>
      <Summary summary={summary} />
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-base font-bold m-0">Ulasan ({summary.count})</h3>
        <select
          className="field-input !w-auto !py-1.5 text-[13px]"
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          aria-label="Urutkan ulasan"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
}
