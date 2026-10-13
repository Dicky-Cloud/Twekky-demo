import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Target } from "lucide-react";
import { api } from "../../api/client";
import { matchTone } from "../../constants/hiring";
import { ErrorBanner } from "./StatusBadge";

// Penanda kecil di daftar & papan pelamar. match = hasil dari api.recruitmentMatches.
export function MatchBadge({ match, className = "" }) {
  if (!match) return null;
  const tone = matchTone(match.score);
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${tone.badge} ${className}`}
      title={`${match.label} (${match.score}%). Dihitung dari keahlian, level, dan lokasi.`}
    >
      {match.score}% cocok
    </span>
  );
}

// Kartu rincian skor di halaman detail pelamar. Di paket tanpa fitur ini,
// kartu menampilkan ajakan upgrade.
export default function MatchCard({ applicant }) {
  const [data, setData] = useState(null); // { allowed, results }
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");
    api
      .recruitmentMatches(applicant.job_id)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [applicant.job_id, applicant.id]);

  const match = data?.results?.[applicant.id];
  const tone = match ? matchTone(match.score) : null;

  return (
    <section className="card">
      <div className="flex items-center gap-2 mb-1">
        <Target size={17} className="text-brand" />
        <h3 className="text-base font-bold m-0">Skor kecocokan</h3>
      </div>
      <p className="text-xs text-gray-400 m-0 mb-3">
        Dihitung otomatis dari syarat lowongan dan data pelamar. Hanya sebagai bantuan, bukan keputusan.
      </p>
      <ErrorBanner>{error}</ErrorBanner>

      {!data && !error ? (
        <p className="text-sm text-gray-400 m-0">Menghitung skor...</p>
      ) : data && !data.allowed ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-center">
          <Lock size={20} className="mx-auto text-gray-400 mb-1.5" />
          <p className="text-sm text-gray-600 m-0 mb-3">Skor kecocokan pelamar tersedia di paket Growth.</p>
          <Link to="/rekrutmen/paket" className="btn btn-accent btn-sm">
            Lihat paket
          </Link>
        </div>
      ) : data && !match ? (
        <p className="text-sm text-gray-500 m-0">
          Skor belum bisa dihitung. Lengkapi syarat keahlian atau level pada lowongan ini agar pelamar bisa dinilai.
        </p>
      ) : match ? (
        <>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold tracking-tight">{match.score}%</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone.badge}`}>{match.label}</span>
          </div>

          <div className="flex flex-col gap-3">
            {match.parts.map((p) => (
              <div key={p.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{p.label}</span>
                  <span className="font-semibold">{p.score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${matchTone(p.score).bar}`} style={{ width: `${p.score}%` }} />
                </div>
                {p.note ? <p className="text-xs text-gray-400 m-0 mt-1">{p.note}</p> : null}
              </div>
            ))}
          </div>

          {(match.matched_skills.length > 0 || match.missing_skills.length > 0) && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              {match.matched_skills.length > 0 && (
                <div className="mb-2.5">
                  <div className="text-xs text-gray-500 mb-1.5">Keahlian yang cocok</div>
                  <div className="flex flex-wrap gap-1.5">
                    {match.matched_skills.map((s) => (
                      <span key={s} className="rounded-full bg-green-50 text-success text-xs font-semibold px-2.5 py-1">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {match.missing_skills.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">Belum terlihat di data pelamar</div>
                  <div className="flex flex-wrap gap-1.5">
                    {match.missing_skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-dashed border-gray-300 text-gray-500 text-xs font-semibold px-2.5 py-1"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
