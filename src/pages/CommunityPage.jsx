import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Users,
  PlusCircle,
  Lock,
  Globe,
  Briefcase,
  MapPin,
  Pin,
  PinOff,
  Crown,
  ShieldCheck,
  Square,
  List,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCommunities } from "../context/CommunityContext";
import { usePostComposer } from "../context/PostComposerContext";
import { TOPICS, topicLabel, topicColor, jobMatchesTopic } from "../constants/topics";
import Topbar from "../components/Topbar";
import PostCard from "../components/PostCard";
import CommentModal from "../components/CommentModal";
import CommunityJoinButton from "../components/CommunityJoinButton";
import JoinRequestsPanel from "../components/JoinRequestsPanel";

// Urutan feed komunitas. Semuanya dihitung di klien dari data post yang sudah ada.
const SORTS = [
  { key: "terbaru", label: "Terbaru" },
  { key: "populer", label: "Populer" },
  { key: "belum-terjawab", label: "Belum terjawab" },
];

// Filter waktu berdasarkan kalender (bukan 24 jam bergulir), supaya "Kemarin" masuk akal.
const TIME_FILTERS = [
  { key: "all", label: "Semua waktu" },
  { key: "today", label: "Hari ini" },
  { key: "yesterday", label: "Kemarin" },
  { key: "month", label: "Bulan ini" },
  { key: "year", label: "Tahun ini" },
];

function inTimeRange(iso, key, now = new Date()) {
  if (key === "all") return true;
  const d = new Date(iso);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  if (key === "today") return d >= startToday;
  if (key === "yesterday") return d >= startYesterday && d < startToday;
  if (key === "month") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  if (key === "year") return d.getFullYear() === now.getFullYear();
  return true;
}

// Sama dengan FeedPage: pilihan tampilan kartu/padat diingat per browser dan dibagi dengan Feed.
const LAYOUT_KEY = "twekky_feed_layout";
const LONG_TEXT_LIMIT = 250;

