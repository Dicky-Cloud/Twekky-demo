import { useEffect, useState, useMemo } from "react";
import { Search as SearchIcon, X, Upload, FileText, CheckCircle2, MapPin, Banknote, Briefcase, Bookmark, SlidersHorizontal, Zap, ExternalLink, AlertTriangle, LayoutGrid, List } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { usePro, ProCrown } from "../context/ProContext";
import Topbar from "../components/Topbar";
import ScreeningFields from "../components/ScreeningFields";
import Pagination from "../components/Pagination";
import { JOB_TYPES } from "../constants/recruitment";
import { useIsMobile } from "../utils/viewport";
import { LEVELS, WORK_MODES, useCareer, careerReadiness } from "../api/careerStore";

const LEVEL_LABEL = Object.fromEntries(LEVELS.map((l) => [l.v, l.label]));
const WORK_MODE_LABEL = Object.fromEntries(WORK_MODES.map((m) => [m.v, m.label]));

// Baris kecil skill/level/mode kerja di kartu dan detail lowongan.
function JobTags({ job, max = 4 }) {
  const skills = job.required_skills || [];
  const extra = [LEVEL_LABEL[job.level], WORK_MODE_LABEL[job.work_mode]].filter(Boolean);
  if (skills.length === 0 && extra.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {skills.slice(0, max).map((s) => (
        <span key={s} className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">{s}</span>
      ))}
      {skills.length > max && <span className="px-1 py-0.5 text-[11px] text-gray-400">+{skills.length - max}</span>}
      {extra.map((t) => (
        <span key={t} className="rounded-md border border-gray-200 px-2 py-0.5 text-[11px] text-gray-500">{t}</span>
      ))}
    </div>
  );
}

const ENGLISH_LEVELS = [
  { value: "", label: "Pilih tingkat kemampuan" },
  { value: "none", label: "Tidak bisa" },
  { value: "basic", label: "Dasar (membaca & menulis sederhana)" },
  { value: "conversational", label: "Percakapan (cukup lancar)" },
  { value: "professional", label: "Profesional (bisa untuk bekerja)" },
  { value: "native", label: "Fasih / Native" },
];

const EXPERIENCE_OPTIONS = [
  { value: "", label: "Pilih pengalaman" },
  { value: "0", label: "Belum ada / Fresh graduate" },
  { value: "1-2", label: "1 - 2 tahun" },
  { value: "3-5", label: "3 - 5 tahun" },
  { value: "5+", label: "Lebih dari 5 tahun" },
];

const MAX_CV_BYTES = 5 * 1024 * 1024;
const CV_ACCEPT = ".pdf,.doc,.docx";
const PAGE_SIZE = 20; // lowongan per halaman

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "Baru saja";
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

