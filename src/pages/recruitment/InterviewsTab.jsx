import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Lock, Pencil, XCircle } from "lucide-react";
import { api } from "../../api/client";
import { formatDateTime, isUpcomingInterview } from "../../constants/hiring";
import { Avatar, ErrorBanner } from "../../components/recruitment/StatusBadge";
import { InterviewStatusBadge, InterviewWhere } from "../../components/recruitment/InterviewParts";
import ScheduleInterviewModal from "../../components/recruitment/ScheduleInterviewModal";

function InterviewRow({ iv, busy, onEdit, onCancel }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 mb-3 ${iv.status === "cancelled" ? "opacity-60" : ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <Avatar name={iv.applicant_name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <Link to={`/rekrutmen/pelamar/${iv.application_id}`} className="text-[15px] font-bold text-inherit no-underline hover:underline">
              {iv.applicant_name}
            </Link>
            <InterviewStatusBadge status={iv.status} />
          </div>
          <div className="text-sm text-gray-500 mb-1">Melamar {iv.job_title || "lowongan"}</div>
          <div className="text-sm font-semibold mb-1.5">
            {formatDateTime(iv.starts_at)} <span className="text-xs font-normal text-gray-400">· {iv.duration_min} menit</span>
          </div>
          <InterviewWhere iv={iv} />
          {iv.response_note ? <p className="text-xs text-gray-500 m-0 mt-2">Alasan pelamar: {iv.response_note}</p> : null}
        </div>
        {iv.status !== "cancelled" && (
          <div className="flex gap-1.5 shrink-0">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(iv)} disabled={busy}>
              <Pencil size={13} /> Ubah
            </button>
            <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => onCancel(iv)} disabled={busy}>
              <XCircle size={13} /> Batalkan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Semua jadwal wawancara perekrut: yang akan datang, dan riwayat.
export default function InterviewsTab() {
  const [data, setData] = useState(null); // { allowed, items }
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api.recruitmentInterviews());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { upcoming, history } = useMemo(() => {
    const items = data?.items || [];
    const now = Date.now();
    const up = items.filter((iv) => isUpcomingInterview(iv, now));
    const hist = items.filter((iv) => !isUpcomingInterview(iv, now));
    up.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    hist.sort((a, b) => new Date(b.starts_at) - new Date(a.starts_at));
    return { upcoming: up, history: hist };
  }, [data]);

  const cancel = async (iv) => {
    if (!window.confirm(`Batalkan wawancara dengan ${iv.applicant_name}? Pelamar akan diberi tahu.`)) return;
    setBusyId(iv.id);
    setError("");
    try {
      await api.cancelInterview(iv.id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  };

  if (!data && !error) return <p className="text-gray-500 text-sm">Memuat jadwal...</p>;

  const empty = data && data.items.length === 0;

  return (
    <>
      <ErrorBanner>{error}</ErrorBanner>

      {data && !data.allowed && (
        <div className="card text-center py-8">
          <Lock size={28} className="mx-auto text-gray-300 mb-2" />
          <h3 className="text-base font-bold mb-1">Penjadwalan wawancara ada di paket Growth</h3>
          <p className="text-sm text-gray-500 max-w-[48ch] mx-auto mb-4">
            Atur jadwal, kirim undangan ke email pelamar, dan terima konfirmasi kehadiran dari satu tempat. Pengingat dikirim
            otomatis ke kedua pihak.
          </p>
          <Link to="/rekrutmen/paket" className="btn btn-accent btn-sm">
            Lihat paket
          </Link>
        </div>
      )}

      {data && data.allowed && empty && (
        <div className="rounded-lg border border-dashed border-gray-200 text-gray-500 text-sm text-center py-10">
          <CalendarClock size={28} className="mx-auto text-gray-300 mb-2" />
          Belum ada jadwal wawancara. Buka detail pelamar lalu pilih &ldquo;Jadwalkan wawancara&rdquo;.
          <div className="mt-3">
            <Link to="/rekrutmen/pelamar" className="btn btn-accent btn-sm">
              Buka daftar pelamar
            </Link>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="mb-6">
          <h3 className="text-base font-bold mb-3">Akan datang ({upcoming.length})</h3>
          {upcoming.map((iv) => (
            <InterviewRow key={iv.id} iv={iv} busy={busyId === iv.id} onEdit={setEditing} onCancel={cancel} />
          ))}
        </section>
      )}

      {history.length > 0 && (
        <section>
          <h3 className="text-base font-bold mb-3">Riwayat ({history.length})</h3>
          {history.map((iv) => (
            <InterviewRow key={iv.id} iv={iv} busy={busyId === iv.id} onEdit={setEditing} onCancel={cancel} />
          ))}
        </section>
      )}

      {editing && (
        <ScheduleInterviewModal
          applicationId={editing.application_id}
          applicantName={editing.applicant_name}
          interview={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </>
  );
}