function sortPosts(posts, sort) {
  const list = sort === "belum-terjawab" ? posts.filter((p) => !p.comment_count) : [...posts];
  if (sort === "populer") {
    list.sort(
      (a, b) =>
        (b.likes || 0) + (b.comment_count || 0) - ((a.likes || 0) + (a.comment_count || 0)) ||
        new Date(b.created_at) - new Date(a.created_at)
    );
  } else {
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  // Post yang disematkan pemilik selalu di atas (kecuali saat menyaring "Belum terjawab").
  if (sort === "belum-terjawab") return list;
  return [...list.filter((p) => p.pinned_at), ...list.filter((p) => !p.pinned_at)];
}

function formatSalary(job) {
  if (!job.salary_min && !job.salary_max) return "";
  const fmt = (n) => `Rp${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (job.salary_min && job.salary_max) return `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`;
  return fmt(job.salary_max || job.salary_min);
}

function SideCard({ title, children }) {
  return (
    <section className="bg-white py-4 sm:rounded-2xl sm:border sm:border-gray-200 sm:p-4 sm:shadow-sm">
      <h3 className="m-0 mb-2 text-sm font-bold text-gray-900">{title}</h3>
      {children}
    </section>
  );
}

function AboutCard({ community }) {
  return (
    <SideCard title="Tentang">
      <p className="m-0 text-sm leading-relaxed text-gray-600">{community.description || "Belum ada deskripsi."}</p>
      {community.created_at && (
        <p className="m-0 mt-2 text-xs text-gray-400">
          Dibuat{" "}
          {new Date(community.created_at).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
        </p>
      )}
    </SideCard>
  );
}

function RulesCard({ community }) {
  return (
    <SideCard title="Aturan komunitas">
      <p className="m-0 whitespace-pre-line text-sm leading-relaxed text-gray-600">{community.rules}</p>
    </SideCard>
  );
}

function MemberRow({ m, canManage, busy, onToggleAdmin }) {
  const initials = (m.company_name || m.name || "?").trim().slice(0, 2).toUpperCase();
  return (
    <li className="flex items-center gap-3 border-b border-gray-100 bg-white py-3 sm:rounded-xl sm:border sm:border-gray-200 sm:px-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <Link
          to={m.account_type === "business" ? `/perusahaan/${m.id}` : `/pengguna/${m.id}`}
          className="truncate text-sm font-semibold text-gray-900 no-underline hover:text-brand"
        >
          {m.company_name || m.name}
        </Link>
        {m.bio && <p className="m-0 truncate text-xs text-gray-500">{m.bio}</p>}
      </div>
      {m.role === "owner" && (
        <span className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">
          <ShieldCheck size={12} /> Pembuat
        </span>
      )}
      {m.role === "admin" && (
        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
          <ShieldCheck size={12} /> Co-admin
        </span>
      )}
      {canManage && m.role !== "owner" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onToggleAdmin(m)}
          className="shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          {m.role === "admin" ? "Cabut" : "Jadikan co-admin"}
        </button>
      )}
      {m.is_pro && (
        <span className="inline-flex items-center gap-1 rounded-md bg-yellow-50 px-2 py-0.5 text-xs font-semibold text-yellow-700">
          <Crown size={12} /> Pro
        </span>
      )}
    </li>
  );
}

function JobRow({ job }) {
  const salary = formatSalary(job);
  return (
    <Link
      to={`/lowongan-kerja?lowongan=${encodeURIComponent(job.id)}`}
      className="block rounded-xl border border-gray-200 bg-white p-3.5 no-underline transition-colors hover:border-brand"
    >
      <p className="m-0 text-sm font-bold text-gray-900">{job.title}</p>
      <p className="m-0 mt-0.5 text-xs text-gray-500">{job.company_name}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
        {job.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} /> {job.location}
          </span>
        )}
        {salary && <span>{salary}</span>}
      </div>
    </Link>
  );
}

export default function CommunityPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { joined, pendingIds } = useCommunities();
  const { openComposer } = usePostComposer();
  const [searchParams, setSearchParams] = useSearchParams();

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState(null); // null = belum dimuat
  const [membersError, setMembersError] = useState("");
  const [adminBusyId, setAdminBusyId] = useState("");
  const [pinBusyId, setPinBusyId] = useState(null);
  const [topicBusy, setTopicBusy] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("terbaru");
  const [timeFilter, setTimeFilter] = useState("all");
  const [expandedPostIds, setExpandedPostIds] = useState([]);
  const [layout, setLayout] = useState(() => {
    try {
      return localStorage.getItem(LAYOUT_KEY) === "compact" ? "compact" : "card";
    } catch {
      return "card";
    }
  });
  const compact = layout === "compact";
  const changeLayout = (value) => {
    setLayout(value);
    try {
      localStorage.setItem(LAYOUT_KEY, value);
    } catch {
      /* penyimpanan tidak tersedia; pilihan tetap berlaku selama halaman terbuka */
    }
  };
  const toggleExpand = (postId) =>
    setExpandedPostIds((prev) => (prev.includes(postId) ? prev.filter((x) => x !== postId) : [...prev, postId]));
  const [openCommentsForPostId, setOpenCommentsForPostId] = useState(null);

  const isMember = joined.some((c) => c.id === id);
  const isPending = pendingIds.includes(id);
  const needsApproval = community?.join_type === "approval";
  const isOwner = !!user && !!community && community.owner_id === user.id;
  // pengelola = pembuat atau co-admin (boleh menyetujui gabung dan menyematkan post)
  const canModerate = isOwner || (!!community && community.my_role === "admin");
  const showRequestsTab = canModerate && needsApproval;

  const toggleAdmin = async (m) => {
    setAdminBusyId(m.id);
    setError("");
    try {
      await api.setCommunityAdmin(id, m.id, m.role !== "admin");
      const list = await api.listCommunityMembers(id);
      setMembers(list || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdminBusyId("");
    }
  };

  // Pemilik mengganti topik komunitas; semua post di komunitas ikut pindah ke topik baru.
  const changeTopic = async (slug) => {
    if (!slug || slug === community.topic) return;
    if (posts.length > 0 && !window.confirm(`Semua post di komunitas ini akan pindah ke topik ${topicLabel(slug)}. Lanjutkan?`)) return;
    setTopicBusy(true);
    try {
      const updated = await api.setCommunityTopic(community.id, slug);
      setCommunity((cur) => ({ ...cur, topic: updated.topic }));
      setPosts((prev) => prev.map((p) => ({ ...p, topic: updated.topic })));
    } catch (err) {
      setError(err.message);
    } finally {
      setTopicBusy(false);
    }
  };

  const wantedTab = searchParams.get("tab");
  const tab =
    wantedTab === "lowongan" || wantedTab === "anggota" || wantedTab === "tentang" || wantedTab === "aturan"
      ? wantedTab
      : showRequestsTab && wantedTab === "permintaan"
      ? "permintaan"
      : "diskusi";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([api.getCommunity(id), api.listFeed("", id)])
      .then(([c, p]) => {
        if (cancelled) return;
        setCommunity(c);
        setPosts(p || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Lowongan dicocokkan ke topik komunitas lewat kata kunci (lowongan belum punya field topik).
  useEffect(() => {
    let cancelled = false;
    api
      .listJobs("", "")
      .then((list) => {
        if (!cancelled) setJobs(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setJobs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Daftar anggota dimuat saat tab Anggota dibuka (komunitas "approval": khusus anggota).
  useEffect(() => {
    if (tab !== "anggota") return;
    let cancelled = false;
    setMembersError("");
    api
      .listCommunityMembers(id)
      .then((list) => {
        if (!cancelled) setMembers(list || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setMembers([]);
          setMembersError(err.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, tab, isMember]);

  useEffect(() => {
    setMembers(null);
  }, [id]);

  const togglePin = async (post) => {
    setPinBusyId(post.id);
    setError("");
    try {
      const updated = await api.pinCommunityPost(id, post.id, !post.pinned_at);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, pinned_at: updated?.pinned_at || null } : p))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setPinBusyId(null);
    }
  };

  // Permintaan bergabung hanya dimuat untuk pembuat komunitas "approval".
  useEffect(() => {
    if (!showRequestsTab) {
      setRequests([]);
      return;
    }
    let cancelled = false;
    api
      .listJoinRequests(id)
      .then((r) => {
        if (!cancelled) setRequests(r || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id, showRequestsTab]);

  const decide = async (req, approve) => {
    setBusyUserId(req.user_id);
    setError("");
    try {
      const result = approve
        ? await api.approveJoinRequest(id, req.user_id)
        : await api.rejectJoinRequest(id, req.user_id);
      setRequests((prev) => prev.filter((r) => r.user_id !== req.user_id));
      if (approve && result?.id) setCommunity(result); // jumlah anggota bertambah
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyUserId(null);
    }
  };

  const switchTab = (next) => setSearchParams(next === "diskusi" ? {} : { tab: next }, { replace: true });

  const relatedJobs = useMemo(
    () =>
      community?.topic
        ? jobs.filter((j) => j.status !== "closed" && jobMatchesTopic(j, community.topic))
        : [],
    [jobs, community?.topic]
  );
  const timeFiltered = useMemo(
    () => posts.filter((p) => inTimeRange(p.created_at, timeFilter)),
    [posts, timeFilter]
  );
  const sortedPosts = useMemo(() => sortPosts(timeFiltered, sort), [timeFiltered, sort]);
  const emptyText =
    posts.length === 0
      ? "Belum ada post di komunitas ini."
      : timeFiltered.length === 0
      ? "Tidak ada post pada rentang waktu ini."
      : "Semua post di komunitas ini sudah ada komentarnya.";

  const tabClass = (active) =>
    `inline-flex items-center gap-1.5 border-b-2 px-1 py-3 text-sm font-semibold transition-colors ${
      active ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-900"
    }`;
  const countPill = "rounded-md bg-gray-100 px-1.5 text-[11px] font-semibold text-gray-600";

  return (
    <>
      <Topbar title={community ? community.name : "Komunitas"} />
      <div className="box-border w-full p-6 lg:p-8">
        {error && (
          <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Memuat komunitas...</p>
        ) : !community ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-500">
            Komunitas tidak ditemukan.
          </div>
        ) : (
          <>
            <header className="-mx-6 mb-6 bg-white px-5 pt-5 sm:mx-0 sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-sm">
              <div className="flex flex-wrap items-center gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${topicColor(
                    community.topic
                  )}`}
                  aria-hidden="true"
                >
                  {community.name.trim().slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="m-0 truncate text-xl font-bold text-gray-900">{community.name}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                    {isOwner ? (
                      <select
                        value={community.topic || ""}
                        onChange={(e) => changeTopic(e.target.value)}
                        disabled={topicBusy}
                        aria-label="Topik komunitas"
                        title="Ganti topik komunitas (semua post ikut pindah)"
                        className={`cursor-pointer rounded-md border-0 px-2 py-0.5 text-xs font-semibold ${
                          community.topic ? topicColor(community.topic) : "bg-brand-soft text-brand"
                        }`}
                      >
                        {!community.topic && (
                          <option value="" disabled>
                            Pilih topik
                          </option>
                        )}
                        {TOPICS.map((t) => (
                          <option key={t.slug} value={t.slug}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      community.topic && (
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${topicColor(community.topic)}`}>
                          {topicLabel(community.topic)}
                        </span>
                      )
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={14} /> {community.member_count} anggota
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      {needsApproval ? (
                        <>
                          <Lock size={13} /> Perlu persetujuan
                        </>
                      ) : (
                        <>
                          <Globe size={13} /> Terbuka
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <CommunityJoinButton community={community} onCommunityChange={setCommunity} onError={setError} />
              </div>

              <nav className="mt-3 flex gap-6 border-t border-gray-100" aria-label="Bagian komunitas">
                <button type="button" className={tabClass(tab === "diskusi")} onClick={() => switchTab("diskusi")}>
                  Diskusi
                </button>
                <button type="button" className={tabClass(tab === "lowongan")} onClick={() => switchTab("lowongan")}>
                  Lowongan
                  {relatedJobs.length > 0 && <span className={countPill}>{relatedJobs.length}</span>}
                </button>
                <button type="button" className={tabClass(tab === "anggota")} onClick={() => switchTab("anggota")}>
                  Anggota
                  <span className={countPill}>{community.member_count}</span>
                </button>
                <button type="button" className={`${tabClass(tab === "tentang")} lg:hidden`} onClick={() => switchTab("tentang")}>
                  Tentang
                </button>
                {community.rules && (
                  <button type="button" className={`${tabClass(tab === "aturan")} lg:hidden`} onClick={() => switchTab("aturan")}>
                    Aturan
                  </button>
                )}
                {showRequestsTab && (
                  <button
                    type="button"
                    className={tabClass(tab === "permintaan")}
                    onClick={() => switchTab("permintaan")}
                  >
                    Permintaan
                    {requests.length > 0 && <span className={countPill}>{requests.length}</span>}
                  </button>
                )}
              </nav>
            </header>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
              <main className="min-w-0">
                {tab === "tentang" ? (
                  <div className="lg:hidden">
                    <AboutCard community={community} />
                  </div>
                ) : tab === "aturan" ? (
                  <div className="lg:hidden">
                    <RulesCard community={community} />
                  </div>
                ) : tab === "permintaan" ? (
                  <JoinRequestsPanel
                    requests={requests}
                    busyUserId={busyUserId}
                    onApprove={(req) => decide(req, true)}
                    onReject={(req) => decide(req, false)}
                  />
                ) : tab === "anggota" ? (
                  !user ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
                      <Link to="/login" className="font-semibold text-brand">
                        Masuk
                      </Link>{" "}
                      untuk melihat daftar anggota.
                    </div>
                  ) : membersError ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
                      {membersError}
                    </div>
                  ) : members === null ? (
                    <p className="text-sm text-gray-500">Memuat anggota...</p>
                  ) : (
                    <ul className="m-0 flex list-none flex-col gap-2 p-0">
                      {members.map((m) => (
                        <MemberRow
                          key={m.id}
                          m={m}
                          canManage={isOwner}
                          busy={adminBusyId === m.id}
                          onToggleAdmin={toggleAdmin}
                        />
                      ))}
                    </ul>
                  )
                ) : tab === "lowongan" ? (
                  relatedJobs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
                      <Briefcase size={22} className="mx-auto mb-2 text-gray-400" />
                      Belum ada lowongan yang cocok dengan topik komunitas ini.
                      <div className="mt-3">
                        <Link to="/lowongan-kerja" className="font-semibold text-brand">
                          Lihat semua lowongan
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {relatedJobs.map((j) => (
                        <JobRow key={j.id} job={j} />
                      ))}
                    </div>
                  )
                ) : (
                  <>
                    {isMember ? (
                      <button
                        type="button"
                        onClick={() => openComposer(id)}
                        className="mb-4 flex w-full items-center gap-3 border-y border-gray-100 bg-white px-0 py-3 text-left transition-colors sm:rounded-xl sm:border sm:border-gray-200 sm:px-4 sm:shadow-sm sm:hover:border-brand"
                      >
                        <PlusCircle size={18} className="shrink-0 text-brand" />
                        <span className="flex-1 text-sm text-gray-500">Tulis pertanyaan atau cerita di komunitas ini</span>
                        <span className="rounded-lg bg-brand px-3 py-1 text-xs font-semibold text-white">Buat post</span>
                      </button>
                    ) : (
                      <div className="mb-4 rounded-lg bg-brand-soft px-3.5 py-2.5 text-sm text-brand-dark">
                        {isPending
                          ? "Permintaanmu sedang menunggu persetujuan pembuat komunitas."
                          : needsApproval
                          ? "Kirim permintaan bergabung dulu untuk bisa membuat post di sini."
                          : "Gabung ke komunitas ini dulu untuk bisa membuat post di sini."}
                      </div>
                    )}

                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2" role="group" aria-label="Urutkan post">
                        {SORTS.map((s) => (
                          <button
                            key={s.key}
                            type="button"
                            aria-pressed={sort === s.key}
                            onClick={() => setSort(s.key)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                              sort === s.key
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>

                      <div
                        className="flex overflow-hidden rounded-lg border border-gray-200 bg-white"
                        role="group"
                        aria-label="Tampilan post"
                      >
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

                    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Rentang waktu post">
                      {TIME_FILTERS.map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          aria-pressed={timeFilter === t.key}
                          onClick={() => setTimeFilter(t.key)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                            timeFilter === t.key
                              ? "border-brand bg-brand-soft text-brand"
                              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {sortedPosts.length === 0 ? (
                      <div className="rounded-xl bg-gray-50 p-12 text-center text-sm text-gray-500">{emptyText}</div>
                    ) : (
                      <div className="-mx-6 border-y border-gray-200 bg-white overflow-hidden divide-y divide-gray-200 md:mx-0 md:rounded-xl md:border [&_p]:text-sm [&_div]:text-sm leading-relaxed">
                        {sortedPosts.map((post) => {
                          const isExpanded = expandedPostIds.includes(post.id);
                          const isLongText = !compact && post.body && post.body.length > LONG_TEXT_LIMIT;
                          const displayedBody =
                            !isExpanded && isLongText ? post.body.substring(0, LONG_TEXT_LIMIT) + "..." : post.body;
                          return (
                            <div key={post.id} className="transition-colors hover:bg-gray-50/70">
                              {(post.pinned_at || canModerate) && (
                                <span className="flex items-center justify-between px-5 pt-3 text-xs text-gray-500">
                                  {post.pinned_at ? (
                                    <span className="inline-flex items-center gap-1 font-semibold text-gray-600">
                                      <Pin size={12} /> Disematkan oleh pembuat
                                    </span>
                                  ) : (
                                    <span />
                                  )}
                                  {canModerate && (
                                    <button
                                      type="button"
                                      disabled={pinBusyId === post.id}
                                      onClick={() => togglePin(post)}
                                      className="inline-flex items-center gap-1 border-none bg-transparent p-0 text-xs font-semibold text-gray-500 hover:text-brand"
                                    >
                                      {post.pinned_at ? (
                                        <>
                                          <PinOff size={12} /> Lepas sematan
                                        </>
                                      ) : (
                                        <>
                                          <Pin size={12} /> Sematkan
                                        </>
                                      )}
                                    </button>
                                  )}
                                </span>
                              )}
                              <PostCard
                                post={{ ...post, body: displayedBody }}
                                onLike={(postId) => api.likePost(postId)}
                                canLike={!!user}
                                onOpenComments={setOpenCommentsForPostId}
                                variant="flat"
                                plain
                                compact={compact}
                              />
                              {isLongText && (
                                <div className="-mt-1 px-5 pb-4">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpand(post.id)}
                                    className="flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-xs font-semibold text-brand hover:underline"
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
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </main>

              <aside className="hidden flex-col gap-4 lg:flex">
                <AboutCard community={community} />

                {community.rules && <RulesCard community={community} />}

                {tab !== "lowongan" && relatedJobs.length > 0 && (
                  <SideCard title="Lowongan terkait">
                    <ul className="m-0 flex list-none flex-col gap-2 p-0">
                      {relatedJobs.slice(0, 3).map((j) => (
                        <li key={j.id}>
                          <Link
                            to={`/lowongan-kerja?lowongan=${encodeURIComponent(j.id)}`}
                            className="text-sm text-gray-700 no-underline hover:text-brand"
                          >
                            <span className="font-semibold">{j.title}</span>
                            <span className="block text-xs text-gray-500">
                              {j.company_name}
                              {j.location ? ` · ${j.location}` : ""}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {relatedJobs.length > 3 && (
                      <button
                        type="button"
                        onClick={() => switchTab("lowongan")}
                        className="mt-3 border-none bg-transparent p-0 text-xs font-semibold text-brand"
                      >
                        Lihat semua {relatedJobs.length}
                      </button>
                    )}
                  </SideCard>
                )}
              </aside>
            </div>
          </>
        )}
      </div>

      {openCommentsForPostId && (
        <CommentModal
          postId={openCommentsForPostId}
          onClose={() => setOpenCommentsForPostId(null)}
          onCommentAdded={(postId) =>
            setPosts((prev) =>
              prev.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p))
            )
          }
        />
      )}
    </>
  );
}