import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../api/client";
import Modal from "../Modal";
import { ErrorBanner } from "./StatusBadge";

const TYPES = [
  { v: "yesno", label: "Ya / Tidak" },
  { v: "choice", label: "Pilihan" },
  { v: "text", label: "Isian bebas" },
];

const blank = () => ({ id: "", text: "", type: "yesno", required: true, options: [], optionsText: "", ideal: "" });

// Pengaturan pertanyaan penyaring satu lowongan (lamar di Twekky).
export default function ScreeningModal({ job, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [max, setMax] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getScreening(job.id)
      .then((cfg) => {
        if (cancelled) return;
        setMax(cfg.max || 0);
        setQuestions((cfg.questions || []).map((q) => ({ ...q, optionsText: (q.options || []).join("\n"), ideal: q.ideal || "" })));
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [job.id]);

  const update = (i, patch) => {
    setSaved(false);
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };
  const remove = (i) => {
    setSaved(false);
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  };
  const add = () => {
    setSaved(false);
    setQuestions((qs) => [...qs, blank()]);
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const payload = questions.map((q) => ({
        id: q.id,
        text: q.text.trim(),
        type: q.type,
        required: q.required,
        options: q.type === "choice" ? q.optionsText.split("\n").map((s) => s.trim()).filter(Boolean) : [],
        ideal: q.type === "text" ? "" : q.ideal,
      }));
      const cfg = await api.saveScreening(job.id, payload);
      setQuestions((cfg.questions || []).map((q) => ({ ...q, optionsText: (q.options || []).join("\n"), ideal: q.ideal || "" })));
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const idealOptions = (q) =>
    q.type === "yesno"
      ? [
          { v: "yes", label: "Ya" },
          { v: "no", label: "Tidak" },
        ]
      : q.optionsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => ({ v: s, label: s }));

  return (
    <Modal title={`Pertanyaan penyaring: ${job.title}`} onClose={onClose} maxWidth="max-w-2xl">
      {loading ? (
        <p className="text-sm text-gray-500 m-0">Memuat...</p>
      ) : max === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          Pertanyaan penyaring tersedia di paket Growth. Pelamar menjawabnya saat melamar, dan jawaban yang tidak sesuai
          diberi tanda di daftar pelamar.
          <div className="mt-3">
            <Link to="/rekrutmen/paket" className="btn btn-accent btn-sm">
              Lihat paket
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-0 mb-4 text-sm text-gray-500">
            Pelamar menjawab pertanyaan ini saat melamar. Jawaban ideal hanya terlihat oleh Anda: pelamar yang jawabannya
            berbeda ditandai di daftar pelamar, tidak ditolak otomatis. Perubahan hanya berlaku untuk pelamar berikutnya.
          </p>
          <ErrorBanner>{error}</ErrorBanner>

          {questions.length === 0 && (
            <p className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-500">
              Belum ada pertanyaan.
            </p>
          )}

          {questions.map((q, i) => (
            <div key={q.id || `new-${i}`} className="mb-3 rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-2">
                <span className="mt-2 text-sm font-bold text-gray-400">{i + 1}.</span>
                <input
                  className="field-input flex-1"
                  placeholder="Tulis pertanyaan, misal: Bersedia kerja di kantor (WFO)?"
                  maxLength={200}
                  value={q.text}
                  onChange={(e) => update(i, { text: e.target.value })}
                  aria-label={`Pertanyaan ${i + 1}`}
                />
                <button
                  type="button"
                  className="mt-1.5 text-gray-400 hover:text-danger"
                  onClick={() => remove(i)}
                  aria-label={`Hapus pertanyaan ${i + 1}`}
                >
                  <Trash2 size={17} />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 pl-6">
                <select
                  className="field-input !w-auto !py-1.5 text-[13px]"
                  value={q.type}
                  onChange={(e) => update(i, { type: e.target.value, ideal: "" })}
                  aria-label="Jenis pertanyaan"
                >
                  {TYPES.map((t) => (
                    <option key={t.v} value={t.v}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <label className="flex cursor-pointer items-center gap-1.5 text-[13px] text-gray-700">
                  <input type="checkbox" className="accent-brand" checked={q.required} onChange={(e) => update(i, { required: e.target.checked })} />
                  Wajib dijawab
                </label>
                {q.type !== "text" && (
                  <label className="flex items-center gap-1.5 text-[13px] text-gray-700">
                    Jawaban ideal
                    <select
                      className="field-input !w-auto !py-1.5 text-[13px]"
                      value={q.ideal}
                      onChange={(e) => update(i, { ideal: e.target.value })}
                    >
                      <option value="">Tidak dinilai</option>
                      {idealOptions(q).map((o) => (
                        <option key={o.v} value={o.v}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {q.type === "choice" && (
                <div className="mt-3 pl-6">
                  <textarea
                    className="field-input min-h-[80px] resize-y text-sm"
                    placeholder={"Satu pilihan per baris (2 sampai 6)\nContoh:\nJakarta\nBandung\nRemote"}
                    value={q.optionsText}
                    onChange={(e) => update(i, { optionsText: e.target.value })}
                    aria-label="Pilihan jawaban"
                  />
                </div>
              )}
            </div>
          ))}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="btn btn-ghost btn-sm" onClick={add} disabled={questions.length >= max}>
              <Plus size={15} /> Tambah pertanyaan
              <span className="text-gray-400"> ({questions.length}/{max})</span>
            </button>
            <div className="flex items-center gap-3">
              {saved && <span className="text-sm text-success">Tersimpan</span>}
              <button type="button" className="btn btn-accent btn-sm" onClick={save} disabled={busy}>
                {busy ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
