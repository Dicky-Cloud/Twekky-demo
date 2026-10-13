import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { Columns3, Download, List, Search, X } from "lucide-react";
import { api } from "../../api/client";
import { APPLICATION_STATUSES, ENGLISH_LABELS, EXPERIENCE_LABELS, STATUS_MAP, timeAgo } from "../../constants/recruitment";
import { Avatar, ErrorBanner, StatusBadge } from "../../components/recruitment/StatusBadge";
import { MatchBadge } from "../../components/recruitment/MatchScore";
import { EvalBadge, RatingStars } from "../../components/recruitment/EvaluationCard";

// Penanda hasil pertanyaan penyaring (hanya bila lowongan punya jawaban ideal).
function FlagBadge({ flag, className = "" }) {
  if (!flag || flag.evaluated === 0) return null;
  const ok = flag.mismatches === 0;
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
        ok ? "bg-gray-100 text-gray-600" : "bg-brand text-white"
      } ${className}`}
      title={ok ? "Semua jawaban penyaring sesuai" : `${flag.mismatches} dari ${flag.evaluated} jawaban tidak sesuai`}
    >
      {ok ? "Sesuai kriteria" : `${flag.mismatches} tidak sesuai`}
    </span>
  );
}

export default function ApplicantsTab() {
  const { jobs, reload } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const jobId = params.get("lowongan") || "";
  const status = params.get("status") || "";
  const view = params.get("tampilan") === "papan" ? "papan" : "daftar";

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [flags, setFlags] = useState({}); // hasil pertanyaan penyaring per lamaran
  const [matchInfo, setMatchInfo] = useState({ allowed: false, results: {} }); // skor kecocokan (Growth)
  const [evalInfo, setEvalInfo] = useState({ allowed: false, items: {} }); // penilaian pelamar (Growth)
  const [sortBy, setSortBy] = useState("terbaru"); // terbaru | skor | nilai
  const matches = matchInfo.results || {};
  const evals = evalInfo.items || {};

  // aksi massal (tampilan daftar)
  const [selected, setSelected] = useState(() => new Set());
  const [bulkStatus, setBulkStatus] = useState("reviewed");
  const [bulkBusy, setBulkBusy] = useState(false);

  // papan kanban: kolom yang sedang disorot saat kartu diseret
  const [dragOver, setDragOver] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setSelected(new Set());
    api
      .recruitmentApplicants(jobId)
      .then((list) => !cancelled && setApplicants(list || []))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  useEffect(() => {
    let cancelled = false;
    api
      .screeningFlags()
      .then((f) => !cancelled && setFlags(f || {}))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .recruitmentMatches(jobId)
      .then((m) => !cancelled && setMatchInfo(m || { allowed: false, results: {} }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  useEffect(() => {
    let cancelled = false;
    api
      .evaluations()
      .then((e) => !cancelled && setEvalInfo(e || { allowed: false, items: {} }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const changeView = (v) => {
    setSelected(new Set());
    setParam("tampilan", v === "papan" ? "papan" : "");
  };

  // hasil pencarian tanpa filter status (dipakai papan & hitungan tab)
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applicants;
    return applicants.filter((a) => `${a.name} ${a.email} ${a.skills} ${a.job_title}`.toLowerCase().includes(q));
  }, [applicants, query]);

  const counts = useMemo(() => {
    const c = { "": applicants.length };
    APPLICATION_STATUSES.forEach((s) => (c[s.value] = 0));
    applicants.forEach((a) => (c[a.status] = (c[a.status] || 0) + 1));
    return c;
  }, [applicants]);

  const visible = useMemo(() => {
    const list = status ? searched.filter((a) => a.status === status) : searched;
    if (sortBy === "skor") return [...list].sort((a, b) => (matches[b.id]?.score ?? -1) - (matches[a.id]?.score ?? -1));
    if (sortBy === "nilai") return [...list].sort((a, b) => (evals[b.id]?.rating ?? -1) - (evals[a.id]?.rating ?? -1));
    return list;
  }, [searched, status, sortBy, matches, evals]);

  const columns = useMemo(() => {
    const map = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s.value, []]));
    searched.forEach((a) => (map[a.status] || map.new).push(a));
    return map;
  }, [searched]);

  // Ubah status satu pelamar. Tampilan diperbarui lebih dulu (supaya kartu
  // langsung pindah kolom) dan dikembalikan bila server menolak.
  const changeStatus = async (a, next) => {
    if (next === a.status) return;
    const prev = a.status;
    setApplicants((list) => list.map((x) => (x.id === a.id ? { ...x, status: next } : x)));
    setBusyId(a.id);
    setError("");
    try {
      const updated = await api.setApplicantStatus(a.id, next);
      setApplicants((list) => list.map((x) => (x.id === a.id ? { ...x, ...updated } : x)));
      reload(); // perbarui angka di tab & statistik
    } catch (err) {
      setApplicants((list) => list.map((x) => (x.id === a.id ? { ...x, status: prev } : x)));
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allVisibleSelected = visible.length > 0 && visible.every((a) => selected.has(a.id));
  const toggleAll = () => setSelected(allVisibleSelected ? new Set() : new Set(visible.map((a) => a.id)));

  const applyBulk = async () => {
    const targets = applicants.filter((a) => selected.has(a.id) && a.status !== bulkStatus);
    if (targets.length === 0) {
      setSelected(new Set());
      return;
    }
    const label = STATUS_MAP[bulkStatus].label;
    if (bulkStatus === "rejected" && !window.confirm(`Tandai ${targets.length} pelamar sebagai "${label}"?`)) return;

    setBulkBusy(true);
    setError("");
    const results = await Promise.allSettled(targets.map((a) => api.setApplicantStatus(a.id, bulkStatus)));
    const done = new Map();
    results.forEach((r, i) => {
      if (r.status === "fulfilled") done.set(targets[i].id, r.value);
    });
    setApplicants((list) =>
      list.map((x) => (done.has(x.id) ? { ...x, ...done.get(x.id), status: bulkStatus } : x))
    );
    const failed = targets.filter((a) => !done.has(a.id));
    if (failed.length > 0) setError(`${failed.length} dari ${targets.length} pelamar gagal diubah. Coba lagi.`);
    setSelected(new Set(failed.map((a) => a.id))); // yang gagal tetap terpilih
    reload();
    setBulkBusy(false);
  };

  const exportCSV = async () => {
    setExporting(true);
    setError("");
    try {
      await api.exportApplicantsCSV(jobId, view === "papan" ? "" : status);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const onDrop = (e, columnStatus) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/plain");
    const a = applicants.find((x) => x.id === id);
    if (a) changeStatus(a, columnStatus);
  };

  const infoLine = (a) =>
    `${EXPERIENCE_LABELS[a.experience] || a.experience || "Pengalaman: tidak diisi"} · Inggris: ${
      ENGLISH_LABELS[a.english_level] || a.english_level || "tidak diisi"
    }`;

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="field-input !pl-9"
            placeholder="Cari nama, email, atau keahlian pelamar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Cari pelamar"
          />
        </div>
        <select
          className="field-input sm:w-[240px] shrink-0"
          value={jobId}
          onChange={(e) => setParam("lowongan", e.target.value)}
          aria-label="Filter lowongan"
        >
          <option value="">Semua lowongan</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
              {j.status === "closed" ? " (ditutup)" : ""}
            </option>
          ))}
        </select>
        {view === "daftar" && (
          <select
            className="field-input sm:w-[190px] shrink-0"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Urutkan pelamar"
          >
            <option value="terbaru">Urutkan: Terbaru</option>
            <option value="skor" disabled={!matchInfo.allowed}>
              Skor kecocokan{matchInfo.allowed ? "" : " (Growth)"}
            </option>
            <option value="nilai" disabled={!evalInfo.allowed}>
              Penilaian saya{evalInfo.allowed ? "" : " (Growth)"}
            </option>
          </select>
        )}
        <div className="flex shrink-0 rounded-lg border border-gray-200 bg-white p-0.5" role="group" aria-label="Tampilan pelamar">
          {[
            { v: "daftar", label: "Daftar", Icon: List },
            { v: "papan", label: "Papan", Icon: Columns3 },
          ].map(({ v, label, Icon }) => (
            <button
              key={v}
              type="button"
              onClick={() => changeView(v)}
              aria-pressed={view === v}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                view === v ? "bg-brand text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-ghost shrink-0"
          onClick={exportCSV}
          disabled={exporting || applicants.length === 0}
          title={
            view === "papan"
              ? "Unduh semua pelamar sesuai filter lowongan"
              : "Unduh pelamar sesuai filter lowongan dan status"
          }
        >
          <Download size={15} /> {exporting ? "Mengekspor..." : "Ekspor CSV"}
        </button>
      </div>

      {view === "daftar" && (
        <div className="flex flex-wrap gap-1.5 mb-5" role="tablist" aria-label="Filter status">
          {[{ value: "", label: "Semua" }, ...APPLICATION_STATUSES].map((s) => (
            <button
              key={s.value || "all"}
              type="button"
              role="tab"
              aria-selected={status === s.value}
              onClick={() => setParam("status", s.value)}
              className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                status === s.value
                  ? "bg-brand text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s.label} <span className="opacity-70">{counts[s.value] || 0}</span>
            </button>
          ))}
        </div>
      )}

      <ErrorBanner>{error}</ErrorBanner>

      {loading ? (
        <p className="text-gray-500 text-sm">Memuat pelamar...</p>
      ) : applicants.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 text-gray-500 text-sm text-center py-8">
          Belum ada pelamar. Lamaran yang masuk akan tampil di sini.
        </div>
      ) : view === "papan" ? (
        /* ---------- Papan kanban ---------- */
        <>
          <p className="text-xs text-gray-500 mt-0 mb-3">
            Seret kartu ke kolom lain untuk mengubah status, atau pakai menu di tiap kartu.
          </p>
          <div className="flex gap-3 overflow-x-auto pb-3 items-start">
            {APPLICATION_STATUSES.map((col) => (
              <section
                key={col.value}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOver !== col.value) setDragOver(col.value);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null);
                }}
                onDrop={(e) => onDrop(e, col.value)}
                aria-label={`Kolom ${col.label}`}
                className={`w-[260px] shrink-0 rounded-xl p-2.5 transition-colors ${
                  dragOver === col.value ? "bg-gray-200" : "bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 px-1 pb-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.bar}`} />
                  <h3 className="m-0 text-sm font-bold">{col.label}</h3>
                  <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-gray-500">
                    {columns[col.value].length}
                  </span>
                </div>
                <div className="flex flex-col gap-2 min-h-[60px]">
                  {columns[col.value].length === 0 && (
                    <p className="m-0 py-4 text-center text-xs text-gray-400">Kosong</p>
                  )}
                  {columns[col.value].map((a) => (
                    <article
                      key={a.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", a.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => setDragOver(null)}
                      className={`cursor-grab rounded-lg border border-gray-200 bg-white p-3 active:cursor-grabbing ${
                        busyId === a.id ? "opacity-60" : ""
                      }`}
                    >
                      <Link to={`/rekrutmen/pelamar/${a.id}`} className="flex items-start gap-2.5 text-inherit no-underline" draggable={false}>
                        <Avatar name={a.name} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold">{a.name}</div>
                          <div className="truncate text-xs text-gray-500">{a.job_title}</div>
                        </div>
                      </Link>
                      <div className="mt-2 text-[11px] leading-snug text-gray-400">
                        {infoLine(a)}
                        <br />
                        {timeAgo(a.created_at)}
                      </div>
                      <FlagBadge flag={flags[a.id]} className="mt-2" />
                      {(matches[a.id] || evals[a.id]) && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <MatchBadge match={matches[a.id]} />
                          {evals[a.id]?.rating > 0 && <RatingStars value={evals[a.id].rating} size={12} />}
                          <EvalBadge label={evals[a.id]?.label} />
                        </div>
                      )}
                      <select
                        className="field-input mt-2 !py-1 text-xs"
                        value={a.status}
                        disabled={busyId === a.id}
                        onChange={(e) => changeStatus(a, e.target.value)}
                        aria-label={`Pindahkan ${a.name}`}
                      >
                        {APPLICATION_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 text-gray-500 text-sm text-center py-8">
          Tidak ada pelamar yang cocok dengan filter.
        </div>
      ) : (
        /* ---------- Daftar + aksi massal ---------- */
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand"
                checked={allVisibleSelected}
                onChange={toggleAll}
                aria-label="Pilih semua pelamar yang tampil"
              />
              {selected.size > 0 ? `${selected.size} dipilih` : "Pilih semua"}
            </label>
            {selected.size > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-500">Ubah status ke</span>
                <select
                  className="field-input !w-auto !py-1.5 text-[13px]"
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  aria-label="Status baru untuk pelamar terpilih"
                >
                  {APPLICATION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-accent btn-sm" onClick={applyBulk} disabled={bulkBusy}>
                  {bulkBusy ? "Menerapkan..." : "Terapkan"}
                </button>
                <button
                  type="button"
                  className="ml-auto flex items-center gap-1 text-[13px] font-medium text-gray-500 hover:text-gray-900"
                  onClick={() => setSelected(new Set())}
                  disabled={bulkBusy}
                >
                  <X size={14} /> Batal pilih
                </button>
              </>
            )}
          </div>

          {visible.map((a) => (
            <div
              key={a.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border bg-white p-4 mb-3 transition-colors ${
                selected.has(a.id) ? "border-brand" : "border-gray-200 hover:border-brand"
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-brand"
                checked={selected.has(a.id)}
                onChange={() => toggleOne(a.id)}
                aria-label={`Pilih ${a.name}`}
              />
              <Link to={`/rekrutmen/pelamar/${a.id}`} className="flex items-center gap-3.5 min-w-0 flex-1 text-inherit no-underline">
                <Avatar name={a.name} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-[15px] font-bold truncate">{a.name}</span>
                    <StatusBadge status={a.status} />
                    <FlagBadge flag={flags[a.id]} />
                    <MatchBadge match={matches[a.id]} />
                    {evals[a.id]?.rating > 0 && <RatingStars value={evals[a.id].rating} size={13} />}
                    <EvalBadge label={evals[a.id]?.label} />
                  </div>
                  <div className="text-sm text-gray-500 truncate">Melamar {a.job_title}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {infoLine(a)} · {timeAgo(a.created_at).toLowerCase()}
                  </div>
                </div>
              </Link>
              <select
                className="field-input sm:w-[150px] shrink-0 !py-1.5 text-[13px]"
                value={a.status}
                disabled={busyId === a.id || bulkBusy}
                onChange={(e) => changeStatus(a, e.target.value)}
                aria-label={`Ubah status ${a.name}`}
              >
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </>
      )}
    </>
  );
}
