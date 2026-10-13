import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Settings,
  Pencil,
  CalendarDays,
  Building2,
  BadgeCheck,
  FileText,
  Briefcase,
  Eye,
  Bookmark,
  Repeat2,
  Library,
  Trash2,
  PenLine,
} from "lucide-react";
import { api, profileImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { usePro } from "../context/ProContext";
import { usePostInteractions } from "../context/PostInteractionContext";
import { useMentorDb, myMentor } from "../api/mentorStore";
import { useCareer, careerProgress } from "../api/careerStore";
import CareerTab from "../components/career/CareerTab";
import ProfileViewsTab from "../components/profile/ProfileViewsTab";
import Topbar from "../components/Topbar";
import CommentModal from "../components/CommentModal";
import EditProfileModal from "../components/EditProfileModal";
import SettingsModal from "../components/SettingsModal";
import { isMobileViewport } from "../utils/viewport";
import { settingsPath } from "../constants/settingsRoutes";
import FollowListModal from "../components/profile/FollowListModal";
import ProfilePostCard from "../components/profile/ProfilePostCard";

const joinedFormatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });

function initialsOf(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="bg-white px-6 py-12 text-center sm:rounded-2xl sm:border sm:border-dashed sm:border-gray-200">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon size={22} strokeWidth={2} />
      </div>
      <h3 className="m-0 text-sm font-bold text-gray-900">{title}</h3>
      <p className="m-0 mt-1 text-sm text-gray-500">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Isi tab Koleksi: daftar post dari server (disimpan, dibagikan, di-repost).
// undo = aksi "hapus" dari daftar (batal simpan / batal bagikan / batal repost).
const KOLEKSI = [
  { id: "saved", label: "Disimpan", icon: Bookmark, undo: api.unsavePost },
  { id: "reposted", label: "Repost", icon: Repeat2, undo: api.unrepostPost },
];

const RANGES = [
  { v: "all", label: "Semua waktu" },
  { v: "7", label: "7 hari terakhir" },
  { v: "30", label: "30 hari terakhir" },
  { v: "365", label: "1 tahun terakhir" },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { openSubscription } = usePro();
  const mentorProfile = myMentor(useMentorDb(), user?.id);
  const [career] = useCareer(user?.id);
  const careerP = careerProgress(career);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("posts");
  const [editOpen, setEditOpen] = useState(false);
  // null = tertutup; objek = terbuka di tab tertentu. Rute lama /pengaturan
  // mengarah ke sini lewat ?pengaturan=1 (atau =bisnis untuk tab Akun Bisnis).
  const [settings, setSettings] = useState(() => {
    const p = searchParams.get("pengaturan");
    // di HP, pengaturan dibuka sebagai halaman (lihat efek di bawah), bukan popup
    if (!p || isMobileViewport()) return null;
    return { tab: p === "bisnis" ? "business" : p === "mentor" ? "mentor" : "account" };
  });

  // HP: pengaturan jadi halaman sendiri; desktop: popup seperti sebelumnya.
  const openSettings = (tab = "account") => {
    if (isMobileViewport()) navigate(tab === "account" ? "/pengaturan" : settingsPath(tab));
    else setSettings({ tab });
  };

  const [myPosts, setMyPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [openCommentsForPostId, setOpenCommentsForPostId] = useState(null);

  // bersihkan ?pengaturan dari URL setelah dibaca
  useEffect(() => {
    const p = searchParams.get("pengaturan");
    if (p !== null) {
      // tautan lama /profil?pengaturan=... (Topbar, Premium, Mentor, dll) terbuka sebagai halaman di HP
      if (isMobileViewport()) {
        navigate(p === "bisnis" ? settingsPath("business") : p === "mentor" ? settingsPath("mentor") : "/pengaturan", {
          replace: true,
        });
        return;
      }
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPosts = async (uid) => {
    setPostsLoading(true);
    setPostsError("");
    try {
      const data = await api.listFeed();
      setMyPosts((data || []).filter((p) => p.author_id === uid));
    } catch (err) {
      setPostsError(err.message || "Gagal memuat postingan.");
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) loadPosts(user.id);
  }, [user?.id]);

  // siapa yang melihat profilmu (dimuat ulang saat status Pro / mode anonim berubah)
  const [views, setViews] = useState(null);
  const [viewsLoading, setViewsLoading] = useState(true);
  const [viewsError, setViewsError] = useState("");
  const loadViews = async () => {
    setViewsLoading(true);
    setViewsError("");
    try {
      setViews(await api.profileViews());
    } catch (err) {
      setViewsError(err.message || "Gagal memuat pengunjung profil.");
    } finally {
      setViewsLoading(false);
    }
  };
  useEffect(() => {
    if (user?.id) loadViews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.is_pro, user?.profile_view_anonymous]);

  // daftar post tiap tab (disimpan / dibagikan / repost), dimuat saat tab dibuka
  const [listState, setListState] = useState({}); // { [tabId]: { loading, error, items } }
  const loadTabList = async (tabId) => {
    const fetchers = { saved: api.savedPosts, reposted: api.repostedPosts };
    setListState((st) => ({ ...st, [tabId]: { loading: true, error: "", items: st[tabId]?.items || [] } }));
    try {
      const items = await fetchers[tabId]();
      setListState((st) => ({ ...st, [tabId]: { loading: false, error: "", items: items || [] } }));
    } catch (err) {
      setListState((st) => ({ ...st, [tabId]: { loading: false, error: err.message || "Gagal memuat.", items: [] } }));
    }
  };

  // tab Koleksi: sub-tab, filter waktu, pilihan, dan hapus massal
  const [koleksiTab, setKoleksiTab] = useState("saved");
  const [range, setRange] = useState("all");
  const [selected, setSelected] = useState(() => new Set());
  const [deleting, setDeleting] = useState(false);

  const koleksiItems = (listState[koleksiTab]?.items || []).filter((p) => {
    if (range === "all") return true;
    return Date.now() - new Date(p.created_at).getTime() <= Number(range) * 86400000;
  });
  const allSelected = koleksiItems.length > 0 && koleksiItems.every((p) => selected.has(p.id));

  const toggleOne = (id) =>
    setSelected((st) => {
      const n = new Set(st);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(koleksiItems.map((p) => p.id)));

  const deleteSelected = async () => {
    if (selected.size === 0 || deleting) return;
    const cur = KOLEKSI.find((k) => k.id === koleksiTab);
    if (!window.confirm(`Hapus ${selected.size} postingan dari ${cur.label.toLowerCase()}?`)) return;
    setDeleting(true);
    await Promise.allSettled([...selected].map((id) => cur.undo(id)));
    setSelected(new Set());
    setDeleting(false);
    loadTabList(koleksiTab);
  };

  // hapus postingan milik sendiri (tab Postingan); komentar, suka, dan simpanannya dibersihkan server
  const inter = usePostInteractions();
  const [deletingPostId, setDeletingPostId] = useState("");
  const handleDeletePost = async (id) => {
    if (deletingPostId) return;
    if (!window.confirm("Hapus postingan ini? Komentar, suka, dan simpanannya ikut terhapus dan tidak bisa dikembalikan.")) {
      return;
    }
    setDeletingPostId(id);
    try {
      await api.deletePost(id);
      setMyPosts((list) => list.filter((p) => p.id !== id));
      // hilangkan juga dari daftar Disimpan/Dibagikan/Repost yang sudah dimuat
      setListState((st) =>
        Object.fromEntries(
          Object.entries(st).map(([k, v]) => [k, { ...v, items: (v.items || []).filter((p) => p.id !== id) }])
        )
      );
      setSelected((st) => {
        if (!st.has(id)) return st;
        const n = new Set(st);
        n.delete(id);
        return n;
      });
      inter?.forget?.(id);
    } catch (err) {
      window.alert(err.message || "Gagal menghapus postingan.");
    } finally {
      setDeletingPostId("");
    }
  };

  // pengikut & yang diikuti (berisi id); daftar lengkapnya tampil di modal
  const [follow, setFollow] = useState({ followers: [], following: [] });
  const [followModal, setFollowModal] = useState(null); // null | "followers" | "following"
  useEffect(() => {
    if (!user?.id) return;
    api
      .followStats(user.id)
      .then((st) => setFollow({ followers: st.followers || [], following: st.following || [] }))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === "koleksi") loadTabList(koleksiTab);
    setSelected(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, koleksiTab]);

  if (!user) return null;

  const isBusiness = user.account_type === "business";
  const joinedLabel = user.created_at ? joinedFormatter.format(new Date(user.created_at)) : null;
  const avatarSrc = profileImageUrl(user.avatar);
  const bannerSrc = profileImageUrl(user.banner);

  const TABS = [
    { id: "posts", label: "Postingan", icon: FileText },
    { id: "career", label: "Karier", icon: Briefcase, dot: !careerP.complete },
    { id: "views", label: "Pengunjung", icon: Eye },
    { id: "koleksi", label: "Koleksi", icon: Library },
  ];

  return (
    <div className="min-h-screen pb-12">
      <Topbar title="Profil" />

      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ===== KARTU HEADER PROFIL ===== */}
        <section className="-mx-4 overflow-hidden bg-white sm:mx-0 sm:rounded-t-2xl sm:border sm:border-b-0 sm:border-gray-200 sm:shadow-sm">
          {/* cover */}
          <div className="relative h-36 sm:h-48 bg-gradient-to-br from-brand via-[#3a3a3a] to-[#6b6b6b] overflow-hidden">
            {bannerSrc ? (
              <img src={bannerSrc} alt="Banner profil" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <>
                <div className="absolute -top-20 -right-12 h-64 w-64 rounded-full bg-white/10" />
                <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-white/10" />
                <div className="absolute top-8 left-10 h-16 w-16 rounded-full bg-white/10" />
              </>
            )}
          </div>

          <div className="px-5 sm:px-8 pb-6">
            {/* avatar + tombol aksi */}
            <div className="flex items-end justify-between gap-3 -mt-12 sm:-mt-16">
              <div className="relative shrink-0">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={user.name}
                    className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover ring-4 ring-white shadow-md"
                  />
                ) : (
                  <div className="flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-gradient-to-br from-brand to-[#6b6b6b] text-white text-3xl sm:text-4xl font-bold ring-4 ring-white shadow-md">
                    {initialsOf(user.name)}
                  </div>
                )}
                <span className="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              <div className="flex items-center gap-2 pb-1">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => openSettings("account")}
                  title="Pengaturan"
                >
                  <Settings size={15} strokeWidth={2} />
                  <span className="hidden sm:inline">Pengaturan</span>
                </button>
                <button type="button" className="btn btn-accent btn-sm" onClick={() => setEditOpen(true)}>
                  <Pencil size={14} strokeWidth={2} />
                  Edit Profil
                </button>
              </div>
            </div>

            {/* identitas */}
            <div className="mt-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="m-0 text-2xl font-bold text-gray-900 break-words">{user.name}</h1>
                {user.verification_status === "verified" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-success text-success text-[11px] font-bold px-2.5 py-0.5">
                    <BadgeCheck size={12} /> Terverifikasi
                  </span>
                )}
                {user.is_pro && (
                  <button
                    type="button"
                    onClick={() => openSubscription({ tab: "pro" })}
                    className="rounded-full bg-brand text-white text-[11px] font-bold px-2.5 py-0.5"
                    title="Kelola langganan"
                  >
                    Pro
                  </button>
                )}
                {mentorProfile && (
                  <Link
                    to="/mentor/dashboard"
                    title="Buka Dashboard Mentor"
                    className="rounded-full bg-emerald-50 text-success text-[11px] font-bold px-2.5 py-0.5 no-underline"
                  >
                    Mentor
                  </Link>
                )}
                {isBusiness && (
                  <span className="rounded-md bg-brand-soft text-brand text-[11px] font-semibold px-2.5 py-0.5">
                    Bisnis
                  </span>
                )}
                {/* postingan, pengikut & mengikuti di sebelah nama (gaya TikTok/Instagram); klik membuka modal */}
                <div className="flex items-center gap-4 text-sm sm:ml-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("posts")}
                    className="cursor-pointer border-none bg-transparent p-0 text-gray-500 hover:text-gray-900"
                  >
                    <b className="text-gray-900">{myPosts.length}</b> Postingan
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowModal("followers")}
                    className="cursor-pointer border-none bg-transparent p-0 text-gray-500 hover:text-gray-900"
                  >
                    <b className="text-gray-900">{follow.followers.length}</b> Pengikut
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowModal("following")}
                    className="cursor-pointer border-none bg-transparent p-0 text-gray-500 hover:text-gray-900"
                  >
                    <b className="text-gray-900">{follow.following.length}</b> Mengikuti
                  </button>
                </div>
              </div>

              {(career.headline.trim() || career.city.trim()) && (
                <p className="m-0 mt-1 text-sm text-gray-700">
                  {[career.headline.trim(), career.city.trim()].filter(Boolean).join(" · ")}
                </p>
              )}

              <div className="mt-1.5 flex items-center gap-x-4 gap-y-1 flex-wrap text-[13px] text-gray-500">
                {isBusiness && user.company_name && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={14} /> {user.company_name}
                  </span>
                )}
                {joinedLabel && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={14} /> Bergabung {joinedLabel}
                  </span>
                )}
              </div>

              {user.bio?.trim() ? (
                <p className="m-0 mt-3 max-w-2xl text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {user.bio}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand transition-colors bg-transparent border-none p-0 cursor-pointer"
                >
                  <PenLine size={14} /> Tambahkan bio untuk memperkenalkan dirimu
                </button>
              )}
            </div>
          </div>

        </section>

        {/* tab: menempel tepat di bawah topbar (h-16) saat halaman di-scroll, seperti media sosial */}
        <div
          className="sticky top-[6.5rem] z-20 mb-6 -mx-4 md:top-16 flex justify-around overflow-x-auto border-b border-gray-200 bg-white px-3 sm:mx-0 sm:rounded-b-2xl sm:border sm:border-t-gray-100 sm:px-6 sm:shadow-sm"
          role="tablist"
        >
            {TABS.map(({ id, label, icon: Icon, dot }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                aria-label={label}
                title={label}
                onClick={() => setActiveTab(id)}
                className={`relative flex flex-1 items-center justify-center border-b-2 px-3.5 py-3.5 transition-colors ${
                  activeTab === id
                    ? "border-brand text-brand"
                    : "border-transparent text-gray-400 hover:text-gray-800"
                }`}
              >
                <Icon size={22} strokeWidth={activeTab === id ? 2.4 : 2} />
                {dot && (
                  <span
                    className="absolute right-[calc(50%-18px)] top-2.5 h-2 w-2 rounded-full bg-brand ring-2 ring-white"
                    aria-label="Belum lengkap"
                  />
                )}
              </button>
            ))}
        </div>

        {/* ===== KONTEN ===== */}
        <div>
          <div className="min-w-0">
            {/* KARIER */}
            {activeTab === "career" && (
              <div className="mx-auto max-w-3xl">
                <CareerTab />
              </div>
            )}

            {/* PENGUNJUNG */}
            {activeTab === "views" && (
              <div className="mx-auto max-w-3xl">
              <ProfileViewsTab
                data={views}
                loading={viewsLoading}
                error={viewsError}
                onReload={loadViews}
                onOpenPrivacy={() => openSettings("privacy")}
              />
              </div>
            )}

            {/* POSTINGAN */}
            {activeTab === "posts" && (
              <div>
                {postsError && (
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
                    <span>{postsError}</span>
                    <button
                      type="button"
                      className="font-semibold underline bg-transparent border-none p-0 cursor-pointer text-danger"
                      onClick={() => loadPosts(user.id)}
                    >
                      Coba lagi
                    </button>
                  </div>
                )}

                {postsLoading ? (
                  <p className="text-sm text-gray-500">Memuat postingan...</p>
                ) : myPosts.length === 0 && !postsError ? (
                  <EmptyState
                    icon={FileText}
                    title="Belum ada postingan"
                    text="Kamu belum menulis post apa pun. Mulai percakapan pertamamu!"
                  />
                ) : (
                  // HP: grid 3 kolom tanpa card, dipisah garis tipis (gap-px di atas bg-gray-200).
                  // sm ke atas: kembali ke grid kartu seperti sebelumnya.
                  <div className="-mx-4 grid grid-cols-3 gap-px bg-gray-200 sm:mx-0 sm:grid-cols-2 sm:gap-4 sm:bg-transparent lg:grid-cols-3">
                    {myPosts.map((post) => (
                      <ProfilePostCard
                        key={post.id}
                        post={post}
                        onOpen={setOpenCommentsForPostId}
                        onDelete={handleDeletePost}
                        deleting={deletingPostId === post.id}
                        mobileTile
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* KOLEKSI: disimpan / repost */}
            {activeTab === "koleksi" && (
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {KOLEKSI.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setKoleksiTab(id)}
                      title={label}
                      aria-label={label}
                      aria-pressed={koleksiTab === id}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${
                        koleksiTab === id
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-gray-200 bg-white text-gray-600 hover:border-brand/40"
                      }`}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-gray-100 bg-white py-2.5 sm:rounded-xl sm:border sm:border-gray-200 sm:px-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={koleksiItems.length === 0}
                      className="h-4 w-4 cursor-pointer"
                    />
                    Pilih semua
                  </label>

                  {selected.size > 0 && (
                    <button
                      type="button"
                      onClick={deleteSelected}
                      disabled={deleting}
                      title={`Hapus ${selected.size} postingan terpilih`}
                      aria-label={`Hapus ${selected.size} postingan terpilih`}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-danger bg-danger-soft px-3 py-1.5 text-sm font-semibold text-danger disabled:opacity-60"
                    >
                      <Trash2 size={14} /> {selected.size}
                    </button>
                  )}

                  <select
                    value={range}
                    onChange={(e) => {
                      setRange(e.target.value);
                      setSelected(new Set());
                    }}
                    className="field-input ml-auto w-auto py-1.5 text-sm"
                  >
                    {RANGES.map((r) => (
                      <option key={r.v} value={r.v}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {listState[koleksiTab]?.loading ? (
                  <p className="text-sm text-gray-500">Memuat...</p>
                ) : listState[koleksiTab]?.error ? (
                  <p className="text-sm text-danger">{listState[koleksiTab].error}</p>
                ) : koleksiItems.length === 0 ? (
                  <EmptyState
                    icon={KOLEKSI.find((k) => k.id === koleksiTab).icon}
                    title="Tidak ada postingan"
                    text="Belum ada postingan di kategori atau rentang waktu ini."
                  />
                ) : (
                  // HP: grid 3 kolom tanpa card, sama seperti tab Postingan
                  <div className="-mx-4 grid grid-cols-3 gap-px bg-gray-200 sm:mx-0 sm:grid-cols-2 sm:gap-4 sm:bg-transparent lg:grid-cols-3">
                    {koleksiItems.map((post) => (
                      <ProfilePostCard
                        key={post.id}
                        post={post}
                        onOpen={setOpenCommentsForPostId}
                        selectable
                        selected={selected.has(post.id)}
                        onToggle={toggleOne}
                        mobileTile
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== MODAL ===== */}
      {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} />}
      {settings && <SettingsModal initialTab={settings.tab} onClose={() => setSettings(null)} />}
      {followModal && (
        <FollowListModal
          key={followModal}
          type={followModal}
          ids={follow[followModal]}
          canUnfollow={followModal === "following"}
          onUnfollow={(id) => setFollow((f) => ({ ...f, following: f.following.filter((x) => x !== id) }))}
          onClose={() => setFollowModal(null)}
        />
      )}
      {openCommentsForPostId && (
        <CommentModal
          postId={openCommentsForPostId}
          onClose={() => setOpenCommentsForPostId(null)}
          onCommentAdded={(postId) =>
            setMyPosts((prev) =>
              prev.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p))
            )
          }
        />
      )}
    </div>
  );
}