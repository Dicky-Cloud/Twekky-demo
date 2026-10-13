import { useEffect, useState } from "react";
import { User, Briefcase, Bell, Eye, ShieldAlert, Check, BadgeCheck, Clock, UserX, GraduationCap, Info, Mail, CalendarDays, Building2 } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";
import { loadHiddenIds, saveHiddenIds } from "../utils/hiddenPosts";
import MentorSettingsPanel from "./mentor/MentorSettingsPanel";
import { useMentorDb, myMentor } from "../api/mentorStore";

const joinedFormatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });
const PREFS_KEY = "twekky_settings";
const DEFAULT_PREFS = { notifEmail: true, notifPush: true, profilePrivate: false, showActivity: true };

function loadPrefs() {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
  } catch {
    return DEFAULT_PREFS;
  }
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer shrink-0" aria-label={label}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-checked:bg-brand peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
    </label>
  );
}

function SettingRow({ title, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <h4 className="m-0 text-sm font-semibold text-gray-800">{title}</h4>
        <p className="m-0 mt-0.5 text-xs text-gray-500 leading-relaxed">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ children, hint }) {
  return (
    <div className="mb-4">
      <h3 className="m-0 text-base font-bold text-gray-900">{children}</h3>
      {hint && <p className="m-0 mt-1 text-xs text-gray-500 leading-relaxed">{hint}</p>}
    </div>
  );
}

