import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { BadgeCheck, Building2 } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import Topbar from "../../components/Topbar";
import { ErrorBanner } from "../../components/recruitment/StatusBadge";

// Satu pintu masuk "Rekrutmen" di sidebar; isinya dibagi jadi tab.
// Data lowongan & statistik dimuat sekali di sini dan dibagikan ke semua tab
// lewat <Outlet context>, supaya angka di tab selalu sama dan tidak ada
// permintaan ganda ke server.
export default function RecruitmentLayout() {
  const { user, loading: authLoading } = useAuth();
  const isBusiness = user?.account_type === "business";

  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [biz, setBiz] = useState(null); // paket, pemakaian kuota, isi halaman perusahaan
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    try {
      const [j, s, b] = await Promise.all([api.recruitmentJobs(), api.recruitmentStats(), api.businessMe()]);
      setJobs(j || []);
      setStats(s);
      setBiz(b);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isBusiness) reload();
  }, [isBusiness, reload]);

  if (authLoading) {
    return (
      <>
        <Topbar title="Rekrutmen" />
        <p className="text-gray-500 text-sm p-6">Memuat...</p>
      </>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  if (!isBusiness) {
    return (
      <>
        <Topbar title="Rekrutmen" />
        <div className="p-6 lg:p-8 w-full">
          <div className="card text-center py-10">
            <Building2 size={36} className="mx-auto text-gray-300 mb-3" />
            <h2 className="text-lg font-bold mb-1">Fitur ini untuk akun Bisnis</h2>
            <p className="text-sm text-gray-500 max-w-[44ch] mx-auto mb-5">
              Upgrade ke akun Bisnis untuk memasang lowongan, menerima lamaran, dan mengelola pelamar dari satu tempat.
            </p>
            <Link to="/profil" className="btn btn-accent">
              Buka profil untuk upgrade
            </Link>
          </div>
        </div>
      </>
    );
  }

  const newCount = stats?.status_counts?.new || 0;
  const tabs = [
    { to: "/rekrutmen", label: "Ringkasan", end: true },
    { to: "/rekrutmen/lowongan", label: "Lowongan Saya", count: jobs.length || null },
    { to: "/rekrutmen/pelamar", label: "Pelamar", count: newCount || null, highlight: true },
    { to: "/rekrutmen/wawancara", label: "Wawancara" },
    { to: "/rekrutmen/talent", label: "Talent Pool" },
    { to: "/rekrutmen/statistik", label: "Statistik" },
    { to: "/rekrutmen/template", label: "Template" },
    { to: "/rekrutmen/perusahaan", label: "Halaman Perusahaan" },
    { to: "/rekrutmen/paket", label: "Paket", tag: biz?.plan?.name },
  ];

  return (
    <>
      <Topbar title="Rekrutmen" />
      <div className="p-6 lg:p-8 w-full">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-soft text-brand shrink-0">
            <Building2 size={22} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-bold m-0 truncate">{user.company_name || "Perusahaan Anda"}</h2>
            <p className="m-0 text-sm text-gray-500 flex items-center gap-1.5">
              {user.verification_status === "verified" ? (
                <>
                  <BadgeCheck size={15} className="text-success" /> Perusahaan terverifikasi
                </>
              ) : (
                "Belum terverifikasi"
              )}
            </p>
          </div>
        </div>

        <nav
          className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto"
          aria-label="Menu rekrutmen"
        >
          {tabs.map(({ to, label, end, count, highlight, tag }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  isActive
                    ? "border-brand text-brand"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`
              }
            >
              {label}
              {tag ? (
                <span className="rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold px-1.5 py-0.5">{tag}</span>
              ) : null}
              {count ? (
                <span
                  className={`rounded-full text-[11px] font-bold px-1.5 py-0.5 ${
                    highlight ? "bg-brand text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <ErrorBanner>{error}</ErrorBanner>
        <Outlet context={{ jobs, stats, biz, loading, reload }} />
      </div>
    </>
  );
}
