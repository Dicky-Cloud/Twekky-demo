import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AtSign, ChevronLeft, Hash, Image, Video, Building2, X } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCommunities } from "../context/CommunityContext";
import { usePostComposer } from "../context/PostComposerContext";
import { TOPICS, topicLabel } from "../constants/topics";
import Modal from "./Modal";

const MAX_IMAGES = 4;
const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm"];

// Tujuan posting: satu pilihan saja. "c:<id>" komunitas, "t:<slug>" topik, "umum" hanya feed utama.
const TARGET_KEY = "twekky_post_target";
const readTarget = () => {
  try {
    return localStorage.getItem(TARGET_KEY) || "";
  } catch {
    return "";
  }
};
const saveTarget = (v) => {
  try {
    localStorage.setItem(TARGET_KEY, v);
  } catch {
    /* penyimpanan tidak tersedia; pilihan tidak diingat */
  }
};
const targetFrom = (communityId, topic) => (communityId ? `c:${communityId}` : topic ? `t:${topic}` : "");

// Popup "Buat Post" ala Threads: tinggi mengikuti isi, dan kalau isinya
// makin panjang (judul + body panjang, pesan error, dst.) Modal sendiri yang
// membatasi tingginya (90vh) lalu memberi scrollbar di dalam — lihat Modal.jsx.
export default function CreatePostModal({ page = false, initialCommunityId: pageCommunityId = "", initialTopic: pageTopic = "" }) {
  const { user } = useAuth();
  const { joined } = useCommunities();
  const { isOpen, communityId: ctxCommunityId, topic: ctxTopic, closeComposer } = usePostComposer();
  // Mode halaman (HP): tampil sebagai halaman penuh lewat rute /buat-post, bukan popup.
  const initialCommunityId = page ? pageCommunityId : ctxCommunityId;
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [asCompany, setAsCompany] = useState(false);
  // lampiran: [{ key, kind, file, previewUrl, status: uploading|done|error, id, error }]
  const [media, setMedia] = useState([]);
  const [mediaError, setMediaError] = useState("");
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  // Dari halaman komunitas/topik langsung terisi; selain itu memakai pilihan terakhir.
  const [target, setTarget] = useState(() => targetFrom(initialCommunityId, page ? pageTopic : "") || readTarget());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Popup selalu terpasang di App, jadi isian awalnya disamakan lagi setiap kali dibuka.
  useEffect(() => {
    if (page || !isOpen) return;
    setTarget(targetFrom(ctxCommunityId, ctxTopic) || readTarget());
  }, [page, isOpen, ctxCommunityId, ctxTopic]);

  if ((!page && !isOpen) || !user) return null;

  // Akun Bisnis dapat memposting atas nama perusahaan (tidak bisa anonim).
  const canPostAsCompany = user.account_type === "business" && !!user.company_name;
  const companyMode = canPostAsCompany && asCompany;

  // Tujuan dibaca dari satu pilihan; pilihan yang sudah tidak berlaku (mis. sudah keluar dari komunitas) dianggap belum dipilih.
  const targetCommunity = target.startsWith("c:") ? joined.find((c) => c.id === target.slice(2)) : null;
  const targetTopic = target.startsWith("t:") && topicLabel(target.slice(2)) ? target.slice(2) : "";
  const targetOk = !!targetCommunity || !!targetTopic || target === "umum";
  const validCommunityId = targetCommunity ? targetCommunity.id : "";
  const effectiveTopic = targetCommunity ? targetCommunity.topic || "" : targetTopic;
  const appearsIn = !targetOk
    ? ""
    : [
        "Feed utama",
        effectiveTopic && `Topik ${topicLabel(effectiveTopic)}`,
        targetCommunity && `Komunitas ${targetCommunity.name}`,
      ]
        .filter(Boolean)
        .join(" · ");
  const initials = user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const revoke = (items) => items.forEach((m) => URL.revokeObjectURL(m.previewUrl));

  // Pilih gambar (sampai 4) ATAU satu video; berkas langsung diunggah.
  const addFiles = (kind, fileList) => {
    setMediaError("");
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    const hasVideo = media.some((m) => m.kind === "video");
    const hasImage = media.some((m) => m.kind === "image");
    if (kind === "video" && hasImage) return setMediaError("Pilih gambar atau video, tidak bisa keduanya dalam satu post.");
    if (kind === "video" && hasVideo) return setMediaError("Satu post hanya bisa memuat satu video.");
    if (kind === "image" && hasVideo) return setMediaError("Pilih gambar atau video, tidak bisa keduanya dalam satu post.");

    const room = kind === "video" ? 1 : MAX_IMAGES - media.length;
    if (kind === "image" && files.length > room) setMediaError(`Maksimal ${MAX_IMAGES} gambar per post.`);

    const allowed = kind === "video" ? VIDEO_TYPES : IMAGE_TYPES;
    const max = kind === "video" ? VIDEO_MAX : IMAGE_MAX;
    const items = [];
    for (const f of files.slice(0, room)) {
      if (!allowed.includes(f.type)) {
        setMediaError(`Format ${f.name} tidak didukung.`);
        continue;
      }
      if (f.size > max) {
        setMediaError(`${f.name} melebihi ${max / 1048576} MB.`);
        continue;
      }
      items.push({
        key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        kind,
        file: f,
        previewUrl: URL.createObjectURL(f),
        status: "uploading",
        id: "",
      });
    }
    if (items.length === 0) return;
    setMedia((prev) => [...prev, ...items]);
    items.forEach(async (it) => {
      try {
        const res = await api.uploadMedia(it.file);
        setMedia((prev) => prev.map((m) => (m.key === it.key ? { ...m, status: "done", id: res.id } : m)));
      } catch (err) {
        setMedia((prev) =>
          prev.map((m) => (m.key === it.key ? { ...m, status: "error", error: err.message } : m))
        );
      }
    });
  };

  const removeMedia = (key) => {
    setMediaError("");
    setMedia((prev) => {
      revoke(prev.filter((m) => m.key === key));
      return prev.filter((m) => m.key !== key);
    });
  };

  // Reset form lokal supaya popup berikutnya mulai kosong lagi, lalu tutup.
  const reset = () => {
    revoke(media);
    setMedia([]);
    setMediaError("");
    setTitle("");
    setBody("");
    setIsAnonymous(false);
    setAsCompany(false);
    setTarget("");
    setError("");
    setBusy(false);
    closeComposer();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.createPost({
        title,
        body,
        isAnonymous: companyMode ? false : isAnonymous,
        asCompany: companyMode,
        mediaIds: media.filter((m) => m.status === "done").map((m) => m.id),
        communityId: validCommunityId,
        topic: targetTopic,
      });
      saveTarget(target);
      const dest = validCommunityId ? `/komunitas/${validCommunityId}` : targetTopic ? `/?topik=${targetTopic}` : "/";
      reset();
      navigate(dest);
    } catch (err) {
      setError(err.message || "Gagal membuat utas. Silakan coba lagi.");
      setBusy(false);
    }
  };

  const uploading = media.some((m) => m.status === "uploading");
  const canSubmit = !busy && !uploading && title.trim() && body.trim() && targetOk;

  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));

  // Mode halaman: layar penuh dengan header (kembali, judul, tombol Posting); menutupi bar bawah HP.
  const shell = (children) =>
    page ? (
      <div className="fixed inset-0 z-50 flex h-dvh flex-col overflow-y-auto bg-white md:static md:z-auto md:h-auto md:overflow-visible md:bg-transparent">
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-gray-200 bg-white px-2 py-2.5">
          <button
            type="button"
            onClick={goBack}
            aria-label="Kembali"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-gray-800 hover:bg-gray-100"
          >
            <ChevronLeft size={26} strokeWidth={2} />
          </button>
          <h1 className="m-0 flex-1 text-base font-bold">Buat Post</h1>
          <button type="submit" form="create-post-form" disabled={!canSubmit} className="btn btn-accent btn-sm">
            {busy ? "Memposting..." : uploading ? "Mengunggah..." : "Posting"}
          </button>
        </div>
        <div
          className="mx-auto w-full max-w-2xl flex-1 px-4 py-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
        >
          {children}
        </div>
      </div>
    ) : (
      <Modal title="Buat Utas Baru" onClose={busy ? () => {} : reset} maxWidth="max-w-2xl">
        {children}
      </Modal>
    );

  return shell(
      <form id="create-post-form" onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-soft text-brand font-bold text-sm shrink-0">
            {companyMode ? <Building2 size={18} /> : isAnonymous ? "?" : initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">
              {companyMode ? user.company_name : isAnonymous ? "Anonim" : user.name}
            </div>
            <select
              value={targetOk ? target : ""}
              onChange={(e) => setTarget(e.target.value)}
              aria-label="Posting ke"
              className={`max-w-full bg-transparent border-none p-0 -ml-0.5 text-xs focus:outline-none cursor-pointer ${
                targetOk ? "text-gray-500" : "font-semibold text-brand"
              }`}
            >
              <option value="" disabled>
                Pilih tempat posting...
              </option>
              {joined.length > 0 && (
                <optgroup label="Komunitas saya">
                  {joined.map((c) => (
                    <option key={c.id} value={`c:${c.id}`}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Topik">
                {TOPICS.map((t) => (
                  <option key={t.slug} value={`t:${t.slug}`}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
              <option value="umum">Umum (hanya feed utama)</option>
            </select>
            {appearsIn && (
              <div className="mt-0.5 text-[11px] text-gray-400">
                Muncul di: {appearsIn}
                {targetCommunity && !targetCommunity.topic && " (komunitas ini belum bertopik)"}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <input
          autoFocus
          placeholder="Judul Utas..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={150}
          className="w-full text-lg font-bold py-2 border-0 border-b border-gray-200 outline-none bg-transparent mb-1 focus:border-brand"
        />

        <textarea
          placeholder="Apa yang sedang Anda pikirkan? (Gunakan @ untuk menyebut, # untuk tagar)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={9}
          className="w-full text-[15px] py-2 border-0 outline-none bg-transparent resize-y leading-relaxed"
        />

        {(media.length > 0 || mediaError) && (
          <div className="mb-3">
            {mediaError && <p className="m-0 mb-2 text-xs text-danger">{mediaError}</p>}
            {media.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {media.map((m) => (
                  <div key={m.key} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                    {m.kind === "video" ? (
                      <video src={m.previewUrl} muted className="h-full w-full object-cover" />
                    ) : (
                      <img src={m.previewUrl} alt="" className="h-full w-full object-cover" />
                    )}
                    {m.status === "uploading" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-[11px] font-semibold text-gray-600">
                        Mengunggah...
                      </div>
                    )}
                    {m.status === "error" && (
                      <div
                        className="absolute inset-0 flex items-center justify-center bg-red-50/90 p-1 text-center text-[11px] font-semibold text-danger"
                        title={m.error}
                      >
                        Gagal
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(m.key)}
                      aria-label="Hapus lampiran"
                      className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-0 bg-black/60 p-0 text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          hidden
          onChange={(e) => {
            addFiles("image", e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm"
          hidden
          onChange={(e) => {
            addFiles("video", e.target.files);
            e.target.value = "";
          }}
        />

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-1 flex-wrap gap-3">
          <div className="flex gap-3.5 items-center">
            <span
              className="flex items-center gap-1.5 text-sm text-gray-400 cursor-not-allowed"
              title="Segera hadir: Sebut pengguna"
            >
              <AtSign size={16} strokeWidth={2} /> Mention
            </span>
            <span
              className="flex items-center gap-1.5 text-sm text-gray-400 cursor-not-allowed"
              title="Segera hadir: Tambahkan tagar"
            >
              <Hash size={16} strokeWidth={2} /> Tagar
            </span>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-1.5 border-0 bg-transparent p-0 text-sm text-gray-500 cursor-pointer hover:text-brand"
              title="Tambah gambar (maks. 4, 5 MB per gambar)"
            >
              <Image size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center gap-1.5 border-0 bg-transparent p-0 text-sm text-gray-500 cursor-pointer hover:text-brand"
              title="Tambah video (1 video, maks. 50 MB, MP4 atau WEBM)"
            >
              <Video size={16} strokeWidth={2} />
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {canPostAsCompany && (
              <label
                className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer"
                title="Post tampil atas nama perusahaan dan ada batas jumlah per hari sesuai paketmu"
              >
                <input
                  type="checkbox"
                  checked={asCompany}
                  onChange={(e) => setAsCompany(e.target.checked)}
                  className="w-3.5 h-3.5 accent-brand"
                />
                Posting sebagai perusahaan
              </label>
            )}
            <label
              className={`flex items-center gap-1.5 text-xs ${companyMode ? "text-gray-300 cursor-not-allowed" : "text-gray-600 cursor-pointer"}`}
              title={companyMode ? "Post perusahaan tidak bisa dikirim anonim" : undefined}
            >
              <input
                type="checkbox"
                checked={companyMode ? false : isAnonymous}
                disabled={companyMode}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-3.5 h-3.5 accent-brand"
              />
              Kirim anonim
            </label>
            {!page && (
              <button type="submit" disabled={!canSubmit} className="btn btn-accent btn-sm">
                {busy ? "Memposting..." : uploading ? "Mengunggah..." : "Posting"}
              </button>
            )}
          </div>
        </div>
      </form>
  );
}