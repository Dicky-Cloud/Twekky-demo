import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import {
  Compass,
  Users,
  Briefcase,
  Building2,
  GraduationCap,
  Crown,
  BookOpen,
  PlusCircle,
  MessageCircle,
  UserCircle,
  Shield,
  FileText,
  Lock,
  Accessibility,
  HelpCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useCommunities } from "../context/CommunityContext";
import { usePostComposer } from "../context/PostComposerContext";
import { TOPICS } from "../constants/topics";

// Import gambar logo dari folder assets (sesuaikan jalurnya jika letak file Sidebar berbeda)
import twekkyLogo from "../assets/twekky_logo.png";

const SECONDARY_ITEMS = [
  { label: "Twekky Rules", icon: Shield, to: "/aturan-komunitas" },
  { label: "Agreements", icon: FileText, to: "/agreements" },
  { label: "Privacy Policy", icon: Lock, to: "/privacy-policy" },
  { label: "Accessibility", icon: Accessibility, to: "/accessibility" },
  { label: "Help", icon: HelpCircle, to: "/help" },
  { label: "Blog", icon: BookOpen, to: "/blog" },
  { label: "About Twekky", icon: Info, to: "/about" },
];

const TOPICS_PREVIEW_COUNT = 6;
const COMMUNITIES_PREVIEW_COUNT = 5;

