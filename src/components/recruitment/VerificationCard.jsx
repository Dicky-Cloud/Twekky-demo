import { useEffect, useState } from "react";
import { BadgeCheck, Clock, ShieldAlert, Upload } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { ErrorBanner } from "./StatusBadge";
import { formatDate } from "../../constants/recruitment";

const MAX_BYTES = 5 * 1024 * 1024;
const EMPTY = { legal_name: "", nib: "", contact_email: "", website: "", note: "" };

// Pengajuan lencana "Perusahaan terverifikasi" (dokumen NIB/SIUP, ditinjau manual).
export default function VerificationCard() {
  const { user, refreshUser } = useAuth();
  const [info, setInfo] = useState(null); // { status, request }
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .getVerification()
      .then((d) => !cancelled && setInfo(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["pdf", "jpg", "jpeg", "png"].includes(ext)) return setError("Dokumen harus PDF, JPG, atau PNG.");
    if (f.size > MAX_BYTES) return setError("Ukuran dokumen maksimal 5 MB.");
    setError("");
    setFile(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Unggah dokumen NIB atau SIUP.");
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v.trim()));
      body.append("document", file);
      setInfo(await api.submitVerification(body));
      setFile(null);
      setForm(EMPTY);
      refreshUser?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!info) {
    return error ? <ErrorBanner>{error}</ErrorBanner> : null;
  }

  const status = user?.verification_status === "verified" ? "verified" : info.status;
  const req = info.request;

  if (status === "verified") {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4">
        <BadgeCheck size={22} className="shrink-0 text-success" />
        <div>
          <div className="text-sm font-bold">Perusahaan terverifikasi</div>
          <div className="text-xs text-gray-500">Lencana tampil di lowongan dan halaman perusahaan Anda.</div>
        </div>
      </div>
    );
  }

  if (status === "pending" && req?.status === "pending") {
    return (
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4">
        <Clock size={22} className="shrink-0 text-gray-500" />
        <div>
          <div className="text-sm font-bold">Pengajuan sedang ditinjau</div>
          <div className="text-xs text-gray-500">
            Dikirim {formatDate(req.submitted_at)} atas nama {req.legal_name}. Anda akan mendapat notifikasi setelah ditinjau.
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-1 flex items-center gap-2">
        <ShieldAlert size={18} className="text-gray-500" />
        <h3 className="m-0 text-base font-bold">Verifikasi perusahaan</h3>
      </div>
      <p className="mb-4 mt-1 text-sm text-gray-500">
        Perusahaan terverifikasi mendapat lencana di lowongan dan halaman perusahaan, sehingga pelamar lebih percaya.
        Dokumen hanya dilihat tim Twekky untuk peninjauan.
      </p>

      {req?.status === "rejected" && (
        <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          Pengajuan sebelumnya ditolak{req.reject_reason ? `: ${req.reject_reason}` : "."} Anda dapat mengajukan lagi.
        </div>
      )}
      <ErrorBanner>{error}</ErrorBanner>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Nama badan usaha (sesuai NIB)
          <input className="field-input mt-1" required maxLength={120} value={form.legal_name} onChange={set("legal_name")} />
        </label>
        <label className="text-sm font-medium">
          Nomor NIB
          <input className="field-input mt-1" required inputMode="numeric" maxLength={25} value={form.nib} onChange={set("nib")} />
        </label>
        <label className="text-sm font-medium">
          Email kontak perusahaan
          <input className="field-input mt-1" type="email" required value={form.contact_email} onChange={set("contact_email")} />
        </label>
        <label className="text-sm font-medium">
          Situs web (opsional)
          <input className="field-input mt-1" placeholder="https://" maxLength={200} value={form.website} onChange={set("website")} />
        </label>
      </div>
      <label className="mt-3 block text-sm font-medium">
        Catatan untuk peninjau (opsional)
        <textarea className="field-input mt-1 min-h-[60px] resize-y" maxLength={500} value={form.note} onChange={set("note")} />
      </label>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="btn btn-ghost btn-sm cursor-pointer">
          <Upload size={14} /> {file ? file.name : "Unggah dokumen NIB/SIUP"}
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={pickFile} />
        </label>
        <button type="submit" className="btn btn-accent btn-sm" disabled={busy}>
          {busy ? "Mengirim..." : "Ajukan verifikasi"}
        </button>
      </div>
    </form>
  );
}
