import { useEffect, useState } from "react";
import { api } from "../api/client";
import { JOB_TYPES } from "../constants/recruitment";
import { LEVELS, WORK_MODES } from "../api/careerStore";
import ChipField, { OptionChips } from "./career/ChipField";

const MAX_SKILLS = 15;
const APPLY_MODES = [
  { v: "quick", label: "Lamar cepat di Twekky" },
  { v: "external", label: "Lamar di situs perusahaan" },
];

// Form pasang lowongan (dipakai di halaman Lowongan dan halaman Rekrutmen).
export default function NewJobForm({ onCreated, onCancel }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("full-time");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [skills, setSkills] = useState([]);
  const [level, setLevel] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [applyMode, setApplyMode] = useState("quick");
  const [applyUrl, setApplyUrl] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Saran nama skill baku dari server (kamus yang sama dipakai skor kecocokan).
  useEffect(() => {
    let alive = true;
    api.skillSuggestions().then((list) => alive && Array.isArray(list) && setSuggestions(list)).catch(() => {});
    return () => { alive = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (skills.length === 0) {
      setError("Isi minimal satu skill yang dibutuhkan.");
      return;
    }
    if (applyMode === "external" && !applyUrl.trim().toLowerCase().startsWith("https://")) {
      setError("Link lamaran harus diawali https://");
      return;
    }
    setBusy(true);
    try {
      const job = await api.createJob({
        title, description, location, type, salaryMin, salaryMax,
        requiredSkills: skills, level, workMode, applyMode, applyUrl,
      });
      onCreated(job);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-1.5 mb-4">
        <label htmlFor="jtitle" className="field-label">Judul posisi</label>
        <input id="jtitle" className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5 mb-4">
        <label htmlFor="jdesc" className="field-label">Deskripsi</label>
        <textarea id="jdesc" className="field-input min-h-[90px] resize-y" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5 mb-4">
        <label htmlFor="jloc" className="field-label">Lokasi</label>
        <input id="jloc" className="field-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Jakarta (Hybrid)" />
      </div>
      <div className="flex flex-col gap-1.5 mb-4">
        <label htmlFor="jtype" className="field-label">Tipe pekerjaan</label>
        <select id="jtype" className="field-input" value={type} onChange={(e) => setType(e.target.value)}>
          {JOB_TYPES.filter((t) => t.value).map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5 mb-4 flex-1">
          <label htmlFor="jsalarymin" className="field-label">Gaji min (Rp)</label>
          <input id="jsalarymin" className="field-input" type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 mb-4 flex-1">
          <label htmlFor="jsalarymax" className="field-label">Gaji maks (Rp)</label>
          <input id="jsalarymax" className="field-input" type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5 mb-4">
        <span className="field-label">Skill yang dibutuhkan <span className="text-gray-400 font-normal">(wajib, maks. {MAX_SKILLS})</span></span>
        <ChipField items={skills} onChange={setSkills} addLabel="Tambah skill" placeholder="Mis. Excel, Laravel" max={MAX_SKILLS} suggestions={suggestions} />
        <p className="m-0 text-xs text-gray-500">Dipakai untuk mencocokkan lowongan dengan CV pelamar.</p>
      </div>
      <div className="flex gap-3">
        <div className="flex flex-col gap-1.5 mb-4 flex-1">
          <label htmlFor="jlevel" className="field-label">Level pengalaman</label>
          <select id="jlevel" className="field-input" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">Semua level</option>
            {LEVELS.map((l) => <option key={l.v} value={l.v}>{l.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 mb-4 flex-1">
          <label htmlFor="jmode" className="field-label">Mode kerja</label>
          <select id="jmode" className="field-input" value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
            <option value="">Tidak ditentukan</option>
            {WORK_MODES.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 mb-4">
        <span className="field-label">Cara melamar</span>
        <OptionChips options={APPLY_MODES} value={applyMode} onChange={(v) => v && setApplyMode(v)} />
        {applyMode === "quick" ? (
          <p className="m-0 text-xs text-gray-500">Pelamar mengirim CV lewat Twekky dan Anda mengelolanya di dashboard rekrutmen.</p>
        ) : (
          <>
            <input
              className="field-input"
              type="url"
              value={applyUrl}
              onChange={(e) => setApplyUrl(e.target.value)}
              placeholder="https://karier.perusahaan.com/lowongan/123"
              maxLength={500}
              required
              aria-label="Link lamaran"
            />
            <p className="m-0 text-xs text-gray-500">
              Pelamar diarahkan ke situs Anda. Lamaran tidak masuk ke dashboard Twekky. Gunakan alamat asli (tanpa pemendek link seperti bit.ly).
            </p>
          </>
        )}
      </div>
      <div className="flex gap-2.5">
        <button className="btn btn-accent" type="submit" disabled={busy}>
          {busy ? "Memasang..." : "Pasang lowongan"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          Batal
        </button>
      </div>
    </form>
  );
}