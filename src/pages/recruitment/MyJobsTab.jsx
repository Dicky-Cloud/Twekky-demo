import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Eye, ListChecks, MapPin, Plus, Users, X, Zap } from "lucide-react";
import { api } from "../../api/client";
import NewJobForm from "../../components/NewJobForm";
import ScreeningModal from "../../components/recruitment/ScreeningModal";
import JobViewersModal from "../../components/recruitment/JobViewersModal";
import { JobStatusBadge, BoostedBadge, ErrorBanner } from "../../components/recruitment/StatusBadge";
import { formatDate, formatSalary, timeAgo } from "../../constants/recruitment";

const FILTERS = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "closed", label: "Ditutup" },
];

export default function MyJobsTab() {
  const { jobs, biz, loading, reload } = useOutletContext();
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [viewersJob, setViewersJob] = useState(null);
  const [screeningJob, setScreeningJob] = useState(null);

  const counts = {
    all: jobs.length,
    active: jobs.filter((j) => j.status !== "closed").length,
    closed: jobs.filter((j) => j.status === "closed").length,
  };
  const visible = jobs.filter((j) =>
    filter === "all" ? true : filter === "closed" ? j.status === "closed" : j.status !== "closed"
  );

  const toggleStatus = async (job) => {
    const closing = job.status !== "closed";
    if (
      closing &&
      !window.confirm(`Tutup lowongan "${job.title}"? Lowongan tidak akan tampil lagi di papan dan tidak menerima lamaran baru.`)
    ) {
      return;
    }
    setBusyId(job.id);
    setError("");
    try {
      await api.setRecruitmentJobStatus(job.id, closing ? "closed" : "active");
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleBoost = async (job) => {
    setBusyId(job.id);
    setError("");
    try {
      if (job.is_boosted) await api.unboostJob(job.id);
      else await api.boostJob(job.id);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const atLimit = !!biz && biz.usage.active_jobs >= biz.plan.max_active_jobs;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1.5" role="tablist" aria-label="Filter lowongan">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                filter === f.value
                  ? "bg-brand text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label} <span className="opacity-70">{counts[f.value]}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-accent btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={15} strokeWidth={2.2} /> Pasang Lowongan
        </button>
      </div>

      {biz && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            <span className={`font-semibold ${atLimit ? "text-danger" : "text-gray-900"}`}>
              {biz.usage.active_jobs}/{biz.plan.max_active_jobs}
            </span>{" "}
            lowongan aktif
            {biz.plan.max_boosts > 0 && (
              <>
                {" "}
                · <span className="font-semibold text-gray-900">{biz.usage.boosts}/{biz.plan.max_boosts}</span> sorotan aktif
              </>
            )}
            <span className="text-gray-400"> · Paket {biz.plan.name}</span>
          </div>
          {(atLimit || biz.plan.max_boosts === 0) && (
            <Link to="/rekrutmen/paket" className="text-sm font-semibold text-brand hover:underline">
              {atLimit ? "Batas tercapai — lihat paket" : "Lihat paket"}
            </Link>
          )}
        </div>
      )}

      {/* Modal Pasang Lowongan */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl max-h-[90vh] flex flex-col my-8">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Pasang Lowongan Baru</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Konten Form (Scrollable jika panjang) */}
            <div className="p-6 overflow-y-auto">
              <NewJobForm
                onCreated={async () => {
                  setShowModal(false);
                  await reload();
                }}
                onCancel={() => setShowModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      <ErrorBanner>{error}</ErrorBanner>

      {loading ? (
        <p className="text-gray-500 text-sm">Memuat lowongan...</p>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 text-gray-500 text-sm text-center py-8">
          {jobs.length === 0
            ? "Anda belum memasang lowongan. Klik \"Pasang Lowongan\" untuk memulai."
            : "Tidak ada lowongan pada filter ini."}
        </div>
      ) : (
        visible.map((job) => {
          const salary = formatSalary(job.salary_min, job.salary_max);
          const closed = job.status === "closed";
          const isExt = job.apply_mode === "external";
          return (
            <div key={job.id} className={`rounded-xl border border-gray-200 bg-white p-5 mb-3 ${closed ? "opacity-80" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <JobStatusBadge status={job.status} />
                    {job.is_boosted && <BoostedBadge />}
                    <span className="rounded-full bg-brand-soft text-brand text-[11px] font-bold px-2.5 py-0.5">{job.type}</span>
                    {isExt && (
                      <span className="rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold px-2.5 py-0.5">Situs perusahaan</span>
                    )}
                    <span className="text-[11px] text-gray-400">Dipasang {timeAgo(job.created_at).toLowerCase()}</span>
                    {job.is_boosted && job.boosted_until && (
                      <span className="text-[11px] text-amber-700">Disorot sampai {formatDate(job.boosted_until)}</span>
                    )}
                  </div>
                  <h3 className="text-base font-bold mb-1">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} /> {job.location || "Remote"}
                    </span>
                    {salary && <span className="text-brand font-semibold">{salary}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-5 text-sm">
                  <div className="text-center">
                    <div className="flex items-center gap-1 font-bold text-base justify-center">
                      <Eye size={14} className="text-gray-400" /> {job.views}
                    </div>
                    <div className="text-[11px] text-gray-400">Dilihat</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 font-bold text-base justify-center">
                      <Users size={14} className="text-gray-400" /> {isExt ? job.apply_clicks : job.applicant_count}
                    </div>
                    <div className="text-[11px] text-gray-400">{isExt ? "Klik lamar" : "Pelamar"}</div>
                  </div>
                  {!isExt && (
                    <div className="text-center">
                      <div className={`font-bold text-base ${job.new_count ? "text-brand" : ""}`}>{job.new_count}</div>
                      <div className="text-[11px] text-gray-400">Baru</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                {!isExt && (
                  <Link to={`/rekrutmen/pelamar?lowongan=${job.id}`} className="btn btn-accent btn-sm">
                    Lihat pelamar
                  </Link>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setViewersJob(job)}>
                  <Eye size={14} /> Pelihat
                </button>
                {!isExt && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setScreeningJob(job)}>
                    <ListChecks size={14} /> Pertanyaan penyaring
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" disabled={busyId === job.id} onClick={() => toggleStatus(job)}>
                  {busyId === job.id ? "Memproses..." : closed ? "Buka kembali" : "Tutup lowongan"}
                </button>
                {!closed && biz && biz.plan.max_boosts > 0 && (
                  <button className="btn btn-ghost btn-sm" disabled={busyId === job.id} onClick={() => toggleBoost(job)}>
                    <Zap size={14} /> {job.is_boosted ? "Hentikan sorotan" : "Sorot lowongan"}
                  </button>
                )}
                {!closed && biz && biz.plan.max_boosts === 0 && (
                  <Link to="/rekrutmen/paket" className="btn btn-ghost btn-sm">
                    <Zap size={14} /> Sorot (paket Growth)
                  </Link>
                )}
              </div>
            </div>
          );
        })
      )}

      {viewersJob && <JobViewersModal job={viewersJob} onClose={() => setViewersJob(null)} />}
      {screeningJob && <ScreeningModal job={screeningJob} onClose={() => setScreeningJob(null)} />}
    </>
  );
}