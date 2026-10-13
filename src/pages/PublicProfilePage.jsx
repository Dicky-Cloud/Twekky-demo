import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Building2, MessageCircle, EyeOff, Eye } from "lucide-react";
import { api, profileImageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";
import FollowListModal from "../components/profile/FollowListModal";

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

// Profil publik pengguna lain (/pengguna/:id). Membuka halaman ini mencatat
// kunjungan lewat POST /api/profile/view; server yang menentukan apakah
// kunjungan dihitung (profil sendiri dan pasangan yang diblokir dilewati).
export default function PublicProfilePage() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | missing | error
  const recorded = useRef("");

  useEffect(() => {
    if (!id || id === me?.id) return undefined;
    let cancelled = false;
    setStatus("loading");
    api
      .lookupUsers([id])
      .then((list) => {
        if (cancelled) return;
        const found = (list || [])[0];
        if (!found) {
          setStatus("missing");
          return;
        }
        setPerson(found);
        setStatus("ok");
        // sekali per profil; ref menjaga dari efek ganda React StrictMode
        if (recorded.current !== id) {
          recorded.current = id;
          api.recordProfileView(id);
        }
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [id, me?.id]);

  // jumlah pengikut / mengikuti dan status ikuti untuk akun ini
  // followers/following berisi id pengguna; jumlahnya dari panjang daftar, daftarnya tampil di modal
  const [fstat, setFstat] = useState({ followers: [], following: [], is_following: false });
  const [followModal, setFollowModal] = useState(null); // null | "followers" | "following"
  const [busyFollow, setBusyFollow] = useState(false);
  useEffect(() => {
    if (!person?.id || person.id === me?.id) return;
    api
      .followStats(person.id)
      .then((st) =>
        setFstat({
          followers: st.followers || [],
          following: st.following || [],
          is_following: !!st.is_following,
        })
      )
      .catch(() => {});
  }, [person?.id, me?.id]);

  // ikuti / berhenti ikuti: tampilan langsung berubah, dikembalikan bila server menolak
  const toggleFollow = async () => {
    if (busyFollow || !person) return;
    setBusyFollow(true);
    const on = !fstat.is_following;
    const mine = me?.id;
    const apply = (isOn) =>
      setFstat((f) => ({
        ...f,
        is_following: isOn,
        followers: isOn
          ? f.followers.includes(mine)
            ? f.followers
            : [...f.followers, mine]
          : f.followers.filter((x) => x !== mine),
      }));
    apply(on);
    try {
      await (on ? api.followUser(person.id) : api.unfollowUser(person.id));
    } catch {
      apply(!on);
    } finally {
      setBusyFollow(false);
    }
  };

  if (id === me?.id) return <Navigate to="/profil" replace />;

  const isBusiness = person?.account_type === "business";

  return (
    <div className="min-h-screen pb-12">
      <Topbar title="Profil" />
      <div className="mx-auto w-full max-w-3xl px-4 pt-6 sm:px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 bg-transparent border-none p-0 text-sm text-gray-500 cursor-pointer hover:text-brand"
        >
          <ArrowLeft size={15} /> Kembali
        </button>

        {status === "loading" && <p className="text-sm text-gray-500">Memuat profil...</p>}
        {status === "missing" && <p className="text-sm text-gray-700">Pengguna tidak ditemukan.</p>}
        {status === "error" && <p className="text-sm text-danger">Gagal memuat profil. Coba lagi nanti.</p>}

        {status === "ok" && person && (
          <>
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="h-28 overflow-hidden bg-gradient-to-br from-brand via-[#3a3a3a] to-[#6b6b6b] sm:h-36">
                {person.banner && (
                  <img src={profileImageUrl(person.banner)} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="px-5 pb-6 sm:px-8">
                <div className="-mt-10 flex items-end justify-between gap-3 sm:-mt-12">
                  {person.avatar ? (
                    <img
                      src={profileImageUrl(person.avatar)}
                      alt={person.name}
                      className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-md sm:h-24 sm:w-24"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand to-[#6b6b6b] text-2xl font-bold text-white ring-4 ring-white shadow-md sm:h-24 sm:w-24">
                      {initialsOf(person.name)}
                    </div>
                  )}
                  <div className="mb-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleFollow}
                      disabled={busyFollow}
                      className={`btn btn-sm ${fstat.is_following ? "btn-ghost" : "btn-accent"}`}
                    >
                      {fstat.is_following ? "Mengikuti" : "Ikuti"}
                    </button>
                    <Link to={`/pesan?ke=${person.id}`} className="btn btn-accent btn-sm no-underline">
                      <MessageCircle size={14} /> Kirim Pesan
                    </Link>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <h1 className="m-0 break-words text-xl font-bold text-gray-900">{person.name}</h1>
                  {person.verification_status === "verified" && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-success px-2.5 py-0.5 text-[11px] font-bold text-success">
                      <BadgeCheck size={12} /> Terverifikasi
                    </span>
                  )}
                  {person.is_pro && (
                    <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-white">Pro</span>
                  )}
                  {isBusiness && (
                    <span className="rounded-md bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand">Bisnis</span>
                  )}
                  <div className="flex items-center gap-4 text-sm sm:ml-2">
                    <button
                      type="button"
                      onClick={() => setFollowModal("followers")}
                      className="cursor-pointer border-none bg-transparent p-0 text-gray-500 hover:text-gray-900"
                    >
                      <b className="text-gray-900">{fstat.followers.length}</b> Pengikut
                    </button>
                    <button
                      type="button"
                      onClick={() => setFollowModal("following")}
                      className="cursor-pointer border-none bg-transparent p-0 text-gray-500 hover:text-gray-900"
                    >
                      <b className="text-gray-900">{fstat.following.length}</b> Mengikuti
                    </button>
                  </div>
                </div>
                {isBusiness && person.company_name && (
                  <p className="m-0 mt-1 inline-flex items-center gap-1.5 text-[13px] text-gray-500">
                    <Building2 size={14} /> {person.company_name}
                  </p>
                )}
                <p className="m-0 mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {person.bio?.trim() || "Pengguna ini belum menulis bio."}
                </p>

              </div>
            </section>

            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-gray-500">
              {me?.profile_view_anonymous ? (
                <>
                  <EyeOff size={14} className="mt-0.5 shrink-0" />
                  Mode anonim aktif: pemilik profil hanya melihat bahwa ada pengunjung anonim.
                </>
              ) : (
                <>
                  <Eye size={14} className="mt-0.5 shrink-0" />
                  Kunjunganmu tercatat di profil ini. Aktifkan Mode Anonim di Pengaturan &gt; Privasi bila tidak ingin
                  identitasmu terlihat.
                </>
              )}
            </p>
          </>
        )}
      </div>

      {followModal && (
        <FollowListModal
          key={followModal}
          type={followModal}
          ids={fstat[followModal]}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  );
}