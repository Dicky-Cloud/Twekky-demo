import { useState } from "react";
import Modal from "../Modal";

// Konfigurasi tiap jenis entri profil karier.
export const KINDS = {
  experience: {
    list: "experience",
    label: "Pengalaman Kerja",
    current: true,
    fields: [
      { k: "title", label: "Posisi", req: true, ph: "Staf Administrasi" },
      { k: "company", label: "Perusahaan / instansi", req: true },
      { k: "industry", label: "Industri", ph: "Contoh: Pemerintahan" },
      { k: "start", label: "Mulai", type: "month", req: true },
      { k: "end", label: "Selesai", type: "month", endField: true },
      { k: "desc", label: "Deskripsi pekerjaan", type: "textarea" },
    ],
  },
  education: {
    list: "education",
    label: "Pendidikan",
    fields: [
      { k: "school", label: "Sekolah / kampus", req: true },
      { k: "level", label: "Jenjang", type: "select", req: true, options: ["SMA/SMK", "D3", "D4/S1", "S2", "S3", "Lainnya"] },
      { k: "major", label: "Jurusan / program studi" },
      { k: "start", label: "Tahun masuk", type: "year", req: true },
      { k: "end", label: "Tahun lulus", type: "year", endField: true },
    ],
  },
  organizations: {
    list: "organizations",
    label: "Pengalaman Organisasi",
    current: true,
    fields: [
      { k: "title", label: "Jabatan", req: true },
      { k: "company", label: "Organisasi", req: true },
      { k: "start", label: "Mulai", type: "month", req: true },
      { k: "end", label: "Selesai", type: "month", endField: true },
      { k: "desc", label: "Deskripsi", type: "textarea" },
    ],
  },
  certifications: {
    list: "certifications",
    label: "Sertifikasi / Prestasi",
    fields: [
      { k: "title", label: "Nama sertifikat / prestasi", req: true },
      { k: "company", label: "Penerbit / penyelenggara", req: true },
      { k: "start", label: "Tahun", type: "year" },
    ],
  },
  portfolio: {
    list: "portfolio",
    label: "Portofolio",
    fields: [
      { k: "title", label: "Judul", req: true, ph: "Case study aplikasi X" },
      { k: "url", label: "Tautan", type: "url", req: true, ph: "https://" },
    ],
  },
};

const validUrl = (s) => {
  try {
    const u = new URL(String(s).trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export default function EntryModal({ kind, entry, onSave, onDelete, onClose }) {
  const cfg = KINDS[kind];
  const [f, setF] = useState(() => ({ current: false, ...(entry || {}) }));
  const [error, setError] = useState("");
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    for (const fd of cfg.fields) {
      const val = String(f[fd.k] || "").trim();
      if (fd.req && !val) return setError(`${fd.label} wajib diisi.`);
      if (fd.type === "url" && val && !validUrl(val)) return setError("Tautan harus diawali http:// atau https://");
    }
    const endField = cfg.fields.find((x) => x.endField);
    if (endField && !f.current && f.end && f.start && f.end < f.start) return setError("Tanggal selesai tidak boleh sebelum tanggal mulai.");
    const clean = {};
    cfg.fields.forEach((fd) => { clean[fd.k] = String(f[fd.k] || "").trim(); });
    if (cfg.current) { clean.current = Boolean(f.current); if (f.current) clean.end = ""; }
    onSave({ ...clean, ...(entry?.id ? { id: entry.id } : {}) });
  };

  return (
    <Modal title={`${entry ? "Ubah" : "Tambah"} ${cfg.label}`} onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={submit} className="flex flex-col gap-4">
        {cfg.fields.map((fd) => {
          const disabled = fd.endField && f.current;
          return (
            <label key={fd.k} className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
              <span>{fd.label}{fd.req && <span className="text-danger"> *</span>}</span>
              {fd.type === "textarea" ? (
                <textarea className="field-input min-h-[80px] resize-y" value={f[fd.k] || ""} onChange={set(fd.k)} maxLength={500} />
              ) : fd.type === "select" ? (
                <select className="field-input" value={f[fd.k] || ""} onChange={set(fd.k)}>
                  <option value="">Pilih…</option>
                  {fd.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  className="field-input disabled:bg-gray-50"
                  type={fd.type === "year" ? "number" : fd.type === "month" ? "month" : "text"}
                  {...(fd.type === "year" ? { min: 1970, max: 2100, placeholder: "2024" } : {})}
                  placeholder={fd.ph}
                  disabled={disabled}
                  value={disabled ? "" : f[fd.k] || ""}
                  onChange={set(fd.k)}
                />
              )}
            </label>
          );
        })}
        {cfg.current && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={Boolean(f.current)} onChange={(e) => setF((x) => ({ ...x, current: e.target.checked }))} />
            Masih berlangsung
          </label>
        )}
        {error && <p className="m-0 text-sm text-danger">{error}</p>}
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
          {entry ? (
            <button type="button" className="btn btn-ghost btn-sm text-red-600" onClick={() => onDelete(entry.id)}>Hapus</button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-accent">Simpan</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
