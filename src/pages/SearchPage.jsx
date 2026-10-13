import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search as SearchIcon,
  Users,
  BadgeCheck,
  Building2,
  Heart,
  MessageCircle,
  MapPin,
} from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";
import MoodBadge, { MOOD_LABELS } from "../components/MoodBadge";
import { initialsOf } from "../components/UserSearchResults";
import { topicLabel } from "../constants/topics";
import { includesText, splitHighlight, snippetAround, timeAgo } from "../utils/searchText";

const TABS = [
  { key: "semua", label: "Semua" },
  { key: "orang", label: "Orang" },
  { key: "post", label: "Post" },
  { key: "komunitas", label: "Komunitas" },
  { key: "lowongan", label: "Lowongan" },
];

const PREVIEW_COUNT = 3; // jumlah hasil per bagian di tab "Semua"
const MAX_PER_TAB = 30;

const JOB_TYPES = [
  { value: "", label: "Semua tipe" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
];

const PEOPLE_FILTERS = [
  { value: "", label: "Semua" },
  { value: "business", label: "Akun bisnis" },
  { value: "verified", label: "Terverifikasi" },
];

const EMPTY = { people: [], posts: [], communities: [], jobs: [] };

function Highlight({ text, q }) {
  return splitHighlight(text, q).map((seg, i) =>
    seg.hit ? (
      <mark key={i} className="rounded-sm bg-yellow-100 px-0.5 text-inherit">
        {seg.text}
      </mark>
    ) : (
      <span key={i}>{seg.text}</span>
    )
  );
}

function Chips({ options, value, onChange }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full border px-3 py-1 text-[13px] font-medium cursor-pointer ${
            value === o.value
              ? "border-brand bg-brand text-white"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Section({ title, count, onSeeAll, error, children }) {
  return (
    <section className="card">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="m-0 text-base">
          {title} <span className="text-sm font-normal text-gray-400">({count})</span>
        </h3>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="border-0 bg-transparent p-0 text-sm font-semibold text-brand cursor-pointer"
          >
            Lihat semua
          </button>
        )}
      </div>
      {error && <p className="m-0 mb-2 text-sm text-danger">{error}</p>}
      <div className="divide-y divide-gray-100">{children}</div>
    </section>
  );
}

function PersonRow({ u, q }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Link to={`/pengguna/${encodeURIComponent(u.id)}`} className="flex min-w-0 flex-1 items-center gap-3 text-inherit no-underline">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
        {initialsOf(u.name)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[15px] font-semibold">
          <span className="truncate">
            <Highlight text={u.name} q={q} />
          </span>
          {u.verification_status === "verified" && (
            <BadgeCheck size={15} className="shrink-0 text-brand" aria-label="Terverifikasi" />
          )}
          {u.is_pro && (
            <span className="shrink-0 rounded bg-brand-soft px-1.5 py-px text-[10px] font-bold text-brand">PRO</span>
          )}
        </div>
        <div className="flex items-center gap-1 truncate text-sm text-gray-500">
          {u.account_type === "business" && u.company_name ? (
            <>
              <Building2 size={13} className="shrink-0" />
              <span className="truncate">{u.company_name}</span>
            </>
          ) : (
            <span className="truncate">{u.bio || "Pengguna Twekky"}</span>
          )}
        </div>
      </div>
      </Link>
      <Link to={`/pesan?ke=${encodeURIComponent(u.id)}`} className="btn-ghost btn-sm no-underline">
        Kirim pesan
      </Link>
    </div>
  );
}

function PostRow({ p, q }) {
  return (
    <Link
      to={`/post/${p.id}`}
      className="-mx-2 block rounded-lg px-2 py-3 text-inherit no-underline hover:bg-gray-50"
    >
      <div className="mb-1 flex items-center gap-2">
        <MoodBadge mood={p.mood} />
        <span className="text-xs text-gray-400">
          {p.is_anonymous ? "Anonim" : p.author_name} · {timeAgo(p.created_at)}
        </span>
      </div>
      <div className="text-[15px] font-semibold">
        <Highlight text={p.title} q={q} />
      </div>
      <p className="m-0 mt-0.5 text-sm leading-relaxed text-gray-600">
        <Highlight text={snippetAround(p.body, q)} q={q} />
      </p>
      <div className="mt-1.5 flex items-center gap-4 text-xs text-gray-400">
        <span className="inline-flex items-center gap-1">
          <Heart size={12} /> {p.likes || 0}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle size={12} /> {p.comment_count || 0}
        </span>
      </div>
    </Link>
  );
}

function CommunityRow({ c, q }) {
  return (
    <Link
      to={`/komunitas/${c.id}`}
      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 text-inherit no-underline hover:bg-gray-50"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
        <Users size={20} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold">
          <Highlight text={c.name} q={q} />
        </div>
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
          <span>{c.member_count} anggota</span>
          {c.topic && (
            <span className="rounded-full bg-brand-soft px-2 py-0.5 font-medium text-brand">
              {topicLabel(c.topic)}
            </span>
          )}
        </div>
        <p className="m-0 mt-0.5 truncate text-sm text-gray-500">
          <Highlight text={c.description || "Belum ada deskripsi."} q={q} />
        </p>
      </div>
    </Link>
  );
}

function JobRow({ j, q }) {
  return (
    <Link
      to="/lowongan-kerja"
      className="-mx-2 block rounded-lg px-2 py-3 text-inherit no-underline hover:bg-gray-50"
    >
      <div className="mb-1 flex items-center gap-2 text-xs">
        <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">{j.type}</span>
        <span className="text-gray-400">{timeAgo(j.created_at)}</span>
        {j.is_verified && (
          <span className="inline-flex items-center gap-1 font-semibold text-brand">
            <BadgeCheck size={13} /> Terverifikasi
          </span>
        )}
      </div>
      <div className="text-[15px] font-semibold">
        <Highlight text={j.title} q={q} />
      </div>
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <Building2 size={13} className="shrink-0" />
        <Highlight text={j.company_name} q={q} />
        <span className="text-gray-300">·</span>
        <MapPin size={13} className="shrink-0" />
        {j.location || "Remote"}
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const tab = TABS.some((t) => t.key === params.get("tab")) ? params.get("tab") : "semua";

  const [draft, setDraft] = useState(q);
  const [data, setData] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | done
  const [moodFilter, setMoodFilter] = useState("");
  const [jobType, setJobType] = useState("");
  const [peopleFilter, setPeopleFilter] = useState("");
  const seq = useRef(0);

  useEffect(() => setDraft(q), [q]);

  useEffect(() => {
    if (!q) {
      seq.current += 1;
      setStatus("idle");
      return;
    }
    const mine = ++seq.current;
    setStatus("loading");
    (async () => {
      const [people, posts, communities, jobs] = await Promise.allSettled([
        user ? api.searchUsers(q) : Promise.resolve([]),
        api.listFeed(),
        api.listCommunities(),
        api.listJobs("", q),
      ]);
      if (seq.current !== mine) return;

      const errs = {};
      const take = (result, key) => {
        if (result.status === "fulfilled") return Array.isArray(result.value) ? result.value : [];
        errs[key] = result.reason?.message || "Gagal memuat hasil";
        return [];
      };
      setData({
        people: take(people, "people"),
        posts: take(posts, "posts").filter((p) => includesText(p.title, q) || includesText(p.body, q)),
        communities: take(communities, "communities").filter(
          (c) => includesText(c.name, q) || includesText(c.description, q) || includesText(topicLabel(c.topic), q)
        ),
        jobs: take(jobs, "jobs"),
      });
      setErrors(errs);
      setStatus("done");
    })();
  }, [q, user]);

  const filtered = useMemo(
    () => ({
      people: data.people.filter((u) =>
        peopleFilter === "business"
          ? u.account_type === "business"
          : peopleFilter === "verified"
          ? u.verification_status === "verified"
          : true
      ),
      posts: data.posts.filter((p) => !moodFilter || p.mood === moodFilter),
      communities: data.communities,
      jobs: data.jobs.filter((j) => !jobType || j.type === jobType),
    }),
    [data, peopleFilter, moodFilter, jobType]
  );

  const counts = {
    orang: filtered.people.length,
    post: filtered.posts.length,
    komunitas: filtered.communities.length,
    lowongan: filtered.jobs.length,
  };
  const totalAll = data.people.length + data.posts.length + data.communities.length + data.jobs.length;

  const submit = (e) => {
    e.preventDefault();
    const next = draft.trim();
    if (!next) return;
    setParams({ q: next, tab });
  };
  const goTab = (key) => setParams({ q, tab: key });

  const rowsFor = (key) => {
    const limit = tab === "semua" ? PREVIEW_COUNT : MAX_PER_TAB;
    if (key === "orang") return filtered.people.slice(0, limit).map((u) => <PersonRow key={u.id} u={u} q={q} />);
    if (key === "post") return filtered.posts.slice(0, limit).map((p) => <PostRow key={p.id} p={p} q={q} />);
    if (key === "komunitas")
      return filtered.communities.slice(0, limit).map((c) => <CommunityRow key={c.id} c={c} q={q} />);
    return filtered.jobs.slice(0, limit).map((j) => <JobRow key={j.id} j={j} q={q} />);
  };

  const sectionTitle = { orang: "Orang", post: "Post", komunitas: "Komunitas", lowongan: "Lowongan" };
  const errorKey = { orang: "people", post: "posts", komunitas: "communities", lowongan: "jobs" };

  const renderSection = (key) => {
    const count = counts[key];
    const isAll = tab === "semua";
    if (isAll && count === 0 && !errors[errorKey[key]] && !(key === "orang" && !user)) return null;

    return (
      <Section
        key={key}
        title={sectionTitle[key]}
        count={count}
        error={errors[errorKey[key]]}
        onSeeAll={isAll && count > PREVIEW_COUNT ? () => goTab(key) : undefined}
      >
        {key === "orang" && !user ? (
          <p className="m-0 py-3 text-sm text-gray-500">
            <Link to="/login" className="font-semibold text-brand">
              Masuk
            </Link>{" "}
            untuk mencari orang lain di Twekky.
          </p>
        ) : count === 0 ? (
          <p className="m-0 py-3 text-sm text-gray-500">Tidak ada {sectionTitle[key].toLowerCase()} yang cocok.</p>
        ) : (
          rowsFor(key)
        )}
        {!isAll && count > MAX_PER_TAB && (
          <p className="m-0 pt-3 text-xs text-gray-400">
            Menampilkan {MAX_PER_TAB} teratas dari {count}. Perjelas kata kunci untuk mempersempit hasil.
          </p>
        )}
      </Section>
    );
  };

  return (
    <>
      <Topbar title="Cari" />
      {/* Diubah dari max-w-4xl menjadi w-full agar mengisi lebar penuh */}
      <div className="w-full px-6 py-6 lg:px-8">
        <form onSubmit={submit} className="mb-5 flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-gray-500 focus-within:ring-2 focus-within:ring-brand">
            <SearchIcon size={18} strokeWidth={2} className="shrink-0" />
            <input
              type="text"
              autoFocus={!q}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Cari orang, post, komunitas, atau lowongan..."
              className="w-full bg-transparent text-[15px] text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>
          <button type="submit" className="btn-accent">
            Cari
          </button>
        </form>

        {!q ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
            Ketik kata kunci lalu tekan Enter untuk mencari orang, post, komunitas, dan lowongan kerja di Twekky.
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-1 border-b border-gray-200">
              {TABS.map((t) => {
                const active = tab === t.key;
                const n = t.key === "semua" ? totalAll : counts[t.key];
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => goTab(t.key)}
                    className={`-mb-px border-0 border-b-2 bg-transparent px-3.5 pb-2.5 pt-1 text-sm font-semibold cursor-pointer ${
                      active ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {t.label}
                    {status === "done" && <span className="ml-1.5 text-xs font-medium text-gray-400">{n}</span>}
                  </button>
                );
              })}
            </div>

            {tab === "orang" && user && <Chips options={PEOPLE_FILTERS} value={peopleFilter} onChange={setPeopleFilter} />}
            {tab === "post" && (
              <Chips
                options={[{ value: "", label: "Semua" }, ...Object.entries(MOOD_LABELS).map(([value, label]) => ({ value, label }))]}
                value={moodFilter}
                onChange={setMoodFilter}
              />
            )}
            {tab === "lowongan" && <Chips options={JOB_TYPES} value={jobType} onChange={setJobType} />}

            {status === "loading" && <p className="text-sm text-gray-500">Mencari &ldquo;{q}&rdquo;...</p>}

            {status === "done" && (
              <>
                {tab === "semua" && totalAll === 0 && Object.keys(errors).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
                    <p className="m-0 font-semibold">Tidak ada hasil untuk &ldquo;{q}&rdquo;</p>
                    <p className="m-0 mt-1 text-sm text-gray-500">
                      Periksa ejaannya, atau coba kata kunci yang lebih umum.
                    </p>
                  </div>
                ) : tab === "semua" ? (
                  <div className="space-y-4">
                    {["orang", "post", "komunitas", "lowongan"].map(renderSection)}
                  </div>
                ) : (
                  renderSection(tab)
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}