import { Zap } from "lucide-react";
import { STATUS_MAP } from "../../constants/recruitment";

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.new;
  return (
    <span className={`inline-block rounded-full text-[11px] font-bold px-2.5 py-0.5 whitespace-nowrap ${s.badge}`}>
      {s.label}
    </span>
  );
}

export function JobStatusBadge({ status }) {
  const closed = status === "closed";
  return (
    <span
      className={`inline-block rounded-full text-[11px] font-bold px-2.5 py-0.5 ${
        closed ? "bg-gray-100 text-gray-500" : "bg-green-50 text-success"
      }`}
    >
      {closed ? "Ditutup" : "Aktif"}
    </span>
  );
}

export function BoostedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-0.5">
      <Zap size={11} fill="currentColor" /> Disorot
    </span>
  );
}

export function Avatar({ name, size = "md" }) {
  const dims = size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";
  const text = (name || "?")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={`flex items-center justify-center rounded-full bg-brand-soft text-brand font-bold shrink-0 ${dims}`}>
      {text || "?"}
    </span>
  );
}

export function ErrorBanner({ children }) {
  if (!children) return null;
  return (
    <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
      {children}
    </div>
  );
}
