import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { api, companyImageUrl } from "../../api/client";
import { ErrorBanner } from "../recruitment/StatusBadge";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const MAX = { logo: 2 * 1024 * 1024, banner: 5 * 1024 * 1024 };

// Pengelola logo & foto latar di dashboard rekrutmen (tab Perusahaan).
// Gambar langsung tersimpan saat diunggah (tidak menunggu tombol "Simpan halaman").
export default function CompanyImages({ company, name, gradient, onChanged }) {
  const logoRef = useRef(null);
  const bannerRef = useRef(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const logoUrl = companyImageUrl(company?.logo);
  const bannerUrl = companyImageUrl(company?.banner);

  const onPick = async (kind, e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // supaya berkas yang sama bisa dipilih lagi
    if (!file) return;
    if (!ACCEPT.includes(file.type)) {
      setError("Format harus JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > MAX[kind]) {
      setError(kind === "logo" ? "Ukuran logo maksimal 2 MB." : "Ukuran foto latar maksimal 5 MB.");
      return;
    }
    setBusy(kind);
    setError("");
    try {
      await api.uploadCompanyImage(kind, file);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const onRemove = async (kind) => {
    setBusy(kind);
    setError("");
    try {
      await api.deleteCompanyImage(kind);
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="mb-6">
      <ErrorBanner>{error}</ErrorBanner>

      <div className={`relative h-36 sm:h-44 rounded-xl overflow-hidden bg-gradient-to-br ${gradient}`}>
        {bannerUrl && (
          <img src={bannerUrl} alt="Foto latar perusahaan" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            type="button"
            className="btn btn-white btn-sm shadow-sm"
            disabled={busy !== ""}
            onClick={() => bannerRef.current?.click()}
          >
            <Camera size={14} />
            {busy === "banner" ? "Mengunggah..." : bannerUrl ? "Ganti foto latar" : "Unggah foto latar"}
          </button>
          {bannerUrl && (
            <button
              type="button"
              className="btn btn-white btn-sm shadow-sm !text-danger"
              disabled={busy !== ""}
              onClick={() => onRemove("banner")}
              aria-label="Hapus foto latar"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-end gap-4 px-4 -mt-10">
        <div className="relative shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`Logo ${name}`}
              className="w-20 h-20 rounded-2xl object-cover bg-white border-4 border-white shadow-sm"
            />
          ) : (
            <span className="flex items-center justify-center w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-sm text-brand text-2xl font-bold">
              {(name || "?").slice(0, 1).toUpperCase()}
            </span>
          )}
          <button
            type="button"
            aria-label={logoUrl ? "Ganti logo" : "Unggah logo"}
            disabled={busy !== ""}
            onClick={() => logoRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Camera size={15} />
          </button>
        </div>
        <div className="min-w-0 pb-1">
          <div className="font-bold truncate">{name}</div>
          <p className="text-xs text-gray-500 m-0 mt-0.5">
            {busy === "logo" ? "Mengunggah logo..." : "Logo maks. 2 MB, foto latar maks. 5 MB (JPG, PNG, WEBP). Tersimpan langsung saat diunggah."}
          </p>
          {logoUrl && (
            <button
              type="button"
              disabled={busy !== ""}
              onClick={() => onRemove("logo")}
              className="text-xs text-danger hover:underline mt-1 bg-transparent border-0 p-0 cursor-pointer disabled:opacity-50"
            >
              Hapus logo
            </button>
          )}
        </div>
      </div>

      <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onPick("logo", e)} />
      <input ref={bannerRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onPick("banner", e)} />
    </div>
  );
}
