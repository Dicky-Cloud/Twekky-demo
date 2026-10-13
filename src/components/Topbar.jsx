import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, LogOut, Bell, X, CheckCheck, ChevronDown, UserCircle, Settings, Crown, FileText } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useRealtime } from "../realtime/RealtimeContext";
import UserSearchResults, { USER_SEARCH_MIN } from "./UserSearchResults";
import SettingsModal from "./SettingsModal";
import { isMobileViewport } from "../utils/viewport";
import { useHeaderSlot } from "../context/HeaderSlotContext";
import { NOTIF_ICONS, NOTIF_TITLES, NotifFallbackIcon, notifTimeAgo } from "./NotifMeta";

const NOTIF_PREVIEW = 8; // jumlah notifikasi terbaru di dropdown

// search = { value, onChange, placeholder, users? }
export default function Topbar({ title, search: searchProp }) {
  const { user, logout } = useAuth();
  const { unreadNotifications, refresh } = useNotifications();
  const navigate = useNavigate();
  const slot = useHeaderSlot();
  const location = useLocation();
  const [localQuery, setLocalQuery] = useState("");
  // Pencarian tampil di semua halaman (menu Cari sudah tidak ada di sidebar).
  // Halaman yang mengirim prop `search` (mis. Feed) tetap memakai miliknya;
  // halaman lain memakai pencarian bawaan yang membuka /cari?q=... saat Enter.
  // Di halaman /cari tidak ditampilkan karena halaman itu sudah punya kolom cari sendiri.
  const search =
    searchProp ||
    (location.pathname.startsWith("/cari")
      ? null
      : { value: localQuery, onChange: setLocalQuery, placeholder: "Cari di Twekky..." });
  const [focused, setFocused] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState("");
  const [marking, setMarking] = useState(false);
  const boxRef = useRef(null);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  const initials = user
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate("/login");
  };

  // Muat notifikasi terbaru dari server (dipanggil saat dropdown dibuka / ada notifikasi baru).
  const loadNotifs = useCallback(async () => {
    setNotifLoading(true);
    setNotifError("");
    try {
      const data = await api.listNotifications();
      setNotifs((data || []).slice(0, NOTIF_PREVIEW));
    } catch (err) {
      setNotifError(err.message || "Gagal memuat notifikasi.");
    } finally {
      setNotifLoading(false);
    }
  }, []);

  const toggleNotif = () => {
    const next = !showNotifModal;
    setShowNotifModal(next);
    setShowUserMenu(false);
    if (next) loadNotifs();
  };

  // Desktop: modal Pengaturan langsung terbuka di halaman yang sedang dilihat.
  // HP: Pengaturan adalah halaman sendiri (/pengaturan).
  const openSettings = () => {
    setShowUserMenu(false);
    if (isMobileViewport()) navigate("/pengaturan");
    else setShowSettings(true);
  };

  const toggleUserMenu = () => {
    setShowUserMenu((v) => !v);
    setShowNotifModal(false);
  };

  // Notifikasi baru dari server (real-time): perbarui lencana, dan daftar bila sedang terbuka.
  useRealtime("notification", () => {
    refresh();
    if (showNotifModal) loadNotifs();
  });
  useRealtime("reconnected", () => refresh());

  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      await api.markAllNotificationsRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      refresh();
    } catch (err) {
      setNotifError(err.message || "Gagal menandai dibaca.");
    } finally {
      setMarking(false);
    }
  };

  // Tutup daftar hasil pencarian & dropdown saat klik di luar atau menekan Escape
  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setFocused(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifModal(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setFocused(false);
        setShowNotifModal(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const queryText = (search?.value || "").trim();
  const showUsers =
    !!search && search.users !== false && !!user && focused && queryText.length >= USER_SEARCH_MIN;

  const handlePickUser = (u) => {
    setFocused(false);
    navigate(`/pesan?ke=${encodeURIComponent(u.id)}`);
  };

  const handleOpenProfile = (u) => {
    setFocused(false);
    navigate(`/pengguna/${encodeURIComponent(u.id)}`);
  };

  const goToSearchPage = () => {
    if (!queryText) return;
    setFocused(false);
    navigate(`/cari?q=${encodeURIComponent(queryText)}`);
  };

  const menuItem =
    "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-gray-700 no-underline hover:bg-gray-50 bg-transparent border-none cursor-pointer";

  const bar = (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_auto] content-center items-center gap-x-3 gap-y-2 px-4 md:grid-cols-[1fr_minmax(0,42rem)_1fr] md:gap-4 md:px-7">
      <h1 className="m-0 min-w-0 truncate text-[1.1rem] font-bold">{title}</h1>

      {/* Pencarian di tengah bar, selebar kolom tengah (gaya Reddit) */}
      {search ? (
        <div ref={boxRef} className="relative col-span-2 row-start-2 min-w-0 md:col-span-1 md:row-auto">
          <div className="flex w-full items-center gap-2.5 rounded-full border border-transparent bg-gray-100 px-4 py-2.5 text-gray-500 transition-colors hover:bg-gray-200 focus-within:border-gray-900 focus-within:bg-white focus-within:hover:bg-white">
            <Search size={16} strokeWidth={2} className="shrink-0" />
            <input
              type="text"
              aria-label="Cari"
              placeholder={search.placeholder || "Cari di Twekky..."}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") goToSearchPage();
              }}
              className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-500"
            />
          </div>
          {showUsers && (
            <UserSearchResults
              query={search.value}
              onSelect={handlePickUser}
              onOpenProfile={handleOpenProfile}
              onSeeAll={goToSearchPage}
              className="absolute left-0 right-0 top-full mt-2 z-20"
            />
          )}
        </div>
      ) : (
        <div className="hidden md:block" />
      )}

      <div className="col-start-2 row-start-1 flex items-center justify-end gap-3.5 md:col-auto md:row-auto">
        {user ? (
          <>
            {/* Fitur CV */}
            <Link
              to="/cv"
              title="CV"
              aria-label="CV"
              className="inline-flex cursor-pointer items-center justify-center rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
            >
              <FileText size={18} strokeWidth={2} />
            </Link>

            {/* Notifikasi */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={toggleNotif}
                className="relative cursor-pointer rounded-full border-none bg-transparent p-2 text-gray-500 transition-colors hover:bg-gray-100"
                title="Notifikasi"
                aria-label={unreadNotifications > 0 ? `Notifikasi, ${unreadNotifications} belum dibaca` : "Notifikasi"}
                aria-expanded={showNotifModal}
              >
                <Bell size={18} strokeWidth={2} />
                {/* Lencana hanya muncul bila ada yang belum dibaca */}
                {unreadNotifications > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </button>

              {showNotifModal && (
                <div className="absolute right-0 top-full z-50 mt-3 flex w-80 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl sm:w-96">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <h3 className="m-0 text-sm font-bold text-gray-800">Notifikasi</h3>
                      {unreadNotifications > 0 && (
                        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">
                          {unreadNotifications} baru
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadNotifications > 0 && (
                        <button
                          type="button"
                          className="flex cursor-pointer items-center gap-1 border-none bg-transparent px-2 py-1 text-xs font-semibold text-brand hover:underline disabled:opacity-50"
                          title="Tandai semua dibaca"
                          disabled={marking}
                          onClick={handleMarkAllRead}
                        >
                          <CheckCheck size={14} /> Baca semua
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNotifModal(false)}
                        aria-label="Tutup"
                        className="cursor-pointer rounded-lg border-none bg-transparent p-1 text-gray-400 transition-colors hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[360px] divide-y divide-gray-50 overflow-y-auto">
                    {notifError && <p className="m-0 px-4 py-3 text-xs text-danger">{notifError}</p>}
                    {notifLoading && notifs.length === 0 ? (
                      <p className="m-0 px-4 py-6 text-center text-xs text-gray-500">Memuat notifikasi...</p>
                    ) : notifs.length === 0 && !notifError ? (
                      <p className="m-0 px-4 py-6 text-center text-xs text-gray-500">Belum ada notifikasi.</p>
                    ) : (
                      notifs.map((n) => {
                        const Icon = NOTIF_ICONS[n.type] || NotifFallbackIcon;
                        const body = (
                          <>
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                n.read ? "bg-gray-100 text-gray-600" : "bg-brand-soft text-brand"
                              }`}
                            >
                              <Icon size={15} strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="m-0 text-xs font-semibold text-gray-900">{NOTIF_TITLES[n.type] || "Notifikasi"}</p>
                              <p className={`m-0 text-xs leading-relaxed ${n.read ? "text-gray-500" : "text-gray-700"}`}>{n.text}</p>
                              <span className="mt-1 block text-[10px] text-gray-400">{notifTimeAgo(n.created_at)}</span>
                            </div>
                            {!n.read && <span className="h-2 w-2 shrink-0 self-center rounded-full bg-brand" />}
                          </>
                        );
                        const cls = `flex gap-3 p-3.5 text-left no-underline transition-colors hover:bg-gray-50/80 ${
                          n.read ? "" : "bg-brand-soft/10"
                        }`;
                        return n.link ? (
                          <Link key={n.id} to={n.link} className={cls} onClick={() => setShowNotifModal(false)}>
                            {body}
                          </Link>
                        ) : (
                          <div key={n.id} className={cls}>
                            {body}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-gray-100 bg-gray-50/50 p-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifModal(false);
                        navigate("/notifikasi");
                      }}
                      className="cursor-pointer border-none bg-transparent py-1 text-xs font-semibold text-gray-500 transition-colors hover:text-brand"
                    >
                      Lihat semua riwayat notifikasi
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar + dropdown akun (menggantikan tombol Keluar) */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={toggleUserMenu}
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                title={user.name}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border-none bg-transparent p-0.5 pr-1.5 transition-colors hover:bg-gray-100"
              >
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-[13px] font-bold text-brand">
                  {initials}
                </span>
                <ChevronDown
                  size={14}
                  strokeWidth={2.2}
                  className={`text-gray-500 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                />
              </button>

              {showUserMenu && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
                >
                  <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-3">
                    <p className="m-0 truncate text-sm font-bold text-gray-900">{user.name}</p>
                    {user.email && <p className="m-0 truncate text-xs text-gray-500">{user.email}</p>}
                  </div>
                  <div className="py-1">
                    <Link to="/profil" role="menuitem" className={menuItem} onClick={() => setShowUserMenu(false)}>
                      <UserCircle size={16} /> Profil
                    </Link>
                    <button type="button" role="menuitem" className={menuItem} onClick={openSettings}>
                      <Settings size={16} /> Pengaturan
                    </button>
                    <Link to="/premium" role="menuitem" className={menuItem} onClick={() => setShowUserMenu(false)}>
                      <Crown size={16} className={user.is_pro ? "fill-yellow-400 text-yellow-500" : ""} />
                      <span className="flex-1">{user.is_pro ? "Kelola Pro" : "Premium"}</span>
                      {user.is_pro && (
                        <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand">Pro</span>
                      )}
                    </Link>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button type="button" role="menuitem" className={`${menuItem} text-danger`} onClick={handleLogout}>
                      <LogOut size={16} /> Keluar
                    </button>
                  </div>
                </div>
              )}

              {showSettings &&
                createPortal(<SettingsModal onClose={() => setShowSettings(false)} />, document.body)}
            </div>
          </>
        ) : (
          <button className="btn btn-accent btn-sm" onClick={() => navigate("/login")}>
            Masuk
          </button>
        )}
      </div>
    </div>
  );

  // Dirender ke bar navigasi global di AppShell (bukan di dalam halaman).
  return slot ? createPortal(bar, slot) : null;
}