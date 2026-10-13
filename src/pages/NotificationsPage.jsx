import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Mail, Briefcase, Bell, UserPlus, CheckCircle2, XCircle, Repeat2 } from "lucide-react";
import { api } from "../api/client";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";

const ICONS = {
  comment: MessageSquare,
  message: Mail,
  job_match: Briefcase,
  join_request: UserPlus,
  join_approved: CheckCircle2,
  join_rejected: XCircle,
  job_application: Briefcase,
  application_status: CheckCircle2,
  follow: UserPlus,
  repost: Repeat2,
};

const TITLES = {
  comment: "Komentar Baru",
  message: "Pesan Baru",
  job_match: "Lowongan Cocok",
  join_request: "Permintaan Bergabung",
  join_approved: "Permintaan Disetujui",
  join_rejected: "Permintaan Ditolak",
  job_application: "Pelamar Baru",
  application_status: "Status Lamaran",
  follow: "Pengikut Baru",
  repost: "Repost Baru",
};

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export default function NotificationsPage() {
  const { refresh } = useNotifications();
  const { user, refreshUser } = useAuth();
  const [emailOn, setEmailOn] = useState(!user?.email_notify_off);
  const [savingEmail, setSavingEmail] = useState(false);
  useEffect(() => setEmailOn(!user?.email_notify_off), [user?.email_notify_off]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.listNotifications();
      setNotifications(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setMarking(false);
    }
  };

  const hasUnread = notifications.some((n) => !n.read);

  const toggleEmail = async () => {
    if (savingEmail) return;
    const next = !emailOn;
    setEmailOn(next);
    setSavingEmail(true);
    try {
      await api.setEmailNotifications(next);
      refreshUser?.();
    } catch (err) {
      setEmailOn(!next);
      setError(err.message);
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    <>
      <Topbar title="Notifikasi Terbaru" />
      {/* Diubah dari max-w-2xl menjadi w-full */}
      <div className="p-6 lg:p-8 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="m-0 text-[1.05rem] font-bold">Notifikasi</h2>
          {hasUnread && (
            <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead} disabled={marking}>
              {marking ? "Menandai..." : "Tandai semua dibaca"}
            </button>
          )}
        </div>

        <label className="mb-4 flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-brand"
            checked={emailOn}
            disabled={savingEmail}
            onChange={toggleEmail}
          />
          <span>
            <span className="block font-semibold text-gray-900">Kirim email</span>
            <span className="block text-xs text-gray-500">
              Beri tahu saya lewat email saat ada yang mengikuti atau me-repost post saya.
            </span>
          </span>
        </label>

        {error && (
          <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}
        {loading ? (
          <p className="text-gray-500 text-sm">Memuat notifikasi...</p>
        ) : notifications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 text-gray-500 text-sm text-center py-6">
            Belum ada notifikasi.
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = ICONS[n.type] || Bell;
            // notifikasi yang punya link (mis. permintaan bergabung) bisa diklik
            const Wrapper = n.link ? Link : "div";
            return (
              <Wrapper
                key={n.id}
                {...(n.link ? { to: n.link } : {})}
                className={`flex items-start gap-3.5 rounded-xl p-4 mb-2.5 ${
                  n.read ? "bg-white border border-gray-200" : "bg-brand-soft"
                } ${n.link ? "hover:opacity-90 transition-opacity" : ""}`}
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-brand shrink-0">
                  <Icon size={17} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="m-0 mb-0.5 text-sm font-bold">{TITLES[n.type] || "Notifikasi"}</h4>
                  <p className="m-0 text-sm text-gray-500">{n.text}</p>
                  <time className="block text-xs text-gray-500 mt-0.5">{timeAgo(n.created_at)}</time>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-brand mt-1 shrink-0" />}
              </Wrapper>
            );
          })
        )}
      </div>
    </>
  );
}