import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import Modal from "../Modal";

const LOOKUP_MAX = 50; // batas id per permintaan lookup di server

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

// Daftar pengikut / yang diikuti dalam bentuk modal.
// type: "followers" | "following"; ids: id pengguna yang akan ditampilkan.
// canUnfollow (hanya untuk daftar "Mengikuti" milik sendiri): tampilkan tombol berhenti ikuti.
// onUnfollow(id): dipanggil setelah berhasil berhenti mengikuti, supaya jumlahnya ikut berubah.
export default function FollowListModal({ type, ids, canUnfollow = false, onUnfollow, onClose }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const title = type === "followers" ? "Pengikut" : "Mengikuti";

  // dimuat sekali saat modal dibuka (id awal); perubahan setelahnya diurus lokal
  useEffect(() => {
    if (!ids || ids.length === 0) {
      setLoading(false);
      return undefined;
    }
    let alive = true;
    const chunks = [];
    for (let i = 0; i < ids.length; i += LOOKUP_MAX) chunks.push(ids.slice(i, i + LOOKUP_MAX));
    Promise.all(chunks.map((c) => api.lookupUsers(c)))
      .then((parts) => alive && setPeople(parts.flat().filter(Boolean)))
      .catch(() => alive && setError("Gagal memuat daftar. Coba lagi nanti."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUnfollow = async (id) => {
    if (busyId) return;
    setBusyId(id);
    setError("");
    try {
      await api.unfollowUser(id);
      setPeople((list) => list.filter((p) => p.id !== id));
      onUnfollow?.(id);
    } catch {
      setError("Gagal berhenti mengikuti. Coba lagi.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <Modal title={title} onClose={onClose}>
      {error && <p className="m-0 mb-3 text-sm text-danger">{error}</p>}
      {loading ? (
        <p className="m-0 text-sm text-gray-500">Memuat...</p>
      ) : people.length === 0 ? (
        <p className="m-0 py-6 text-center text-sm text-gray-500">
          {type === "followers" ? "Belum ada pengikut." : "Belum mengikuti siapa pun."}
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {people.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2.5">
              <Link
                to={`/pengguna/${p.id}`}
                onClick={onClose}
                className="flex min-w-0 flex-1 items-center gap-3 no-underline"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                  {initialsOf(p.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-gray-900">{p.name}</span>
                  {p.bio && <span className="block truncate text-xs text-gray-500">{p.bio}</span>}
                </span>
              </Link>
              {canUnfollow && type === "following" && (
                <button
                  type="button"
                  onClick={() => handleUnfollow(p.id)}
                  disabled={busyId === p.id}
                  className="btn btn-ghost btn-sm shrink-0"
                >
                  Mengikuti
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
