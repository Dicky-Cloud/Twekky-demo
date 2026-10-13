import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Lock, Star } from "lucide-react";
import { api } from "../../api/client";
import { EVAL_LABELS, EVAL_LABEL_MAP } from "../../constants/hiring";
import { ErrorBanner } from "./StatusBadge";

const NOTE_MAX = 500;

// Bintang. Tanpa onChange = hanya tampilan; dengan onChange = bisa diklik
// (klik bintang yang sama sekali lagi untuk mengosongkan).
export function RatingStars({ value = 0, onChange, size = 16, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role={onChange ? "radiogroup" : "img"} aria-label={`${value} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = (
          <Star
            size={size}
            className={n <= value ? "text-amber-500" : "text-gray-300"}
            fill={n <= value ? "currentColor" : "none"}
            strokeWidth={1.75}
          />
        );
        return onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`${n} bintang`}
            className="p-0.5 bg-transparent border-none cursor-pointer"
            onClick={() => onChange(n === value ? 0 : n)}
          >
            {icon}
          </button>
        ) : (
          <span key={n}>{icon}</span>
        );
      })}
    </span>
  );
}

export function EvalBadge({ label, className = "" }) {
  const l = EVAL_LABEL_MAP[label];
  if (!l) return null;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${l.badge} ${className}`}>{l.label}</span>
  );
}

// Penilaian pribadi + tombol simpan ke talent pool, untuk satu pelamar.
// Hanya terlihat oleh perekrut. Di paket tanpa fitur ini: ajakan upgrade.
export default function EvaluationCard({ applicant }) {
  const [evalData, setEvalData] = useState(null); // { allowed, evaluation }
  const [pool, setPool] = useState(null); // { allowed, limit, count, items }
  const [rating, setRating] = useState(0);
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setEvalData(null);
    setPool(null);
    setSaved(false);
    setError("");
    Promise.all([api.applicantEvaluation(applicant.id), api.talentPool()])
      .then(([e, p]) => {
        if (cancelled) return;
        setEvalData(e);
        setPool(p);
        setRating(e?.evaluation?.rating || 0);
        setLabel(e?.evaluation?.label || "");
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [applicant.id]);

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveEvaluation = () =>
    run(async () => {
      const res = await api.saveEvaluation(applicant.id, { rating, label });
      setEvalData(res);
      setSaved(true);
    });

  const addToPool = () =>
    run(async () => {
      await api.addToTalentPool(applicant.id, note.trim());
      setNote("");
      setPool(await api.talentPool());
    });

  const removeFromPool = (entryId) => {
    if (!window.confirm("Keluarkan kandidat ini dari talent pool?")) return;
    run(async () => {
      await api.removeFromTalentPool(entryId);
      setPool(await api.talentPool());
    });
  };

  const current = evalData?.evaluation;
  const dirty = rating !== (current?.rating || 0) || label !== (current?.label || "");
  const entry = pool?.items?.find((i) => i.applicant_id === applicant.applicant_id);
  const loading = !evalData && !pool && !error;
  const locked = evalData && !evalData.allowed;

  return (
    <section className="card">
      <div className="flex items-center gap-2 mb-1">
        <Star size={17} className="text-brand" />
        <h3 className="text-base font-bold m-0">Penilaian &amp; talent pool</h3>
      </div>
      <p className="text-xs text-gray-400 m-0 mb-3">Hanya terlihat oleh Anda. Pelamar tidak bisa melihat penilaian ini.</p>
      <ErrorBanner>{error}</ErrorBanner>

      {loading ? (
        <p className="text-sm text-gray-400 m-0">Memuat...</p>
      ) : locked ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-center">
          <Lock size={20} className="mx-auto text-gray-400 mb-1.5" />
          <p className="text-sm text-gray-600 m-0 mb-3">Penilaian pelamar dan talent pool tersedia di paket Growth.</p>
          <Link to="/rekrutmen/paket" className="btn btn-accent btn-sm">
            Lihat paket
          </Link>
        </div>
      ) : (
        <>
          <div className="text-[13px] text-gray-500 font-medium mb-1">Nilai keseluruhan</div>
          <RatingStars value={rating} onChange={setRating} size={22} />

          <div className="text-[13px] text-gray-500 font-medium mt-3 mb-1.5">Kesimpulan</div>
          <div className="flex flex-wrap gap-1.5">
            {EVAL_LABELS.map((l) => (
              <button
                key={l.value}
                type="button"
                aria-pressed={label === l.value}
                onClick={() => setLabel(label === l.value ? "" : l.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  label === l.value ? l.active : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 mt-3">
            <span className="text-xs text-gray-400">{saved && !dirty ? "Tersimpan" : ""}</span>
            <button type="button" className="btn btn-accent btn-sm" onClick={saveEvaluation} disabled={busy || !dirty}>
              {busy ? "Menyimpan..." : "Simpan penilaian"}
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <Bookmark size={15} /> Talent pool
              </span>
              {pool?.allowed ? (
                <span className="text-xs text-gray-400">
                  {pool.count} / {pool.limit} kandidat
                </span>
              ) : null}
            </div>

            {!pool?.allowed ? (
              <p className="text-xs text-gray-500 m-0">Talent pool tersedia di paket Growth.</p>
            ) : entry ? (
              <>
                <p className="text-sm text-gray-600 m-0 mb-2">
                  Kandidat ini sudah ada di talent pool.
                  {entry.note ? <span className="block text-gray-500 mt-1">Catatan: {entry.note}</span> : null}
                </p>
                <div className="flex gap-2">
                  <Link to="/rekrutmen/talent" className="btn btn-ghost btn-sm">
                    Buka talent pool
                  </Link>
                  <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => removeFromPool(entry.id)} disabled={busy}>
                    Keluarkan
                  </button>
                </div>
              </>
            ) : (
              <>
                <textarea
                  className="field-input min-h-[64px] resize-y"
                  placeholder="Catatan singkat (opsional). Contoh: Bagus untuk posisi supervisor kuartal depan."
                  value={note}
                  maxLength={NOTE_MAX}
                  onChange={(e) => setNote(e.target.value)}
                  aria-label="Catatan talent pool"
                />
                <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={addToPool} disabled={busy}>
                  <Bookmark size={14} /> Simpan ke talent pool
                </button>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
