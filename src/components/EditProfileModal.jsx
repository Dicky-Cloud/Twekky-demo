import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { api, profileImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";
import AvatarCropModal from "./AvatarCropModal";

const BIO_MAX = 200;
// Foto asli boleh lebih besar: sebelum disimpan, foto dipotong dan diperkecil
// di langkah "Atur foto profil" sehingga hasilnya selalu di bawah 2 MB.
const MAX_AVATAR_SOURCE = 10 * 1024 * 1024;
const MAX_BANNER = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

// Popup edit profil. Nama, bio, foto profil, dan banner baru disimpan
// bersamaan saat tombol "Simpan Perubahan" ditekan; "Batal" membuang semuanya.
export default function EditProfileModal({ onClose }) {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // foto yang dipilih tapi belum disimpan
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [removeBanner, setRemoveBanner] = useState(false);
  const avatarInput = useRef(null);
  const bannerInput = useRef(null);
  // foto asli yang sedang diatur posisinya (langkah sebelum masuk antrean simpan)
  const [cropSource, setCropSource] = useState(null);
  // foto asli dari pilihan terakhir, agar posisinya bisa diatur ulang sebelum disimpan
  const [avatarOriginal, setAvatarOriginal] = useState(null);

  const avatarPreview = useMemo(() => (avatarFile ? URL.createObjectURL(avatarFile) : ""), [avatarFile]);
  const bannerPreview = useMemo(() => (bannerFile ? URL.createObjectURL(bannerFile) : ""), [bannerFile]);
  useEffect(() => () => avatarPreview && URL.revokeObjectURL(avatarPreview), [avatarPreview]);
  useEffect(() => () => bannerPreview && URL.revokeObjectURL(bannerPreview), [bannerPreview]);

  const avatarSrc = avatarPreview || (removeAvatar ? "" : profileImageUrl(user?.avatar));
  const bannerSrc = bannerPreview || (removeBanner ? "" : profileImageUrl(user?.banner));

  const initials = (name || user?.name || "?")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const textUnchanged = name.trim() === (user?.name || "") && bio.trim() === (user?.bio || "");
  const unchanged = textUnchanged && !avatarFile && !bannerFile && !removeAvatar && !removeBanner;

  const pickImage = (kind, file) => {
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setError("Format tidak didukung. Gunakan JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > (kind === "avatar" ? MAX_AVATAR_SOURCE : MAX_BANNER)) {
      setError(`Ukuran gambar melebihi ${kind === "avatar" ? "10 MB" : "5 MB"}.`);
      return;
    }
    setError("");
    if (kind === "avatar") {
      // belum masuk antrean simpan: atur posisi foto dulu
      setCropSource(file);
    } else {
      setBannerFile(file);
      setRemoveBanner(false);
    }
  };

  // hasil atur foto: foto yang sudah dipotong masuk antrean, disimpan bersama "Simpan Perubahan"
  const applyCrop = (cropped) => {
    setAvatarOriginal(cropSource);
    setAvatarFile(cropped);
    setRemoveAvatar(false);
    setCropSource(null);
  };

  const clearImage = (kind) => {
    if (kind === "avatar") {
      setAvatarFile(null);
      setAvatarOriginal(null);
      setRemoveAvatar(true);
    } else {
      setBannerFile(null);
      setRemoveBanner(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!name.trim()) {
      setError("Nama tidak boleh kosong.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      if (!textUnchanged) await api.updateProfile(name.trim(), bio.trim());
      if (avatarFile) await api.uploadProfileImage("avatar", avatarFile);
      else if (removeAvatar && user?.avatar) await api.deleteProfileImage("avatar");
      if (bannerFile) await api.uploadProfileImage("banner", bannerFile);
      else if (removeBanner && user?.banner) await api.deleteProfileImage("banner");
      await refreshUser();
      onClose();
    } catch (err) {
      setError(err.message || "Gagal menyimpan profil.");
      setBusy(false);
    }
  };

  return (
    <>
    <Modal title="Edit Profil" onClose={busy ? () => {} : onClose} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit}>
        {/* banner + foto profil */}
        <div className="mb-5">
          <div className="relative h-28 sm:h-32 overflow-hidden rounded-xl bg-gradient-to-br from-brand via-[#3a3a3a] to-[#6b6b6b]">
            {bannerSrc && <img src={bannerSrc} alt="Banner profil" className="h-full w-full object-cover" />}
            <div className="absolute right-2 top-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => bannerInput.current?.click()}
                disabled={busy}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-none bg-black/55 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-black/70 disabled:opacity-60"
              >
                <Camera size={13} />
                {bannerSrc ? "Ganti banner" : "Unggah banner"}
              </button>
              {bannerSrc && (
                <button
                  type="button"
                  onClick={() => clearImage("banner")}
                  disabled={busy}
                  title="Hapus banner"
                  aria-label="Hapus banner"
                  className="inline-flex cursor-pointer items-center rounded-lg border-none bg-black/55 px-2 py-1.5 text-white hover:bg-black/70 disabled:opacity-60"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
          <input
            ref={bannerInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => {
              pickImage("banner", e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          <div className="-mt-9 ml-4 flex items-end gap-3">
            <div className="relative shrink-0">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Foto profil"
                  className="h-[72px] w-[72px] rounded-full object-cover ring-4 ring-white shadow-sm"
                />
              ) : (
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-brand to-[#6b6b6b] text-xl font-bold text-white ring-4 ring-white shadow-sm">
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInput.current?.click()}
                disabled={busy}
                title="Ganti foto profil"
                aria-label="Ganti foto profil"
                className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-brand text-white hover:opacity-90 disabled:opacity-60"
              >
                <Camera size={13} />
              </button>
              <input
                ref={avatarInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => {
                  pickImage("avatar", e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            <div className="pb-1 text-xs leading-relaxed text-gray-500">
              Foto profil dipotong persegi (atur posisinya setelah memilih foto), banner maks. 5 MB (JPG, PNG, WEBP).
              {avatarOriginal && (
                <button
                  type="button"
                  onClick={() => setCropSource(avatarOriginal)}
                  disabled={busy}
                  className="ml-1.5 cursor-pointer border-none bg-transparent p-0 text-xs font-semibold text-brand underline"
                >
                  Atur posisi
                </button>
              )}
              {avatarSrc && (
                <button
                  type="button"
                  onClick={() => clearImage("avatar")}
                  disabled={busy}
                  className="ml-1.5 cursor-pointer border-none bg-transparent p-0 text-xs font-semibold text-danger underline"
                >
                  Hapus foto
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="edit-name" className="text-xs font-semibold text-gray-700">
            Nama
          </label>
          <input
            id="edit-name"
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5 mb-5">
          <div className="flex items-center justify-between">
            <label htmlFor="edit-bio" className="text-xs font-semibold text-gray-700">
              Bio
            </label>
            <span className={`text-[11px] ${bio.length > BIO_MAX ? "text-danger" : "text-gray-400"}`}>
              {bio.length}/{BIO_MAX}
            </span>
          </div>
          <textarea
            id="edit-bio"
            className="field-input min-h-[110px] resize-y"
            placeholder="Ceritakan sedikit tentang dirimu..."
            value={bio}
            maxLength={BIO_MAX}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2.5">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button type="submit" className="btn btn-accent" disabled={busy || unchanged}>
            {busy ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </Modal>
    {cropSource && <AvatarCropModal file={cropSource} onCancel={() => setCropSource(null)} onDone={applyCrop} />}
    </>
  );
}