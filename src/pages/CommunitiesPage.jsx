import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Lock, Search, Plus } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCommunities } from "../context/CommunityContext";
import { TOPICS, topicLabel, topicColor } from "../constants/topics";
import Topbar from "../components/Topbar";
import CommunityJoinButton from "../components/CommunityJoinButton";
import CreateCommunityModal from "../components/CreateCommunityModal";

const SORTS = [
  { key: "populer", label: "Populer" },
  { key: "terbaru", label: "Terbaru" },
];

function applyFilters(list, { topic, sort, query }) {
  const q = query.trim().toLowerCase();
  const out = list.filter(
    (c) =>
      (!topic || c.topic === topic) &&
      (!q || `${c.name} ${c.description || ""}`.toLowerCase().includes(q))
  );
  if (sort === "terbaru") {
    return out.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return out.sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
}

export default function CommunitiesPage() {
  const { user } = useAuth();
  const { refresh: refreshJoined } = useCommunities();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [topic, setTopic] = useState("");
  const [sort, setSort] = useState("populer");
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.listCommunities();
      setCommunities(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const replaceCommunity = (updated) =>
    setCommunities((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

  const visible = useMemo(
    () => applyFilters([...communities], { topic, sort, query }),
    [communities, topic, sort, query]
  );

  // Chip topik hanya untuk topik yang punya komunitas, supaya tidak ada pilihan kosong.
  const topicsInUse = useMemo(
    () => TOPICS.filter((t) => communities.some((c) => c.topic === t.slug)),
    [communities]
  );

  const chip = (active) =>
    `shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
      active
        ? "border-gray-900 bg-gray-900 text-white"
        : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
    }`;

  return (
    <>
      <Topbar title="Komunitas" />
      <div className="box-border w-full p-6 lg:p-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="m-0 text-xl font-bold text-gray-900">Komunitas</h1>
            <p className="m-0 mt-1 text-sm text-gray-500">
              Temukan tempat berdiskusi sesuai bidang kerjamu.
            </p>
          </div>
          {user && (
            <button type="button" className="btn btn-accent" onClick={() => setShowCreate(true)}>
              <Plus size={16} strokeWidth={2.5} /> Buat komunitas
            </button>
          )}
        </div>

        <div className="relative mb-3">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari komunitas"
            aria-label="Cari komunitas"
            className="field-input w-full pl-9"
          />
        </div>

        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap" role="group" aria-label="Filter topik">
          <button type="button" aria-pressed={!topic} className={chip(!topic)} onClick={() => setTopic("")}>
            Semua
          </button>
          {topicsInUse.map((t) => (
            <button
              key={t.slug}
              type="button"
              aria-pressed={topic === t.slug}
              className={chip(topic === t.slug)}
              onClick={() => setTopic(topic === t.slug ? "" : t.slug)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center gap-2 text-xs text-gray-500" role="group" aria-label="Urutkan komunitas">
          <span>Urutkan:</span>
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              aria-pressed={sort === s.key}
              onClick={() => setSort(s.key)}
              className={`border-none bg-transparent p-0 text-xs font-semibold ${
                sort === s.key ? "text-gray-900 underline underline-offset-4" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mb-4 text-sm text-gray-500">Memuat komunitas...</p>
        ) : communities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-500">
            Belum ada komunitas. Jadilah yang pertama membuatnya.
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-500">
            Tidak ada komunitas yang cocok.{" "}
            <button
              type="button"
              className="border-none bg-transparent p-0 font-semibold text-brand"
              onClick={() => {
                setQuery("");
                setTopic("");
              }}
            >
              Hapus filter
            </button>
          </div>
        ) : (
          <ul className="m-0 grid list-none grid-cols-1 gap-0 p-0 divide-y divide-gray-100 sm:gap-3 sm:divide-y-0 md:grid-cols-2 md:divide-y-0 xl:grid-cols-3">
            {visible.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-3 bg-white py-4 sm:rounded-2xl sm:border sm:border-gray-200 sm:p-4 sm:shadow-sm"
              >
                <Link to={`/komunitas/${c.id}`} className="flex min-w-0 items-start gap-3 no-underline">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${topicColor(
                      c.topic
                    )}`}
                    aria-hidden="true"
                  >
                    {c.name.trim().slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="m-0 truncate text-base font-bold text-gray-900 hover:text-brand">{c.name}</h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} /> {c.member_count} anggota
                      </span>
                      {c.topic && (
                        <span className={`rounded-md px-1.5 py-0.5 font-semibold ${topicColor(c.topic)}`}>
                          {topicLabel(c.topic)}
                        </span>
                      )}
                      {c.join_type === "approval" && (
                        <span className="inline-flex items-center gap-1">
                          <Lock size={11} strokeWidth={2.5} /> Perlu persetujuan
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <p className="m-0 truncate text-sm text-gray-600">{c.description || "Belum ada deskripsi."}</p>
                <div className="mt-auto flex justify-end">
                  <CommunityJoinButton community={c} onCommunityChange={replaceCommunity} onError={setError} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showCreate && (
        <CreateCommunityModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => {
            setCommunities((prev) => [c, ...prev]);
            refreshJoined(); // pembuat otomatis anggota
            setShowCreate(false);
          }}
        />
      )}
    </>
  );
}