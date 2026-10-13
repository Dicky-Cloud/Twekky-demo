import { useState } from "react";
import { api } from "../../api/client";
import Modal from "../Modal";
import { ErrorBanner } from "./StatusBadge";
import {
  INTERVIEW_DURATIONS,
  INTERVIEW_MODES,
  INTERVIEW_MODE_MAP,
  tzLabel,
  toLocalInputValue,
} from "../../constants/hiring";

const NOTE_MAX = 500;

function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return toLocalInputValue(d);
}

// Form jadwal wawancara. Tanpa `interview` = jadwal baru; dengan `interview` =
// ubah jadwal (pelamar diminta konfirmasi ulang).
export default function ScheduleInterviewModal({ applicationId, applicantName, interview, onClose, onSaved }) {
  const [when, setWhen] = useState(interview ? toLocalInputValue(new Date(interview.starts_at)) : defaultStart());
  const [duration, setDuration] = useState(interview?.duration_min || 60);
  const [mode, setMode] = useState(interview?.mode || "online");
  const [location, setLocation] = useState(interview?.location || "");
  const [note, setNote] = useState(interview?.note || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const m = INTERVIEW_MODE_MAP[mode];

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const startsAt = new Date(when);
    if (!when || Number.isNaN(startsAt.getTime())) return setError("Pilih tanggal dan jam wawancara.");
    if (startsAt.getTime() <= Date.now()) return setError("Pilih waktu di masa depan.");
    if (!location.trim()) return setError(`${m.locationLabel} wajib diisi.`);

    const payload = {
      starts_at: startsAt.toISOString(),
      duration_min: Number(duration),
      mode,
      location: location.trim(),
      note: note.trim(),
    };
    setBusy(true);
    try {
      const saved = interview
        ? await api.updateInterview(interview.id, payload)
        : await api.createInterview({ application_id: applicationId, ...payload });
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={interview ? "Ubah jadwal wawancara" : "Jadwalkan wawancara"} onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <p className="text-sm text-gray-500 m-0">
          {interview
            ? `Pelamar ${applicantName} akan diminta konfirmasi ulang setelah jadwal diubah.`
            : `${applicantName} akan menerima notifikasi dan email berisi undangan ini, lalu bisa konfirmasi atau menolak.`}
        </p>
        <ErrorBanner>{error}</ErrorBanner>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="field-label">Tanggal &amp; jam ({tzLabel(new Date())})</span>
            <input
              type="datetime-local"
              className="field-input"
              value={when}
              min={toLocalInputValue(new Date())}
              onChange={(e) => setWhen(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="field-label">Durasi</span>
            <select className="field-input" value={duration} onChange={(e) => setDuration(e.target.value)}>
              {INTERVIEW_DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} menit
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="field-label">Cara wawancara</span>
          <select className="field-input" value={mode} onChange={(e) => setMode(e.target.value)}>
            {INTERVIEW_MODES.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label">{m.locationLabel}</span>
          <input
            className="field-input"
            value={location}
            maxLength={300}
            placeholder={m.placeholder}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label">Pesan untuk pelamar (opsional)</span>
          <textarea
            className="field-input min-h-[72px] resize-y"
            value={note}
            maxLength={NOTE_MAX}
            placeholder="Contoh: Mohon hadir 10 menit lebih awal dan bawa KTP."
            onChange={(e) => setNote(e.target.value)}
          />
          <span className="text-xs text-gray-400 text-right">
            {note.length} / {NOTE_MAX}
          </span>
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button type="submit" className="btn btn-accent btn-sm" disabled={busy}>
            {busy ? "Menyimpan..." : interview ? "Simpan perubahan" : "Kirim undangan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
