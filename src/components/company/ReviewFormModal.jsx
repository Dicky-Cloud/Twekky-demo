import { useState } from "react";
import Modal from "../Modal";
import { api } from "../../api/client";
import { ErrorBanner } from "../recruitment/StatusBadge";
import { StarInput } from "./Stars";

const STATUS_OPTIONS = [
  { value: "current", label: "Karyawan saat ini" },
  { value: "former", label: "Mantan karyawan" },
];
const RATING_HINT = ["", "Sangat buruk", "Kurang baik", "Cukup", "Baik", "Sangat baik"];

// Form tulis / ubah ulasan perusahaan. `existing` diisi saat mengubah ulasan sendiri.
export default function ReviewFormModal({ companyId, companyName, existing, onClose, onSaved }) {
  const [form, setForm] = useState({
    rating: existing?.rating || 0,
    title: existing?.title || "",
    employment_status: existing?.employment_status || "",
    position: existing?.position || "",
    pros: existing?.pros || "",
    cons: existing?.cons || "",
    recommend: existing ? existing.recommend : true,
    anonymous: existing ? existing.anonymous : false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.rating) return setError("Beri nilai bintang terlebih dahulu.");
    if (!form.title.trim()) return setError("Judul ulasan wajib diisi.");
    if (!form.employment_status) return setError("Pilih status Anda di perusahaan ini.");
    if (!form.pros.trim() && !form.cons.trim()) return setError("Isi kelebihan atau kekurangan perusahaan.");
    setBusy(true);
    setError("");
    try {
      const saved = existing
        ? await api.updateCompanyReview(companyId, form)
        : await api.createCompanyReview(companyId, form);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={existing ? "Ubah ulasan Anda" : `Tulis ulasan untuk ${companyName}`}
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      <form onSubmit={submit}>
        <ErrorBanner>{error}</ErrorBanner>

        <div className="mb-4">
          <div className="field-label mb-1.5">Penilaian keseluruhan</div>
          <div className="flex items-center gap-3">
            <StarInput value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
            <span className="text-sm text-gray-500">{RATING_HINT[form.rating]}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="rv-title" className="field-label">Judul ulasan</label>
          <input
            id="rv-title"
            className="field-input"
            maxLength={100}
            placeholder="Ringkas pengalaman Anda dalam satu kalimat"
            value={form.title}
            onChange={set("title")}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rv-status" className="field-label">Status Anda</label>
            <select id="rv-status" className="field-input" value={form.employment_status} onChange={set("employment_status")}>
              <option value="">Pilih status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rv-position" className="field-label">Posisi / jabatan (opsional)</label>
            <input
              id="rv-position"
              className="field-input"
              maxLength={60}
              placeholder="Contoh: Staf Administrasi"
              value={form.position}
              onChange={set("position")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="rv-pros" className="field-label">Kelebihan</label>
          <textarea
            id="rv-pros"
            className="field-input min-h-[90px] resize-y"
            maxLength={1000}
            placeholder="Apa yang baik dari bekerja di sini?"
            value={form.pros}
            onChange={set("pros")}
          />
        </div>
        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="rv-cons" className="field-label">Kekurangan</label>
          <textarea
            id="rv-cons"
            className="field-input min-h-[90px] resize-y"
            maxLength={1000}
            placeholder="Apa yang perlu diperbaiki?"
            value={form.cons}
            onChange={set("cons")}
          />
        </div>

        <div className="mb-4">
          <div className="field-label mb-1.5">Apakah Anda merekomendasikan perusahaan ini?</div>
          <div className="flex gap-5 text-sm">
            {[
              { v: true, label: "Ya" },
              { v: false, label: "Tidak" },
            ].map((o) => (
              <label key={o.label} className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="rv-recommend"
                  checked={form.recommend === o.v}
                  onChange={() => setForm((f) => ({ ...f, recommend: o.v }))}
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-2.5 text-sm cursor-pointer mb-5">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={form.anonymous}
            onChange={(e) => setForm((f) => ({ ...f, anonymous: e.target.checked }))}
          />
          <span>
            Tampilkan sebagai anonim
            <span className="block text-xs text-gray-500">Nama Anda disembunyikan; status dan posisi tetap tampil.</span>
          </span>
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button type="submit" className="btn btn-accent" disabled={busy}>
            {busy ? "Menyimpan..." : existing ? "Simpan perubahan" : "Kirim ulasan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
