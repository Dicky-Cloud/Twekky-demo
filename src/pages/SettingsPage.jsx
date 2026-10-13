import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  User,
  Info,
  Briefcase,
  GraduationCap,
  Bell,
  Eye,
  ShieldAlert,
  Building2,
  Crown,
  Shield,
  FileText,
  Lock,
  Accessibility,
  HelpCircle,
  BookOpen,
  LogOut,
  LogIn,
  ChevronRight,
} from "lucide-react";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useCommunities } from "../context/CommunityContext";
import { useMentorDb, myMentor } from "../api/mentorStore";
import { useIsMobile } from "../utils/viewport";
import { settingsPath } from "../constants/settingsRoutes";

// Halaman Pengaturan untuk HP: semua menu yang dulu ada di sidebar/menu ada di sini.
// Bagian akun membuka halaman sendiri (/pengaturan/<bagian>), bukan popup.

const HELP_LINKS = [
  { label: "Twekky Rules", icon: Shield, to: "/aturan-komunitas" },
  { label: "Agreements", icon: FileText, to: "/agreements" },
  { label: "Privacy Policy", icon: Lock, to: "/privacy-policy" },
  { label: "Accessibility", icon: Accessibility, to: "/accessibility" },
  { label: "Help", icon: HelpCircle, to: "/help" },
  { label: "Blog", icon: BookOpen, to: "/blog" },
  { label: "About Twekky", icon: Info, to: "/about" },
];

function Group({ title, children }) {
  return (
    <section className="mb-5">
      {title && (
        <h2 className="m-0 mb-1.5 px-4 text-[11px] font-bold uppercase tracking-wide text-gray-400">{title}</h2>
      )}
      <div className="divide-y divide-gray-100 border-y border-gray-200 bg-white">{children}</div>
    </section>
  );
}

function Row({ to, icon: Icon, label, badge, dot, danger, onClick }) {
  const cls = `flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] font-medium no-underline hover:bg-gray-50 ${
    danger ? "text-danger" : "text-gray-800"
  }`;
  const inner = (
    <>
      <Icon size={20} strokeWidth={1.75} className={`shrink-0 ${danger ? "text-danger" : "text-gray-500"}`} />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            badge === "Aktif" ? "bg-emerald-50 text-success" : "bg-brand-soft text-brand"
          }`}
        >
          {badge}
        </span>
      )}
      {dot && <span className="h-2 w-2 rounded-full bg-danger" />}
      {!danger && <ChevronRight size={18} className="shrink-0 text-gray-300" />}
    </>
  );
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={`${cls} cursor-pointer border-none bg-transparent`}>
      {inner}
    </button>
  );
}

export default function SettingsPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadNotifications } = useNotifications();
  const { joined } = useCommunities();
  const mentorDb = useMentorDb();

  // Desktop memakai popup Pengaturan di halaman profil, seperti sebelumnya.
  if (!isMobile && user) return <Navigate to="/profil?pengaturan=1" replace />;

  const isBusiness = user?.account_type === "business";
  const isMentor = Boolean(user && myMentor(mentorDb, user.id));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <Topbar title="Pengaturan" />
      <div className="mx-auto w-full max-w-xl pb-4 pt-4">
        {user ? (
          <Group title="Akun">
            <Row to={settingsPath("account")} icon={User} label="Akun & Keamanan" />
            <Row to={settingsPath("about")} icon={Info} label="Tentang" />
            <Row to={settingsPath("business")} icon={Briefcase} label="Akun Bisnis" badge={isBusiness ? "Aktif" : null} />
            <Row to={settingsPath("mentor")} icon={GraduationCap} label="Pengaturan Mentor" badge={isMentor ? "Aktif" : null} />
            <Row to={settingsPath("notifications")} icon={Bell} label="Pengaturan Notifikasi" />
            <Row to={settingsPath("privacy")} icon={Eye} label="Privasi" />
            <Row to={settingsPath("report")} icon={ShieldAlert} label="Pusat Laporan" />
          </Group>
        ) : (
          <Group>
            <Row to="/login" icon={LogIn} label="Masuk atau daftar" />
          </Group>
        )}

        <Group title="Fitur">
          {user && <Row to="/notifikasi" icon={Bell} label="Notifikasi" dot={unreadNotifications > 0} />}
          <Row to="/lowongan-kerja" icon={Briefcase} label="Lowongan Kerja" />
          {isBusiness && <Row to="/rekrutmen" icon={Building2} label="Rekrutmen" badge="Bisnis" />}
          {user && <Row to="/mentor" icon={GraduationCap} label="Mentor" />}
          {user && <Row to="/premium" icon={Crown} label="Premium" />}
        </Group>

        {user && joined.length > 0 && (
          <Group title="Komunitasmu">
            {joined.slice(0, 8).map((c) => (
              <Link
                key={c.id}
                to={`/komunitas/${c.id}`}
                className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-gray-50"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-soft text-xs font-bold text-brand">
                  {c.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="flex-1 truncate text-[15px] font-medium text-gray-800">{c.name}</span>
                <ChevronRight size={18} className="shrink-0 text-gray-300" />
              </Link>
            ))}
          </Group>
        )}

        <Group title="Bantuan & kebijakan">
          {HELP_LINKS.map(({ to, label, icon }) => (
            <Row key={to} to={to} icon={icon} label={label} />
          ))}
        </Group>

        {user && (
          <Group>
            <Row icon={LogOut} label="Keluar" danger onClick={handleLogout} />
          </Group>
        )}
      </div>
    </>
  );
}
