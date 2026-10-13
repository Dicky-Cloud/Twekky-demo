import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, CalendarDays, CheckCircle2, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { topicLabel } from "../constants/topics";
import { formatRupiah } from "../constants/mentors";
import { useMentorDb, getMentor, allMentors, mentorStats, bookSession } from "../api/mentorStore";
import Topbar from "../components/Topbar";
import { Avatar, Rating, Stars, EmptyState, fmtDate } from "../components/mentor/MentorUi";

function BookingPanel({ mentor }) {
  const { user } = useAuth();
  const [slot, setSlot] = useState(mentor.slots[0]);
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  const isOwn = mentor.userId && mentor.userId === user?.id;
  const unavailable = mentor.available === false;

  if (done) {
    return (
      <div className="py-2 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-success"><CheckCircle2 size={28} /></div>
        <h4 className="m-0 text-base font-bold text-gray-900">Permintaan terkirim</h4>
        <p className="mx-auto mb-4 mt-1.5 text-sm leading-relaxed text-gray-600">
          {done.slot} bersama {mentor.name} menunggu konfirmasi mentor. Pantau statusnya di Sesi saya.
        </p>
        <Link to="/mentor/sesi" className="btn btn-accent no-underline">Lihat Sesi saya</Link>
      </div>
    );
  }

  if (isOwn) {
    return (
      <div className="space-y-3 text-center text-sm text-gray-600">
        <p className="m-0">Ini profil mentor kamu.</p>
        <Link to="/mentor/dashboard" className="btn btn-accent no-underline"><LayoutDashboard size={15} /> Buka Dashboard</Link>
      </div>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    setError("");
    try {
      setDone(bookSession({ mentorId: mentor.id, menteeId: user.id, menteeName: user.name, slot, goal: goal.trim() }));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <div className="text-xl font-bold text-gray-900">{formatRupiah(mentor.price)}</div>
        <div className="text-xs text-gray-500">per sesi · 60 menit</div>
      </div>
      <div>
        <div className="mb-2 text-xs font-semibold text-gray-700">Pilih jadwal</div>
        <div className="flex flex-wrap gap-2">
          {mentor.slots.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlot(s)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                slot === s ? "border-brand bg-brand-soft text-brand" : "border-gray-200 bg-white text-gray-600 hover:border-brand/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
        Apa yang ingin kamu bahas?
        <textarea
          className="field-input min-h-[100px] resize-y"
          placeholder="Contoh: saya ingin pindah ke bidang UX dan butuh masukan untuk portofolio."
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
      </label>
      {error && <p className="m-0 text-sm text-danger">{error}</p>}
      <button type="submit" className="btn btn-accent" disabled={!goal.trim() || unavailable}>
        {unavailable ? "Tidak menerima pesanan" : "Kirim Permintaan Sesi"}
      </button>
      <p className="m-0 text-[11px] leading-relaxed text-gray-400">
        DEMO: pembayaran belum aktif. Di versi sebenarnya dana ditahan sampai sesi selesai.
      </p>
    </form>
  );
}

export default function MentorDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const db = useMentorDb();
  const mentor = getMentor(db, id);

  if (!mentor) {
    return (
      <>
        <Topbar title="Mentor" />
        <div className="mx-auto w-full max-w-4xl p-6 lg:p-8">
          <EmptyState>Mentor tidak ditemukan. <Link to="/mentor" className="text-brand hover:underline">Kembali ke daftar mentor</Link></EmptyState>
        </div>
      </>
    );
  }

  const stats = mentorStats(db, mentor);
  const similar = allMentors(db).filter((m) => m.topic === mentor.topic && m.id !== mentor.id).slice(0, 3);

  return (
    <>
      <Topbar title="Mentor" />
      <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
        <Link to="/mentor" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 no-underline hover:text-gray-800">
          <ArrowLeft size={15} /> Semua mentor
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <Avatar name={mentor.name} size="h-20 w-20 text-2xl" />
                <div className="min-w-0">
                  <h1 className="m-0 flex items-center gap-2 text-xl font-bold text-gray-900">
                    {mentor.name}
                    {mentor.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-success px-2 py-0.5 text-[11px] font-bold text-success">
                        <BadgeCheck size={12} /> Terverifikasi
                      </span>
                    )}
                  </h1>
                  <div className="text-sm text-gray-600">{mentor.title} · {mentor.org}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <Rating stats={stats} />
                    <span className="rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">{topicLabel(mentor.topic)}</span>
                  </div>
                </div>
              </div>

              <h2 className="m-0 mb-1.5 mt-6 text-xs font-semibold uppercase tracking-wide text-gray-400">Tentang</h2>
              <p className="m-0 text-sm leading-relaxed text-gray-700">{mentor.bio}</p>

              <h2 className="m-0 mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-400">Keahlian</h2>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise.map((x) => <span key={x} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{x}</span>)}
              </div>

              <h2 className="m-0 mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-400">Jadwal tersedia (mingguan)</h2>
              <div className="flex flex-wrap gap-2">
                {mentor.slots.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700">
                    <CalendarDays size={13} className="text-gray-400" /> {s}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="m-0 mb-3 text-base font-bold text-gray-900">Ulasan {stats.reviewCount > 0 && `(${stats.reviewCount})`}</h2>
              {stats.reviews.length === 0 ? (
                <p className="m-0 text-sm text-gray-500">Belum ada ulasan. Ulasan muncul setelah peserta menyelesaikan sesi.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col divide-y divide-gray-100 p-0">
                  {stats.reviews.map((r) => (
                    <li key={r.id} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-gray-900">{r.menteeName}</span>
                        <span className="text-xs text-gray-400">{fmtDate(r.createdAt)}</span>
                      </div>
                      <Stars value={r.rating} size={14} />
                      {r.comment && <p className="m-0 mt-1 text-sm text-gray-700">{r.comment}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {similar.length > 0 && (
              <section>
                <h2 className="m-0 mb-3 text-base font-bold text-gray-900">Mentor serupa</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {similar.map((m) => (
                    <Link key={m.id} to={`/mentor/${m.id}`} className="rounded-xl border border-gray-200 bg-white p-3.5 text-inherit no-underline hover:shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.name} size="h-9 w-9 text-xs" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-gray-900">{m.name}</div>
                          <div className="truncate text-xs text-gray-500">{m.title}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-gray-700">{formatRupiah(m.price)}</div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              {user ? <BookingPanel key={mentor.id} mentor={mentor} /> : (
                <div className="space-y-3 text-center text-sm text-gray-600">
                  <p className="m-0">Masuk untuk memesan sesi.</p>
                  <Link to="/login" className="btn btn-accent no-underline">Masuk</Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
