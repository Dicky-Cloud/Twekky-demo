import { Check, X } from "lucide-react";

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

// Daftar permintaan bergabung yang menunggu keputusan pembuat komunitas.
export default function JoinRequestsPanel({ requests, busyUserId, onApprove, onReject }) {
  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 text-gray-500 text-sm text-center py-8">
        Tidak ada permintaan yang menunggu.
      </div>
    );
  }

  return requests.map((req) => {
    const busy = busyUserId === req.user_id;
    return (
      <div
        key={req.user_id}
        className="flex items-start gap-3.5 rounded-xl border border-gray-200 bg-white p-4 mb-3"
      >
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-soft text-brand text-sm font-bold shrink-0">
          {(req.user_name || "?").slice(0, 1).toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold truncate">{req.user_name}</span>
            <time className="text-xs text-gray-500 shrink-0">{timeAgo(req.created_at)}</time>
          </div>
          <p
            className={`m-0 mt-0.5 text-sm whitespace-pre-line break-words ${
              req.message ? "text-gray-700" : "text-gray-400 italic"
            }`}
          >
            {req.message || "Tidak ada pesan."}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onReject(req)}
            disabled={busy}
          >
            <X size={14} strokeWidth={2.5} /> Tolak
          </button>
          <button
            className="btn btn-accent btn-sm"
            onClick={() => onApprove(req)}
            disabled={busy}
          >
            <Check size={14} strokeWidth={2.5} /> Terima
          </button>
        </div>
      </div>
    );
  });
}
