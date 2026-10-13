// src/pages/FeedPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import CommentModal from "../components/CommentModal";
import {
  Search as SearchIcon,
  ChevronDown,
  ChevronUp,
  X,
  Building2,
  Square,
  List,
} from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import ReportPostModal from "../components/ReportPostModal";
import PostMenu from "../components/PostMenu";
import { truncateText } from "../utils/text";
import { loadHiddenIds, saveHiddenIds } from "../utils/hiddenPosts";
import Topbar from "../components/Topbar";
import ScrollTabs from "../components/ScrollTabs";
import { usePostComposer } from "../context/PostComposerContext";
import { useRealtime } from "../realtime/RealtimeContext";
import { topicColor, topicLabel } from "../constants/topics";

// Tab urutan/sumber di atas feed. "Komunitasku" hanya untuk pengguna yang login.
const FEED_TABS = [
  { id: "terbaru", label: "Terbaru" },
  { id: "populer", label: "Populer" },
  { id: "mengikuti", label: "Mengikuti", authOnly: true },
  { id: "komunitasku", label: "Komunitasku", authOnly: true },
  { id: "perusahaan", label: "Perusahaan" },
];

// Rentang waktu untuk semua tab (berdasarkan kapan post dibuat).
const TOP_RANGES = [
  { value: "all", label: "Semua waktu", ms: Infinity },
  { value: "day", label: "Hari ini", ms: 24 * 3600 * 1000 },
  { value: "week", label: "Minggu ini", ms: 7 * 24 * 3600 * 1000 },
  { value: "month", label: "Bulan ini", ms: 30 * 24 * 3600 * 1000 },
  { value: "year", label: "Tahun ini", ms: 365 * 24 * 3600 * 1000 },
];

const LAYOUT_KEY = "twekky_feed_layout";

// Gabungkan daftar tanpa duplikat (berdasarkan id). where: "start" = yang baru di depan.
function mergeById(list, extra, where = "end") {
  const seen = new Set(list.map((p) => p.id));
  const fresh = extra.filter((p) => !seen.has(p.id));
  return where === "start" ? [...fresh, ...list] : [...list, ...fresh];
}

// Tombol aksi di pesan kosong: tab -> [label, tujuan]
const EMPTY_ACTION = {
  mengikuti: ["Jelajahi akun", "/cari"],
  komunitasku: ["Gabung komunitas", "/komunitas"],
};

