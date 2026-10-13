import { useState } from "react";
import { Star } from "lucide-react";

// Bintang tampilan (hanya baca). `value` boleh desimal, mis. 4.3:
// bintang terakhir terisi sebagian.
export function Stars({ value = 0, size = 16, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`${value} dari 5 bintang`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} strokeWidth={0} fill="currentColor" className="absolute inset-0 text-gray-300" />
            <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} strokeWidth={0} fill="currentColor" className="text-amber-400" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

// Pemilih bintang (1-5) untuk form ulasan.
export function StarInput({ value, onChange, size = 30 }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="inline-flex gap-1" role="radiogroup" aria-label="Penilaian" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} bintang`}
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          className="p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Star
            size={size}
            strokeWidth={0}
            fill="currentColor"
            className={i <= shown ? "text-amber-400" : "text-gray-300"}
          />
        </button>
      ))}
    </div>
  );
}
