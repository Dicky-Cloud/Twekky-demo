import { useId, useState } from "react";
import { Plus, X } from "lucide-react";

// Daftar chip yang bisa ditambah/dihapus (keahlian, posisi, lokasi, perusahaan).
export default function ChipField({ items, onChange, addLabel = "Tambah", placeholder = "Ketik lalu Enter", max = 15, suggestions = [] }) {
  const listId = useId();
  const [adding, setAdding] = useState(false);
  const [v, setV] = useState("");

  const add = () => {
    const t = v.trim();
    setV("");
    if (!t || items.length >= max || items.some((x) => x.toLowerCase() === t.toLowerCase())) return;
    onChange([...items, t]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((s) => <option key={s} value={s} />)}
        </datalist>
      )}
      {adding ? (
        <input
          autoFocus
          value={v}
          maxLength={40}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); add(); }
            if (e.key === "Escape") { setV(""); setAdding(false); }
          }}
          onBlur={() => { add(); setAdding(false); }}
          placeholder={placeholder}
          list={suggestions.length ? listId : undefined}
          className="rounded-lg border border-brand px-3 py-1.5 text-sm outline-none ring-2 ring-brand/20"
        />
      ) : (
        items.length < max && (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-brand/40">
            <Plus size={14} /> {addLabel}
          </button>
        )
      )}
      {items.map((x) => (
        <span key={x} className="inline-flex items-center gap-1.5 rounded-lg border border-brand/20 bg-brand-soft px-3 py-1.5 text-sm font-medium text-brand">
          {x}
          <button type="button" onClick={() => onChange(items.filter((i) => i !== x))} aria-label={`Hapus ${x}`} className="border-none bg-transparent p-0 text-brand/60 hover:text-brand">
            <X size={13} />
          </button>
        </span>
      ))}
    </div>
  );
}

// Pilihan chip: tunggal atau ganda.
export function OptionChips({ options, value, onChange, multi = false }) {
  const isOn = (v) => (multi ? value.includes(v) : value === v);
  const toggle = (v) => {
    if (!multi) return onChange(value === v ? null : v);
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          aria-pressed={isOn(o.v)}
          onClick={() => toggle(o.v)}
          className={`rounded-lg border px-3.5 py-2 text-sm transition-colors ${
            isOn(o.v) ? "border-brand/30 bg-brand-soft font-semibold text-brand" : "border-gray-200 bg-white text-gray-700 hover:border-brand/40"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
