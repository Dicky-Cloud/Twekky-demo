import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ExternalLink } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatRupiah } from "../constants/mentors";
import { useMentorDb, getMentor, sessionsAsMentee, setSessionStatus, addReview, ACTIVE } from "../api/mentorStore";
import Topbar from "../components/Topbar";
import { MentorNav, SessionBadge, Stars, EmptyState, DemoBox, fmtDate } from "../components/mentor/MentorUi";

function ReviewForm({ session }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const submit = () => {
    try {
      addReview({ sessionId: session.id, rating, comment });
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <div className="mt-3 rounded-xl bg-gray-50 p-3.5">
      <div className="mb-1.5 text-xs font-semibold text-gray-700">Beri ulasan untuk sesi ini</div>
      <Stars value={rating} onChange={setRating} />
      <textarea className="field-input mt-2 min-h-[70px] resize-y" placeholder="Ceritakan pengalamanmu (opsional)" value={comment} onChange={(e) => setComment(e.target.value)} />
      {error && <p className="m-0 mt-1 text-xs text-danger">{error}</p>}
      <button type="button" className="btn btn-accent btn-sm mt-2" onClick={submit}>Kirim ulasan</button>
    </div>
  );
}

export default function MentorSessionsPage() {
  const { user } = useAuth();
  const db = useMentorDb();
  const sessions = sessionsAsMentee(db, user.id);

  return (
    <>
      <Topbar title="Mentor" />
      <div className="mx-auto w-full max-w-4xl p-6 lg:p-8">
        <MentorNav />
        {sessions.length === 0 ? (
          <EmptyState>
            Kamu belum punya sesi. <Link to="/mentor" className="text-brand hover:underline">Cari mentor</Link> dan ajukan sesi pertamamu.
          </EmptyState>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {sessions.map((s) => {
              const mentor = getMentor(db, s.mentorId);
              const seeded = mentor?.seeded;
              return (
                <li key={s.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/mentor/${s.mentorId}`} className="text-[15px] font-bold text-gray-900 no-underline hover:text-brand">{s.mentorName}</Link>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {s.slot}</span>
                        <span>{formatRupiah(s.price)}</span>
                        <span>Diajukan {fmtDate(s.createdAt)}</span>
                      </div>
                    </div>
                    <SessionBadge status={s.status} />
                  </div>
                  <p className="m-0 mt-3 text-sm text-gray-700">{s.goal}</p>

                  {s.status === "confirmed" && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
                      {s.meetingLink ? (
                        <>
                          <ExternalLink size={14} />
                          <a href={s.meetingLink} target="_blank" rel="noreferrer" className="font-semibold text-blue-800 underline">Buka tautan meeting</a>
                        </>
                      ) : (
                        "Mentor belum menambahkan tautan meeting."
                      )}
                    </div>
                  )}

                  {ACTIVE.includes(s.status) && (
                    <button type="button" className="btn btn-ghost btn-sm mt-3 text-red-600" onClick={() => setSessionStatus(s.id, "cancelled")}>
                      Batalkan sesi
                    </button>
                  )}

                  {s.status === "completed" && !s.reviewed && <ReviewForm session={s} />}
                  {s.status === "completed" && s.reviewed && <p className="m-0 mt-3 text-xs text-gray-400">Terima kasih, ulasanmu sudah terkirim.</p>}

                  {seeded && ACTIVE.includes(s.status) && (
                    <div className="mt-3">
                      <DemoBox title="Simulasi mentor (demo)">
                        {s.status === "requested" ? (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSessionStatus(s.id, "confirmed", { meetingLink: "https://meet.google.com/demo-twekky" })}>
                            Mentor menerima permintaan
                          </button>
                        ) : (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSessionStatus(s.id, "completed")}>
                            Tandai sesi selesai
                          </button>
                        )}
                      </DemoBox>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
