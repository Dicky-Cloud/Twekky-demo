import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import { ArrowLeft, Ban, Download, FileText, Mail, MessageCircle, Phone, Send, XCircle } from "lucide-react";
import { api } from "../../api/client";
import {
  APPLICATION_STATUSES,
  ENGLISH_LABELS,
  EXPERIENCE_LABELS,
  formatDate,
  formatFileSize,
  timeAgo,
  whatsappLink,
} from "../../constants/recruitment";
import { Avatar, ErrorBanner, StatusBadge } from "../../components/recruitment/StatusBadge";
import ApplicantNotes from "../../components/recruitment/ApplicantNotes";
import ScreeningAnswers from "../../components/recruitment/ScreeningAnswers";
import UseTemplateModal from "../../components/recruitment/UseTemplateModal";
import MatchCard from "../../components/recruitment/MatchScore";
import EvaluationCard from "../../components/recruitment/EvaluationCard";
import InterviewSection from "../../components/recruitment/InterviewSection";

// Jawaban pertanyaan hak bekerja & sponsor (nilai kosong = lamaran lama).
const YES_NO_LABELS = { yes: "Ya", no: "Tidak" };

function InfoRow({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <dt className="text-[13px] text-gray-500 sm:w-44 shrink-0">{label}</dt>
      <dd className="m-0 text-sm font-medium">{children}</dd>
    </div>
  );
}

