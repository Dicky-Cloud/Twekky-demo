import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, BadgeCheck, Clock, AlertTriangle, Trash2, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { topicLabel } from "../../constants/topics";
import { MENTOR_FEE_PERCENT, mentorNet, formatRupiah } from "../../constants/mentors";
import {
  useMentorDb, myApplication, myMentor, submitApplication, withdrawApplication, demoDecide,
} from "../../api/mentorStore";
import MentorApplyWizard, { CommissionNotice } from "./MentorApplyWizard";
import { DemoBox } from "./MentorUi";

// Isi tab "Mentor" di Pengaturan (di bawah Akun Bisnis).
export default function MentorSettingsPanel({ onNavigate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const db = useMentorDb();
  const app = myApplication(db, user.id);
  const mentor = myMentor(db, user.id);
  const [wizard, setWizard] = useState(false);

  const go = (path) => {
    onNavigate?.();
    navigate(path);
  };

  const hint = "Bagikan keahlianmu lewat sesi 1-on-1 dan dapatkan penghasilan. Pengajuan ditinjau terlebih dahulu.";

  let body;
  if (wizard) {
    body = (
      <MentorApplyWizard
        initial={app && app.status !== "approved" ? app : null}
        onCancel={() => setWizard(false)}
        onSubmit={(data) => {
          submitApplication(user.id, user.name, data);
          setWizard(false);
        }}
      />
    );
  } else if (mentor && app?.status === "approved") {
    body = (
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 p-5">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"><GraduationCap size={20} /></div>
            <div className="min-w-0">
              <div className="truncate text-base font-bold text-gray-900">{mentor.title} · {mentor.org}</div>
              <div className="text-xs text-gray-500">{topicLabel(mentor.topic)} · Mentor aktif</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
            <BadgeCheck size={17} className="shrink-0 text-success" /> Pengajuan disetujui. Profilmu tampil di daftar mentor.
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Harga sesi {formatRupiah(mentor.price)} · kamu terima <b>{formatRupiah(mentorNet(mentor.price))}</b> setelah komisi platform {MENTOR_FEE_PERCENT}%.
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn btn-accent btn-sm" onClick={() => go("/mentor/dashboard")}>
              <LayoutDashboard size={15} /> Buka Dashboard Mentor
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => go(`/mentor/${mentor.id}`)}>Lihat profil publik</button>
          </div>
        </div>
      </div>
    );
  } else if (app) {
    const revision = app.status === "revision";
    body = (
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 p-5">
          <div className="text-sm font-bold text-gray-900">{app.title} · {app.org}</div>
          <div className="mt-0.5 text-xs text-gray-500">{topicLabel(app.topic)} · {formatRupiah(app.price)} per sesi · terima {formatRupiah(mentorNet(app.price))}</div>
          <div className={`mt-4 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm ${revision ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"}`}>
            {revision ? <AlertTriangle size={17} className="mt-0.5 shrink-0 text-red-600" /> : <Clock size={17} className="mt-0.5 shrink-0 text-amber-600" />}
            <div>
              <b>{revision ? "Perlu revisi" : "Menunggu tinjauan"}</b>
              <div className="text-[13px]">{revision ? app.reason : "Tim Twekky sedang meninjau bukti keahlianmu."}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {revision && <button type="button" className="btn btn-accent btn-sm" onClick={() => setWizard(true)}>Perbaiki & ajukan ulang</button>}
            <button type="button" className="btn btn-ghost btn-sm text-red-600" onClick={() => withdrawApplication(user.id)}>
              <Trash2 size={14} /> Tarik pengajuan
            </button>
          </div>
        </div>
        {!revision && (
          <DemoBox title="Simulasi peninjauan admin (demo)">
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-accent btn-sm" onClick={() => demoDecide(user.id, "approve")}>Setujui pengajuan</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => demoDecide(user.id, "revision", "Bukti keahlian belum cukup jelas. Lengkapi tautan portofolio atau CV, lalu ajukan ulang.")}>
                Minta revisi
              </button>
            </div>
          </DemoBox>
        )}
      </div>
    );
  } else {
    body = (
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 p-5">
          <h4 className="m-0 text-sm font-bold text-gray-900">Punya pengalaman yang bisa dibagikan?</h4>
          <p className="m-0 mb-4 mt-1 text-xs leading-relaxed text-gray-500">
            Ajukan diri sebagai mentor: isi profil, lampirkan bukti keahlian, tetapkan harga dan jadwal. Setelah disetujui, kamu bisa menerima pesanan sesi lewat dashboard.
          </p>
          <button type="button" className="btn btn-accent" onClick={() => setWizard(true)}>Mulai pengajuan</button>
        </div>
        <CommissionNotice price={0} />
        <p className="m-0 text-xs text-gray-400">
          Hanya ingin belajar dari mentor? <Link to="/mentor" onClick={onNavigate} className="text-brand hover:underline">Jelajahi mentor</Link>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="m-0 text-base font-bold text-gray-900">Mentor</h3>
        <p className="m-0 mt-1 text-xs leading-relaxed text-gray-500">{hint}</p>
      </div>
      {body}
    </div>
  );
}
