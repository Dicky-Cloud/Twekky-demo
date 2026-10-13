// src/components/ReportPostModal.jsx
// Laporan post bertahap: kategori -> sub-alasan -> detail + foto bukti.
// Dikirim sebagai multipart ke POST /api/reports (lihat api.reportPost).
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from "lucide-react";
import Modal from "./Modal";
import { api } from "../api/client";
import {
  REPORT_CATEGORIES,
  MAX_EVIDENCE,
  MAX_EVIDENCE_BYTES,
  EVIDENCE_TYPES,
  MIN_DETAILS,
  MAX_DETAILS,
  detailsRequired,
} from "../constants/reportReasons";

// onSubmitted(post, { blockedAuthorId }) dipanggil setelah laporan berhasil dikirim.
export default function ReportPostModal({ post, onClose, onSubmitted }) {
  const [step, setStep] = useState("category"); // category | reason | details | done
  const [category, setCategory] = useState(null);
  const [sub, setSub] = useState(null);
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState([]); // { id, file, url }
  const [fileProblems, setFileProblems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const headingRef = useRef(null);
  const inputRef = useRef(null);

  // bebaskan URL pratinjau saat modal ditutup
  const filesRef = useRef([]);
  filesRef.current = files;
  useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

  // pindahkan fokus ke judul langkah supaya pembaca layar dan keyboard tidak "tertinggal"
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  // post anonim tidak membawa id penulis di tampilan, jadi opsi blokir tidak ditawarkan
  const authorId = !post.is_anonymous && post.author_id ? post.author_id : null;
  const authorName = post.is_anonymous ? "Anonim" : post.author_name;

  const hasSubs = !!category && category.subs.length > 0;
  const totalSteps = hasSubs ? 3 : 2;
  const stepNumber = step === "category" ? 1 : step === "reason" ? 2 : totalSteps;
  const needsDetails = detailsRequired(category?.slug, sub?.slug);
  const detailsLen = details.trim().length;
  const dirty = step !== "done" && (details.trim() !== "" || files.length > 0);

  const requestClose = () => {
    if (submitting) return;
    if (dirty && !window.confirm("Buang laporan ini? Penjelasan dan foto yang sudah kamu isi akan hilang.")) return;
    onClose();
  };

  const pickCategory = (c) => {
    setCategory(c);
    setSub(null);
    setError("");
    setStep(c.subs.length > 0 ? "reason" : "details");
  };
  const pickSub = (s) => {
    setSub(s);
    setError("");
    setStep("details");
  };
  const goBack = () => {
    setError("");
    if (step === "details") setStep(hasSubs ? "reason" : "category");
    else if (step === "reason") setStep("category");
  };

  const addFiles = (list) => {
    const incoming = Array.from(list || []);
    if (incoming.length === 0) return;
    const problems = new Set();
    const accepted = [];
    let room = MAX_EVIDENCE - files.length;
    for (const f of incoming) {
      if (!EVIDENCE_TYPES.includes(f.type)) {
        problems.add(`${f.name || "File"}: harus berupa foto JPG, PNG, WEBP, atau GIF.`);
        continue;
      }
      if (f.size > MAX_EVIDENCE_BYTES) {
        problems.add(`${f.name || "Foto"}: ukuran melebihi 5 MB.`);
        continue;
      }
      if (room <= 0) {
        problems.add(`Maksimal ${MAX_EVIDENCE} foto bukti.`);
        continue;
      }
      accepted.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file: f,
        url: URL.createObjectURL(f),
      });
      room -= 1;
    }
    setFileProblems([...problems]);
    if (accepted.length > 0) setFiles((prev) => [...prev, ...accepted]);
  };

  const removeFile = (id) => {
    setFiles((prev) => {
      const gone = prev.find((f) => f.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return prev.filter((f) => f.id !== id);
    });
    setFileProblems([]);
  };

  const submit = async () => {
    if (submitting || !category) return;
    if (needsDetails && detailsLen < MIN_DETAILS) {
      setError(`Jelaskan masalahnya minimal ${MIN_DETAILS} karakter.`);
      return;
    }
    setSubmitting(true);
    setError("");
    const body = new FormData();
    body.append("post_id", post.id);
    body.append("category", category.slug);
    body.append("subcategory", sub?.slug || "");
    body.append("details", details.trim());
    files.forEach((f) => body.append("evidence", f.file));
    try {
      await api.reportPost(body);
    } catch (err) {
      setError(err.message || "Laporan gagal dikirim. Coba lagi.");
      setSubmitting(false);
      return;
    }
    // laporan sudah tersimpan; memblokir adalah langkah terpisah
    let blocked = false;
    let blockFailed = false;
    if (alsoBlock && authorId) {
      try {
        await api.blockUser(authorId);
        blocked = true;
      } catch {
        blockFailed = true;
      }
    }
    setResult({ blocked, blockFailed });
    setSubmitting(false);
    setStep("done");
    onSubmitted?.(post, { blockedAuthorId: blocked ? authorId : null });
  };

  const headingClass = "m-0 text-sm font-bold text-gray-900 outline-none";

  const urgentNotice = category?.urgent && (
    <div className="mb-3 flex gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-3.5 py-2.5 text-xs text-yellow-800">
      <AlertTriangle size={15} className="mt-px shrink-0" />
      <p className="m-0">
        Jika ada orang yang sedang dalam bahaya saat ini, hubungi layanan darurat setempat lebih dulu (di Indonesia:
        112). Laporan ini diberi prioritas saat ditinjau, tetapi tidak menggantikan bantuan darurat.
      </p>
    </div>
  );

  return (
    <Modal title="Laporkan postingan" onClose={step === "done" ? onClose : requestClose} maxWidth="max-w-lg">
      {step !== "done" && (
        <>
          <div className="mb-3 rounded-xl bg-gray-50 px-3.5 py-2.5 text-xs text-gray-600">
            <span className="font-semibold text-gray-800">{authorName}</span>
            <span className="block truncate">{post.title}</span>
          </div>
          <div className="mb-4">
            <p className="m-0 mb-1.5 text-[11px] font-semibold text-gray-500">
              Langkah {stepNumber} dari {totalSteps}
            </p>
            <div className="h-1 rounded-full bg-gray-100">
              <div
                className="h-1 rounded-full bg-brand transition-all"
                style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </>
      )}

      {step === "category" && (
        <div>
          <h4 ref={headingRef} tabIndex={-1} className={headingClass}>
            Apa masalah dengan postingan ini?
          </h4>
          <p className="m-0 mb-3 mt-1 text-xs text-gray-500">Pilih yang paling sesuai. Laporanmu bersifat rahasia.</p>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {REPORT_CATEGORIES.map((c) => (
              <li key={c.slug}>
                <button
                  type="button"
                  onClick={() => pickCategory(c)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-left transition-colors hover:border-brand hover:bg-gray-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-900">{c.label}</span>
                    <span className="block text-xs text-gray-500">{c.hint}</span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-gray-400" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step === "reason" && category && (
        <div>
          {urgentNotice}
          <h4 ref={headingRef} tabIndex={-1} className={headingClass}>
            {category.label}: apa tepatnya?
          </h4>
          <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
            {category.subs.map((s) => (
              <li key={s.slug}>
                <button
                  type="button"
                  onClick={() => pickSub(s)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-left text-sm font-medium text-gray-900 transition-colors hover:border-brand hover:bg-gray-50"
                >
                  <span className="min-w-0 flex-1">{s.label}</span>
                  <ChevronRight size={16} className="shrink-0 text-gray-400" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-xs font-semibold text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={14} /> Kembali
            </button>
          </div>
        </div>
      )}

      {step === "details" && category && (
        <div
          onPaste={(e) => {
            // tempel tangkapan layar langsung dari clipboard
            const pasted = e.clipboardData?.files;
            if (pasted && pasted.length > 0) {
              e.preventDefault();
              addFiles(pasted);
            }
          }}
        >
          {urgentNotice}
          <h4 ref={headingRef} tabIndex={-1} className={headingClass}>
            Detail laporan
          </h4>
          <p className="m-0 mb-3 mt-1 text-xs text-gray-600">
            {category.label}
            {sub && <span className="text-gray-400"> › </span>}
            {sub?.label}{" "}
            <button
              type="button"
              onClick={goBack}
              className="cursor-pointer border-none bg-transparent p-0 text-xs font-semibold text-brand underline"
            >
              Ubah
            </button>
          </p>

          <label htmlFor="report-details" className="mb-1.5 block text-xs font-semibold text-gray-700">
            Jelaskan masalahnya {needsDetails ? <span className="text-danger">(wajib)</span> : "(opsional)"}
          </label>
          <textarea
            id="report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={MAX_DETAILS}
            rows={4}
            placeholder="Bagian mana yang melanggar, dan apa yang perlu diketahui peninjau?"
            className="w-full resize-y rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <p className="m-0 mt-1 text-right text-[11px] text-gray-400">
            {details.length}/{MAX_DETAILS}
          </p>

          <p className="m-0 mb-1.5 mt-3 text-xs font-semibold text-gray-700">
            Bukti foto {category.evidence === "recommended" ? "(disarankan)" : "(opsional)"}
          </p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`rounded-xl border-2 border-dashed px-3.5 py-3 text-center transition-colors ${
              dragging ? "border-brand bg-gray-50" : "border-gray-200"
            }`}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={files.length >= MAX_EVIDENCE}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImagePlus size={14} /> Pilih foto
            </button>
            <p className="m-0 mt-1.5 text-[11px] text-gray-500">
              atau seret dan lepas, atau tempel tangkapan layar di sini. Maksimal {MAX_EVIDENCE} foto, 5 MB per foto
              (JPG, PNG, WEBP, GIF).
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={EVIDENCE_TYPES.join(",")}
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {fileProblems.length > 0 && (
            <ul role="alert" className="m-0 mt-2 list-none p-0 text-xs text-danger">
              {fileProblems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}

          {files.length > 0 && (
            <ul className="m-0 mt-2.5 grid list-none grid-cols-4 gap-2 p-0">
              {files.map((f, i) => (
                <li
                  key={f.id}
                  className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                >
                  <img src={f.url} alt={`Bukti ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
                    aria-label={`Hapus bukti ${i + 1}`}
                    className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-none bg-black/70 p-0 text-white hover:bg-black"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {authorId && (
            <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer"
              />
              <span>
                <span className="block font-semibold text-gray-900">Blokir {authorName}</span>
                <span className="block text-xs text-gray-500">Pengguna yang diblokir tidak bisa mengirim pesan kepadamu.</span>
              </span>
            </label>
          )}

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger"
            >
              {error}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={goBack}
              disabled={submitting}
              className="inline-flex cursor-pointer items-center gap-1 rounded-xl border-none bg-transparent px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft size={14} /> Kembali
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting || (needsDetails && detailsLen < MIN_DETAILS)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-none bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? "Mengirim..." : "Kirim laporan"}
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="py-4 text-center">
          <CheckCircle2 size={40} className="mx-auto mb-3 text-success" />
          <h4 ref={headingRef} tabIndex={-1} className="m-0 text-base font-bold text-gray-900 outline-none">
            Laporan terkirim
          </h4>
          <p className="m-0 mx-auto mt-2 max-w-sm text-sm text-gray-600">
            Terima kasih sudah membantu menjaga komunitas. Laporanmu rahasia dan tidak ditampilkan ke penulis post.
          </p>
          {result?.blocked && <p className="m-0 mt-2 text-sm text-gray-600">{authorName} sudah kamu blokir.</p>}
          {result?.blockFailed && (
            <p className="m-0 mt-2 text-sm text-danger">
              Laporan terkirim, tetapi pengguna gagal diblokir. Kamu bisa memblokirnya lewat halaman profilnya.
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="mt-5 cursor-pointer rounded-xl border-none bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Selesai
          </button>
        </div>
      )}
    </Modal>
  );
}