function formatSalary(min, max) {
  if (!min && !max) return null;
  const fmt = (n) => `Rp ${Math.round(n / 1000000)}jt`;
  if (min && max) return `${fmt(min)} - ${fmt(max)} / bulan`;
  return `${fmt(min || max)} / bulan`;
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */
/* Halaman utama                                                      */
/* ------------------------------------------------------------------ */

export default function JobsPage() {
  const { user } = useAuth();
  const { isPro, openPro } = usePro();
  useCareer(user?.id); // memuat profil karier dari server lebih awal (untuk Lamar Cepat)
  const [searchMsg, setSearchMsg] = useState("");
  const [jobs, setJobs] = useState([]);
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appliedIds, setAppliedIds] = useState([]);
  
  // State untuk Fitur Simpan & Filter Kompleks
  const [savedJobIds, setSavedJobIds] = useState(() => {
    try {
      // fallback ke kunci lama agar lowongan tersimpan dari versi sebelumnya tidak hilang
      const local = localStorage.getItem("twekky_saved_jobs") ?? localStorage.getItem("gimme_saved_jobs");
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });
  
  // "all" | "saved" | "applications". Bisa dibuka langsung lewat ?tab=tersimpan / ?tab=lamaran
  // (dipakai tab di halaman Wawancara untuk kembali ke sini).
  const [activeTab, setActiveTab] = useState(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "tersimpan") return "saved";
    if (t === "lamaran" && user) return "applications";
    return "all";
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minSalaryFilter, setMinSalaryFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "salary_high"
  const [locationFilter, setLocationFilter] = useState("");

  const isMobile = useIsMobile(); // HP: hanya tampilan list, detail tampil penuh layar

  // Modal: detail lowongan & form lamaran
  const [detailJob, setDetailJob] = useState(null);
  const [applyJob, setApplyJob] = useState(null);
  const [extJob, setExtJob] = useState(null); // lowongan eksternal yang sedang dilamar
  const [externalMap, setExternalMap] = useState({}); // job_id -> { clicked_at, applied_at }

  // Tampilan (list / kartu), pagination, dan batal melamar
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem("twekky_jobs_view") === "card" ? "card" : "list";
    } catch {
      return "list";
    }
  });
  const [page, setPage] = useState(1);
  const [withdrawTarget, setWithdrawTarget] = useState(null); // { id, title, company_name }
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [appsVersion, setAppsVersion] = useState(0); // naik setelah melamar/batal: tab Lamaran Saya dimuat ulang

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.listJobs(type, query);
      setJobs(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Simpan state savedJobIds ke localStorage setiap kali berubah
  useEffect(() => {
    try {
      localStorage.setItem("twekky_saved_jobs", JSON.stringify(savedJobIds));
    } catch {}
  }, [savedJobIds]);

  // Tandai lowongan yang sudah pernah dilamar
  useEffect(() => {
    if (!user) {
      setAppliedIds([]);
      return;
    }
    api
      .myApplications()
      .then((list) => setAppliedIds((list || []).map((a) => a.job_id)))
      .catch(() => {});
  }, [user]);

  // Lamaran lewat situs perusahaan (untuk lencana "Sudah melamar" di daftar).
  const loadExternal = () => {
    if (!user) {
      setExternalMap({});
      return;
    }
    api
      .myExternalApplications()
      .then((list) => setExternalMap(Object.fromEntries((list || []).map((e) => [e.job_id, e]))))
      .catch(() => {});
  };
  useEffect(() => {
    loadExternal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const saveSearch = async () => {
    setSearchMsg("");
    try {
      await api.createSearch({ query: query.trim(), type, location: locationFilter.trim(), min_salary: Number(minSalaryFilter) || 0 });
      setSearchMsg(isPro ? "Pencarian disimpan. Kamu akan dapat notifikasi instan." : "Pencarian disimpan.");
    } catch (err) {
      if (!isPro && /batas/i.test(err.message)) openPro("Pencarian tersimpan gratis hanya 1. Pro: 10 pencarian + notifikasi instan.");
      else setSearchMsg(err.message);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    load();
  };

  const toggleSaveJob = (jobId, e) => {
    e?.stopPropagation();
    setSavedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  // buka detail otomatis bila datang dari halaman perusahaan (?lowongan=<id>)
  const [searchParams] = useSearchParams();
  const wantedJobId = searchParams.get("lowongan");
  useEffect(() => {
    if (!wantedJobId || jobs.length === 0) return;
    const wanted = jobs.find((j) => j.id === wantedJobId);
    if (wanted) setDetailJob(wanted);
  }, [wantedJobId, jobs]);

  const openDetail = (job) => {
    setDetailJob(job);
    if (!user || user.id !== job.poster_id) api.viewJob(job.id);
  };

  const openApply = (job) => {
    setDetailJob(null);
    if (job.apply_mode === "external") setExtJob(job);
    else setApplyJob(job);
  };

  // Filter Kompleks & Tab (Semua vs Disimpan) di Sisi Klien
  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Filter berdasarkan Tab Disimpan
    if (activeTab === "saved") {
      result = result.filter((j) => savedJobIds.includes(j.id));
    }

    // Filter Lokasi
    if (locationFilter.trim()) {
      const qLoc = locationFilter.toLowerCase();
      result = result.filter((j) => (j.location || "remote").toLowerCase().includes(qLoc));
    }

    // Filter Gaji Minimum
    if (minSalaryFilter) {
      const minVal = Number(minSalaryFilter);
      result = result.filter((j) => {
        const jMax = j.salary_max || j.salary_min || 0;
        return jMax >= minVal;
      });
    }

    // Sorting
    if (sortBy === "newest") {
      // lowongan yang sedang disorot tampil paling atas, sisanya terbaru dulu
      result.sort(
        (a, b) =>
          Number(!!b.is_boosted) - Number(!!a.is_boosted) || new Date(b.created_at) - new Date(a.created_at)
      );
    } else if (sortBy === "salary_high") {
      result.sort((a, b) => (b.salary_max || b.salary_min || 0) - (a.salary_max || a.salary_min || 0));
    }

    return result;
  }, [jobs, activeTab, savedJobIds, locationFilter, minSalaryFilter, sortBy]);

  // Kembali ke halaman 1 setiap daftar berubah (tab, filter, urutan, atau hasil pencarian baru).
  useEffect(() => {
    setPage(1);
  }, [activeTab, locationFilter, minSalaryFilter, sortBy, jobs]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageJobs = filteredJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const changePage = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeView = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("twekky_jobs_view", mode);
    } catch {}
  };

  // Status satu lowongan untuk pengguna saat ini.
  const jobStatus = (job) => {
    const isExternal = job.apply_mode === "external";
    const applied = isExternal ? Boolean(externalMap[job.id]?.applied_at) : appliedIds.includes(job.id);
    return { isExternal, applied, isSaved: savedJobIds.includes(job.id) };
  };

  // Batal melamar: buka konfirmasi. target = { id, title, company_name }.
  const askWithdraw = (target) => {
    setWithdrawError("");
    setWithdrawTarget(target);
  };

  const confirmWithdraw = async () => {
    if (!withdrawTarget) return;
    setWithdrawBusy(true);
    setWithdrawError("");
    try {
      await api.withdrawApplication(withdrawTarget.id);
      setAppliedIds((prev) => prev.filter((id) => id !== withdrawTarget.id));
      setAppsVersion((n) => n + 1);
      setWithdrawTarget(null);
    } catch (err) {
      setWithdrawError(err.message || "Gagal membatalkan lamaran. Coba lagi.");
    } finally {
      setWithdrawBusy(false);
    }
  };

  // Tombol aksi di kartu dan baris: simpan, lamar, dan batal melamar (lamaran di dalam Twekky).
  // stretch: di HP tombol Lamar melebar mengisi baris, tombol simpan di ujung kanan.
  const renderActions = (job, { stretch = false } = {}) => {
    const { isExternal, applied, isSaved } = jobStatus(job);
    const grow = stretch ? "flex-1 sm:flex-none" : "";
    return (
      <>
        <button
          type="button"
          onClick={(e) => toggleSaveJob(job.id, e)}
          title={isSaved ? "Hapus dari tersimpan" : "Simpan lowongan"}
          className={`p-2 rounded-lg border transition-colors ${stretch ? "order-last shrink-0 sm:order-first" : ""} ${
            isSaved
              ? "border-brand bg-brand-soft text-brand"
              : "border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          }`}
          aria-label={isSaved ? "Hapus dari tersimpan" : "Simpan lowongan"}
          aria-pressed={isSaved}
        >
          <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
        </button>

        {user && user.id === job.poster_id ? (
          <span className={`text-gray-400 text-sm ${grow}`}>Lowongan Anda</span>
        ) : user ? (
          <>
            <button
              className={`btn btn-accent btn-sm ${grow}`}
              disabled={applied}
              onClick={(e) => {
                e.stopPropagation();
                openApply(job);
              }}
            >
              {isExternal
                ? applied ? "Sudah melamar" : (<><ExternalLink size={13} className="inline -mt-0.5 mr-1" />Lamar di situs</>)
                : applied ? "Terkirim" : "Lamar Cepat"}
            </button>
            {applied && !isExternal && (
              <button
                type="button"
                className={`btn btn-ghost btn-sm text-danger ${grow}`}
                onClick={(e) => {
                  e.stopPropagation();
                  askWithdraw({ id: job.id, title: job.title, company_name: job.company_name });
                }}
              >
                Batal melamar
              </button>
            )}
          </>
        ) : (
          <span className={`text-gray-500 text-sm ${grow}`}>Masuk untuk melamar</span>
        )}
      </>
    );
  };

  // Tampilan list: satu baris lebar (sama seperti sebelumnya).
  const renderJobRow = (job) => {
    const salary = formatSalary(job.salary_min, job.salary_max);
    const { isExternal } = jobStatus(job);
    return (
      <div
        key={job.id}
        role="button"
        tabIndex={0}
        onClick={() => openDetail(job)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetail(job);
          }
        }}
        className="flex flex-col gap-3 border-b border-gray-100 bg-white py-4 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand relative active:bg-gray-50 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-xl sm:border sm:border-gray-200 sm:p-5 sm:mb-3 sm:hover:border-brand sm:active:bg-white"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="rounded-full bg-brand-soft text-brand text-[11px] font-bold px-2.5 py-0.5">
              {job.type}
            </span>
            {job.is_boosted && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-0.5">
                <Zap size={11} fill="currentColor" /> Disorot
              </span>
            )}
            {isExternal && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold px-2.5 py-0.5">
                <ExternalLink size={11} /> Situs perusahaan
              </span>
            )}
            <span className="text-[11px] text-gray-400">{timeAgo(job.created_at)}</span>
            {job.is_verified && (
              <span className="rounded-full border border-success text-success text-[11px] font-bold px-2 py-0.5">
                Terverifikasi
              </span>
            )}
          </div>
          <h3 className="text-base font-bold leading-snug mb-1">{job.title}</h3>
          <div className="text-sm text-gray-500">
            <Link
              to={`/perusahaan/${job.poster_id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-inherit hover:text-brand hover:underline"
            >
              {job.company_name}
            </Link>{" "}
            · {job.location || "Remote"}
            {/* layar lebar: gaji sebaris; HP: gaji di baris sendiri supaya tidak terpotong */}
            {salary && (
              <span className="hidden sm:inline">
                {" "}
                · <span className="text-brand font-semibold">{salary}</span>
              </span>
            )}
          </div>
          {salary && <div className="mt-0.5 text-sm font-semibold text-brand sm:hidden">{salary}</div>}
          <JobTags job={job} />
          {user && (
            <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
              {isPro && job.is_early_access && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-yellow-700"><ProCrown size={11} /> Akses awal</span>
              )}
              {isPro ? (
                job.applicant_count !== undefined && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{job.applicant_count} pelamar</span>
                )
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openPro("Lihat jumlah pelamar tiap lowongan dan akses lowongan baru 12 jam lebih awal."); }}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-500 hover:bg-gray-200"
                >
                  <ProCrown size={11} /> Jumlah pelamar
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
          {renderActions(job, { stretch: true })}
        </div>
      </div>
    );
  };

  // Tampilan kartu: ringkas, dalam grid.
  const renderJobCard = (job) => {
    const salary = formatSalary(job.salary_min, job.salary_max);
    const { isExternal } = jobStatus(job);
    return (
      <div
        key={job.id}
        role="button"
        tabIndex={0}
        onClick={() => openDetail(job)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetail(job);
          }
        }}
        className="flex flex-col border-b border-gray-100 bg-white py-4 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:rounded-xl sm:border sm:border-gray-200 sm:p-5 sm:hover:border-brand"
      >
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-brand-soft text-brand text-[11px] font-bold px-2.5 py-0.5">{job.type}</span>
          {job.is_boosted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-0.5">
              <Zap size={11} fill="currentColor" /> Disorot
            </span>
          )}
          {isExternal && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold px-2.5 py-0.5">
              <ExternalLink size={11} /> Situs perusahaan
            </span>
          )}
          {job.is_verified && (
            <span className="rounded-full border border-success text-success text-[11px] font-bold px-2 py-0.5">Terverifikasi</span>
          )}
        </div>
        <h3 className="text-base font-bold mb-1 line-clamp-2">{job.title}</h3>
        <div className="text-sm text-gray-500 truncate">
          {job.company_name} · {job.location || "Remote"}
        </div>
        {salary && <div className="mt-1 text-sm font-semibold text-brand">{salary}</div>}
        <JobTags job={job} max={3} />
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
          <span className="text-[11px] text-gray-400">{timeAgo(job.created_at)}</span>
          <div className="flex flex-wrap items-center gap-2">{renderActions(job)}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Topbar title="Lowongan Kerja" />
      <div className="p-6 lg:p-8 w-full">
        
        {/* Tab Navigasi (Semua / Disimpan) */}
        <div className="flex items-center gap-2 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "all" ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Semua Lowongan ({jobs.length})
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "saved" ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Bookmark size={15} /> Tersimpan ({savedJobIds.length})
          </button>
          {user && (
            <button
              onClick={() => setActiveTab("applications")}
              className={`pb-3 px-2 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === "applications" ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Lamaran Saya
            </button>
          )}
          {/* Wawancara: halaman sendiri, ditampilkan sebagai tab di sini */}
          {user && (
            <>
              <Link
                to="/wawancara"
                className="pb-3 px-2 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors no-underline"
              >
                Wawancara
              </Link>
            </>
          )}
        </div>

        {/* Bar Pencarian Utama & Tombol Filter Kompleks */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <form className="flex gap-2.5 flex-1 min-w-[280px]" onSubmit={handleSearchSubmit}>
            <input
              className="field-input flex-1"
              placeholder="Cari posisi, perusahaan, atau keahlian..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select className="field-input w-[150px] sm:w-[180px] shrink-0" value={type} onChange={(e) => setType(e.target.value)}>
              {JOB_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <button className="btn btn-ghost shrink-0" type="submit" aria-label="Cari">
              <SearchIcon size={16} strokeWidth={2} />
            </button>
            {user && (
              <button
                className="btn btn-ghost shrink-0 flex items-center gap-1.5"
                type="button"
                onClick={saveSearch}
                title="Simpan pencarian ini dan dapatkan alert lowongan baru"
              >
                <Bookmark size={15} /> Simpan pencarian {!isPro && <ProCrown />}
              </button>
            )}
          </form>

          <button
            type="button"
            onClick={() => setShowAdvancedFilters((v) => !v)}
            className={`btn ${showAdvancedFilters ? "btn-accent" : "btn-ghost"} shrink-0 flex items-center gap-1.5`}
          >
            <SlidersHorizontal size={16} /> Filter Lanjutan
          </button>
        </div>

        {/* Panel Filter Lanjutan (Kompleks) */}
        {showAdvancedFilters && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Filter Lokasi</label>
              <input
                className="field-input text-sm bg-white"
                placeholder="Misal: Jakarta, Remote..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Minimum Gaji</label>
              <select
                className="field-input text-sm bg-white"
                value={minSalaryFilter}
                onChange={(e) => setMinSalaryFilter(e.target.value)}
              >
                <option value="">Semua Gaji</option>
                <option value="3000000">&gt; Rp 3 Juta</option>
                <option value="5000000">&gt; Rp 5 Juta</option>
                <option value="10000000">&gt; Rp 10 Juta</option>
                <option value="15000000">&gt; Rp 15 Juta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Urutkan Berdasarkan</label>
              <select
                className="field-input text-sm bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Paling Terbaru</option>
                <option value="salary_high">Gaji Tertinggi</option>
              </select>
            </div>
          </div>
        )}

        {searchMsg && <p className="mb-3 text-sm text-gray-600">{searchMsg}</p>}

        {error && (
          <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        {activeTab === "applications" ? (
          <MyApplicationsPanel isPro={isPro} openPro={openPro} onRequestWithdraw={askWithdraw} refreshKey={appsVersion} />
        ) : loading ? (
          <p className="text-gray-500 text-sm">Memuat lowongan...</p>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 text-gray-500 text-sm text-center py-12">
            {activeTab === "saved"
              ? "Belum ada lowongan yang Anda simpan."
              : "Belum ada lowongan yang cocok dengan kriteria filter Anda."}
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="m-0 text-xs text-gray-500">{filteredJobs.length} lowongan</p>
              <div className="hidden rounded-lg border border-gray-200 bg-white p-0.5 sm:inline-flex" role="group" aria-label="Tampilan lowongan">
                <button
                  type="button"
                  onClick={() => changeView("list")}
                  aria-pressed={viewMode === "list"}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === "list" ? "bg-brand-soft text-brand" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List size={15} /> Daftar
                </button>
                <button
                  type="button"
                  onClick={() => changeView("card")}
                  aria-pressed={viewMode === "card"}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === "card" ? "bg-brand-soft text-brand" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LayoutGrid size={15} /> Kartu
                </button>
              </div>
            </div>

            {viewMode === "card" && !isMobile ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{pageJobs.map(renderJobCard)}</div>
            ) : (
              pageJobs.map(renderJobRow)
            )}

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              total={filteredJobs.length}
              pageSize={PAGE_SIZE}
              onChange={changePage}
            />
          </>
        )}
      </div>

      {detailJob && (
        <JobDetailModal
          job={detailJob}
          user={user}
          applied={
            detailJob.apply_mode === "external"
              ? Boolean(externalMap[detailJob.id]?.applied_at)
              : appliedIds.includes(detailJob.id)
          }
          isSaved={savedJobIds.includes(detailJob.id)}
          onToggleSave={(e) => toggleSaveJob(detailJob.id, e)}
          onClose={() => setDetailJob(null)}
          onApply={() => openApply(detailJob)}
          onWithdraw={() => askWithdraw({ id: detailJob.id, title: detailJob.title, company_name: detailJob.company_name })}
        />
      )}

      {extJob && (
        <ExternalApplyModal
          job={extJob}
          onClose={() => { setExtJob(null); loadExternal(); }}
          onChanged={loadExternal}
        />
      )}

      {applyJob && (
        <ApplyModal
          job={applyJob}
          user={user}
          onClose={() => setApplyJob(null)}
          onSubmitted={(id) => {
            setAppliedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
            setAppsVersion((n) => n + 1);
          }}
        />
      )}

      {withdrawTarget && (
        <WithdrawModal
          target={withdrawTarget}
          busy={withdrawBusy}
          error={withdrawError}
          onCancel={() => !withdrawBusy && setWithdrawTarget(null)}
          onConfirm={confirmWithdraw}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Komponen modal dasar                                               */
/* ------------------------------------------------------------------ */

function Modal({ title, subtitle, onClose, children, footer, widthClass = "max-w-2xl", fullPage = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className={
        fullPage
          ? "fixed inset-0 z-50 flex items-stretch justify-center bg-white p-0 sm:items-center sm:bg-black/50 sm:p-4"
          : "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      }
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={
          fullPage
            ? `flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[92vh] sm:rounded-2xl sm:shadow-xl ${widthClass}`
            : `w-full ${widthClass} max-h-[92vh] flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-xl`
        }
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-200">
          <div className="min-w-0">
            <h3 className="text-lg font-bold m-0">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 m-0 mt-0.5">{subtitle}</p>}
          </div>
          <button className="btn btn-ghost btn-sm shrink-0" onClick={onClose} aria-label="Tutup">
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-gray-200">{footer}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal detail lowongan                                              */
/* ------------------------------------------------------------------ */

function JobDetailModal({ job, user, applied, isSaved, onToggleSave, onClose, onApply, onWithdraw }) {
  const salary = formatSalary(job.salary_min, job.salary_max);

  return (
    <Modal
      fullPage
      title={job.title}
      subtitle={`${job.company_name} · ${timeAgo(job.created_at)}`}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <button
            type="button"
            onClick={onToggleSave}
            className={`btn btn-ghost btn-sm flex items-center gap-1.5 ${isSaved ? "text-brand" : "text-gray-500"}`}
          >
            <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
            {isSaved ? "Tersimpan" : "Simpan Lowongan"}
          </button>

          <div className="flex items-center gap-2">
            {!user && <span className="text-xs text-gray-500">Masuk untuk melamar.</span>}
            {user && user.id === job.poster_id && (
              <span className="text-sm text-gray-400">Ini lowongan Anda</span>
            )}
            {user && user.id !== job.poster_id && applied && job.apply_mode !== "external" && onWithdraw && (
              <button className="btn btn-ghost btn-sm text-danger" onClick={onWithdraw}>
                Batal melamar
              </button>
            )}
            {user && user.id !== job.poster_id && (
              <button className="btn btn-accent" disabled={applied} onClick={onApply}>
                {job.apply_mode === "external"
                  ? applied ? "Sudah melamar" : "Lamar di situs perusahaan"
                  : applied ? "Lamaran terkirim" : "Lamar Cepat"}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="rounded-full bg-brand-soft text-brand text-[11px] font-bold px-2.5 py-0.5">{job.type}</span>
        {job.is_boosted && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-0.5">
            <Zap size={11} fill="currentColor" /> Disorot
          </span>
        )}
        {job.is_verified && (
          <span className="rounded-full border border-success text-success text-[11px] font-bold px-2 py-0.5">
            Terverifikasi
          </span>
        )}
      </div>

      <dl className="grid gap-3 mb-6 text-sm m-0">
        <div className="flex items-center gap-2.5">
          <MapPin size={16} className="text-gray-400 shrink-0" />
          <dd className="m-0">{job.location || "Remote"}</dd>
        </div>
        <div className="flex items-center gap-2.5">
          <Briefcase size={16} className="text-gray-400 shrink-0" />
          <dd className="m-0 capitalize">{job.type}</dd>
        </div>
        {salary && (
          <div className="flex items-center gap-2.5">
            <Banknote size={16} className="text-gray-400 shrink-0" />
            <dd className="m-0 text-brand font-semibold">{salary}</dd>
          </div>
        )}
      </dl>

      {job.apply_mode === "external" && (
        <p className="m-0 mb-4 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
          Lowongan ini melamar lewat situs perusahaan. Lamaran tidak dikirim melalui Twekky.
        </p>
      )}
      {(job.required_skills?.length > 0 || job.level || job.work_mode) && (
        <div className="mb-5">
          <h4 className="text-sm font-bold mb-1">Kualifikasi</h4>
          <JobTags job={job} max={15} />
        </div>
      )}

      <Link
        to={`/perusahaan/${job.poster_id}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline mb-5"
      >
        <Briefcase size={15} /> Lihat halaman {job.company_name}
      </Link>

      <h4 className="text-sm font-bold mb-2">Deskripsi pekerjaan</h4>
      <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed m-0">
        {job.description || "Perusahaan belum menambahkan deskripsi."}
      </p>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Modal lamaran bertahap (seperti Easy Apply)                        */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Lamar di situs perusahaan: peringatan, buka link, lalu konfirmasi   */
/* ------------------------------------------------------------------ */

function ExternalApplyModal({ job, onClose, onChanged }) {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("confirm"); // "confirm" | "asked" | "done"
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .externalApplyInfo(job.id)
      .then((d) => {
        if (!alive) return;
        setInfo(d);
        if (d.applied_at) setPhase("done");
      })
      .catch((e) => alive && setError(e.message || "Gagal memuat link lamaran."));
    return () => { alive = false; };
  }, [job.id]);

  // Klik dicatat sebelum tab baru terbuka; kegagalan mencatat tidak boleh menghalangi pengguna.
  const onOpen = () => {
    api.externalApplyClick(job.id).then(onChanged).catch(() => {});
    setPhase("asked");
  };

  const markApplied = async () => {
    setBusy(true);
    setError("");
    try {
      await api.externalApplyDone(job.id);
      onChanged();
      setPhase("done");
    } catch (e) {
      setError(e.message || "Gagal menyimpan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={job.title} subtitle={info?.company_name || job.company_name} onClose={onClose} widthClass="max-w-md">
      {error && <p className="m-0 mb-3 rounded-lg border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      {!info && !error && <p className="m-0 text-sm text-gray-500">Memuat...</p>}

      {info && phase === "confirm" && (
        <>
          <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <strong>Anda akan meninggalkan Twekky.</strong>
              <div className="mt-1">Lamaran dikirim di situs milik perusahaan, bukan di Twekky.</div>
            </div>
          </div>
          <p className="mt-4 mb-1 text-xs text-gray-500">Tujuan</p>
          <p className="m-0 break-all text-base font-bold text-gray-900">{info.host}</p>
          {!info.is_verified && (
            <p className="mt-1 mb-0 text-xs text-gray-500">Perusahaan ini belum terverifikasi di Twekky.</p>
          )}
          <ul className="mt-4 mb-5 list-disc pl-5 text-xs text-gray-600 space-y-1">
            <li>Perusahaan yang sah tidak meminta uang untuk melamar atau mengikuti seleksi.</li>
            <li>Jangan membagikan kode OTP, PIN, atau data rekening bank.</li>
            <li>Pastikan alamat situs sesuai dengan perusahaan yang Anda tuju.</li>
          </ul>
          <a
            href={info.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onOpen}
            className="btn btn-accent w-full justify-center no-underline"
          >
            <ExternalLink size={15} className="mr-1.5" /> Lanjutkan ke situs perusahaan
          </a>
        </>
      )}

      {info && phase === "asked" && (
        <>
          <p className="m-0 mb-4 text-sm text-gray-700">
            Link dibuka di tab baru. Sudah selesai melamar di situs perusahaan?
          </p>
          <div className="flex flex-col gap-2">
            <button className="btn btn-accent" disabled={busy} onClick={markApplied}>
              {busy ? "Menyimpan..." : "Ya, saya sudah melamar"}
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Belum, nanti saja</button>
            <a href={info.url} target="_blank" rel="noopener noreferrer" className="text-center text-xs text-gray-500 hover:text-brand">
              Buka lagi link lamaran
            </a>
          </div>
        </>
      )}

      {info && phase === "done" && (
        <div className="text-center">
          <CheckCircle2 size={40} className="mx-auto mb-2 text-success" />
          <p className="m-0 mb-1 font-bold">Ditandai sudah melamar</p>
          <p className="m-0 mb-4 text-sm text-gray-500">Tercatat di tab Lamaran Saya.</p>
          <button className="btn btn-accent" onClick={onClose}>Selesai</button>
        </div>
      )}
    </Modal>
  );
}

// Konfirmasi batal melamar. Hanya untuk lamaran yang belum diproses perekrut.
function WithdrawModal({ target, busy, error, onCancel, onConfirm }) {
  return (
    <Modal
      title="Batalkan lamaran?"
      subtitle={`${target.title} · ${target.company_name}`}
      onClose={onCancel}
      widthClass="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={busy}>
            Tidak jadi
          </button>
          <button className="btn btn-accent" type="button" onClick={onConfirm} disabled={busy}>
            {busy ? "Membatalkan..." : "Ya, batalkan"}
          </button>
        </div>
      }
    >
      {error && (
        <p className="m-0 mb-3 rounded-lg border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <p className="m-0 text-sm text-gray-600">
        Lamaranmu dan CV yang terkirim akan dihapus, dan perekrut tidak lagi melihatnya. Kamu bisa melamar lagi selama lowongan masih dibuka.
      </p>
    </Modal>
  );
}

const STEPS = ["Kontak", "Kualifikasi", "Dokumen"];

function Field({ id, label, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {hint && !error && <span className="text-xs text-gray-400">{hint}</span>}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

// Level di profil karier -> pilihan "pengalaman kerja" di form lamaran (perkiraan, bisa diubah).
const EXP_FROM_LEVEL = { sma: "0", student: "0", "student-final": "0", fresh: "0", "1-3": "1-2", "3-5": "3-5", "5+": "5+" };

// Gabungkan skill jadi satu baris tanpa memotong di tengah nama skill.
function joinSkills(list, max = 300) {
  let out = "";
  for (const s of list || []) {
    const next = out ? `${out}, ${s}` : s;
    if (next.length > max) break;
    out = next;
  }
  return out;
}

// Nomor HP yang disimpan ke profil: hanya angka dan "+" di awal.
const cleanPhone = (s) => {
  const t = String(s).trim();
  return (t.startsWith("+") ? "+" : "") + t.replace(/\D/g, "");
};

// Pilihan Ya / Tidak (radio) untuk pertanyaan hak bekerja & sponsor.
function YesNo({ name, label, value, onChange, error }) {
  return (
    <fieldset className="m-0 mb-4 border-0 p-0">
      <legend className="field-label mb-1.5 p-0">{label}</legend>
      <div className="flex gap-3">
        {[["yes", "Ya"], ["no", "Tidak"]].map(([v, text]) => (
          <label
            key={v}
            className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm ${value === v ? "border-brand bg-brand-soft font-semibold" : "border-gray-200"}`}
          >
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
            {text}
          </label>
        ))}
      </div>
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </fieldset>
  );
}

function ApplyModal({ job, user, onClose, onSubmitted }) {
  const { openPro } = usePro();
  // pertanyaan penyaring dari perusahaan (bila ada)
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [qStatus, setQStatus] = useState("loading"); // loading | ready | error
  const [qReload, setQReload] = useState(0); // naikkan untuk memuat ulang pertanyaan
  useEffect(() => {
    let cancelled = false;
    setQStatus("loading");
    api
      .screeningQuestions(job.id)
      .then((q) => {
        if (cancelled) return;
        setQuestions(q || []);
        setQStatus("ready");
      })
      .catch(() => !cancelled && setQStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [job.id, qReload]);
  const [career, updateCareer] = useCareer(user?.id);
  const readiness = careerReadiness(career); // "complete" | "partial" | "empty"
  const fromProfile = readiness === "complete"; // profil lengkap: CV utama dipakai, tanpa unggah ulang
  const [editing, setEditing] = useState(false); // true = pengguna memilih mengubah data (tampilkan langkah-langkah)
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: user?.name || user?.full_name || "",
    email: user?.email || "",
    phone: career.phone || "",
    englishLevel: "",
    experience: EXP_FROM_LEVEL[career.level] || "",
    skills: joinSkills(career.skills),
    coverLetter: "",
    priority: false,
    cv: null,
    replaceCv: false, // true = pengguna memilih tidak memakai CV tersimpan
    cvId: career.cvs?.[0]?.id || "", // CV tersimpan yang dipilih
    workAuth: "", // "yes" | "no": berhak bekerja di lokasi lowongan
    needsSponsor: "", // "yes" | "no": butuh sponsor visa
  });

  // CV tersimpan bisa tiba terlambat: pilih CV pertama bila belum ada pilihan yang valid.
  useEffect(() => {
    setForm((f) => (career.cvs.some((x) => x.id === f.cvId) ? f : { ...f, cvId: career.cvs[0]?.id || "" }));
  }, [career.cvs]);

  // Data profil bisa tiba terlambat (sinkronisasi dengan server): isi hanya kolom yang masih kosong.
  useEffect(() => {
    setForm((f) => ({
      ...f,
      phone: f.phone || career.phone || "",
      experience: f.experience || EXP_FROM_LEVEL[career.level] || "",
      skills: f.skills || joinSkills(career.skills),
    }));
  }, [career.phone, career.level, career.skills]);

  const hasSaved = career.cvs.length > 0;
  const usingSaved = fromProfile || (hasSaved && !form.cv && !form.replaceCv);
  const phoneDigits = form.phone.replace(/\D/g, "");
  // Data diri dari profil sudah lengkap: CV dipilih di halaman yang sama (tidak jadi syarat).
  const quickReady =
    phoneDigits.length >= 9 && phoneDigits.length <= 15 &&
    form.name.trim() !== "" && /^\S+@\S+\.\S+$/.test(form.email);
  const showReview = fromProfile && quickReady && !editing;

  const set = (key) => (e) => {
    setEditing(true);
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const validate = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.name.trim()) e.name = "Nama lengkap wajib diisi.";
      if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Masukkan alamat email yang valid.";
      const digits = form.phone.replace(/\D/g, "");
      if (digits.length < 9 || digits.length > 15) e.phone = "Masukkan nomor HP yang valid, misal 081234567890.";
    }
    if (s === 2) {
      if (!form.cv && !usingSaved) e.cv = "Unggah CV Anda.";
      if (usingSaved && !form.cvId) e.cv = "Pilih salah satu CV.";
      if (!form.workAuth) e.workAuth = "Pilih salah satu jawaban.";
      if (!form.needsSponsor) e.needsSponsor = "Pilih salah satu jawaban.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate(step)) setStep((s) => s + 1);
  };

  const back = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext)) {
      setErrors({ cv: "Format harus PDF, DOC, atau DOCX." });
      return;
    }
    if (file.size > MAX_CV_BYTES) {
      setErrors({ cv: "Ukuran file maksimal 5 MB." });
      return;
    }
    setErrors({});
    setForm((f) => ({ ...f, cv: file }));
  };

  const submit = async () => {
    if (!validate(2)) {
      setSubmitError("Lengkapi bagian yang ditandai merah dulu.");
      return;
    }
    if (qStatus === "loading") {
      setSubmitError("Pertanyaan dari perusahaan masih dimuat, coba lagi sebentar.");
      return;
    }
    if (qStatus === "error") {
      setSubmitError("Pertanyaan dari perusahaan gagal dimuat. Coba lagi, jika masih gagal muat ulang halaman.");
      setQReload((n) => n + 1);
      return;
    }
    const missing = questions.find((q) => q.required && !String(answers[q.id] || "").trim());
    if (missing) {
      setSubmitError(`Jawab pertanyaan wajib dari ${job.company_name}: "${missing.text}"`);
      return;
    }
    setBusy(true);
    setSubmitError("");
    try {
      const body = new FormData();
      body.append("name", form.name.trim());
      body.append("email", form.email.trim());
      body.append("phone", form.phone.trim());
      body.append("english_level", form.englishLevel);
      body.append("experience", form.experience);
      body.append("skills", form.skills.trim());
      body.append("cover_letter", form.coverLetter.trim());
      if (questions.length > 0) body.append("answers", JSON.stringify(answers));
      if (form.priority && user?.is_pro) body.append("priority", "1");
      body.append("work_authorization", form.workAuth);
      body.append("needs_sponsorship", form.needsSponsor);
      if (usingSaved) {
        body.append("use_saved_cv", "1");
        body.append("cv_id", fromProfile ? career.cvs[0]?.id : form.cvId);
      } else body.append("cv", form.cv);
      await api.applyJob(job.id, body);
      // Simpan nomor HP ke profil supaya lamaran berikutnya tinggal satu ketukan.
      const savedPhone = cleanPhone(form.phone);
      if (savedPhone && savedPhone !== career.phone) updateCareer({ phone: savedPhone });
      onSubmitted(job.id);
      setDone(true);
    } catch (err) {
      setSubmitError(err.message || "Lamaran gagal dikirim. Coba lagi.");
      // Perusahaan baru menambah pertanyaan setelah formulir dibuka: muat ulang agar bisa dijawab.
      if (/pertanyaan wajib/i.test(err.message || "")) {
        setQReload((n) => n + 1);
        setSubmitError("Perusahaan menambahkan pertanyaan baru. Jawab pertanyaan wajib di bawah, lalu kirim lagi.");
      }
      if (/sudah melamar/i.test(err.message || "")) onSubmitted(job.id);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Modal
        title="Lamaran terkirim"
        onClose={onClose}
        widthClass="max-w-md"
        footer={
          <div className="flex justify-end">
            <button className="btn btn-accent" onClick={onClose}>
              Selesai
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <CheckCircle2 size={44} className="text-success mb-3" />
          <p className="font-bold m-0 mb-1">{job.title}</p>
          <p className="text-sm text-gray-500 m-0">
            Lamaran Anda ke {job.company_name} sudah dikirim. Perusahaan akan menghubungi Anda lewat email atau nomor HP.
          </p>
        </div>
      </Modal>
    );
  }

  // Bagian yang dipakai bersama oleh tampilan ringkas dan langkah terakhir.
  const screening = questions.length > 0 && (
    <ScreeningFields questions={questions} answers={answers} onChange={setAnswers} company={job.company_name} />
  );

  // Surat pengantar: teks biasa. Perekrut menerimanya sebagai PDF (dibuat server).
  const coverField = (
    <Field
      id="a-cover"
      label="Surat pengantar (opsional)"
      hint="Tulis seperti biasa. Perusahaan akan menerimanya dalam bentuk PDF."
    >
      <textarea
        id="a-cover"
        className="field-input min-h-[100px] resize-y"
        placeholder="Ceritakan singkat kenapa Anda cocok untuk posisi ini."
        maxLength={3000}
        value={form.coverLetter}
        onChange={(e) => setForm((f) => ({ ...f, coverLetter: e.target.value }))}
      />
    </Field>
  );

  const uploadCvPicker = (
    <Field id="a-cv" label="CV" error={errors.cv} hint="PDF, DOC, atau DOCX. Maksimal 5 MB.">
      {form.cv ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3.5 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText size={20} className="text-brand shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{form.cv.name}</div>
              <div className="text-xs text-gray-400">{formatFileSize(form.cv.size)}</div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm shrink-0"
            onClick={() => setForm((f) => ({ ...f, cv: null, replaceCv: true }))}
          >
            Ganti
          </button>
        </div>
      ) : usingSaved ? (
        <div role="radiogroup" aria-label="Pilih CV" className="flex flex-col gap-2">
          {career.cvs.map((cv) => (
            <label
              key={cv.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-3 ${form.cvId === cv.id ? "border-brand bg-brand-soft" : "border-gray-200"}`}
            >
              <input
                type="radio"
                name="a-cv-choice"
                checked={form.cvId === cv.id}
                onChange={() => setForm((f) => ({ ...f, cvId: cv.id }))}
              />
              <FileText size={18} className="text-brand shrink-0" />
              <span className="min-w-0 truncate text-sm font-semibold">{cv.name}</span>
              <span className="ml-auto shrink-0 text-xs text-gray-400">{formatFileSize(cv.size)}</span>
            </label>
          ))}
          <button
            type="button"
            className="self-start border-none bg-transparent p-0 text-xs text-brand underline"
            onClick={() => setForm((f) => ({ ...f, replaceCv: true }))}
          >
            Unggah CV lain untuk lamaran ini
          </button>
        </div>
      ) : (
        <label
          htmlFor="a-cv"
          className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-gray-300 hover:border-brand cursor-pointer text-center px-4 py-8"
        >
          <Upload size={22} className="text-gray-400" />
          <span className="text-sm font-semibold">Pilih file CV</span>
          <span className="text-xs text-gray-400">Klik untuk memilih dari perangkat Anda</span>
        </label>
      )}
      {hasSaved && form.replaceCv && !form.cv && (
        <button
          type="button"
          className="mt-2 self-start border-none bg-transparent p-0 text-xs text-brand underline"
          onClick={() => setForm((f) => ({ ...f, replaceCv: false }))}
        >
          Pilih dari CV tersimpan
        </button>
      )}
      <input id="a-cv" type="file" accept={CV_ACCEPT} onChange={handleFile} className="sr-only" />
    </Field>
  );

  // Mode hijau: CV utama dari profil dipakai, tanpa input CV di modal.
  const cvPicker = fromProfile ? (
    <Field id="a-cv" label="CV" hint="Diambil otomatis dari profil karier. Ganti CV utama di Profil > Karier.">
      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3">
        <FileText size={20} className="text-success shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{career.cvs[0]?.name}</div>
          <div className="text-xs text-gray-500">CV utama</div>
        </div>
      </div>
    </Field>
  ) : (
    uploadCvPicker
  );

  const workFields = (
    <div className="mb-4">
      <p className="m-0 mb-0.5 text-sm font-bold text-gray-900">Hak bekerja & sponsor</p>
      <p className="m-0 mb-3 text-xs text-gray-500">Dipakai perusahaan untuk menilai kelayakan lamaran Anda.</p>
      <YesNo
        name="a-workauth"
        label="Apakah Anda berhak bekerja di lokasi pekerjaan ini?"
        value={form.workAuth}
        error={errors.workAuth}
        onChange={(v) => setForm((f) => ({ ...f, workAuth: v }))}
      />
      <YesNo
        name="a-sponsor"
        label="Apakah Anda membutuhkan sponsor visa untuk bekerja di sana?"
        value={form.needsSponsor}
        error={errors.needsSponsor}
        onChange={(v) => setForm((f) => ({ ...f, needsSponsor: v }))}
      />
    </div>
  );

  const priorityToggle = (
    <label
      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
      onClick={(e) => {
        if (!user?.is_pro) { e.preventDefault(); openPro("Lamaran prioritas tampil lebih dulu di dashboard perekrut. Kuota 10 per bulan."); }
      }}
    >
      <input
        type="checkbox"
        checked={form.priority && Boolean(user?.is_pro)}
        onChange={(e) => setForm((f) => ({ ...f, priority: e.target.checked }))}
      />
      Jadikan lamaran prioritas <ProCrown />
    </label>
  );

  // Warna status profil: hijau (lengkap), kuning (sebagian), merah (belum diisi).
  const READINESS = {
    complete: {
      box: "border-emerald-200 bg-emerald-50",
      icon: "text-success",
      title: "Data profil karier sudah lengkap",
      text: "CV utama dan data kariermu dipakai otomatis untuk lamaran ini.",
    },
    partial: {
      box: "border-amber-200 bg-amber-50",
      icon: "text-amber-600",
      title: "Data profil karier belum lengkap",
      text: "Lengkapi di halaman Profil > Karier agar lamaran berikutnya tidak perlu diisi ulang.",
    },
    empty: {
      box: "border-red-200 bg-red-50",
      icon: "text-danger",
      title: "Data profil karier belum diisi",
      text: "Isi data karier dan unggah CV di halaman Profil. Untuk lamaran ini, lengkapi formulir di bawah.",
    },
  }[readiness];
  const readinessBanner = (
    <div className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 ${READINESS.box}`}>
      {readiness === "complete" ? (
        <CheckCircle2 size={22} className={`mt-0.5 shrink-0 ${READINESS.icon}`} />
      ) : (
        <AlertTriangle size={20} className={`mt-0.5 shrink-0 ${READINESS.icon}`} />
      )}
      <div>
        <p className="m-0 text-sm font-bold text-gray-900">{READINESS.title}</p>
        <p className="m-0 mt-0.5 text-sm text-gray-600">{READINESS.text}</p>
      </div>
    </div>
  );

  if (showReview) {
    return (
      <Modal
        title={`Lamar ${job.title}`}
        subtitle={job.company_name}
        onClose={onClose}
        widthClass="max-w-xl"
        footer={
          <div className="flex items-center justify-between gap-3">
            <button className="btn btn-ghost" type="button" onClick={() => { setEditing(true); setStep(0); }} disabled={busy}>
              Ubah data
            </button>
            <button className="btn btn-accent" type="button" onClick={submit} disabled={busy}>
              {busy ? "Mengirim..." : "Kirim lamaran"}
            </button>
          </div>
        }
      >
        {submitError && (
          <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{submitError}</div>
        )}
        {readinessBanner}
        {screening}
        {coverField}
        {cvPicker}
        {workFields}
        {priorityToggle}
      </Modal>
    );
  }

  const isLast = step === STEPS.length - 1;

  return (
    <Modal
      title={`Lamar ${job.title}`}
      subtitle={job.company_name}
      onClose={onClose}
      widthClass="max-w-xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          {step > 0 ? (
            <button className="btn btn-ghost" type="button" onClick={back} disabled={busy}>
              Kembali
            </button>
          ) : (
            <span />
          )}
          {isLast ? (
            <button className="btn btn-accent" type="button" onClick={submit} disabled={busy}>
              {busy ? "Mengirim..." : "Kirim lamaran"}
            </button>
          ) : (
            <button className="btn btn-accent" type="button" onClick={next}>
              Lanjut
            </button>
          )}
        </div>
      }
    >
      {readinessBanner}
      <ol className="flex items-center gap-2 list-none p-0 m-0 mb-6" aria-label="Langkah lamaran">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1" aria-current={i === step ? "step" : undefined}>
            <div className={`h-1 rounded-full mb-1.5 ${i <= step ? "bg-brand" : "bg-gray-200"}`} />
            <span className={`text-xs ${i === step ? "font-bold text-brand" : "text-gray-400"}`}>
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>

      {submitError && (
        <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {submitError}
        </div>
      )}

      {step === 0 && (
        <>
          <Field id="a-name" label="Nama lengkap" error={errors.name}>
            <input id="a-name" className="field-input" value={form.name} onChange={set("name")} autoComplete="name" />
          </Field>
          <Field id="a-email" label="Email" error={errors.email}>
            <input
              id="a-email"
              className="field-input"
              type="email"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
            />
          </Field>
          <Field id="a-phone" label="Nomor HP" error={errors.phone} hint="Gunakan nomor yang aktif di WhatsApp.">
            <input
              id="a-phone"
              className="field-input"
              type="tel"
              inputMode="tel"
              placeholder="081234567890"
              value={form.phone}
              onChange={set("phone")}
              autoComplete="tel"
            />
          </Field>
        </>
      )}

      {step === 1 && (
        <>
          <Field id="a-english" label="Kemampuan bahasa Inggris (opsional)" error={errors.englishLevel}>
            <select id="a-english" className="field-input" value={form.englishLevel} onChange={set("englishLevel")}>
              {ENGLISH_LEVELS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="a-exp" label="Pengalaman kerja (opsional)" error={errors.experience}>
            <select id="a-exp" className="field-input" value={form.experience} onChange={set("experience")}>
              {EXPERIENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="a-skills" label="Keahlian utama" hint="Pisahkan dengan koma, misal: Figma, Excel, Public speaking.">
            <input id="a-skills" className="field-input" value={form.skills} onChange={set("skills")} />
          </Field>
        </>
      )}

      {step === 2 && (
        <>
          {screening}
          {coverField}
          {cvPicker}
          {workFields}
          {priorityToggle}
        </>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Tab "Lamaran Saya": status, dilihat perekrut, catatan & pengingat    */
/* ------------------------------------------------------------------ */

const STATUS_LABEL = { new: "Terkirim", reviewed: "Ditinjau", interview: "Interview", accepted: "Diterima", rejected: "Ditolak" };
const fmtTime = (iso) => new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

function MyApplicationsPanel({ isPro, openPro, onRequestWithdraw, refreshKey }) {
  const [apps, setApps] = useState(null);
  const [exts, setExts] = useState([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    api.myApplications().then((l) => setApps(l || [])).catch((e) => setErr(e.message));
    api.myExternalApplications().then((l) => setExts(l || [])).catch(() => {});
  }, [refreshKey]);
  if (err) return <p className="text-sm text-danger">{err}</p>;
  if (!apps) return <p className="text-gray-500 text-sm">Memuat lamaran...</p>;
  if (apps.length === 0 && exts.length === 0)
    return <div className="rounded-lg border border-dashed border-gray-200 text-gray-500 text-sm text-center py-12">Belum ada lamaran.</div>;
  return (
    <div className="space-y-3">
      {apps.map((a) => <ApplicationRow key={a.id} a={a} isPro={isPro} openPro={openPro} onRequestWithdraw={onRequestWithdraw} />)}
      {exts.length > 0 && (
        <>
          <h4 className="m-0 pt-3 text-sm font-bold text-gray-700">Lewat situs perusahaan</h4>
          {exts.map((e) => (
            <ExternalApplicationRow
              key={e.job_id}
              e={e}
              onApplied={() => setExts((list) => list.map((x) => (x.job_id === e.job_id ? { ...x, applied_at: new Date().toISOString() } : x)))}
            />
          ))}
        </>
      )}
    </div>
  );
}

function ExternalApplicationRow({ e, onApplied }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const mark = async () => {
    setBusy(true);
    setMsg("");
    try {
      await api.externalApplyDone(e.job_id);
      onApplied();
    } catch (err) {
      setMsg(err.message || "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold">{e.title}</div>
          <div className="text-sm text-gray-500">{e.company_name}{e.location ? ` · ${e.location}` : ""}</div>
          <div className="mt-1 text-xs text-gray-400">
            {e.applied_at ? `Ditandai melamar ${fmtTime(e.applied_at)}` : `Link dibuka ${fmtTime(e.clicked_at)}`}
            {e.job_status === "closed" && " · Lowongan ditutup"}
          </div>
        </div>
        {e.applied_at ? (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-success">Sudah melamar</span>
        ) : (
          <button className="btn btn-ghost btn-sm shrink-0" disabled={busy} onClick={mark}>
            {busy ? "Menyimpan..." : "Tandai sudah melamar"}
          </button>
        )}
      </div>
      {msg && <p className="m-0 mt-2 text-xs text-danger">{msg}</p>}
    </div>
  );
}

function ApplicationRow({ a, isPro, openPro, onRequestWithdraw }) {
  const [note, setNote] = useState(a.note || "");
  const [remind, setRemind] = useState(a.remind_at ? a.remind_at.slice(0, 16) : "");
  const [msg, setMsg] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatText, setChatText] = useState(
    `Selamat siang, saya ingin menanyakan perkembangan lamaran saya untuk posisi ${a.job_title || "ini"}. Terima kasih.`
  );
  const [chatMsg, setChatMsg] = useState("");
  const [used, setUsed] = useState(a.follow_ups_used || 0);
  const left = (a.follow_ups_max || 1) - used;
  const sendChat = async () => {
    setChatMsg("");
    try {
      await api.sendFollowUp(a.id, chatText);
      setUsed((n) => n + 1);
      setChatOpen(false);
      setChatMsg("Pesan terkirim ke HR. Balasan masuk di menu Pesan.");
    } catch (e) { setChatMsg(e.message); }
  };
  const save = async () => {
    try {
      await api.saveApplicationNote(a.id, note, remind ? new Date(remind).toISOString() : "");
      setMsg("Tersimpan");
    } catch (e) { setMsg(e.message); }
  };
  const gate = (why) => (e) => { e.preventDefault(); openPro(why); };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">{a.job_title || "Lowongan"}</p>
          <p className="text-sm text-gray-500">{a.company_name}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {a.is_priority && <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-yellow-700"><ProCrown size={11} /> Prioritas</span>}
          <span className="rounded-full bg-brand-soft px-2 py-0.5 font-semibold text-brand">{STATUS_LABEL[a.status] || a.status}</span>
          {(a.status === "new" || a.status === "reviewed") && onRequestWithdraw && (
            <button
              type="button"
              className="btn btn-ghost btn-sm text-danger"
              onClick={() => onRequestWithdraw({ id: a.job_id, title: a.job_title || "Lowongan", company_name: a.company_name })}
            >
              Batal melamar
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {a.viewed ? "Sudah dilihat perekrut" : "Belum dilihat perekrut"}
        {isPro && a.viewed_at && ` · ${fmtTime(a.viewed_at)}`}
        {!isPro && a.viewed && (
          <button type="button" className="ml-2 inline-flex items-center gap-1 text-gray-400 hover:text-gray-600"
            onClick={gate("Lihat kapan tepatnya perekrut membuka lamaranmu.")}>
            <ProCrown size={11} /> Lihat jamnya
          </button>
        )}
      </p>
      <div className="mt-3">
        {chatOpen ? (
          <div className="space-y-2">
            <textarea className="field-input w-full text-sm" rows={3} value={chatText} onChange={(e) => setChatText(e.target.value)} />
            <div className="flex gap-2">
              <button type="button" className="btn btn-accent btn-sm" onClick={sendChat}>Kirim ke HR</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setChatOpen(false)}>Batal</button>
            </div>
          </div>
        ) : left > 0 ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setChatOpen(true)}>
            Chat HR <span className="ml-1 text-xs text-gray-400">({left} pesan tersisa)</span>
          </button>
        ) : !isPro ? (
          <button type="button" className="btn btn-ghost btn-sm inline-flex items-center gap-1"
            onClick={() => openPro("Akun gratis bisa mengirim 1 pesan ke HR per lamaran. Pro: sampai 5 pesan, ditandai lencana Pro.")}>
            <ProCrown size={12} /> Tambah pesan ke HR
          </button>
        ) : (
          <span className="text-xs text-gray-500">Batas pesan untuk lamaran ini sudah tercapai.</span>
        )}
        {chatMsg && (
          <p className="mt-1 text-xs text-gray-600">
            {chatMsg} {chatMsg.startsWith("Pesan terkirim") && <Link className="text-brand underline" to={`/pesan?ke=${a.poster_id}`}>Buka Pesan</Link>}
          </p>
        )}
      </div>
      <div className="mt-3" onClick={!isPro ? gate("Tulis catatan dan atur pengingat follow-up untuk tiap lamaran.") : undefined}>
        <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-gray-600">Catatan & pengingat <ProCrown size={11} /></label>
        <textarea className="field-input w-full text-sm" rows={2} placeholder="Mis. HRD: Bu Sari, follow-up Jumat" value={note}
          readOnly={!isPro} onChange={(e) => setNote(e.target.value)} />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input type="datetime-local" className="field-input text-sm w-auto" value={remind} readOnly={!isPro}
            onChange={(e) => setRemind(e.target.value)} />
          {isPro && <button type="button" className="btn btn-ghost btn-sm" onClick={save}>Simpan</button>}
          {msg && <span className="text-xs text-gray-500">{msg}</span>}
        </div>
      </div>
    </div>
  );
}