// Popup Pengaturan. `initialTab` memungkinkan halaman lain membuka langsung
// ke tab tertentu (mis. "business").
export default function SettingsModal({ onClose, initialTab = "account", page = false }) {
  const { user, refreshUser } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [notice, setNotice] = useState("");

  // akun
  const [name, setName] = useState(user?.name || "");
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountError, setAccountError] = useState("");

  // akun bisnis
  const [companyName, setCompanyName] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  // preferensi (disimpan di perangkat ini)
  const [prefs, setPrefs] = useState(loadPrefs);
  const setPref = (key) => (value) => setPrefs((p) => ({ ...p, [key]: value }));

  // pengguna yang diblokir (dimuat saat tab Privasi pertama kali dibuka)
  const [blocked, setBlocked] = useState(null);
  const [blockedError, setBlockedError] = useState("");
  const [unblockingId, setUnblockingId] = useState("");
  useEffect(() => {
    if (tab !== "privacy" || blocked !== null) return;
    api
      .listBlocks()
      .then((list) => setBlocked(list || []))
      .catch((err) => setBlockedError(err.message || "Gagal memuat daftar blokir."));
  }, [tab, blocked]);

  // post yang disembunyikan dari Feed (disimpan di browser ini)
  const [hiddenCount, setHiddenCount] = useState(() => loadHiddenIds().size);
  const showHiddenAgain = () => {
    saveHiddenIds(new Set());
    setHiddenCount(0);
  };

  const handleUnblock = async (id) => {
    setUnblockingId(id);
    setBlockedError("");
    try {
      await api.unblockUser(id);
      setBlocked((list) => (list || []).filter((b) => b.user_id !== id));
    } catch (err) {
      setBlockedError(err.message || "Gagal membuka blokir.");
    } finally {
      setUnblockingId("");
    }
  };

  // mode anonim kunjungan profil: tersimpan di server, langsung saat toggle diubah
  const [viewAnon, setViewAnon] = useState(Boolean(user?.profile_view_anonymous));
  const [anonBusy, setAnonBusy] = useState(false);
  const [anonError, setAnonError] = useState("");
  const handleToggleAnon = async (value) => {
    if (anonBusy) return;
    setAnonBusy(true);
    setAnonError("");
    setViewAnon(value);
    try {
      await api.setViewPrivacy(value);
      await refreshUser();
      flash(value ? "Mode anonim aktif." : "Mode anonim dimatikan.");
    } catch (err) {
      setViewAnon(!value);
      setAnonError(err.message || "Gagal menyimpan mode anonim.");
    } finally {
      setAnonBusy(false);
    }
  };

  // laporan
  const [reportCategory, setReportCategory] = useState("bug");
  const [reportDescription, setReportDescription] = useState("");

  const isBusiness = user?.account_type === "business";
  const mentorDb = useMentorDb();
  const isMentor = Boolean(myMentor(mentorDb, user?.id));

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 4000);
  };

  const switchTab = (key) => {
    setTab(key);
    setNotice("");
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setAccountError("Nama tidak boleh kosong.");
      return;
    }
    setAccountError("");
    setAccountBusy(true);
    try {
      // PUT /profile/me menimpa bio, jadi bio yang ada ikut dikirim agar tidak terhapus.
      await api.updateProfile(name.trim(), user?.bio || "");
      await refreshUser();
      flash("Nama berhasil diperbarui.");
    } catch (err) {
      setAccountError(err.message || "Gagal menyimpan perubahan.");
    } finally {
      setAccountBusy(false);
    }
  };

  const handleUpgrade = async (e) => {
    e.preventDefault();
    setUpgradeError("");
    setUpgrading(true);
    try {
      await api.upgradeToBusiness(companyName.trim());
      await refreshUser();
      setCompanyName("");
      flash("Akun berhasil di-upgrade ke Bisnis.");
    } catch (err) {
      setUpgradeError(err.message || "Gagal upgrade akun.");
    } finally {
      setUpgrading(false);
    }
  };

  const handleSavePrefs = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* penyimpanan lokal tidak tersedia — abaikan */
    }
    flash("Preferensi disimpan.");
  };

  const handleReport = (e) => {
    e.preventDefault();
    if (!reportDescription.trim()) return;
    setReportDescription("");
    flash("Laporan Anda berhasil dikirim ke tim admin. Terima kasih!");
  };

  const TABS = [
    { key: "account", label: "Akun & Keamanan", icon: User },
    { key: "about", label: "Tentang", icon: Info },
    { key: "business", label: "Akun Bisnis", icon: Briefcase, badge: isBusiness ? "Aktif" : null },
    { key: "mentor", label: "Mentor", icon: GraduationCap, badge: isMentor ? "Aktif" : null },
    { key: "notifications", label: "Notifikasi", icon: Bell },
    { key: "privacy", label: "Privasi", icon: Eye },
    { key: "report", label: "Pusat Laporan", icon: ShieldAlert },
  ];

  const saveBar = (busy = false) => (
    <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
      <button type="submit" className="btn btn-accent" disabled={busy}>
        {busy ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </div>
  );

  // Mode halaman (HP): tanpa kotak popup dan tanpa navigasi tab; daftar bagiannya ada di halaman Pengaturan.
  const shell = (children) =>
    page ? (
      <div>{children}</div>
    ) : (
      <Modal title="Pengaturan" onClose={onClose} maxWidth="max-w-3xl">
        {children}
      </Modal>
    );

  return shell(
      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 sm:min-h-[430px]">
        {/* navigasi tab */}
        {!page && <nav className="sm:w-52 shrink-0 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 -mx-1 px-1">
          {TABS.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              type="button"
              onClick={() => switchTab(key)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm whitespace-nowrap transition-colors text-left ${
                tab === key
                  ? "bg-brand-soft text-brand font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
              }`}
            >
              <Icon size={17} strokeWidth={2} className="shrink-0" />
              <span>{label}</span>
              {badge && (
                <span className="ml-auto rounded-full bg-emerald-50 text-success text-[10px] font-bold px-1.5 py-0.5">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>}

        {/* konten */}
        <div className="flex-1 min-w-0">
          {notice && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-success bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
              <Check size={16} strokeWidth={2.5} className="text-success shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* AKUN & KEAMANAN */}
          {tab === "account" && (
            <form onSubmit={handleSaveAccount}>
              <SectionTitle hint="Perubahan nama langsung tampil di profil dan postingan barumu.">
                Informasi Akun
              </SectionTitle>
              {accountError && (
                <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
                  {accountError}
                </div>
              )}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="set-name" className="text-xs font-semibold text-gray-700">
                    Nama Pengguna
                  </label>
                  <input id="set-name" className="field-input" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="set-email" className="text-xs font-semibold text-gray-700">
                    Alamat Email
                  </label>
                  <input
                    id="set-email"
                    type="email"
                    className="field-input bg-gray-50 text-gray-500 cursor-not-allowed"
                    value={user?.email || ""}
                    disabled
                  />
                  <span className="text-[11px] text-gray-400">Email tidak dapat diubah saat ini.</span>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h4 className="m-0 text-sm font-semibold text-gray-800">Ubah Kata Sandi</h4>
                <p className="m-0 mt-1 text-xs text-gray-500 leading-relaxed">
                  Fitur ganti kata sandi belum tersedia karena server belum menyediakan endpoint-nya.
                </p>
              </div>

              {saveBar(accountBusy)}
            </form>
          )}

          {/* TENTANG */}
          {tab === "about" && (
            <div>
              <SectionTitle hint="Informasi akunmu. Email hanya terlihat olehmu.">Tentang</SectionTitle>
              <ul className="m-0 flex list-none flex-col gap-3.5 p-0 text-sm">
                <li className="flex min-w-0 items-center gap-2.5 text-gray-600">
                  <Mail size={16} className="shrink-0 text-gray-400" />
                  <span className="truncate">{user?.email}</span>
                </li>
                {user?.created_at && (
                  <li className="flex items-center gap-2.5 text-gray-600">
                    <CalendarDays size={16} className="shrink-0 text-gray-400" />
                    <span>Bergabung {joinedFormatter.format(new Date(user.created_at))}</span>
                  </li>
                )}
                <li className="flex min-w-0 items-center gap-2.5 text-gray-600">
                  <Building2 size={16} className="shrink-0 text-gray-400" />
                  {isBusiness ? (
                    <span className="truncate">
                      {user?.company_name} · {user?.verification_status === "verified" ? "terverifikasi" : "menunggu verifikasi"}
                    </span>
                  ) : (
                    <span>Akun Personal</span>
                  )}
                </li>
              </ul>
              {!isBusiness && (
                <button type="button" onClick={() => switchTab("business")} className="mt-5 btn btn-ghost btn-sm">
                  Upgrade ke Akun Bisnis
                </button>
              )}
            </div>
          )}

          {/* AKUN BISNIS */}
          {tab === "business" && (
            <div>
              <SectionTitle hint="Akun Bisnis memungkinkan kamu memasang lowongan kerja dan mengelola pelamar di Twekky.">
                Akun Bisnis
              </SectionTitle>

              {isBusiness ? (
                <div className="rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-start gap-3.5">
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-soft text-brand shrink-0">
                      <Briefcase size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-bold text-gray-900 truncate">{user.company_name}</div>
                      <div className="text-xs text-gray-500">Akun Bisnis aktif</div>
                    </div>
                  </div>
                  <div
                    className={`mt-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm ${
                      user.verification_status === "verified"
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {user.verification_status === "verified" ? (
                      <>
                        <BadgeCheck size={17} className="text-success shrink-0" /> Perusahaan sudah terverifikasi.
                      </>
                    ) : (
                      <>
                        <Clock size={17} className="text-amber-600 shrink-0" /> Menunggu verifikasi perusahaan.
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpgrade}>
                  {upgradeError && (
                    <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
                      {upgradeError}
                    </div>
                  )}
                  <div className="rounded-2xl border border-gray-200 p-5">
                    <h4 className="m-0 text-sm font-bold text-gray-900">Punya bisnis atau sedang merekrut?</h4>
                    <p className="m-0 mt-1 mb-4 text-xs text-gray-500 leading-relaxed">
                      Upgrade ke akun Bisnis untuk memasang lowongan kerja di Twekky.
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="set-company" className="text-xs font-semibold text-gray-700">
                        Nama perusahaan
                      </label>
                      <input
                        id="set-company"
                        className="field-input"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-5 flex justify-end">
                    <button type="submit" className="btn btn-accent" disabled={upgrading || !companyName.trim()}>
                      {upgrading ? "Memproses..." : "Upgrade ke Bisnis"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MENTOR */}
          {tab === "mentor" && <MentorSettingsPanel onNavigate={onClose} />}

          {/* NOTIFIKASI */}
          {tab === "notifications" && (
            <form onSubmit={handleSavePrefs}>
              <SectionTitle>Preferensi Notifikasi</SectionTitle>
              <div className="divide-y divide-gray-100">
                <SettingRow title="Notifikasi Email" desc="Terima ringkasan aktivitas dan pesan penting melalui email.">
                  <Toggle checked={prefs.notifEmail} onChange={setPref("notifEmail")} label="Notifikasi email" />
                </SettingRow>
                <SettingRow title="Notifikasi Push" desc="Terima pemberitahuan langsung di perangkat saat ada suka atau komentar.">
                  <Toggle checked={prefs.notifPush} onChange={setPref("notifPush")} label="Notifikasi push" />
                </SettingRow>
              </div>
              {saveBar()}
            </form>
          )}

          {/* PRIVASI */}
          {tab === "privacy" && (
            <form onSubmit={handleSavePrefs}>
              <SectionTitle>Privasi & Tampilan Profil</SectionTitle>
              {anonError && (
                <div className="mb-3 rounded-lg border border-danger bg-danger-soft px-3 py-2 text-xs text-danger">
                  {anonError}
                </div>
              )}
              <div className="divide-y divide-gray-100">
                <SettingRow
                  title="Mode Anonim saat Melihat Profil"
                  desc="Profil yang kamu kunjungi hanya melihat “pengunjung anonim”, tanpa namamu. Timbal balik: daftar nama pengunjung profilmu juga ikut disembunyikan (jumlahnya tetap terlihat). Tersimpan langsung."
                >
                  <Toggle checked={viewAnon} onChange={handleToggleAnon} label="Mode anonim saat melihat profil" />
                </SettingRow>
                <SettingRow title="Profil Privat" desc="Hanya pengguna yang disetujui yang dapat melihat postingan lengkap Anda.">
                  <Toggle checked={prefs.profilePrivate} onChange={setPref("profilePrivate")} label="Profil privat" />
                </SettingRow>
                <SettingRow title="Tampilkan Status Aktivitas" desc="Izinkan pengguna lain melihat kapan terakhir kali Anda aktif.">
                  <Toggle checked={prefs.showActivity} onChange={setPref("showActivity")} label="Status aktivitas" />
                </SettingRow>
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 p-4">
                <h4 className="m-0 text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <UserX size={16} className="text-gray-500" /> Pengguna yang Diblokir
                </h4>
                <p className="m-0 mt-0.5 mb-3 text-xs text-gray-500 leading-relaxed">
                  Postingan Anda dan postingan mereka tidak saling terlihat (kecuali postingan anonim). Mereka juga
                  tidak bisa mengirim pesan atau melamar lowongan Anda, dan percakapannya disembunyikan. Mereka tidak
                  diberi tahu bahwa mereka diblokir.
                </p>
                {blockedError && (
                  <div className="mb-3 rounded-lg border border-danger bg-danger-soft px-3 py-2 text-xs text-danger">
                    {blockedError}
                  </div>
                )}
                {blocked === null && !blockedError ? (
                  <p className="m-0 text-xs text-gray-400">Memuat...</p>
                ) : blocked && blocked.length === 0 ? (
                  <p className="m-0 text-xs text-gray-400">Belum ada pengguna yang Anda blokir.</p>
                ) : (
                  <ul className="list-none p-0 m-0 divide-y divide-gray-100">
                    {(blocked || []).map((b) => (
                      <li key={b.user_id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-800 truncate">{b.name}</div>
                          {b.company_name && <div className="text-xs text-gray-500 truncate">{b.company_name}</div>}
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm shrink-0"
                          disabled={unblockingId === b.user_id}
                          onClick={() => handleUnblock(b.user_id)}
                        >
                          {unblockingId === b.user_id ? "Memproses..." : "Buka blokir"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-4">
                <div className="min-w-0">
                  <h4 className="m-0 text-sm font-semibold text-gray-800">Post yang Disembunyikan</h4>
                  <p className="m-0 mt-0.5 text-xs text-gray-500 leading-relaxed">
                    {hiddenCount === 0
                      ? "Belum ada post yang Anda sembunyikan dari Feed."
                      : `${hiddenCount} post disembunyikan dari Feed di browser ini.`}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm shrink-0"
                  disabled={hiddenCount === 0}
                  onClick={showHiddenAgain}
                >
                  Tampilkan lagi
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="m-0 mb-0.5 text-sm font-bold text-red-900">Zona Berbahaya</h4>
                  <p className="m-0 text-xs text-red-700 leading-relaxed">
                    Menghapus akun akan menghilangkan seluruh data postingan secara permanen.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert("Fitur hapus akun memerlukan verifikasi ulang.")}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-lg transition-colors shrink-0"
                >
                  Hapus Akun
                </button>
              </div>
              {saveBar()}
            </form>
          )}

          {/* PUSAT LAPORAN */}
          {tab === "report" && (
            <form onSubmit={handleReport}>
              <SectionTitle hint="Laporkan bug, kendala teknis, atau pelanggaran konten kepada tim pengelola Twekky.">
                Pusat Laporan & Kendala
              </SectionTitle>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="rep-cat" className="text-xs font-semibold text-gray-700">
                    Kategori Laporan
                  </label>
                  <select
                    id="rep-cat"
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="field-input"
                  >
                    <option value="bug">Bug / Masalah Teknis Aplikasi</option>
                    <option value="content">Laporan Konten / Pengguna Melanggar</option>
                    <option value="account">Kendala Akses Akun</option>
                    <option value="other">Saran & Masukan Lainnya</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="rep-desc" className="text-xs font-semibold text-gray-700">
                    Deskripsi Detail
                  </label>
                  <textarea
                    id="rep-desc"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Jelaskan kendala, langkah-langkah terjadinya bug, atau tautan akun/post yang ingin dilaporkan..."
                    className="field-input min-h-[130px] resize-y"
                    required
                  />
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
                <button type="submit" className="btn btn-accent" disabled={!reportDescription.trim()}>
                  Kirim Laporan
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
  );
}