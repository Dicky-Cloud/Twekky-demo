import { NavLink } from "react-router-dom";
import { Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useMentorDb, myMentor, sessionsOfMentor } from "../../api/mentorStore";

export const initialsOf = (name = "") =>
  name.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "";

export function Avatar({ name, size = "h-14 w-14 text-lg" }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-[#6b6b6b] font-bold text-white ${size}`}>
      {initialsOf(name)}
    </span>
  );
}

export function Rating({ stats }) {
  if (!stats.rating) return <span className="text-xs font-medium text-gray-500">Mentor baru</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
      <Star size={13} className="fill-amber-400 text-amber-400" />
      <span className="font-semibold text-gray-800">{stats.rating.toFixed(1)}</span>
      <span>· {stats.sessions} sesi</span>
    </span>
  );
}

export function Stars({ value, onChange, size = 20 }) {
  return (
    <div className="inline-flex gap-0.5" role={onChange ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} bintang`}
          className="border-none bg-transparent p-0 disabled:cursor-default"
        >
          <Star size={size} className={n <= value ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
        </button>
      ))}
    </div>
  );
}

export const SESSION_STATUS = {
  requested: { label: "Menunggu konfirmasi", cls: "bg-amber-50 text-amber-700" },
  confirmed: { label: "Dikonfirmasi", cls: "bg-blue-50 text-blue-700" },
  completed: { label: "Selesai", cls: "bg-emerald-50 text-emerald-700" },
  declined: { label: "Ditolak mentor", cls: "bg-red-50 text-red-600" },
  cancelled: { label: "Dibatalkan", cls: "bg-gray-100 text-gray-600" },
};

export function SessionBadge({ status }) {
  const s = SESSION_STATUS[status] || SESSION_STATUS.requested;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}

// Tab navigasi bersama untuk halaman Mentor: Jelajah | Sesi saya | Dashboard
export function MentorNav() {
  const { user } = useAuth();
  const db = useMentorDb();
  const mentor = myMentor(db, user?.id);
  const mine = db.sessions.filter((s) => s.menteeId === user?.id && ["requested", "confirmed"].includes(s.status)).length;
  const incoming = mentor ? sessionsOfMentor(db, mentor.id).filter((s) => s.status === "requested").length : 0;

  const items = [
    { to: "/mentor", label: "Jelajah", end: true },
    { to: "/mentor/sesi", label: "Sesi saya", count: mine },
    ...(mentor ? [{ to: "/mentor/dashboard", label: "Dashboard Mentor", count: incoming }] : []),
  ];

  return (
    <nav className="mb-5 flex gap-1 overflow-x-auto border-b border-gray-200">
      {items.map(({ to, label, end, count }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              isActive ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-800"
            }`
          }
        >
          {label}
          {count > 0 && <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">{count}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

export function EmptyState({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}

// Penanda hal yang di versi nyata dikerjakan server / admin / payment gateway.
export function DemoBox({ title = "Simulasi (demo)", children }) {
  return (
    <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-3">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-amber-700">{title}</div>
      {children}
    </div>
  );
}
