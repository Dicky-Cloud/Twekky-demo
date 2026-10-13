import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Lock, Pencil, XCircle } from "lucide-react";
import { api } from "../../api/client";
import { formatDateTime } from "../../constants/hiring";
import { ErrorBanner } from "./StatusBadge";
import { InterviewStatusBadge, InterviewWhere } from "./InterviewParts";
import ScheduleInterviewModal from "./ScheduleInterviewModal";

// Jadwal wawancara satu pelamar di halaman detail. `onChanged` dipanggil
// setelah jadwal dibuat/diubah/dibatalkan, supaya halaman memuat ulang status
// lamaran (membuat jadwal otomatis memindahkan pelamar ke tahap Wawancara).
export default function InterviewSection({ applicant, onChanged }) {
  const [data, setData] = useState(null); // { allowed, items }
  const [modal, setModal] = useState(null); // { interview } | null
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api.recruitmentInterviews(applicant.id));
    } catch (err) {
      setError(err.message);
    }
  }, [applicant.id]);

  useEffect(() => {
    setData(null);
    setError("");
    load();
  }, [load]);

  const cancel = async (iv) => {
    if (!window.confirm("Batalkan jadwal wawancara ini? Pelamar akan diberi tahu.")) return;
    setBusyId(iv.id);
    setError("");
    try {
      await api.cancelInterview(iv.id);
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  };

  const saved = async () => {
    setModal(null);
    await load();
    onChanged?.();
  };

  const items = data?.items || [];
  const rejected = applicant.status === "rejected";

  return (
    <section className="card !mb-0">
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock size={17} className="text-brand" />
        <h3 className="text-base font-bold m-0">Jadwal wawancara</h3>
      </div>
      <ErrorBanner>{error}</ErrorBanner>

      {!data && !error ? (
        <p className="text-sm text-gray-400 m-0">Memuat jadwal...</p>
      ) : (
        <>
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 m-0 mb-3">Belum ada jadwal wawancara untuk pelamar ini.</p>
          ) : (
            <ul className="list-none p-0 m-0 mb-3 flex flex-col gap-2.5">
              {items.map((iv) => (
                <li key={iv.id} className={`rounded-lg border border-gray-200 px-3.5 py-3 ${iv.status === "cancelled" ? "opacity-60" : ""}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="text-sm font-bold">{formatDateTime(iv.starts_at)}</span>
                    <InterviewStatusBadge status={iv.status} />
                  </div>
                  <div className="text-xs text-gray-400 mb-1.5">{iv.duration_min} menit</div>
                  <InterviewWhere iv={iv} />
                  {iv.response_note ? (
                    <p className="text-xs text-gray-500 m-0 mt-2">Alasan pelamar: {iv.response_note}</p>
                  ) : null}
                  {iv.status !== "cancelled" && (
                    <div className="flex gap-1.5 mt-2.5">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setModal({ interview: iv })}
                        disabled={busyId === iv.id}
                      >
                        <Pencil size={13} /> Ubah
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-danger"
                        onClick={() => cancel(iv)}
                        disabled={busyId === iv.id}
                      >
                        <XCircle size={13} /> {busyId === iv.id ? "Membatalkan..." : "Batalkan"}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {data?.allowed ? (
            <button
              type="button"
              className="btn btn-accent btn-sm w-full"
              onClick={() => setModal({ interview: null })}
              disabled={rejected}
              title={rejected ? "Pelamar sudah ditolak. Ubah statusnya dulu." : undefined}
            >
              <CalendarClock size={14} /> Jadwalkan wawancara
            </button>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3.5 py-3 text-center">
              <Lock size={18} className="mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-600 m-0 mb-2">Penjadwalan wawancara tersedia di paket Growth.</p>
              <Link to="/rekrutmen/paket" className="btn btn-accent btn-sm">
                Lihat paket
              </Link>
            </div>
          )}
          {rejected && data?.allowed ? (
            <p className="text-xs text-gray-400 m-0 mt-2">Pelamar sudah ditolak. Ubah statusnya dulu untuk menjadwalkan wawancara.</p>
          ) : null}
        </>
      )}

      {modal && (
        <ScheduleInterviewModal
          applicationId={applicant.id}
          applicantName={applicant.name}
          interview={modal.interview}
          onClose={() => setModal(null)}
          onSaved={saved}
        />
      )}
    </section>
  );
}
