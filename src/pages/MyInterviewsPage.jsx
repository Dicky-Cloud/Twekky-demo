import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Check, Send, X } from "lucide-react";
import { api } from "../api/client";
import Topbar from "../components/Topbar";
import JobsTabs from "../components/JobsTabs";
import { ErrorBanner } from "../components/recruitment/StatusBadge";
import { InterviewStatusBadge, InterviewWhere } from "../components/recruitment/InterviewParts";
import { formatDateTime, isUpcomingInterview } from "../constants/hiring";

const REASON_MAX = 300;

function MyInterviewCard({ iv, upcoming, busy, onRespond }) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");

  const decline = async () => {
    const ok = await onRespond(iv, "decline", reason.trim());
    if (ok) {
      setDeclining(false);
      setReason("");
    }
  };

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 mb-3 ${iv.status === "cancelled" ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <div className="text-[15px] font-bold">{iv.job_title || "Lowongan"}</div>
          <div className="text-sm text-gray-500">{iv.company_name}</div>
        </div>
        <InterviewStatusBadge status={iv.status} />
      </div>

      <div className="text-sm font-semibold mt-2 mb-1.5">
        {formatDateTime(iv.starts_at)} <span className="text-xs font-normal text-gray-400">· {iv.duration_min} menit</span>
      </div>
      <InterviewWhere iv={iv} />

      {iv.note ? (
        <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed m-0 mt-2.5 rounded-lg bg-gray-50 px-3 py-2">
          <span className="block text-xs text-gray-400 mb-0.5">Pesan dari perusahaan</span>
          {iv.note}
        </p>
      ) : null}
      {iv.status === "declined" && iv.response_note ? (
        <p className="text-xs text-gray-500 m-0 mt-2">Alasan Anda: {iv.response_note}</p>
      ) : null}

      {declining && (
        <div className="mt-3">
          <textarea
            className="field-input min-h-[64px] resize-y"
            placeholder="Alasan tidak bisa hadir (opsional). Anda bisa menyarankan waktu lain."
            value={reason}
            maxLength={REASON_MAX}
            onChange={(e) => setReason(e.target.value)}
            aria-label="Alasan tidak bisa hadir"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDeclining(false)} disabled={busy}>
              Batal
            </button>
            <button type="button" className="btn btn-accent btn-sm" onClick={decline} disabled={busy}>
              {busy ? "Mengirim..." : "Kirim"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
        {upcoming && !declining && iv.status !== "confirmed" && (
          <button type="button" className="btn btn-accent btn-sm" onClick={() => onRespond(iv, "confirm", "")} disabled={busy}>
            <Check size={14} /> {iv.status === "declined" ? "Saya bisa hadir" : "Konfirmasi hadir"}
          </button>
        )}
        {upcoming && !declining && iv.status !== "declined" && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDeclining(true)} disabled={busy}>
            <X size={14} /> Tidak bisa hadir
          </button>
        )}
        <Link to={`/pesan?ke=${encodeURIComponent(iv.poster_id)}`} className="btn btn-ghost btn-sm ml-auto">
          <Send size={13} /> Kirim pesan
        </Link>
      </div>
    </div>
  );
}

// Jadwal wawancara milik pelamar: konfirmasi atau tolak kehadiran.
export default function MyInterviewsPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    try {
      setItems((await api.myInterviews()) || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { upcoming, history } = useMemo(() => {
    const list = items || [];
    const now = Date.now();
    const up = list.filter((iv) => isUpcomingInterview(iv, now));
    const hist = list.filter((iv) => !isUpcomingInterview(iv, now));
    up.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    hist.sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));
    return { upcoming: up, history: hist };
  }, [items]);

  const respond = async (iv, response, note) => {
    setBusyId(iv.id);
    setError("");
    try {
      await api.respondInterview(iv.id, response, note);
      await load();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <Topbar title="Lowongan Kerja" />
      <div className="p-6 lg:p-8 w-full max-w-3xl">
        <JobsTabs className="mb-6" />
        <div className="flex items-center gap-3 mb-5">
          <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-soft text-brand shrink-0">
            <CalendarClock size={22} strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-xl font-bold m-0">Jadwal wawancara</h2>
            <p className="m-0 text-sm text-gray-500">Konfirmasi kehadiran Anda agar perusahaan bisa bersiap.</p>
          </div>
        </div>

        <ErrorBanner>{error}</ErrorBanner>

        {!items && !error ? (
          <p className="text-gray-500 text-sm">Memuat jadwal...</p>
        ) : items && items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 text-gray-500 text-sm text-center py-10">
            Belum ada undangan wawancara. Saat perusahaan mengundang Anda, jadwalnya muncul di sini dan dikirim ke email Anda.
            <div className="mt-3">
              <Link to="/lowongan-kerja" className="btn btn-accent btn-sm">
                Cari lowongan
              </Link>
            </div>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="mb-6">
                <h3 className="text-base font-bold mb-3">Akan datang ({upcoming.length})</h3>
                {upcoming.map((iv) => (
                  <MyInterviewCard key={iv.id} iv={iv} upcoming busy={busyId === iv.id} onRespond={respond} />
                ))}
              </section>
            )}
            {history.length > 0 && (
              <section>
                <h3 className="text-base font-bold mb-3">Riwayat ({history.length})</h3>
                {history.map((iv) => (
                  <MyInterviewCard key={iv.id} iv={iv} upcoming={false} busy={false} onRespond={respond} />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}