const EMPTY_BY_TAB = {
  mengikuti: "Belum ada post dari akun yang kamu ikuti. Ikuti pengguna lain atau repost post yang kamu suka.",
  populer: "Belum ada post populer dalam rentang waktu ini.",
  komunitasku: "Belum ada post dari komunitas yang kamu ikuti. Gabung ke komunitas dulu untuk melihat post-nya di sini.",
  perusahaan: "Belum ada post dari perusahaan.",
};

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { openComposer } = usePostComposer();
  // Topik aktif dari sidebar (?topik=finance); slug yang tidak dikenal diabaikan.
  const [searchParams, setSearchParams] = useSearchParams();
  const topicParam = searchParams.get("topik") || "";
  const activeTopic = topicLabel(topicParam) ? topicParam : "";
  // Tab, rentang waktu, dan pencarian disimpan di URL (?tab=, ?waktu=, ?q=, ?topik=)
  // supaya tombol Kembali dan tautan yang dibagikan membuka feed yang sama.
  const updateParams = (changes, { replace = false } = {}) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(changes)) {
          if (v) next.set(k, v);
          else next.delete(k);
        }
        return next;
      },
      { replace }
    );
  const tabParam = searchParams.get("tab") || "";
  const tab = FEED_TABS.some((t) => t.id === tabParam && (!t.authOnly || user)) ? tabParam : "terbaru";
  const setTab = (id) => updateParams({ tab: id === "terbaru" ? "" : id });
  const rangeParam = searchParams.get("waktu") || "";
  const topRange = TOP_RANGES.some((r) => r.value === rangeParam) ? rangeParam : "all";
  const setTopRange = (v) => updateParams({ waktu: v === "all" ? "" : v });
  const isFollowing = tab === "mengikuti";
  // post dari akun yang diikuti (termasuk repost mereka), dimuat saat tab "Mengikuti" dibuka
  const [followingPosts, setFollowingPosts] = useState([]);
  // Tampilan feed: "card" (lampiran penuh) atau "compact" (thumbnail kecil di kanan). Diingat per browser.
  const [layout, setLayout] = useState(() => {
    try {
      return localStorage.getItem(LAYOUT_KEY) === "compact" ? "compact" : "card";
    } catch {
      return "card";
    }
  });
  const changeLayout = (value) => {
    setLayout(value);
    try {
      localStorage.setItem(LAYOUT_KEY, value);
    } catch {
      /* penyimpanan tidak tersedia; pilihan tetap berlaku selama halaman terbuka */
    }
  };
  const compact = layout === "compact";
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  // Pencarian: kotak diisi langsung, server baru dipanggil setelah berhenti mengetik.
  const urlQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQ);
  const [debouncedQuery, setDebouncedQuery] = useState(urlQ);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => {
    if (urlQ !== debouncedQuery.trim()) updateParams({ q: debouncedQuery.trim() }, { replace: true });
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Kembali/Maju di browser mengubah ?q=: ikutkan kotak pencarian
    if (urlQ !== debouncedQuery.trim()) {
      setQuery(urlQ);
      setDebouncedQuery(urlQ);
    }
  }, [urlQ]); // eslint-disable-line react-hooks/exhaustive-deps
  const hasSearch = debouncedQuery.trim() !== "";
  const filtersActive = topRange !== "all" || query.trim() !== "" || !!activeTopic;
  const resetFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    updateParams({ waktu: "", q: "", topik: "" });
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State fitur tambahan
  const [expandedPostIds, setExpandedPostIds] = useState([]);
  const [reportingPost, setReportingPost] = useState(null);
  const [reportedPostIds, setReportedPostIds] = useState(() => new Set()); // sudah dilaporkan di sesi ini
  const [blockedAuthorIds, setBlockedAuthorIds] = useState(() => new Set()); // diblokir lewat modal laporan
  const [toastMessage, setToastMessage] = useState("");
  const toastTimer = useRef(null);
  const [hiddenPostIds, setHiddenPostIds] = useState(loadHiddenIds);

  // Popup komentar
  const [openCommentsForPostId, setOpenCommentsForPostId] = useState(null);

  // --- data feed: dimuat per halaman (20 post) dari server ---
  // Tab (kecuali Mengikuti), rentang waktu, topik, dan pencarian disaring di server.
  const [nextCursor, setNextCursor] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingNew, setPendingNew] = useState([]); // post baru yang cocok dengan filter, menunggu banner diklik
  const reqId = useRef(0); // menolak respons lama bila filter berubah di tengah jalan

  const fetchPage = (cursor) =>
    api.feedPage({
      tab,
      range: topRange === "all" ? "" : topRange,
      q: debouncedQuery.trim(),
      topic: activeTopic,
      cursor,
    });

  const loadFirst = async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError("");
    setLoadingMore(false);
    try {
      if (isFollowing) {
        const data = await api.followingFeed(); // tab Mengikuti masih memakai endpoint tersendiri
        if (id !== reqId.current) return;
        setFollowingPosts(data || []);
        setNextCursor("");
      } else {
        const data = await fetchPage("");
        if (id !== reqId.current) return;
        setPosts(data?.items || []);
        setNextCursor(data?.next_cursor || "");
      }
      setPendingNew([]);
    } catch (err) {
      if (id === reqId.current) setError(err.message);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  };

  const queryKey = [tab, topRange, debouncedQuery.trim(), activeTopic, user?.id || ""].join("|");
  useEffect(() => {
    loadFirst();
  }, [queryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = async () => {
    if (!nextCursor || loading || loadingMore || isFollowing) return;
    const id = reqId.current;
    setLoadingMore(true);
    try {
      const data = await fetchPage(nextCursor);
      if (id !== reqId.current) return;
      setPosts((prev) => mergeById(prev, data?.items || []));
      setNextCursor(data?.next_cursor || "");
    } catch (err) {
      if (id === reqId.current) showToast(err.message || "Gagal memuat post berikutnya.");
    } finally {
      if (id === reqId.current) setLoadingMore(false);
    }
  };

  // Infinite scroll: muat halaman berikutnya saat penanda di dasar daftar hampir terlihat.
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;
  const sentinelRef = useRef(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !nextCursor || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreRef.current();
      },
      { rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [nextCursor, loading, loadingMore, posts.length]);

  // id post yang sudah pernah dilaporkan akun ini (supaya tombol Laporkan tetap nonaktif setelah refresh)
  useEffect(() => {
    if (!user) {
      setReportedPostIds(new Set());
      return;
    }
    api
      .reportedPostIds()
      .then((d) => setReportedPostIds(new Set(d?.post_ids || [])))
      .catch(() => {});
  }, [user?.id]);

  // --- real-time ---
  const removePostLocally = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setFollowingPosts((prev) => prev.filter((p) => p.id !== id));
    setPendingNew((prev) => prev.filter((p) => p.id !== id));
  };
  const addToTop = (list) => {
    const setter = isFollowing ? setFollowingPosts : setPosts;
    setter((prev) => mergeById(prev, list, "start"));
  };

  // Ada post baru: ambil halaman pertama saja (bukan seluruh feed), lalu bandingkan dengan
  // yang sudah tampil. Hanya post yang cocok dengan tab dan filter aktif yang dihitung.
  // Di paling atas langsung disisipkan; sedang membaca di bawah, ditawarkan lewat banner.
  const checkNewPosts = async () => {
    if (tab === "populer") return; // urutan berdasarkan skor: post baru belum tentu di atas
    const id = reqId.current;
    try {
      let fresh;
      if (isFollowing) {
        const q = debouncedQuery.trim().toLowerCase();
        fresh = ((await api.followingFeed()) || []).filter(
          (p) =>
            (!activeTopic || p.topic === activeTopic) &&
            (!q || p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q))
        );
      } else {
        fresh = (await fetchPage(""))?.items || [];
      }
      if (id !== reqId.current) return;
      const have = new Set((isFollowing ? followingPosts : posts).map((p) => p.id));
      const added = fresh.filter((p) => !have.has(p.id));
      if (added.length === 0) return;
      if (window.scrollY < 120) addToTop(added);
      else setPendingNew((prev) => mergeById(prev, added, "start"));
    } catch {
      // diam: tampilan lama tetap dipakai
    }
  };
  const checkNewRef = useRef(checkNewPosts);
  checkNewRef.current = checkNewPosts;
  const syncTimer = useRef(null);
  useEffect(() => () => clearTimeout(syncTimer.current), []);

  const showPending = () => {
    addToTop(pendingNew);
    setPendingNew([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useRealtime("post_created", () => {
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => checkNewRef.current(), 400); // gabungkan beberapa event berdekatan
  });
  useRealtime("post_updated", (ev) => {
    const patch = (prev) =>
      prev.map((p) => (p.id === ev.id ? { ...p, likes: ev.likes, comment_count: ev.comment_count } : p));
    setPosts(patch);
    setFollowingPosts(patch);
  });
  // post dihapus (oleh penulisnya, di perangkat lain atau di sini): hilang tanpa refresh
  useRealtime("post_deleted", (ev) => removePostLocally(ev.id));
  useRealtime("reconnected", () => checkNewRef.current());

  useEffect(() => {
    api
      .listCommunities()
      .then((data) => setCommunities((data || []).slice().sort((a, b) => b.member_count - a.member_count)))
      .catch(() => {});
  }, []);

  // id komunitas -> objek komunitas, untuk penanda "di <komunitas>" + tombol Gabung di tiap post
  const communityById = useMemo(() => Object.fromEntries(communities.map((c) => [c.id, c])), [communities]);

  const visiblePosts = useMemo(() => {
    let list = isFollowing ? followingPosts : posts; // tab lain sudah disaring di server
    if (isFollowing) {
      // tab Mengikuti memakai endpoint terpisah, jadi rentang waktu, topik, dan pencarian disaring di sini
      const span = TOP_RANGES.find((r) => r.value === topRange)?.ms ?? Infinity;
      const now = Date.now();
      const q = debouncedQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          now - new Date(p.created_at).getTime() <= span &&
          (!activeTopic || p.topic === activeTopic) &&
          (!q || p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q))
      );
    }
    if (hiddenPostIds.size > 0) list = list.filter((p) => !hiddenPostIds.has(p.id));
    if (blockedAuthorIds.size > 0) list = list.filter((p) => p.is_anonymous || !blockedAuthorIds.has(p.author_id));
    return list;
  }, [posts, followingPosts, isFollowing, debouncedQuery, topRange, activeTopic, blockedAuthorIds, hiddenPostIds]);

  const isBusiness = user?.account_type === "business" && !!user?.company_name;
  const composerInitials = user?.name
    ? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  // dari halaman ini ke login, lalu kembali ke sini setelah masuk
  const goLogin = () => navigate("/login", { state: { from: location.pathname + location.search } });
  const handleCompose = () => (user ? openComposer("", activeTopic) : goLogin());

  const handleLike = async (id) => {
    await api.likePost(id);
  };

  // Simpan post kini ditangani PostCard (tersimpan di server, tampil di tab Disimpan profil).
  const handleSaveChange = (on) =>
    showToast(on ? "Postingan berhasil disimpan!" : "Postingan dihapus dari daftar tersimpan.");

  const handleOpenReport = (post) => {
    if (!user) {
      goLogin();
      return;
    }
    setReportingPost(post);
  };

  // Dipanggil modal setelah laporan tersimpan di server.
  const handleReported = (post, { blockedAuthorId } = {}) => {
    setReportedPostIds((prev) => new Set(prev).add(post.id));
    if (blockedAuthorId) setBlockedAuthorIds((prev) => new Set(prev).add(blockedAuthorId));
  };

  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current = setTimeout(() => setToastMessage(""), 3500);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const handleHidePost = (post) => {
    setHiddenPostIds((prev) => {
      const next = new Set(prev).add(post.id);
      saveHiddenIds(next);
      return next;
    });
    showToast("Post disembunyikan. Bisa ditampilkan lagi di Pengaturan > Privasi.");
  };

  const handleBlockUser = async (post) => {
    if (!window.confirm(`Blokir ${post.author_name}? Postingan kalian tidak akan saling terlihat dan dia tidak bisa mengirim pesan kepadamu.`)) return;
    try {
      await api.blockUser(post.author_id);
      setBlockedAuthorIds((prev) => new Set(prev).add(post.author_id));
      showToast(`${post.author_name} diblokir.`);
    } catch (err) {
      showToast(err.message || "Gagal memblokir pengguna.");
    }
  };

  const handleDeletePost = async (post) => {
    if (!window.confirm("Hapus postingan ini? Komentarnya ikut terhapus dan tidak bisa dikembalikan.")) return;
    try {
      await api.deletePost(post.id);
      removePostLocally(post.id);
      showToast("Postingan dihapus.");
    } catch (err) {
      showToast(err.message || "Gagal menghapus postingan.");
    }
  };

  // Navigasi tab dengan panah kiri/kanan (Home/End), fokus berpindah bersama tab
  const visibleTabs = FEED_TABS.filter((t) => !t.authOnly || user);
  const onTabKeyDown = (e) => {
    const i = visibleTabs.findIndex((t) => t.id === tab);
    let n;
    if (e.key === "ArrowRight") n = (i + 1) % visibleTabs.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + visibleTabs.length) % visibleTabs.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = visibleTabs.length - 1;
    else return;
    e.preventDefault();
    const id = visibleTabs[n].id;
    setTab(id);
    requestAnimationFrame(() => document.getElementById(`feed-tab-${id}`)?.focus());
  };

  const handleToggleExpand = (postId) => {
    if (expandedPostIds.includes(postId)) {
      setExpandedPostIds(expandedPostIds.filter((id) => id !== postId));
    } else {
      setExpandedPostIds([...expandedPostIds, postId]);
    }
  };

  return (
    <>
      <Topbar
        title="Feed Diskusi"
        search={{ value: query, onChange: setQuery, placeholder: "Cari di Twekky..." }}
      />

      <div className="flex gap-8 p-0 md:p-6 lg:p-8 w-full box-border min-h-[calc(100vh-70px)] relative">
        {/* fixed: tidak ikut tata letak flex (tanpa ini, elemen kosong menambah celah gap-8 di kiri feed) */}
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-36 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6"
        >
          {toastMessage && (
            <div className="rounded-xl bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">{toastMessage}</div>
          )}
        </div>

        {pendingNew.length > 0 && (
          <button
            type="button"
            onClick={() => {
              showPending();
            }}
            className="fixed left-1/2 top-20 z-40 -translate-x-1/2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white shadow-lg"
          >
            {pendingNew.length} post baru
          </button>
        )}

        {/* feed main */}
        <div className="flex-1 min-w-0 max-w-full lg:max-w-[calc(100%-340px)]">
          {/* Penanda topik aktif + tombol untuk kembali ke semua post */}
          {activeTopic && (
            <div className="mx-4 mb-4 mt-3 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 md:mx-0 md:mt-0">
              <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-900">
                Topik
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${topicColor(activeTopic)}`}>{topicLabel(activeTopic)}</span>
              </div>
              <button
                type="button"
                onClick={() => updateParams({ topik: "" })}
                className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                <X size={13} /> Semua topik
              </button>
            </div>
          )}

          {/* Kotak tulis cepat (desktop): membuka popup Buat Post. Di HP diganti tombol melayang. */}
          <button
            type="button"
            onClick={handleCompose}
            className="mb-4 hidden w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left cursor-pointer hover:bg-gray-50 md:flex"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[13px] font-bold text-brand">
              {isBusiness ? <Building2 size={17} /> : composerInitials}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-gray-400">
              {!user
                ? "Masuk untuk membuat post..."
                : isBusiness
                  ? `Bagikan kabar dari ${user.company_name}...`
                  : "Apa yang sedang kamu pikirkan?"}
            </span>
            <span className="shrink-0 rounded-full bg-brand px-3.5 py-1 text-xs font-semibold text-white">Post</span>
          </button>

          {/* Tab urutan/sumber */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 pt-3 md:px-0 md:pt-0">
            <ScrollTabs activeKey={tab} role="tablist" aria-label="Urutan feed" onKeyDown={onTabKeyDown}>
              {visibleTabs.map((t) => (
                <button
                  key={t.id}
                  id={`feed-tab-${t.id}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  tabIndex={tab === t.id ? 0 : -1}
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    tab === t.id
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-transparent bg-transparent text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </ScrollTabs>

            <div className="flex items-center gap-2">
              {filtersActive && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <X size={13} /> Reset filter
                </button>
              )}
              {/* Filter waktu: hari ini / minggu ini / bulan ini ... */}
              <select
                value={topRange}
                onChange={(e) => setTopRange(e.target.value)}
                aria-label="Rentang waktu"
                className="cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {TOP_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>

              {/* Pilihan tampilan: kartu (lampiran penuh) atau padat (thumbnail di kanan) */}
              <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white" role="group" aria-label="Tampilan feed">
                {[
                  { value: "card", label: "Tampilan kartu", Icon: Square },
                  { value: "compact", label: "Tampilan padat", Icon: List },
                ].map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => changeLayout(value)}
                    aria-pressed={layout === value}
                    title={label}
                    className={`flex cursor-pointer items-center border-0 px-2.5 py-1.5 transition-colors ${
                      layout === value ? "bg-brand-soft text-brand" : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={14} strokeWidth={2} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mx-4 mb-4 flex items-center justify-between gap-3 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger md:mx-0"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={loadFirst}
                className="shrink-0 cursor-pointer rounded-md border border-danger bg-white px-2.5 py-1 text-xs font-semibold text-danger hover:bg-danger-soft"
              >
                Coba lagi
              </button>
            </div>
          )}

          {loading ? (
            <div
              aria-busy="true"
              aria-label="Memuat feed"
              className="divide-y divide-gray-200 border-y border-gray-200 bg-white md:rounded-xl md:border"
            >
              {[0, 1, 2].map((i) => (
                <div key={i} className="animate-pulse px-4 py-4 md:px-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className="h-[38px] w-[38px] rounded-full bg-gray-200" />
                    <div className="h-3 w-32 rounded bg-gray-200" />
                  </div>
                  <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
                  <div className="mb-1.5 h-3 w-full rounded bg-gray-100" />
                  <div className="h-3 w-5/6 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : visiblePosts.length === 0 && !nextCursor ? (
            <div className="bg-gray-50 p-12 text-center text-gray-500 md:rounded-xl">
              {hasSearch
                ? "Tidak ada post yang cocok dengan pencarianmu."
                : activeTopic
                  ? `Belum ada post di topik ${topicLabel(activeTopic)}. Jadilah yang pertama memposting di sini!`
                  : EMPTY_BY_TAB[tab] || "Belum ada post. Jadilah yang pertama membuat utas!"}
              {!hasSearch && !activeTopic && EMPTY_ACTION[tab] && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => navigate(EMPTY_ACTION[tab][1])}
                    className="cursor-pointer rounded-full border-none bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    {EMPTY_ACTION[tab][0]}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
            {visiblePosts.length > 0 && (
            <div className="border-y border-gray-200 bg-white overflow-hidden divide-y divide-gray-200 md:rounded-xl md:border [&_p]:text-sm [&_div]:text-sm leading-relaxed">
              {visiblePosts.map((post) => {
                const isExpanded = expandedPostIds.includes(post.id);

                const shortBody = truncateText(post.body, 250); // aman terhadap emoji dan batas kata
                const isLongText = !compact && !!post.body && shortBody !== post.body;
                const displayedBody = !isExpanded && isLongText ? shortBody : post.body;

                return (
                  <div key={post.id} className="relative group transition-colors hover:bg-gray-50/70">
                    <PostCard
                      post={{ ...post, body: displayedBody }}
                      onLike={handleLike}
                      canLike={!!user}
                      onSaveChange={handleSaveChange}
                      onOpenComments={setOpenCommentsForPostId}
                      variant="flat"
                      compact={compact}
                      community={post.community_id ? communityById[post.community_id] : undefined}
                      menu={
                        <PostMenu
                          post={post}
                          isOwn={!!user && post.author_id === user.id}
                          loggedIn={!!user}
                          reported={reportedPostIds.has(post.id)}
                          onReport={handleOpenReport}
                          onHide={handleHidePost}
                          onBlock={handleBlockUser}
                          onDelete={handleDeletePost}
                          onNotify={showToast}
                        />
                      }
                      footer={
                        isLongText ? (
                          <div className="mt-3">
                            <button
                              onClick={() => handleToggleExpand(post.id)}
                              className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline cursor-pointer bg-transparent border-none p-0"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={14} /> Tampilkan lebih sedikit
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={14} /> Tampilkan lebih banyak
                                </>
                              )}
                            </button>
                          </div>
                        ) : null
                      }
                    />
                  </div>
                );
              })}
            </div>
            )}

            {/* Penanda infinite scroll + tombol cadangan (keyboard / bila penanda tidak terpicu) */}
            {nextCursor && !isFollowing && (
              <div className="px-4 py-5 text-center md:px-0">
                <div ref={sentinelRef} aria-hidden="true" className="h-px" />
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="cursor-pointer rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default disabled:opacity-60"
                >
                  {loadingMore ? "Memuat..." : "Muat lebih banyak"}
                </button>
              </div>
            )}
            </>
          )}
        </div>

        {/* right rail */}
        <aside className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-6 flex flex-col gap-6">
            <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
              <h3 className="text-base font-bold mb-4 text-gray-900">Komunitas Populer</h3>
              {communities.length === 0 ? (
                <p className="m-0 text-sm text-gray-400">Belum ada komunitas.</p>
              ) : (
                <ul className="list-none p-0 m-0 flex flex-col gap-3">
                  {communities.slice(0, 3).map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => navigate(`/komunitas/${c.id}`)}
                        className="flex w-full items-center justify-between rounded-lg bg-gray-100 px-3 py-2.5 border-none cursor-pointer transition-colors hover:bg-gray-200"
                      >
                        <span className="font-semibold text-gray-900">#{c.name}</span>
                        <span className="text-xs text-gray-500">{c.member_count} anggota</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div
              onClick={() => navigate("/lowongan-kerja")}
              className="rounded-xl bg-brand p-6 text-white cursor-pointer shadow-brand/20 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <SearchIcon size={28} strokeWidth={2} className="mb-4" />
              <h3 className="text-[1.1rem] font-bold mb-2">Cari Peluang Karir Impian?</h3>
              <p className="text-sm leading-relaxed opacity-90">
                Jelajahi lowongan kerja eksklusif dari perusahaan di komunitas Twekky.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {reportingPost && (
        <ReportPostModal post={reportingPost} onClose={() => setReportingPost(null)} onSubmitted={handleReported} />
      )}


      {/* Popup Komentar */}
      {openCommentsForPostId && (
        <CommentModal
          postId={openCommentsForPostId}
          onClose={() => setOpenCommentsForPostId(null)}
          onCommentAdded={(postId) => {
            const bump = (prev) =>
              prev.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p));
            setPosts(bump);
            setFollowingPosts(bump);
          }}
        />
      )}
    </>
  );
}