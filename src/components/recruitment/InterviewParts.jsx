import { MapPin, Phone, Video } from "lucide-react";
import { INTERVIEW_MODE_MAP, INTERVIEW_STATUS, isHttpUrl } from "../../constants/hiring";

const MODE_ICONS = { online: Video, onsite: MapPin, phone: Phone };

export function InterviewStatusBadge({ status }) {
  const s = INTERVIEW_STATUS[status] || INTERVIEW_STATUS.pending;
  return (
    <span className={`inline-block rounded-full text-[11px] font-bold px-2.5 py-0.5 whitespace-nowrap ${s.badge}`}>
      {s.label}
    </span>
  );
}

// Cara wawancara + lokasi/tautan/nomor. Tautan hanya aktif bila http(s).
export function InterviewWhere({ iv }) {
  const mode = INTERVIEW_MODE_MAP[iv.mode];
  const Icon = MODE_ICONS[iv.mode] || MapPin;
  return (
    <span className="flex items-start gap-1.5 text-sm text-gray-600 min-w-0">
      <Icon size={15} className="shrink-0 mt-0.5 text-gray-400" />
      <span className="min-w-0 break-words">
        <span className="font-medium">{mode?.label || iv.mode}</span>
        {" · "}
        {isHttpUrl(iv.location) ? (
          <a href={iv.location.trim()} target="_blank" rel="noopener noreferrer" className="text-accent underline">
            {iv.location.trim()}
          </a>
        ) : (
          iv.location
        )}
      </span>
    </span>
  );
}
