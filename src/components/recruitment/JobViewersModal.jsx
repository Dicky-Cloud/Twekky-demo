import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, MessageCircle } from "lucide-react";
import { api } from "../../api/client";
import Modal from "../Modal";
import { Avatar, ErrorBanner } from "./StatusBadge";
import { timeAgo } from "../../constants/recruitment";

function Tile({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-center">
      <div className="text-xl font-bold leading-none">{value}</div>
      <div className="mt-1 text-[11px] text-gray-500">{label}</div>
    </div>
  );
}

// Siapa yang melihat sebuah lowongan (pengguna yang login).
export default function JobViewersModal({ job, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .jobViewers(job.id)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [job.id]);

  return (
    <Modal title={`Pelihat lowongan: ${job.title}`} onClose={onClose} maxWidth="max-w-xl">
      <ErrorBanner>{error}</ErrorBanner>
      {!data && !error && <p className="m-0 text-sm text-gray-500">Memuat...</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Tile label={`Pelihat (${data.window_days} hari)`} value={data.total_viewers} />
            <Tile label="7 hari terakhir" value={data.viewers_7d} />
            <Tile label="Sudah melamar" value={data.applied_viewers} />
            <Tile label="Anonim" value={data.anonymous_viewers} />
          </div>
          <p className="mb-4 mt-2 text-xs text-gray-400">
            Hanya pengguna yang login yang tercatat. Pengguna dengan mode anonim hanya dihitung, namanya tidak ditampilkan.
          </p>

          {!data.can_list ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              Daftar nama pelihat tersedia di paket Growth.
              <div className="mt-3">
                <Link to="/rekrutmen/paket" className="btn btn-accent btn-sm">
                  Lihat paket
                </Link>
              </div>
            </div>
          ) : data.items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-500">
              Belum ada pelihat yang bisa ditampilkan.
            </p>
          ) : (
            <ul className="m-0 list-none p-0">
              {data.items.map((v) => (
                <li key={v.viewer_id} className="flex items-center gap-3 border-b border-gray-100 py-3 last:border-0">
                  <Avatar name={v.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/pengguna/${v.viewer_id}`} className="truncate text-sm font-bold text-inherit hover:text-brand">
                        {v.name}
                      </Link>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          v.applied ? "bg-gray-100 text-gray-600" : "bg-brand text-white"
                        }`}
                      >
                        {v.applied ? "Sudah melamar" : "Belum melamar"}
                      </span>
                    </div>
                    {v.bio && <div className="truncate text-xs text-gray-500">{v.bio}</div>}
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Eye size={11} /> {v.visit_days} hari · {timeAgo(v.last_viewed_at).toLowerCase()}
                    </div>
                  </div>
                  {!v.applied && (
                    <Link to={`/pesan?ke=${v.viewer_id}`} className="btn btn-ghost btn-sm shrink-0">
                      <MessageCircle size={14} /> Pesan
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Modal>
  );
}
