import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { api } from "../../api/client";
import { JobStatusBadge } from "../../components/recruitment/StatusBadge";
import {
  APPLICATION_STATUSES,
  ENGLISH_LABELS,
  EXPERIENCE_LABELS,
  percent,
} from "../../constants/recruitment";

const PERIODS = [
  { value: 7, label: "7 hari" },
  { value: 30, label: "30 hari" },
  { value: 0, label: "Semua" },
];

function Metric({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="text-sm text-gray-500 mb-2">{label}</div>
      <div className="text-3xl font-bold leading-none">{value}</div>
      <div className="text-xs text-gray-400 mt-2">{hint}</div>
    </div>
  );
}

function Panel({ title, hint, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-base font-bold m-0">{title}</h3>
      {hint && <p className="text-xs text-gray-400 mt-1 mb-0">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// Baris bar horizontal: label, bar proporsional, angka.
function BarRow({ label, value, max, suffix }) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0;
  return (
    <div className="flex items-center gap-3 mb-2.5 last:mb-0">
      <div className="w-32 shrink-0 truncate text-[13px] text-gray-600" title={label}>
        {label}
      </div>
      <div className="h-2.5 flex-1 rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-brand" style={{ width: `${width}%` }} />
      </div>
      <div className="w-14 shrink-0 text-right text-[13px] font-semibold">
        {value}
        {suffix}
      </div>
    </div>
  );
}

const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function splitSkills(raw) {
  return String(raw || "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function StatsTab() {
  const { jobs, stats, loading } = useOutletContext();
  const [period, setPeriod] = useState(30);
  const [applicants, setApplicants] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .recruitmentApplicants("")
      .then((list) => !cancelled && setApplicants(list || []))
      .catch((err) => !cancelled && setListError(err.message))
      .finally(() => !cancelled && setLoadingList(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // pelamar dalam periode terpilih
  const inPeriod = useMemo(() => {
    if (!period) return applicants;
    const since = Date.now() - period * 86400000;
    return applicants.filter((a) => new Date(a.created_at).getTime() >= since);
  }, [applicants, period]);

  const analysis = useMemo(() => {
    const total = inPeriod.length;
    const sc = {};
    APPLICATION_STATUSES.forEach((s) => (sc[s.value] = 0));
    inPeriod.forEach((a) => (sc[a.status] = (sc[a.status] || 0) + 1));

    // tren harian (maks. 30 hari terakhir)
    const days = period || 30;
    const buckets = [];
    const index = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      index[key] = buckets.length;
      buckets.push({ key, date: d, count: 0 });
    }
    inPeriod.forEach((a) => {
      const i = index[dayKey(new Date(a.created_at))];
      if (i !== undefined) buckets[i].count++;
    });

    const countBy = (fn) => {
      const m = {};
      inPeriod.forEach((a) => {
        const k = fn(a);
        m[k] = (m[k] || 0) + 1;
      });
      return m;
    };
    const experience = countBy((a) => EXPERIENCE_LABELS[a.experience] || a.experience || "Tidak diisi");
    const english = countBy((a) => ENGLISH_LABELS[a.english_level] || a.english_level || "Tidak diisi");

    const skillMap = {};
    inPeriod.forEach((a) =>
      new Set(splitSkills(a.skills).map((s) => s.toLowerCase())).forEach((k) => (skillMap[k] = (skillMap[k] || 0) + 1))
    );
    const skills = Object.entries(skillMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return { total, sc, buckets, experience, english, skills };
  }, [inPeriod, period]);

  if (loading || !stats) return <p className="text-gray-500 text-sm">Memuat statistik...</p>;

  const sorted = [...jobs].sort((a, b) => b.applicant_count - a.applicant_count);
  const hasExternal = jobs.some((j) => j.apply_mode === "external");

  const { total, sc, buckets, experience, english, skills } = analysis;
  // tampilan hanya dihitung dari lowongan "lamar di Twekky" supaya corong adil
  const nativeJobs = jobs.filter((j) => j.apply_mode !== "external");
  const nativeViews = nativeJobs.reduce((sum, j) => sum + (j.views || 0), 0);
  const interviewPlus = (sc.interview || 0) + (sc.accepted || 0);
  const funnel = [
    { label: "Dilihat", value: nativeViews },
    { label: "Melamar", value: applicants.length },
    { label: "Wawancara", value: applicants.filter((a) => a.status === "interview" || a.status === "accepted").length },
    { label: "Diterima", value: applicants.filter((a) => a.status === "accepted").length },
  ];
  const peakDay = Math.max(1, ...buckets.map((b) => b.count));
  const trendTotal = buckets.reduce((s, b) => s + b.count, 0);

  const externalClicks = jobs.filter((j) => j.apply_mode === "external").reduce((s, j) => s + (j.apply_clicks || 0), 0);

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h3 className="text-base font-bold m-0">Ringkasan performa</h3>
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5" role="group" aria-label="Periode statistik">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              aria-pressed={period === p.value}
              className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                period === p.value ? "bg-brand text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        <Metric
          label="Rasio lamaran"
          value={percent(applicants.length, nativeViews)}
          hint={`${applicants.length} pelamar dari ${nativeViews} tampilan (lamar di Twekky)`}
        />
        <Metric
          label="Dipanggil wawancara"
          value={percent(interviewPlus, total)}
          hint={`${interviewPlus} dari ${total} pelamar ${period ? `${period} hari terakhir` : "keseluruhan"}`}
        />
        <Metric
          label="Diterima"
          value={percent(sc.accepted || 0, total)}
          hint={`${sc.accepted || 0} dari ${total} pelamar ${period ? `${period} hari terakhir` : "keseluruhan"}`}
        />
      </div>

      {listError && (
        <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          Data pelamar gagal dimuat: {listError}
        </div>
      )}

      {loadingList ? (
        <p className="text-gray-500 text-sm">Memuat analisis pelamar...</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Panel title="Corong rekrutmen" hint="Dari tampilan sampai diterima, seluruh waktu (lowongan lamar di Twekky).">
            {funnel.map((f, i) => (
              <div key={f.label}>
                <BarRow label={f.label} value={f.value} max={funnel[0].value || funnel[1].value} />
                {i < funnel.length - 1 && (
                  <div className="ml-32 pl-3 -mt-1 mb-1.5 text-[11px] text-gray-400">
                    {percent(funnel[i + 1].value, f.value)} lanjut ke tahap berikutnya
                  </div>
                )}
              </div>
            ))}
          </Panel>

          <Panel
            title="Pelamar per hari"
            hint={`${trendTotal} pelamar dalam ${buckets.length} hari terakhir`}
          >
            {trendTotal === 0 ? (
              <p className="text-sm text-gray-400 m-0 py-6 text-center">Belum ada lamaran pada periode ini.</p>
            ) : (
              <>
                <div className="flex items-end gap-[3px] h-32" role="img" aria-label="Grafik pelamar per hari">
                  {buckets.map((b) => (
                    <div
                      key={b.key}
                      className="flex-1 rounded-t bg-brand min-h-[2px]"
                      style={{ height: `${(b.count / peakDay) * 100}%`, opacity: b.count ? 1 : 0.15 }}
                      title={`${b.date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}: ${b.count} pelamar`}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-gray-400">
                  <span>{buckets[0].date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                  <span>Puncak: {peakDay} / hari</span>
                  <span>Hari ini</span>
                </div>
              </>
            )}
          </Panel>

          <Panel title="Status pelamar" hint={`${total} pelamar ${period ? `dalam ${period} hari terakhir` : "keseluruhan"}`}>
            {total === 0 ? (
              <p className="text-sm text-gray-400 m-0">Belum ada data.</p>
            ) : (
              <>
                <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
                  {APPLICATION_STATUSES.map((s) =>
                    sc[s.value] ? (
                      <div key={s.value} className={s.bar} style={{ width: `${(sc[s.value] / total) * 100}%` }} title={`${s.label}: ${sc[s.value]}`} />
                    ) : null
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {APPLICATION_STATUSES.map((s) => (
                    <span key={s.value} className="flex items-center gap-1.5 text-[13px] text-gray-600">
                      <span className={`h-2.5 w-2.5 rounded-full ${s.bar}`} />
                      {s.label} <b className="text-gray-900">{sc[s.value] || 0}</b>
                    </span>
                  ))}
                </div>
              </>
            )}
          </Panel>

          <Panel title="Keahlian terbanyak" hint="Dari kolom keahlian pada lamaran.">
            {skills.length === 0 ? (
              <p className="text-sm text-gray-400 m-0">Belum ada data keahlian.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map(([name, n]) => (
                  <span key={name} className="rounded-full bg-gray-100 px-3 py-1 text-[13px] text-gray-700">
                    {name} <b className="text-gray-900">{n}</b>
                  </span>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Pengalaman pelamar">
            {total === 0 ? (
              <p className="text-sm text-gray-400 m-0">Belum ada data.</p>
            ) : (
              Object.entries(experience)
                .sort((a, b) => b[1] - a[1])
                .map(([label, n]) => (
                  <BarRow key={label} label={label} value={n} max={Math.max(...Object.values(experience))} />
                ))
            )}
          </Panel>

          <Panel title="Level bahasa Inggris">
            {total === 0 ? (
              <p className="text-sm text-gray-400 m-0">Belum ada data.</p>
            ) : (
              Object.entries(english)
                .sort((a, b) => b[1] - a[1])
                .map(([label, n]) => (
                  <BarRow key={label} label={label} value={n} max={Math.max(...Object.values(english))} />
                ))
            )}
          </Panel>
        </div>
      )}

      {hasExternal && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-base font-bold m-0">Lowongan di situs perusahaan</h3>
          <p className="text-sm text-gray-500 mt-1 mb-0">
            {externalClicks} pengguna unik membuka link lamaran. Lamaran sebenarnya diterima di situs Anda, jadi tidak
            masuk ke corong, papan, dan grafik di atas.
          </p>
        </div>
      )}

      <section className="card !p-0 overflow-hidden !mb-0">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-base font-bold m-0">Performa per lowongan</h3>
        </div>
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500 px-5 pb-5 m-0">Belum ada lowongan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[640px]">
              <thead>
                <tr className="text-left text-[13px] text-gray-500 border-y border-gray-100 bg-gray-50">
                  <th className="font-medium px-5 py-2.5">Lowongan</th>
                  <th className="font-medium px-3 py-2.5 text-right">Dilihat</th>
                  <th className="font-medium px-3 py-2.5 text-right">Pelamar</th>
                  <th className="font-medium px-3 py-2.5 text-right">Rasio</th>
                  <th className="font-medium px-3 py-2.5 text-right">Wawancara</th>
                  <th className="font-medium px-3 py-2.5 text-right">Diterima</th>
                  <th className="font-medium px-5 py-2.5 text-right">Ditolak</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((j) => (
                  <tr key={j.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-5 py-3">
                      <Link to={`/rekrutmen/pelamar?lowongan=${j.id}`} className="font-semibold text-inherit hover:text-brand">
                        {j.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-1.5">
                        <JobStatusBadge status={j.status} />
                        {j.apply_mode === "external" && (
                          <span className="rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold px-2.5 py-0.5">Situs perusahaan</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">{j.views}</td>
                    {j.apply_mode === "external" ? (
                      <>
                        <td className="px-3 py-3 text-right font-semibold">{j.apply_clicks} klik</td>
                        <td className="px-3 py-3 text-right text-gray-500">{percent(j.apply_clicks, j.views)}</td>
                        <td className="px-3 py-3 text-right text-gray-400">—</td>
                        <td className="px-3 py-3 text-right text-gray-400">—</td>
                        <td className="px-5 py-3 text-right text-gray-400">—</td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-3 text-right font-semibold">{j.applicant_count}</td>
                        <td className="px-3 py-3 text-right text-gray-500">{percent(j.applicant_count, j.views)}</td>
                        <td className="px-3 py-3 text-right">{j.status_counts?.interview || 0}</td>
                        <td className="px-3 py-3 text-right">{j.status_counts?.accepted || 0}</td>
                        <td className="px-5 py-3 text-right">{j.status_counts?.rejected || 0}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
