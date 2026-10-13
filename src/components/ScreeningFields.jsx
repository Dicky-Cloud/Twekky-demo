// Pertanyaan penyaring dari perusahaan, ditampilkan di formulir lamaran.
// questions: [{ id, text, type: "yesno" | "choice" | "text", options, required }]
// answers:   { [questionId]: "yes" | "no" | "<pilihan>" | "<teks>" }
export default function ScreeningFields({ questions, answers, onChange, company }) {
  const set = (id, value) => onChange({ ...answers, [id]: value });

  return (
    <fieldset className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <legend className="px-1 text-sm font-bold">Pertanyaan dari {company || "perusahaan"}</legend>
      {questions.map((q) => (
        <div key={q.id} className="mb-4 last:mb-0">
          <div className="mb-1.5 text-sm font-medium text-gray-800">
            {q.text} {q.required ? <span className="text-danger">*</span> : <span className="text-xs text-gray-400">(opsional)</span>}
          </div>

          {q.type === "yesno" && (
            <div className="flex gap-2" role="radiogroup" aria-label={q.text}>
              {[
                { v: "yes", label: "Ya" },
                { v: "no", label: "Tidak" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  role="radio"
                  aria-checked={answers[q.id] === o.v}
                  onClick={() => set(q.id, answers[q.id] === o.v && !q.required ? "" : o.v)}
                  className={`rounded-lg border px-5 py-1.5 text-sm font-semibold transition-colors ${
                    answers[q.id] === o.v
                      ? "border-brand bg-brand text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {q.type === "choice" && (
            <select className="field-input" value={answers[q.id] || ""} onChange={(e) => set(q.id, e.target.value)} aria-label={q.text}>
              <option value="">Pilih jawaban</option>
              {(q.options || []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          )}

          {q.type === "text" && (
            <textarea
              className="field-input min-h-[70px] resize-y"
              maxLength={500}
              value={answers[q.id] || ""}
              onChange={(e) => set(q.id, e.target.value)}
              aria-label={q.text}
            />
          )}
        </div>
      ))}
    </fieldset>
  );
}
