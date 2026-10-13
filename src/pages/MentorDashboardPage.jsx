import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Wallet, TrendingUp, Hourglass, CheckCircle2, Star, Info } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { MENTOR_FEE_PERCENT, mentorNet, formatRupiah } from "../constants/mentors";
import {
  useMentorDb, myMentor, myApplication, mentorStats, mentorEarnings, sessionsOfMentor,
  setSessionStatus, setMeetingLink, updateMentor, simulateIncomingRequest,
} from "../api/mentorStore";
import Topbar from "../components/Topbar";
import { MentorNav, Stars, EmptyState, DemoBox, SessionBadge, fmtDate } from "../components/mentor/MentorUi";

function Stat({ icon: Icon, label, value, tone = "text-brand bg-brand-soft" }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <span className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}><Icon size={16} /></span>
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function RequestCard({ s }) {
  const [link, setLink] = useState("");
  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-bold text-gray-900">{s.menteeName}</div>
          <div className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500"><CalendarDays size={12} /> {s.slot} · diajukan {fmtDate(s.createdAt)}</div>
        </div>
        <div className="text-right text-xs text-gray-500">
          {formatRupiah(s.price)} − komisi {formatRupiah(s.fee)}
          <div className="text-sm font-bold text-gray-900">Kamu terima {formatRupiah(s.net)}</div>
        </div>
      </div>
      <p className="m-0 mt-3 text-sm text-gray-700">{s.goal}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input className="field-input sm:max-w-xs" placeholder="Tautan meeting (opsional)" value={link} onChange={(e) => setLink(e.target.value)} />
        <div className="flex gap-2">
          <button type="button" className="btn btn-accent btn-sm" onClick={() => setSessionStatus(s.id, "confirmed", { meetingLink: link.trim() })}>Terima</button>
          <button type="button" className="btn btn-ghost btn-sm text-red-600" onClick={() => setSessionStatus(s.id, "declined")}>Tolak</button>
        </div>
      </div>
    </li>
  );
}

function ScheduleCard({ s }) {
  const [link, setLink] = useState(s.meetingLink || "");
  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-bold text-gray-900">{s.menteeName}</div>
          <div className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500"><CalendarDays size={12} /> {s.slot}</div>
        </div>
        <SessionBadge status={s.status} />
      </div>
      <p className="m-0 mt-3 text-sm text-gray-700">{s.goal}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input className="field-input sm:max-w-xs" placeholder="Tautan meeting" value={link} onChange={(e) => setLink(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMeetingLink(s.id, link)}>Simpan tautan</button>
          <button type="button" className="btn btn-accent btn-sm" onClick={() => setSessionStatus(s.id, "completed")}>Tandai selesai</button>
          <button type="button" className="btn btn-ghost btn-sm text-red-600" onClick={() => setSessionStatus(s.id, "cancelled")}>Batalkan</button>
        </div>
      </div>
    </li>
  );
}

function ProfileForm({ mentor }) {
  const [f, setF] = useState({
    title: mentor.title, org: mentor.org, bio: mentor.bio,
    expertise: mentor.expertise.join(", "), slots: mentor.slots.join(", "), price: String(mentor.price),
  });
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => { setSaved(false); setF((x) => ({ ...x, [k]: e.target.value })); };
  const list = (s, max) => [...new Set(s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean))].slice(0, max);
  const price = Math.floor(Number(f.price)) || 0;
  const ok = f.title.trim() && f.org.trim() && f.bio.trim() && price > 0 && list(f.expertise, 6).length && list(f.slots, 7).length;

  const submit = (e) => {
    e.preventDefault();
    if (!ok) return;
    updateMentor(mentor.id, { title: f.title.trim(), org: f.org.trim(), bio: f.bio.trim(), price, expertise: list(f.expertise, 6), slots: list(f.slots, 7) });
    setSaved(true);
  };

  return (
    <form onSubmit={submit} className="flex max-w-2xl flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">Jabatan<input className="field-input" value={f.title} onChange={set("title")} /></label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">Perusahaan / bidang<input className="field-input" value={f.org} onChange={set("org")} /></label>
      </div>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">Tentang<textarea className="field-input min-h-[90px] resize-y" value={f.bio} onChange={set("bio")} /></label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">Keahlian (pisahkan dengan koma)<input className="field-input" value={f.expertise} onChange={set("expertise")} /></label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">Jadwal mingguan (pisahkan dengan koma)<input className="field-input" value={f.slots} onChange={set("slots")} /></label>
      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">Harga per sesi (Rupiah)<input type="number" min="1" step="1000" className="field-input" value={f.price} onChange={set("price")} /></label>
        {price > 0 && <p className="m-0 text-xs text-gray-500">Kamu terima {formatRupiah(mentorNet(price))} setelah komisi platform {MENTOR_FEE_PERCENT}%. Perubahan harga hanya berlaku untuk pemesanan baru.</p>}
      </div>
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="inline-flex items-center gap-1 text-sm text-green-700"><CheckCircle2 size={14} /> Tersimpan</span>}
        <button type="submit" className="btn btn-accent" disabled={!ok}>Simpan Profil</button>
      </div>
    </form>
  );
}

const TABS = [
  { key: "requests", label: "Permintaan" },
  { key: "schedule", label: "Jadwal" },
  { key: "earnings", label: "Penghasilan" },
  { key: "profile", label: "Profil" },
  { key: "reviews", label: "Ulasan" },
];

