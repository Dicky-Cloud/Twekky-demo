const MOOD_LABELS = {
  curhat: "Curhat",
  sindiran: "Sindiran",
  positif: "Positif",
  diskusi: "Diskusi",
};

// Explicit class strings (not `bg-mood-${mood}` template literals) so
// Tailwind's content scanner can actually find and keep them.
const MOOD_CLASSES = {
  curhat: "bg-mood-curhat",
  sindiran: "bg-mood-sindiran",
  positif: "bg-mood-positif",
  diskusi: "bg-mood-diskusi",
};

export default function MoodBadge({ mood }) {
  const label = MOOD_LABELS[mood] || mood;
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${
        MOOD_CLASSES[mood] || "bg-gray-400"
      }`}
    >
      #{label}
    </span>
  );
}

export { MOOD_LABELS, MOOD_CLASSES };
