import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Briefcase, ChevronLeft, MessageCircle, Palette, Search, Send } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";
import UserSearchResults, { USER_SEARCH_MIN, initialsOf } from "../components/UserSearchResults";
import ThemedBubble from "../components/bubble/ThemedBubble";
import BubbleThemePicker from "../components/bubble/BubbleThemePicker";
import { useBubbleTheme } from "../context/BubbleThemeContext";

function shortId(id) {
  return `Pengguna ${id.slice(0, 6)}`;
}

function timeShort(iso) {
  return new Date(iso).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

function dayDiff(iso) {
  return Math.round((startOfDay(new Date()) - startOfDay(new Date(iso))) / 86400000);
}

// Pemisah tanggal di dalam chat: "Hari ini", "Kemarin", atau tanggal lengkap.
function dayLabel(iso) {
  const diff = dayDiff(iso);
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Kemarin";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// Waktu singkat di daftar percakapan: jam (hari ini), "Kemarin", atau tanggal singkat.
function listTime(iso) {
  const diff = dayDiff(iso);
  if (diff === 0) return timeShort(iso);
  if (diff === 1) return "Kemarin";
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

// Pesan otomatis dari fitur lamaran: "Terkait lamaran: <posisi>\n<isi pesan>"
const APPLICATION_RE = /^Terkait lamaran:\s*([^\n]+)\n+([\s\S]*)$/;

function Avatar({ text, className = "h-11 w-11 text-sm", active = false }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${className} ${
        active ? "bg-brand text-white" : "bg-gray-200 text-gray-700"
      }`}
    >
      {text}
    </span>
  );
}

function MessageBubble({ message, mine }) {
  // gaya bubble mengikuti pilihan PENGIRIM pesan ("" = bubble bawaan)
  const themeId = useBubbleTheme(message.from_user_id);
  const match = APPLICATION_RE.exec(message.body);
  const shape = mine ? "self-end rounded-2xl rounded-br-md" : "self-start rounded-2xl rounded-bl-md";

  if (match) {
    return (
      <div className={`max-w-[85%] overflow-hidden border border-gray-200 bg-white md:max-w-[62%] ${shape}`}>
        <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-100 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
            <Briefcase size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <div className="text-xs text-gray-600">Terkait lamaran</div>
            <div className="truncate font-bold text-gray-900">{match[1].trim()}</div>
          </div>
        </div>
        <div className="whitespace-pre-wrap px-4 pb-1 pt-3 text-sm leading-relaxed text-gray-900">
          {match[2].trim()}
        </div>
        <time className="block px-4 pb-2.5 text-[11px] text-gray-500">{timeShort(message.created_at)}</time>
      </div>
    );
  }

  if (themeId) {
    return (
      <ThemedBubble
        themeId={themeId}
        side={mine ? "right" : "left"}
        className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed md:max-w-[62%] ${mine ? "self-end" : "self-start"}`}
      >
        <div className="whitespace-pre-wrap break-words">{message.body}</div>
        <time className="mt-1 block text-[11px] opacity-70">{timeShort(message.created_at)}</time>
      </ThemedBubble>
    );
  }

  return (
    <div
      className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed md:max-w-[62%] ${shape} ${
        mine ? "bg-brand text-white" : "border border-gray-200 bg-white text-gray-900"
      }`}
    >
      <div className="whitespace-pre-wrap break-words">{message.body}</div>
      <time className={`mt-1 block text-[11px] ${mine ? "text-white/75" : "text-gray-500"}`}>
        {timeShort(message.created_at)}
      </time>
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePartner, setActivePartner] = useState(null);
  // Di HP daftar percakapan tampil dulu; chat baru terbuka (layar penuh) setelah dipilih.
  // Di desktop kedua kolom selalu tampil, jadi nilai ini tidak berpengaruh.
  const [chatOpen, setChatOpen] = useState(false);
  const listRef = useRef(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  // id lawan bicara -> data singkat pengguna (nama, dll). Diisi dari hasil
  // pencarian dan dari lookup ke backend.
  const [partners, setPartners] = useState({});
  const lookedUp = useRef(new Set());

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.listMessages();
      setMessages(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const conversations = useMemo(() => {
    const map = new Map();
    for (const m of messages) {
      const partnerId = m.from_user_id === user.id ? m.to_user_id : m.from_user_id;
      const existing = map.get(partnerId);
      if (!existing || new Date(m.created_at) > new Date(existing.lastAt)) {
        map.set(partnerId, {
          partnerId,
          lastBody: m.body,
          lastAt: m.created_at,
          lastFromMe: m.from_user_id === user.id,
        });
      }
    }
    return [...map.values()].sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
  }, [messages, user.id]);

  // dibuka dari hasil pencarian di Topbar: /pesan?ke=<id pengguna>
  useEffect(() => {
    const target = searchParams.get("ke");
    if (target) {
      setActivePartner(target);
      setChatOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!activePartner && conversations.length > 0) setActivePartner(conversations[0].partnerId);
  }, [conversations, activePartner]);

  // ambil nama lawan bicara yang belum diketahui
  useEffect(() => {
    const ids = new Set(conversations.map((c) => c.partnerId));
    if (activePartner) ids.add(activePartner);
    const missing = [...ids].filter((id) => !partners[id] && !lookedUp.current.has(id));
    if (missing.length === 0) return;
    missing.forEach((id) => lookedUp.current.add(id));
    api
      .lookupUsers(missing)
      .then((list) => {
        setPartners((prev) => {
          const next = { ...prev };
          for (const u of list || []) next[u.id] = u;
          return next;
        });
      })
      .catch(() => {
        /* tidak fatal: tampilan kembali memakai ID singkat */
      });
  }, [conversations, activePartner, partners]);

  const nameOf = (id) => partners[id]?.name || shortId(id);

  const thread = useMemo(
    () =>
      messages
        .filter((m) => m.from_user_id === activePartner || m.to_user_id === activePartner)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [messages, activePartner]
  );

  // sisipkan pemisah tanggal setiap hari berganti
  const threadItems = useMemo(() => {
    const items = [];
    let lastLabel = "";
    for (const m of thread) {
      const label = dayLabel(m.created_at);
      if (label !== lastLabel) {
        items.push({ type: "day", key: `day-${m.id}`, label });
        lastLabel = label;
      }
      items.push({ type: "message", key: m.id, message: m });
    }
    return items;
  }, [thread]);

  // selalu tampilkan pesan terbaru saat chat dibuka atau ada pesan baru
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.length, activePartner, chatOpen]);

  const openChat = (id) => {
    setActivePartner(id);
    setChatOpen(true);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !activePartner) return;
    setSending(true);
    try {
      const sent = await api.sendMessage(activePartner, draft.trim());
      setMessages((prev) => [...prev, sent]);
      setDraft("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handlePickUser = (u) => {
    setPartners((prev) => ({ ...prev, [u.id]: u }));
    openChat(u.id);
    setUserQuery("");
  };

  const partnerInitials = (id) =>
    partners[id] ? initialsOf(partners[id].name) : id.slice(0, 2).toUpperCase();

  return (
    <>
      <Topbar title="Pesan" />
      <div className="w-full">
        {error && (
          <div className="m-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        {loading ? (
          <p className="p-6 text-gray-500 text-sm">Memuat pesan...</p>
        ) : (
          <div className="flex md:h-[calc(100vh-64px)]">
            {/* daftar percakapan: penuh di HP, tersembunyi saat chat dibuka */}
            <div
              className={`${chatOpen ? "hidden md:flex" : "flex"} w-full flex-col bg-white md:w-80 md:shrink-0 md:border-r md:border-gray-200`}
            >
              <div className="hidden px-5 pb-2 pt-5 text-xl font-bold tracking-tight md:block">Pesan</div>
              <div className="relative px-4 py-3 md:px-5">
                <label className="flex h-11 items-center gap-2.5 rounded-xl bg-gray-100 px-3.5 focus-within:ring-2 focus-within:ring-brand">
                  <Search size={18} strokeWidth={2} className="shrink-0 text-gray-500" />
                  <input
                    placeholder="Cari pengguna..."
                    aria-label="Cari pengguna"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                  />
                </label>
                {userQuery.trim().length >= USER_SEARCH_MIN && (
                  <UserSearchResults
                    query={userQuery}
                    onSelect={handlePickUser}
                    className="absolute left-4 right-4 top-full z-10 mt-1 md:left-5 md:right-5"
                  />
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-3 md:px-3">
                {conversations.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-gray-500">
                    <MessageCircle size={28} strokeWidth={1.75} className="mx-auto mb-2 text-gray-400" />
                    Belum ada percakapan. Cari pengguna di atas untuk mulai mengobrol.
                  </div>
                ) : (
                  conversations.map((c) => {
                    const active = activePartner === c.partnerId;
                    return (
                      <button
                        key={c.partnerId}
                        onClick={() => openChat(c.partnerId)}
                        className={`mb-0.5 flex w-full cursor-pointer items-center gap-3 rounded-2xl border-0 px-3 py-3 text-left transition-colors ${
                          active ? "bg-transparent md:bg-gray-100" : "bg-transparent hover:bg-gray-50"
                        }`}
                      >
                        <Avatar
                          text={partnerInitials(c.partnerId)}
                          active={active}
                          className="h-12 w-12 text-base"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-2 text-[15px] font-semibold text-gray-900">
                            <span className="truncate">{nameOf(c.partnerId)}</span>
                            <span className="shrink-0 text-xs font-normal text-gray-500">{listTime(c.lastAt)}</span>
                          </div>
                          <div className="mt-0.5 truncate text-sm text-gray-500">
                            {c.lastFromMe && <span className="text-gray-700">Anda: </span>}
                            {c.lastBody}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* chat: di HP menutupi layar penuh (termasuk bar bawah), di desktop kolom tengah */}
            <div
              className={`${
                chatOpen ? "fixed inset-0 z-50 flex h-dvh md:static md:z-auto md:h-auto" : "hidden md:flex"
              } min-w-0 flex-1 flex-col bg-gray-50`}
            >
              {activePartner ? (
                <>
                  <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-2 py-2.5 md:px-6 md:py-3.5">
                    <button
                      type="button"
                      onClick={() => setChatOpen(false)}
                      aria-label="Kembali ke daftar pesan"
                      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-gray-800 hover:bg-gray-100 md:hidden"
                    >
                      <ChevronLeft size={26} strokeWidth={2} />
                    </button>
                    <Link
                      to={`/pengguna/${activePartner}`}
                      className="flex min-w-0 flex-1 items-center gap-3 text-gray-900 no-underline"
                    >
                      <Avatar text={partnerInitials(activePartner)} active className="h-10 w-10 text-sm" />
                      <span className="truncate text-base font-bold">{nameOf(activePartner)}</span>
                    </Link>
                    <Link to={`/pengguna/${activePartner}`} className="btn btn-ghost btn-sm hidden md:inline-flex">
                      Lihat profil
                    </Link>
                  </div>

                  <div ref={listRef} className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-5 md:px-10">
                    {threadItems.length === 0 ? (
                      <div className="py-6 text-center text-sm text-gray-500">Belum ada pesan. Sapa duluan!</div>
                    ) : (
                      threadItems.map((item) =>
                        item.type === "day" ? (
                          <div
                            key={item.key}
                            className="my-1 self-center rounded-full bg-gray-200 px-3.5 py-1 text-xs text-gray-700"
                          >
                            {item.label}
                          </div>
                        ) : (
                          <MessageBubble
                            key={item.key}
                            message={item.message}
                            mine={item.message.from_user_id === user.id}
                          />
                        )
                      )
                    )}
                  </div>

                  <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2.5 border-t border-gray-200 bg-white px-3 pt-3 md:px-6 md:py-4"
                    style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
                  >
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      aria-label="Gaya bubble chat"
                      title="Gaya bubble chat"
                      className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    >
                      <Palette size={18} strokeWidth={2} />
                    </button>
                    <input
                      placeholder="Tulis pesan..."
                      aria-label="Tulis pesan"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:ring-2 focus:ring-brand"
                    />
                    <button
                      className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-brand px-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 md:px-5"
                      type="submit"
                      disabled={sending || !draft.trim()}
                      aria-label="Kirim"
                    >
                      <span className="hidden md:inline">Kirim</span>
                      <Send size={16} strokeWidth={2} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-gray-500">
                  <MessageCircle size={32} strokeWidth={1.75} className="text-gray-400" />
                  Pilih atau mulai percakapan di sebelah kiri.
                </div>
              )}
            </div>

            {/* panel info lawan bicara: hanya di layar lebar */}
            {activePartner && (
              <aside className="hidden w-72 shrink-0 flex-col items-center gap-1 border-l border-gray-200 bg-white px-5 py-8 xl:flex">
                <Avatar text={partnerInitials(activePartner)} active className="h-20 w-20 text-3xl" />
                <div className="mt-3 text-center text-[17px] font-bold">{nameOf(activePartner)}</div>
                <Link to={`/pengguna/${activePartner}`} className="btn btn-ghost btn-sm mt-4 w-full">
                  Lihat profil
                </Link>
              </aside>
            )}
          </div>
        )}
      </div>
      {pickerOpen && <BubbleThemePicker onClose={() => setPickerOpen(false)} />}
    </>
  );
}