export default function MentorDashboardPage() {
  const { user } = useAuth();
  const db = useMentorDb();
  const mentor = myMentor(db, user.id);
  const application = myApplication(db, user.id);
  const [tab, setTab] = useState("requests");

  if (!mentor) {
    return (
      <>
        <Topbar title="Mentor" />
        <div className="mx-auto w-full max-w-4xl p-6 lg:p-8">
          <MentorNav />
          <EmptyState>
            {application ? "Pengajuan mentor kamu belum disetujui." : "Kamu belum menjadi mentor."}{" "}
            <Link to="/profil?pengaturan=mentor" className="text-brand hover:underline">
              {application ? "Lihat status pengajuan" : "Ajukan diri sebagai mentor"}
            </Link>
          </EmptyState>
        </div>
      </>
    );
  }

  const stats = mentorStats(db, mentor);
  const earn = mentorEarnings(db, mentor.id);
  const sessions = sessionsOfMentor(db, mentor.id);
  const requests = sessions.filter((s) => s.status === "requested");
  const schedule = sessions.filter((s) => s.status === "confirmed");

  return (
    <>
      <Topbar title="Mentor" />
      <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
        <MentorNav />

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="m-0 text-xl font-bold text-gray-900">Dashboard Mentor</h2>
            <Link to={`/mentor/${mentor.id}`} className="text-xs text-brand hover:underline">Lihat profil publik</Link>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={mentor.available !== false} onChange={(e) => updateMentor(mentor.id, { available: e.target.checked })} />
            Terima pesanan baru
          </label>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Stat icon={Wallet} label="Total diterima" value={formatRupiah(earn.totalNet)} tone="text-emerald-600 bg-emerald-50" />
          <Stat icon={TrendingUp} label="Bulan ini" value={formatRupiah(earn.monthNet)} />
          <Stat icon={Hourglass} label="Menunggu selesai" value={formatRupiah(earn.pendingNet)} tone="text-amber-600 bg-amber-50" />
          <Stat icon={CheckCircle2} label="Sesi selesai" value={earn.completed.length} />
          <Stat icon={Star} label="Rating" value={stats.rating ? stats.rating.toFixed(1) : "Baru"} tone="text-amber-500 bg-amber-50" />
        </div>

        <div className="mb-5 flex items-start gap-2 rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-600">
          <Info size={15} className="mt-0.5 shrink-0 text-gray-400" />
          Komisi platform {MENTOR_FEE_PERCENT}% dipotong dari setiap sesi dan belum termasuk kewajiban pajak pribadi kamu sendiri.
        </div>

        <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto border-b border-gray-200">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`-mb-px flex items-center gap-2 whitespace-nowrap border-0 border-b-2 bg-transparent px-4 py-2.5 text-sm font-semibold ${
                tab === key ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {label}
              {key === "requests" && requests.length > 0 && <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">{requests.length}</span>}
              {key === "schedule" && schedule.length > 0 && <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-700">{schedule.length}</span>}
            </button>
          ))}
        </div>

        {tab === "requests" && (
          <div className="space-y-4">
            {requests.length === 0 ? <EmptyState>Belum ada permintaan masuk.</EmptyState> : (
              <ul className="m-0 flex list-none flex-col gap-4 p-0">{requests.map((s) => <RequestCard key={s.id} s={s} />)}</ul>
            )}
            <DemoBox title="Simulasi (demo)">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => simulateIncomingRequest(mentor.id)}>Tambah permintaan masuk dari peserta fiktif</button>
            </DemoBox>
          </div>
        )}

        {tab === "schedule" && (
          schedule.length === 0 ? <EmptyState>Belum ada jadwal terkonfirmasi. Terima permintaan di tab Permintaan.</EmptyState> : (
            <ul className="m-0 flex list-none flex-col gap-4 p-0">{schedule.map((s) => <ScheduleCard key={s.id} s={s} />)}</ul>
          )
        )}

        {tab === "earnings" && (
          <div className="space-y-4">
            {earn.completed.length === 0 ? <EmptyState>Penghasilan muncul setelah sesi pertama selesai.</EmptyState> : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                      <th className="px-4 py-3">Tanggal</th><th>Peserta</th>
                      <th className="text-right">Harga</th><th className="text-right">Komisi {MENTOR_FEE_PERCENT}%</th><th className="px-4 text-right">Diterima</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earn.completed.map((s) => (
                      <tr key={s.id} className="border-b border-gray-50">
                        <td className="whitespace-nowrap px-4 py-2.5">{fmtDate(s.completedAt || s.updatedAt)}</td>
                        <td>{s.menteeName}</td>
                        <td className="text-right">{formatRupiah(s.price)}</td>
                        <td className="text-right text-gray-500">− {formatRupiah(s.fee)}</td>
                        <td className="px-4 text-right font-semibold">{formatRupiah(s.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td className="px-4 py-3" colSpan={2}>Total</td>
                      <td className="text-right">{formatRupiah(earn.totalGross)}</td>
                      <td className="text-right text-gray-500">− {formatRupiah(earn.totalFee)}</td>
                      <td className="px-4 text-right">{formatRupiah(earn.totalNet)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
            <button type="button" className="btn btn-ghost btn-sm" disabled>Tarik saldo (segera hadir)</button>
          </div>
        )}

        {tab === "profile" && <ProfileForm key={mentor.id} mentor={mentor} />}

        {tab === "reviews" && (
          stats.reviews.length === 0 ? <EmptyState>Belum ada ulasan.</EmptyState> : (
            <ul className="m-0 flex max-w-2xl list-none flex-col divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white p-0 shadow-sm">
              {stats.reviews.map((r) => (
                <li key={r.id} className="px-5 py-4">
                  <div className="flex items-center justify-between"><span className="text-sm font-semibold text-gray-900">{r.menteeName}</span><span className="text-xs text-gray-400">{fmtDate(r.createdAt)}</span></div>
                  <Stars value={r.rating} size={14} />
                  {r.comment && <p className="m-0 mt-1 text-sm text-gray-700">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </>
  );
}
