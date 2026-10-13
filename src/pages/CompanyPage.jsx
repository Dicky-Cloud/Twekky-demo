import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BadgeCheck, Pencil } from "lucide-react";
import { api, companyImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";
import { BoostedBadge } from "../components/recruitment/StatusBadge";
import CompanyReviews from "../components/company/CompanyReviews";
import ReviewFormModal from "../components/company/ReviewFormModal";
import { Stars } from "../components/company/Stars";
import { COMPANY_ACCENTS, COMPANY_SIZES, formatDate, formatSalary, timeAgo } from "../constants/recruitment";

const SIZE_LABEL = Object.fromEntries(COMPANY_SIZES.filter((s) => s.value).map((s) => [s.value, s.label]));

const TABS = [
  { key: "tentang", label: "Tentang" },
  { key: "budaya", label: "Kehidupan dan Budaya" },
  { key: "pekerjaan", label: "Pekerjaan" },
  { key: "gaji", label: "Gaji" },
  { key: "ulasan", label: "Ulasan" },
];

// Hanya izinkan tautan http(s) — nilai dari server tidak dipercaya mentah-mentah.
function safeHref(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

function EmptyBox({ children }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 text-gray-500 text-sm text-center py-8">{children}</div>
  );
}

export default function CompanyPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviewData, setReviewData] = useState(null);
  const [reviewError, setReviewError] = useState("");
  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewTick, setReviewTick] = useState(0); // naikkan untuk memuat ulang ulasan
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setReviewData(null);
    api
      .getCompany(id)
      .then((c) => !cancelled && setCompany(c))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setReviewError("");
    api
      .getCompanyReviews(id, reviewSort)
      .then((d) => !cancelled && setReviewData(d))
      .catch((err) => !cancelled && setReviewError(err.message));
    return () => {
      cancelled = true;
    };
  }, [id, reviewSort, reviewTick, user?.id]);

  if (loading) {
    return (
      <>
        <Topbar title="Perusahaan" />
        <p className="text-gray-500 text-sm p-6 lg:p-8">Memuat halaman perusahaan...</p>
      </>
    );
  }
  if (!company) {
    return (
      <>
        <Topbar title="Perusahaan" />
        <div className="p-6 lg:p-8">
          <EmptyBox>{error || "Perusahaan tidak ditemukan."}</EmptyBox>
        </div>
      </>
    );
  }

  const accent = COMPANY_ACCENTS[company.accent] || COMPANY_ACCENTS.blue;
  const website = company.website ? safeHref(company.website) : null;
  const bannerUrl = companyImageUrl(company.banner);
  const logoUrl = companyImageUrl(company.logo);
  const isOwner = user && user.id === company.id;
  const canReview = !isOwner && user?.account_type !== "business";

  const tab = TABS.some((t) => t.key === params.get("tab")) ? params.get("tab") : "tentang";
  const setTab = (key) => {
    const next = new URLSearchParams(params);
    next.set("tab", key);
    setParams(next, { replace: true });
  };

  const summary = reviewData?.summary;
  const myReview = (reviewData?.reviews || []).find((r) => r.mine);
  const salaryJobs = company.jobs.filter((j) => j.salary_min || j.salary_max);

  const info = [
    company.location && { label: "Lokasi", value: company.location },
    company.industry && { label: "Bidang usaha", value: company.industry },
    company.size && { label: "Ukuran perusahaan", value: SIZE_LABEL[company.size] || company.size },
    website && {
      label: "Website",
      value: (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-brand font-semibold hover:underline"
        >
          {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
        </a>
      ),
    },
    { label: "Bergabung di Twekky", value: formatDate(company.member_since) },
  ].filter(Boolean);

  const openWrite = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setShowForm(true);
  };

  const removeReview = async () => {
    if (!window.confirm("Hapus ulasan Anda? Tindakan ini tidak bisa dibatalkan.")) return;
    try {
      await api.deleteCompanyReview(company.id);
      setReviewTick((t) => t + 1);
    } catch (err) {
      setReviewError(err.message);
    }
  };

  return (
    <>
      <Topbar title="Perusahaan" />
      <div className="p-6 lg:p-8 w-full">
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden mb-6">
          {/* foto latar */}
          <div className={`relative h-40 sm:h-56 bg-gradient-to-br ${accent.banner}`}>
            {bannerUrl && (
              <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
          </div>

          <div className="px-6 pb-4">
            <div className="flex flex-wrap items-end justify-between gap-3 -mt-10">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`Logo ${company.name}`}
                  className="w-20 h-20 rounded-2xl object-cover bg-white border-4 border-white shadow-sm"
                />
              ) : (
                <span className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-sm text-brand text-2xl font-bold">
                  {(company.name || "?").slice(0, 1).toUpperCase()}
                </span>
              )}
              {isOwner && (
                <Link to="/rekrutmen/perusahaan" className="btn btn-ghost btn-sm">
                  <Pencil size={14} /> Edit halaman
                </Link>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-bold m-0">{company.name}</h2>
              {company.verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-success text-success text-[11px] font-bold px-2 py-0.5">
                  <BadgeCheck size={13} /> Terverifikasi
                </span>
              )}
            </div>
            {summary && summary.count > 0 && (
              <button
                type="button"
                onClick={() => setTab("ulasan")}
                className="mt-1.5 inline-flex items-center gap-2 text-sm bg-transparent border-0 p-0 cursor-pointer text-inherit"
              >
                <Stars value={summary.average} size={15} />
                <span className="font-semibold">{summary.average.toFixed(1)}</span>
                <span className="text-gray-500 hover:underline">({summary.count} ulasan)</span>
              </button>
            )}
            {company.tagline && <p className="text-gray-600 m-0 mt-1.5">{company.tagline}</p>}
          </div>

          {/* tab + tombol tulis ulasan */}
          <div className="px-6 border-t border-gray-100 flex flex-wrap items-end justify-between gap-x-4">
            <div role="tablist" aria-label="Bagian halaman perusahaan" className="flex gap-1 overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-3.5 py-3 text-sm font-medium whitespace-nowrap border-b-2 bg-transparent cursor-pointer transition-colors ${
                    tab === t.key
                      ? "border-brand text-brand"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {t.label}
                  {t.key === "pekerjaan" && company.jobs.length > 0 && (
                    <span className="rounded-md bg-brand-soft text-brand text-xs font-bold px-2 py-0.5">
                      {company.jobs.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {canReview && (
              <button type="button" onClick={openWrite} className="btn btn-accent my-2">
                <Pencil size={15} /> {myReview ? "Ubah ulasan" : "Tulis ulasan"}
              </button>
            )}
          </div>
        </div>

        <div className="max-w-4xl">
          {tab === "tentang" && (
            <>
              <section className="card">
                <h3 className="text-base font-bold mb-2">Tentang perusahaan</h3>
                {company.about ? (
                  <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed m-0">{company.about}</p>
                ) : (
                  <p className="text-sm text-gray-500 m-0">Perusahaan belum menambahkan deskripsi.</p>
                )}
              </section>
              <section className="card">
                <h3 className="text-base font-bold mb-3">Informasi perusahaan</h3>
                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm m-0">
                  {info.map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-xs text-gray-400">{label}</dt>
                      <dd className="m-0 font-medium text-gray-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </>
          )}

          {tab === "budaya" && (
            <section className="card">
              <h3 className="text-base font-bold mb-2">Kehidupan dan budaya</h3>
              {!company.tagline && (company.benefits || []).length === 0 ? (
                <p className="text-sm text-gray-500 m-0">Perusahaan belum membagikan informasi tentang budaya kerja.</p>
              ) : (
                <>
                  {company.tagline && <p className="text-sm text-gray-600 leading-relaxed m-0">{company.tagline}</p>}
                  {(company.benefits || []).length > 0 && (
                    <div className={company.tagline ? "mt-5" : ""}>
                      <h4 className="text-sm font-bold mb-2">Benefit karyawan</h4>
                      <div className="flex flex-wrap gap-2">
                        {company.benefits.map((b) => (
                          <span key={b} className="rounded-full bg-brand-soft text-brand text-xs font-semibold px-3 py-1">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {tab === "pekerjaan" && (
            <>
              <h3 className="text-base font-bold mb-3">Lowongan terbuka ({company.jobs.length})</h3>
              {company.jobs.length === 0 ? (
                <EmptyBox>Belum ada lowongan terbuka.</EmptyBox>
              ) : (
                company.jobs.map((job) => {
                  const salary = formatSalary(job.salary_min, job.salary_max);
                  return (
                    <Link
                      key={job.id}
                      to={`/lowongan-kerja?lowongan=${job.id}`}
                      className="block rounded-xl border border-gray-200 bg-white p-5 mb-3 text-inherit no-underline hover:border-brand transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="rounded-full bg-brand-soft text-brand text-[11px] font-bold px-2.5 py-0.5">{job.type}</span>
                        {job.is_boosted && <BoostedBadge />}
                        <span className="text-[11px] text-gray-400">{timeAgo(job.created_at)}</span>
                      </div>
                      <h4 className="text-base font-bold mb-1">{job.title}</h4>
                      <div className="text-sm text-gray-500">
                        {job.location || "Remote"}
                        {salary && (
                          <>
                            {" "}
                            · <span className="text-brand font-semibold">{salary}</span>
                          </>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </>
          )}

          {tab === "gaji" && (
            <section className="card">
              <h3 className="text-base font-bold mb-1">Gaji</h3>
              <p className="text-sm text-gray-500 m-0 mb-4">Berdasarkan gaji yang dicantumkan pada lowongan terbuka.</p>
              {salaryJobs.length === 0 ? (
                <EmptyBox>Belum ada lowongan dengan informasi gaji.</EmptyBox>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-gray-100">
                        <th className="py-2 pr-4 font-medium">Posisi</th>
                        <th className="py-2 pr-4 font-medium">Lokasi</th>
                        <th className="py-2 font-medium text-right">Kisaran gaji</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryJobs.map((job) => (
                        <tr key={job.id} className="border-b border-gray-50 last:border-0">
                          <td className="py-3 pr-4">
                            <Link
                              to={`/lowongan-kerja?lowongan=${job.id}`}
                              className="font-semibold text-gray-900 no-underline hover:text-brand"
                            >
                              {job.title}
                            </Link>
                          </td>
                          <td className="py-3 pr-4 text-gray-500">{job.location || "Remote"}</td>
                          <td className="py-3 text-right font-semibold text-brand whitespace-nowrap">
                            {formatSalary(job.salary_min, job.salary_max)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {tab === "ulasan" && (
            <CompanyReviews
              companyName={company.name}
              data={reviewData}
              error={reviewError}
              sort={reviewSort}
              onSort={setReviewSort}
              canWrite={canReview}
              onWrite={openWrite}
              onEdit={() => setShowForm(true)}
              onDelete={removeReview}
            />
          )}
        </div>
      </div>

      {showForm && (
        <ReviewFormModal
          companyId={company.id}
          companyName={company.name}
          existing={myReview}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setReviewTick((t) => t + 1);
            setTab("ulasan");
          }}
        />
      )}
    </>
  );
}
