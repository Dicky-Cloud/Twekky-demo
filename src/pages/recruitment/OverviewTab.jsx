import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Briefcase, Eye, Users, Inbox } from "lucide-react";
import { api } from "../../api/client";
import { APPLICATION_STATUSES, formatShortDate, timeAgo } from "../../constants/recruitment";
import { Avatar } from "../../components/recruitment/StatusBadge";

function StatCard({ icon: Icon, label, value, hint, accent }) {
  return (
    <div className={`rounded-xl border bg-white p-5 ${accent ? "border-brand" : "border-gray-200"}`}>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Icon size={16} strokeWidth={2} className={accent ? "text-brand" : "text-gray-400"} />
        {label}
      </div>
      <div className={`text-3xl font-bold leading-none ${accent ? "text-brand" : ""}`}>{value}</div>
      {hint && <div className="text-xs text-gray-400 mt-2">{hint}</div>}
    </div>
  );
}

function DailyChart({ daily }) {
  const max = Math.max(1, ...daily.map((d) => d.count));
  const total = daily.reduce((n, d) => n + d.count, 0);
  if (total === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 text-gray-500 text-sm text-center py-10">
        Belum ada lamaran dalam 14 hari terakhir.
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-end gap-1.5 h-32" role="img" aria-label={`${total} lamaran dalam 14 hari terakhir`}>
        {daily.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col justify-end h-full" title={`${formatShortDate(d.date)}: ${d.count} pelamar`}>
            <div
              className={`w-full rounded-t ${d.count ? "bg-brand" : "bg-gray-100"}`}
              style={{ height: d.count ? `${Math.max(8, (d.count / max) * 100)}%` : "3px" }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-gray-400 mt-2">
        <span>{formatShortDate(daily[0].date)}</span>
        <span>{formatShortDate(daily[daily.length - 1].date)}</span>
      </div>
    </div>
  );
}

export default function OverviewTab() {
  const { jobs, stats, loading } = useOutletContext();
  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .recruitmentApplicants()
      .then((list) => !cancelled && setRecent((list || []).filter((a) => a.status === "new").slice(0, 5)))
      .catch(() => {})
      .finally(() => !cancelled && setRecentLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !stats) return <p className="text-gray-500 text-sm">Memuat ringkasan...</p>;

  if (jobs.length === 0) {
    return (
      <div className="card text-center py-10">
        <Briefcase size={34} className="mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-bold mb-1">Belum ada lowongan</h3>
        <p className="text-sm text-gray-500 max-w-[44ch] mx-auto mb-5">
          Pasang lowongan pertama Anda. Lamaran yang masuk akan muncul di sini.
        </p>
        <Link to="/rekrutmen/lowongan" className="btn btn-accent">
          Pasang lowongan
        </Link>
      </div>
    );
  }

  const sc = stats.status_counts || {};
  const totalApplicants = stats.total_applicants || 0;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Briefcase} label="Lowongan aktif" value={stats.active_jobs} hint={`dari ${stats.total_jobs} lowongan`} />
        <StatCard icon={Users} label="Total pelamar" value={totalApplicants} />
        <StatCard icon={Inbox} label="Perlu ditinjau" value={sc.new || 0} hint="lamaran berstatus Baru" accent={(sc.new || 0) > 0} />
        <StatCard icon={Eye} label="Dilihat" value={stats.total_views} hint="total tampilan lowongan" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <section className="card lg:col-span-2 !mb-0">
          <h3 className="text-base font-bold mb-4">Pelamar 14 hari terakhir</h3>
          <DailyChart daily={stats.daily || []} />
        </section>

        <section className="card !mb-0">
          <h3 className="text-base font-bold mb-4">Tahapan lamaran</h3>
          <ul className="list-none p-0 m-0 flex flex-col gap-3">
            {APPLICATION_STATUSES.map((s) => {
              const n = sc[s.value] || 0;
              return (
                <li key={s.value}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{s.label}</span>
                    <span className="font-semibold">{n}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.bar}`}
                      style={{ width: totalApplicants ? `${(n / totalApplicants) * 100}%` : "0%" }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="card !mb-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold m-0">Perlu ditinjau</h3>
          <Link to="/rekrutmen/pelamar?status=new" className="text-sm text-brand font-semibold hover:underline">
            Lihat semua
          </Link>
        </div>
        {recentLoading ? (
          <p className="text-gray-500 text-sm m-0">Memuat pelamar...</p>
        ) : recent.length === 0 ? (
          <p className="text-gray-500 text-sm m-0">Semua lamaran sudah ditinjau.</p>
        ) : (
          <ul className="list-none p-0 m-0 divide-y divide-gray-100">
            {recent.map((a) => (
              <li key={a.id}>
                <Link
                  to={`/rekrutmen/pelamar/${a.id}`}
                  className="flex items-center gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <Avatar name={a.name} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{a.name}</div>
                    <div className="text-xs text-gray-500 truncate">Melamar {a.job_title}</div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{timeAgo(a.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
