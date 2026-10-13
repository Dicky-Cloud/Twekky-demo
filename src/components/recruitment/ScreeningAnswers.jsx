import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { api } from "../../api/client";

const label = (a) => {
  if (!a.answer) return "Tidak dijawab";
  if (a.type === "yesno") return a.answer === "yes" ? "Ya" : "Tidak";
  return a.answer;
};

// Jawaban pelamar atas pertanyaan penyaring (tidak tampil bila lowongan tidak punya pertanyaan).
export default function ScreeningAnswers({ applicationId }) {
  const [res, setRes] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setRes(null);
    api
      .applicantScreening(applicationId)
      .then((d) => !cancelled && setRes(d))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  if (!res || !res.answers || res.answers.length === 0) return null;

  return (
    <section className="card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="m-0 text-base font-bold">Jawaban pertanyaan penyaring</h3>
        {res.evaluated > 0 && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              res.mismatches === 0 ? "bg-gray-100 text-gray-700" : "bg-brand text-white"
            }`}
          >
            {res.mismatches === 0
              ? "Sesuai semua kriteria"
              : `${res.mismatches} dari ${res.evaluated} kriteria tidak sesuai`}
          </span>
        )}
      </div>
      <ul className="m-0 list-none p-0">
        {res.answers.map((a) => (
          <li key={a.question_id} className="border-b border-gray-100 py-3 last:border-0">
            <div className="text-[13px] text-gray-500">{a.question}</div>
            <div className="mt-0.5 flex items-start gap-2 text-sm font-medium">
              {a.ideal ? (
                a.mismatch ? (
                  <X size={16} className="mt-0.5 shrink-0 text-danger" aria-label="Tidak sesuai" />
                ) : (
                  <Check size={16} className="mt-0.5 shrink-0 text-success" aria-label="Sesuai" />
                )
              ) : null}
              <span className={`whitespace-pre-line ${a.answer ? "" : "text-gray-400 font-normal"}`}>{label(a)}</span>
            </div>
            {a.mismatch && (
              <div className="ml-6 mt-0.5 text-xs text-gray-400">
                Jawaban ideal: {a.type === "yesno" ? (a.ideal === "yes" ? "Ya" : "Tidak") : a.ideal}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
