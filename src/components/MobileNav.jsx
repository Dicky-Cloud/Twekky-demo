import { NavLink } from "react-router-dom";
import { Compass, Users, Briefcase, GraduationCap, MessageCircle, UserCircle, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

// Bar navigasi bawah untuk layar HP (di bawah md); di layar lebar yang tampil adalah Sidebar.
// Hanya ikon, tanpa label. Tombol Post tetap melayang (lihat ComposeFab), tidak masuk bar ini.
// Masuk: Feed, Komunitas, Mentor, Lowongan, Pesan, Profil. Tamu: Feed, Komunitas, Lowongan, Lainnya.
// Pencarian ada di Topbar. Mentor ada di tab Mentor pada halaman Komunitas.

const item = ({ isActive }) =>
  `flex min-w-0 flex-1 items-center justify-center py-3.5 no-underline transition-colors ${
    isActive ? "text-brand" : "text-gray-500"
  }`;

function Tab({ to, label, icon: Icon, end, dot }) {
  return (
    <NavLink to={to} end={end} className={item} aria-label={label} title={label}>
      {({ isActive }) => (
        <span className="relative">
          <Icon size={24} strokeWidth={isActive ? 2.5 : 1.75} />
          {dot && <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-danger" />}
        </span>
      )}
    </NavLink>
  );
}

export default function MobileNav({ hidden = false }) {
  const { user } = useAuth();
  const { hasMessages } = useNotifications();

  return (
    <nav
      aria-label="Navigasi utama"
      className={`fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200 bg-white transition-transform duration-200 md:hidden ${
        hidden ? "translate-y-full" : "translate-y-0"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <Tab to="/" end label="Feed" icon={Compass} />
      <Tab to="/komunitas" label="Komunitas" icon={Users} />
      {user && <Tab to="/mentor" label="Mentor" icon={GraduationCap} />}
      <Tab to="/lowongan-kerja" label="Lowongan" icon={Briefcase} />

      {user ? (
        <>
          <Tab to="/pesan" label="Pesan" icon={MessageCircle} dot={hasMessages} />
          <Tab to="/profil" label="Profil" icon={UserCircle} />
        </>
      ) : (
        <>
          <Tab to="/pengaturan" label="Lainnya" icon={Settings} />
        </>
      )}
    </nav>
  );
}