export default function ApplicantDetailPage() {
  const { id } = useParams();
  const { reload } = useOutletContext();
  const [a, setA] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingStatus, setSavingStatus] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [templateKind, setTemplateKind] = useState(""); // "rejection" | "interview" | ""

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .recruitmentApplicant(id)
      .then((data) => !cancelled && setA(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const changeStatus = async (next) => {
    if (!a || next === a.status) return;
    setSavingStatus(next);
    setError("");
    try {
      const updated = await api.setApplicantStatus(a.id, next);
      setA((prev) => ({ ...prev, ...updated }));
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingStatus("");
    }
  };

  const toggleBlock = async () => {
    if (
      !a.blocked &&
      !window.confirm(
        `Blokir ${a.name}? Pelamar ini tidak akan bisa mengirim pesan atau melamar lowongan Anda lagi. Lamaran yang sudah masuk tetap tersimpan.`
      )
    ) {
      return;
    }
    setBlocking(true);
    setError("");
    try {
      if (a.blocked) await api.unblockUser(a.applicant_id);
      else await api.blockUser(a.applicant_id);
      setA((prev) => ({ ...prev, blocked: !prev.blocked }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBlocking(false);
    }
  };

  const [downloadingLetter, setDownloadingLetter] = useState(false);
  // Surat pengantar disimpan sebagai teks; server membuat PDF-nya saat diunduh.
  const downloadLetter = async () => {
    setDownloadingLetter(true);
    setError("");
    try {
      await api.downloadApplicantCoverLetter(a.id, "surat-pengantar.pdf");
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloadingLetter(false);
    }
  };

  const downloadCV = async () => {
    setDownloading(true);
    setError("");
    try {
      await api.downloadApplicantCV(a.id, a.cv_name);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  const back = (
    <Link to="/rekrutmen/pelamar" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand mb-4">
      <ArrowLeft size={16} /> Kembali ke daftar pelamar
    </Link>
  );

  if (loading) {
    return (
      <>
        {back}
        <p className="text-gray-500 text-sm">Memuat data pelamar...</p>
      </>
    );
  }
  if (!a) {
    return (
      <>
        {back}
        <ErrorBanner>{error || "Pelamar tidak ditemukan."}</ErrorBanner>
      </>
    );
  }

  const skills = (a.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <>
      {back}
      <ErrorBanner>{error}</ErrorBanner>

      <div className="card flex items-center gap-4">
        <Avatar name={a.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-bold m-0">{a.name}</h2>
            <StatusBadge status={a.status} />
            {a.blocked && (
              <span className="rounded-full bg-gray-900 text-white text-[11px] font-bold px-2.5 py-0.5">Diblokir</span>
            )}
          </div>
          <p className="m-0 mt-0.5 text-sm text-gray-500">
            Melamar <span className="font-semibold text-gray-700">{a.job_title}</span> · {timeAgo(a.created_at).toLowerCase()}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2">
          <MatchCard applicant={a} />

          <section className="card">
            <h3 className="text-base font-bold mb-2">Profil pelamar</h3>
            <dl className="m-0">
              <InfoRow label="Kemampuan bahasa Inggris">{ENGLISH_LABELS[a.english_level] || a.english_level || "Tidak diisi"}</InfoRow>
              <InfoRow label="Pengalaman kerja">{EXPERIENCE_LABELS[a.experience] || a.experience || "Tidak diisi"}</InfoRow>
              <InfoRow label="Keahlian">
                {skills.length ? (
                  <span className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span key={s} className="rounded-full bg-brand-soft text-brand text-xs font-semibold px-2.5 py-1">
                        {s}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-gray-400 font-normal">Tidak diisi</span>
                )}
              </InfoRow>
              <InfoRow label="Berhak bekerja di lokasi ini">{YES_NO_LABELS[a.work_authorization] || "Tidak diisi"}</InfoRow>
              <InfoRow label="Butuh sponsor visa">{YES_NO_LABELS[a.needs_sponsorship] || "Tidak diisi"}</InfoRow>
              <InfoRow label="Tanggal melamar">{formatDate(a.created_at)}</InfoRow>
            </dl>
          </section>

          <section className="card">
            <h3 className="text-base font-bold mb-2">Surat pengantar</h3>
            {a.cover_letter ? (
              <>
                <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3.5 py-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText size={22} className="text-brand shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">surat-pengantar.pdf</div>
                      <div className="text-xs text-gray-400">Dibuat otomatis dari tulisan pelamar</div>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm shrink-0" onClick={downloadLetter} disabled={downloadingLetter}>
                    <Download size={14} /> {downloadingLetter ? "Mengunduh..." : "Unduh PDF"}
                  </button>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed m-0">{a.cover_letter}</p>
              </>
            ) : (
              <p className="text-sm text-gray-400 m-0">Pelamar tidak menulis surat pengantar.</p>
            )}
          </section>

          <section className="card">
            <h3 className="text-base font-bold mb-3">CV</h3>
            {a.has_cv ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3.5 py-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText size={22} className="text-brand shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{a.cv_name}</div>
                    <div className="text-xs text-gray-400">{formatFileSize(a.cv_size)}</div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm shrink-0" onClick={downloadCV} disabled={downloading}>
                  <Download size={14} /> {downloading ? "Mengunduh..." : "Unduh"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 m-0">Pelamar tidak melampirkan CV.</p>
            )}
          </section>

          <ScreeningAnswers applicationId={a.id} />

          <EvaluationCard applicant={a} />

          <ApplicantNotes applicationId={a.id} />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
          <section className="card !mb-0">
            <h3 className="text-base font-bold mb-3">Status lamaran</h3>
            <div className="flex flex-col gap-1.5">
              {APPLICATION_STATUSES.map((s) => {
                const active = a.status === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => changeStatus(s.value)}
                    disabled={!!savingStatus}
                    aria-pressed={active}
                    className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm font-semibold text-left transition-colors disabled:cursor-not-allowed ${
                      active ? "border-brand bg-brand-soft text-brand" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {s.label}
                    {savingStatus === s.value ? <span className="text-xs font-normal">Menyimpan...</span> : active ? <span className="text-xs">Saat ini</span> : null}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 m-0 mt-3">
              Pelamar mendapat notifikasi saat status berubah ke Wawancara, Diterima, atau Ditolak.
            </p>
            <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-gray-100">
              <button type="button" className="btn btn-ghost btn-sm justify-start" onClick={() => setTemplateKind("interview")}>
                <Send size={14} /> Undang wawancara dengan template
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm justify-start text-danger"
                onClick={() => setTemplateKind("rejection")}
              >
                <XCircle size={14} /> Tolak dengan template
              </button>
            </div>
          </section>

          <InterviewSection
            applicant={a}
            onChanged={() => {
              reload();
              api.recruitmentApplicant(id).then((d) => setA(d)).catch(() => {});
            }}
          />

          <section className="card !mb-0">
            <h3 className="text-base font-bold mb-3">Hubungi pelamar</h3>
            <div className="flex flex-col gap-2">
              <Link to={`/pesan?ke=${encodeURIComponent(a.applicant_id)}`} className="btn btn-accent btn-sm justify-start">
                <Send size={14} /> Kirim pesan di Twekky
              </Link>
              <a href={whatsappLink(a.phone)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm justify-start">
                <MessageCircle size={14} /> WhatsApp
              </a>
              <a href={`mailto:${a.email}`} className="btn btn-ghost btn-sm justify-start">
                <Mail size={14} /> {a.email}
              </a>
              <a href={`tel:${a.phone}`} className="btn btn-ghost btn-sm justify-start">
                <Phone size={14} /> {a.phone}
              </a>
            </div>
          </section>

          <section className="card !mb-0">
            <h3 className="text-base font-bold mb-2">Blokir pelamar</h3>
            <p className="text-xs text-gray-500 leading-relaxed m-0 mb-3">
              {a.blocked
                ? "Pelamar ini diblokir: tidak bisa mengirim pesan atau melamar lowongan Anda. Buka blokir kapan saja, juga dari Pengaturan > Privasi."
                : "Pelamar yang diblokir tidak bisa mengirim pesan atau melamar lowongan Anda lagi. Lamaran yang sudah masuk tetap tersimpan."}
            </p>
            <button
              type="button"
              onClick={toggleBlock}
              disabled={blocking}
              className={`btn btn-ghost btn-sm justify-start ${a.blocked ? "" : "text-danger"}`}
            >
              <Ban size={14} /> {blocking ? "Memproses..." : a.blocked ? "Buka blokir" : "Blokir pelamar"}
            </button>
          </section>
        </aside>
      </div>

      {templateKind && (
        <UseTemplateModal
          applicant={a}
          kind={templateKind}
          onClose={() => setTemplateKind("")}
          onDone={(updated) => {
            setA((prev) => ({ ...prev, ...updated }));
            setTemplateKind("");
            reload();
          }}
        />
      )}
    </>
  );
}
