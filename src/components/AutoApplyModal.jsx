// Pengaturan Auto Lamar: melamar otomatis ke lowongan yang cocok dengan profil karier.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import Modal from "./Modal";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCareer } from "../api/careerStore";
import { JOB_TYPES } from "../constants/recruitment";

const TYPES = JOB_TYPES.filter((t) => t.value);
const fmtTime = (iso) => new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

function YesNoRow({ label, value, onChange }) {
  return (
    <div className="mb-3">
      <p className="m-0 mb-1.5 text-xs font-semibold text-gray-700">{label}</p>
      <div className="flex gap-2">
        {[["yes", "Ya"], ["no", "Tidak"]].map(([v, text]) => (
          <label
            key={v}
            className={`flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              value === v ? "border-brand bg-brand-soft font-semibold" : "border-gray-200"
            }`}
          >
            <input type="radio" name={label} checked={value === v} onChange={() => onChange(v)} />
            {text}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function AutoApplyModal({ onClose, onApplied }) {
  const { user } = useAuth();
  const [career] = useCareer(user?.id);
  const [state, setState] = useState(null); // respons server: settings, ready, missing, sent_today, logs
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = (d) => {
    setState(d);
    setForm({ ...d.settings, types: d.settings.types || [] });
  };
  useEffect(() => {
    api.getAutoApply().then(apply).catch((e) => setError(e.message || "Gagal memuat Auto Lamar."));
  }, []);

  if (!state || !form) {
    return (
      <Modal title="Auto Lamar" onClose={onClose} maxWidth="max-w-lg">
        <p className="m-0 text-sm text-gray-500">{error || "Memuat..."}</p>
      </Modal>
    );
  }

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const cvValue = form.cv_id || career.cvs[0]?.id || "";
  const toggleType = (v) =>
    set({ types: form.types.includes(v) ? form.types.filter((t) => t !== v) : [...form.types, v] });

  const save = async () => {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      apply(await api.saveAutoApply({ ...form, cv_id: cvValue }));
      setMsg("Pengaturan disimpan.");
    } catch (e) {
      setError(e.message || "Gagal menyimpan.");
    } finally {
      setBusy(false);
    }
  };

  const runNow = async () => {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await api.runAutoApply();
      apply(res.state);
      setMsg(res.sent > 0 ? `${res.sent} lamaran terkirim.` : "Belum ada lowongan baru yang cocok.");
      if (res.sent > 0) onApplied?.();
    } catch (e) {
      setError(e.message || "Gagal menjalankan Auto Lamar.");
    } finally {
      setBusy(false);
    }
  };

  const saved = state.settings;
  return (
    <Modal title="Auto Lamar" onClose={onClose} maxWidth="max-w-lg">
      <p className="m-0 mb-4 text-sm text-gray-600">
        Twekky melamar otomatis (dicek tiap 5 menit) ke lowongan yang cocok dengan profil kariermu. Lowongan di situs
        perusahaan dan yang punya pertanyaan wajib dilewati.
      </p>

      {state.ready ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-800">
          <CheckCircle2 size={18} className="shrink-0 text-success" /> Data karier lengkap, Auto Lamar siap dipakai.
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
          <p className="m-0 flex items-center gap-2 text-sm font-bold text-gray-900">
            <AlertTriangle size={18} className="shrink-0 text-danger" /> Data karier belum lengkap
          </p>
          <ul className="m-0 mt-1.5 list-disc pl-5 text-xs text-red-700">
            {state.missing.map((m) => <li key={m}>{m}</li>)}
          </ul>
          <Link to="/profil?tab=career" onClick={onClose} className="mt-2 inline-block text-xs font-bold text-brand underline">
            Lengkapi di Profil →
          </Link>
        </div>
      )}

      {error && <div className="mb-3 rounded-lg border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}
      {msg && <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</div>}

      <label className={`mb-4 flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 ${state.ready ? "cursor-pointer" : "opacity-50"}`}>
        <span className="text-sm font-bold text-gray-900"><Zap size={14} className="mr-1 inline -mt-0.5" />Aktifkan Auto Lamar</span>
        <input type="checkbox" className="h-5 w-5" checked={form.enabled} disabled={!state.ready} onChange={(e) => set({ enabled: e.target.checked })} />
      </label>

      <div className="mb-4">
        <label className="mb-1 flex justify-between text-xs font-semibold text-gray-700">
          <span>Kecocokan skill minimal</span><span className="text-brand">{form.min_match}%</span>
        </label>
        <input type="range" min={0} max={100} step={10} value={form.min_match} onChange={(e) => set({ min_match: Number(e.target.value) })} className="w-full" />
      </div>

      <div className="mb-4">
        <p className="m-0 mb-1.5 text-xs font-semibold text-gray-700">Jenis lowongan (kosong = semua)</p>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <label key={t.value} className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold ${form.types.includes(t.value) ? "border-brand bg-brand-soft text-brand" : "border-gray-200 text-gray-600"}`}>
              <input type="checkbox" className="sr-only" checked={form.types.includes(t.value)} onChange={() => toggleType(t.value)} />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Maksimal per hari</label>
          <select className="field-input text-sm" value={form.max_per_day} onChange={(e) => set({ max_per_day: Number(e.target.value) })}>
            {[1, 2, 3, 5, 10].map((n) => <option key={n} value={n}>{n} lamaran</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">CV yang dipakai</label>
          <select className="field-input text-sm" value={cvValue} onChange={(e) => set({ cv_id: e.target.value })}>
            {career.cvs.length === 0 && <option value="">Belum ada CV</option>}
            {career.cvs.map((cv) => <option key={cv.id} value={cv.id}>{cv.name}</option>)}
          </select>
        </div>
      </div>

      <YesNoRow label="Berhak bekerja di lokasi lowongan?" value={form.work_authorization} onChange={(v) => set({ work_authorization: v })} />
      <YesNoRow label="Butuh sponsor visa?" value={form.needs_sponsorship} onChange={(v) => set({ needs_sponsorship: v })} />

      <div className="mb-4">
        <label className="mb-1 block text-xs font-semibold text-gray-700">Surat pengantar (opsional)</label>
        <textarea className="field-input min-h-[80px] resize-y text-sm" maxLength={3000} value={form.cover_letter} onChange={(e) => set({ cover_letter: e.target.value })} placeholder="Dikirim ke semua lamaran otomatis." />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-gray-500">Hari ini: {state.sent_today}/{saved.max_per_day} lamaran</span>
        <div className="flex gap-2">
          {saved.enabled && (
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={runNow}>Jalankan sekarang</button>
          )}
          <button type="button" className="btn btn-accent btn-sm" disabled={busy} onClick={save}>{busy ? "Menyimpan..." : "Simpan"}</button>
        </div>
      </div>

      {state.logs.length > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-3">
          <h4 className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Riwayat Auto Lamar</h4>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {state.logs.map((l) => (
              <li key={`${l.job_id}-${l.at}`} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate font-semibold text-gray-800">{l.job_title} <span className="font-normal text-gray-500">· {l.company_name}</span></span>
                <span className="shrink-0 text-gray-400">{l.match}% · {fmtTime(l.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}