// collapsed/onToggle dikendalikan AppShell. Sidebar setinggi layar dan memuat logo di bagian atas.
export default function Sidebar({ collapsed = false, onToggle = () => {} }) {
  const { user } = useAuth();
  const { joined } = useCommunities();
  const { openComposer } = usePostComposer();
  const { hasMessages } = useNotifications();
  const [communitiesOpen, setCommunitiesOpen] = useState(true);
  const [showAllCommunities, setShowAllCommunities] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false); // Topics tertutup secara default agar sidebar ringan
  const [showAllTopics, setShowAllTopics] = useState(false);
  const location = useLocation();
  const activeTopic = new URLSearchParams(location.search).get("topik");
  const visibleCommunities = showAllCommunities ? joined : joined.slice(0, COMMUNITIES_PREVIEW_COUNT);
  const visibleTopics = showAllTopics ? TOPICS : TOPICS.slice(0, TOPICS_PREVIEW_COUNT);

  // Tipe akun (sesuaikan nama field dengan data dari backend)
  const isBusiness = user?.account_type === "business";

  // Buat Post jadi tombol CTA di atas menu. Notifikasi & Cari sudah ada di Topbar.
  // Wawancara kini tab di dalam Lowongan Kerja (rute /wawancara tetap sama),
  // jadi menu Lowongan Kerja tetap menyala saat berada di halaman itu (lihat matchPaths).
  const NAV_ITEMS = [
    { to: "/", label: "Feed", icon: Compass, end: true },
    { to: "/komunitas", label: "Komunitas", icon: Users },
    {
      to: "/lowongan-kerja",
      label: "Lowongan Kerja",
      icon: Briefcase,
      matchPaths: ["/lowongan-kerja", "/wawancara"],
    },
    // Hanya tampil untuk akun Bisnis
    { to: "/rekrutmen", label: "Rekrutmen", icon: Building2, requireBusiness: true, badge: "Bisnis" },
    { to: "/mentor", label: "Mentor", icon: GraduationCap, requireAuth: true },
    { to: "/cv", label: "Buat CV", icon: FileText, requireAuth: true },
    { to: "/pesan", label: "Pesan", icon: MessageCircle, requireAuth: true, showDot: hasMessages },
    { to: "/profil", label: "Profil", icon: UserCircle, requireAuth: true },
    // Halaman Premium ada di dropdown akun di Topbar.
  ];

  return (
    <div
      className={`hidden md:block relative sticky top-0 z-40 h-screen shrink-0 self-start transition-[width] duration-200 ease-in-out ${
        collapsed ? "w-[76px]" : "w-60"
      }`}
    >
      {/* tombol lipat/buka: bulat, menempel di tepi sidebar */}
      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? "Perbesar sidebar" : "Perkecil sidebar"}
        aria-label={collapsed ? "Perbesar sidebar" : "Perkecil sidebar"}
        className="absolute -right-3 top-5 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white p-0 text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
      >
        {collapsed ? <ChevronRight size={14} strokeWidth={2.25} /> : <ChevronLeft size={14} strokeWidth={2.25} />}
      </button>

      <aside className="flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-gray-50 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* logo: menggunakan gambar dari src/assets/twekky_logo.png */}
        <Link
          to="/"
          title="Twekky"
          className={`flex h-16 shrink-0 items-center gap-2.5 no-underline ${collapsed ? "justify-center" : "px-5"}`}
        >
          <img
            src={twekkyLogo}
            alt="Twekky Logo"
            className="h-8 w-8 shrink-0 object-contain rounded-lg"
          />
          {!collapsed && <span className="truncate text-lg font-bold text-brand">Twekky</span>}
        </Link>

        {/* tombol CTA Buat Post */}
        {user && (
          <div className="px-3 pb-1 pt-1">
            <button
              type="button"
              onClick={() => openComposer("", activeTopic || "")}
              title={collapsed ? "Buat Post" : undefined}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              <PlusCircle size={18} strokeWidth={2.25} className="shrink-0" />
              {!collapsed && <span className="truncate">Buat Post</span>}
            </button>
          </div>
        )}

        {/* primary nav */}
        <nav className="flex flex-col gap-0.5 px-3 py-2">
          {NAV_ITEMS.map(
            ({ to, action, label, icon: Icon, end, matchPaths, requireAuth, requireBusiness, badge, locked, showDot, dotVariant }) => {
              if (requireAuth && !user) return null;
              if (requireBusiness && !isBusiness) return null;

              const itemClass = `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full text-left ${
                collapsed ? "justify-center" : ""
              }`;
              const idleClass = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";
              const activeClass = "bg-white font-bold text-gray-900 shadow-[0_0_0_1px_rgb(229,231,235)]";

              // Menu dengan matchPaths menyala di semua rute yang terdaftar
              const matchActive = (isActive) =>
                matchPaths
                  ? matchPaths.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"))
                  : isActive;

              const renderContent = (isActive) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.75} className="shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                  {!collapsed && badge && (
                    <span
                      className={`rounded-full text-[10px] font-bold px-1.5 py-0.5 shrink-0 ${
                        "bg-brand-soft text-brand"
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                  {locked && (
                    <Crown
                      size={14}
                      strokeWidth={2}
                      aria-label="Fitur langganan"
                      className={`shrink-0 text-yellow-500 fill-yellow-400 ${
                        collapsed ? "absolute top-1 right-1" : "ml-auto"
                      }`}
                    />
                  )}
                  {showDot && (
                    <span
                      className={`w-[7px] h-[7px] rounded-full shrink-0 ${
                        dotVariant === "danger" ? "bg-danger" : "bg-brand"
                      } ${collapsed ? "absolute top-1.5 right-1.5" : "ml-auto"}`}
                    />
                  )}
                </>
              );

              if (action === "compose-post") {
                return (
                  <button
                    key="compose-post"
                    type="button"
                    onClick={() => openComposer("", activeTopic || "")}
                    title={collapsed ? label : undefined}
                    className={`${itemClass} ${idleClass}`}
                  >
                    {renderContent(false)}
                  </button>
                );
              }

              return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) => `${itemClass} ${matchActive(isActive) ? activeClass : idleClass}`}
                >
                  {({ isActive }) => renderContent(matchActive(isActive))}
                </NavLink>
              );
            }
          )}
        </nav>

        {/* komunitas saya */}
        {user && joined.length > 0 && (
          <>
            <hr className="border-t border-gray-200 mx-3" />
            <div className="px-2.5 py-2">
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => setCommunitiesOpen((v) => !v)}
                  aria-expanded={communitiesOpen}
                  className="flex w-full items-center justify-between px-3 pb-2 text-[13px] font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <span>Komunitas saya</span>
                  {communitiesOpen ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
                </button>
              )}

              {(communitiesOpen || collapsed) && (
                <div className="flex flex-col gap-0.5">
                  {visibleCommunities.map((c) => (
                    <NavLink
                      key={c.id}
                      to={`/komunitas/${c.id}`}
                      title={collapsed ? c.name : undefined}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                          collapsed ? "justify-center" : ""
                        } ${
                          isActive
                            ? "bg-brand-soft text-brand font-medium"
                            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        }`
                      }
                    >
                      <span className="flex items-center justify-center w-[17px] h-[17px] rounded-md bg-brand-soft text-brand text-[10px] font-bold shrink-0">
                        {c.name.slice(0, 1).toUpperCase()}
                      </span>
                      {!collapsed && <span className="truncate">{c.name}</span>}
                    </NavLink>
                  ))}

                  {joined.length > COMMUNITIES_PREVIEW_COUNT && (
                    <button
                      type="button"
                      onClick={() => setShowAllCommunities((v) => !v)}
                      title={collapsed ? (showAllCommunities ? "Lihat lebih sedikit" : "Lihat semua komunitas") : undefined}
                      className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors ${
                        collapsed ? "justify-center" : ""
                      }`}
                    >
                      {collapsed ? (
                        <MoreHorizontal size={17} strokeWidth={2} className="shrink-0" />
                      ) : (
                        <span>{showAllCommunities ? "Lihat lebih sedikit" : "Lihat selengkapnya"}</span>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        <hr className="border-t border-gray-200 mx-3" />

        {/* topics */}
        <div className="px-2.5 py-2">
          {!collapsed && (
            <button
              type="button"
              onClick={() => setTopicsOpen((v) => !v)}
              aria-expanded={topicsOpen}
              className="flex w-full items-center justify-between px-3 pb-2 text-[13px] font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span>Topics</span>
              {topicsOpen ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
            </button>
          )}

          {(topicsOpen || collapsed) && (
            <div className="flex flex-col gap-0.5">
              {visibleTopics.map(({ slug, label, icon: Icon }) => {
                const isActive = activeTopic === slug;
                return (
                  <Link
                    key={slug}
                    to={`/?topik=${slug}`}
                    title={collapsed ? label : undefined}
                    className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                      collapsed ? "justify-center" : ""
                    } ${
                      isActive
                        ? "bg-brand-soft text-brand font-medium"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon size={17} strokeWidth={2} className="shrink-0" />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => setShowAllTopics((v) => !v)}
                title={collapsed ? (showAllTopics ? "Lihat lebih sedikit" : "Lihat semua topik") : undefined}
                className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors ${
                  collapsed ? "justify-center" : ""
                }`}
              >
                {collapsed ? (
                  <MoreHorizontal size={17} strokeWidth={2} className="shrink-0" />
                ) : (
                  <span>{showAllTopics ? "Lihat lebih sedikit" : "Lihat selengkapnya"}</span>
                )}
              </button>
            </div>
          )}
        </div>

        <hr className="border-t border-gray-200 mx-3" />

        {/* secondary links */}
        <div className="flex flex-col gap-0.5 px-2.5 py-2">
          {SECONDARY_ITEMS.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={label}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                  collapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-brand-soft text-brand font-medium"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                }`
              }
            >
              <Icon size={17} strokeWidth={2} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </div>

        <div className="flex-1" />

        <hr className="border-t border-gray-200 mx-3" />
        <div className={`px-3 py-3 text-[11px] text-gray-400 ${collapsed ? "text-center" : ""}`}>
          {collapsed ? (
            <span title="Twekky © 2026 All rights reserved">© 2026</span>
          ) : (
            <span>Twekky &copy; 2026 All rights reserved</span>
          )}
        </div>
      </aside>
    </div>
  );
}