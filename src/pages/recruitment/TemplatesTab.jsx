import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../../api/client";
import Modal from "../../components/Modal";
import { ErrorBanner } from "../../components/recruitment/StatusBadge";
import { TEMPLATE_KINDS, TEMPLATE_PLACEHOLDERS } from "../../constants/recruitment";

const EMPTY = { kind: "rejection", name: "", body: "" };
const kindLabel = (k) => TEMPLATE_KINDS.find((x) => x.value === k)?.label || k;

function TemplateForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={initial.id ? "Ubah template" : "Template baru"} onClose={onClose} maxWidth="max-w-lg">
      <ErrorBanner>{error}</ErrorBanner>
      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="t-kind" className="field-label">
            Jenis
          </label>
          <select id="t-kind" className="field-input" value={form.kind} onChange={set("kind")}>
            {TEMPLATE_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="t-name" className="field-label">
            Nama template
          </label>
          <input
            id="t-name"
            className="field-input"
            maxLength={60}
            placeholder="Contoh: Penolakan sopan (umum)"
            value={form.name}
            onChange={set("name")}
          />
        </div>
        <div>
          <label htmlFor="t-body" className="field-label">
            Isi pesan
          </label>
          <textarea
            id="t-body"
            className="field-input min-h-[200px] resize-y"
            maxLength={1500}
            value={form.body}
            onChange={set("body")}
          />
          <p className="text-xs text-gray-400 m-0 mt-1.5">
            Placeholder yang terisi otomatis:{" "}
            {TEMPLATE_PLACEHOLDERS.map((p, i) => (
              <span key={p.token}>
                <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">{p.token}</code> ({p.hint})
                {i < TEMPLATE_PLACEHOLDERS.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn-accent btn-sm"
            onClick={submit}
            disabled={busy || !form.name.trim() || !form.body.trim()}
          >
            {busy ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Tab "Template": kelola template pesan penolakan dan undangan wawancara.
export default function TemplatesTab() {
  const [data, setData] = useState(null); // { allowed, limit, count, templates, suggestions }
  const [editing, setEditing] = useState(null); // objek form atau null
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api
      .messageTemplates()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  const save = async (form) => {
    const payload = { kind: form.kind, name: form.name, body: form.body };
    if (form.id) await api.updateMessageTemplate(form.id, payload);
    else await api.createMessageTemplate(payload);
    setEditing(null);
    load();
  };

  const remove = async (t) => {
    if (!window.confirm(`Hapus template "${t.name}"?`)) return;
    setError("");
    try {
      await api.deleteMessageTemplate(t.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const addSuggestion = async (s) => {
    setError("");
    try {
      await api.createMessageTemplate({ kind: s.kind, name: s.name, body: s.body });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!data) return <p className="text-gray-500 text-sm">Memuat template...</p>;

  if (!data.allowed) {
    return (
      <section className="card text-center py-10">
        <Lock size={32} className="mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-bold mb-1">Template pesan ada di paket Growth</h3>
        <p className="text-sm text-gray-500 max-w-[48ch] mx-auto mb-5">
          Simpan pesan penolakan dan undangan wawancara yang sopan, lalu pakai dengan satu klik dari halaman pelamar.
          {data.count > 0 ? ` ${data.count} template lama Anda tersimpan dan akan muncul lagi setelah berlangganan.` : ""}
        </p>
        <Link to="/rekrutmen/paket" className="btn btn-accent">
          Lihat paket
        </Link>
      </section>
    );
  }

  const full = data.count >= data.limit;
  // contoh yang belum dipakai (dicocokkan lewat nama)
  const used = new Set(data.templates.map((t) => t.name));
  const suggestions = data.suggestions.filter((s) => !used.has(s.name));

  return (
    <>
      <ErrorBanner>{error}</ErrorBanner>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold m-0">Template pesan</h3>
            <p className="text-sm text-gray-500 m-0">
              {data.count} dari {data.limit} template terpakai
            </p>
          </div>
          <button type="button" className="btn btn-accent btn-sm" onClick={() => setEditing(EMPTY)} disabled={full}>
            <Plus size={14} /> Template baru
          </button>
        </div>

        {data.templates.length === 0 ? (
          <p className="text-sm text-gray-400 m-0">Belum ada template. Mulai dari contoh di bawah, atau buat sendiri.</p>
        ) : (
          <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
            {data.templates.map((t) => (
              <li key={t.id} className="rounded-lg border border-gray-200 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{t.name}</span>
                      <span className="rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold px-2 py-0.5">
                        {kindLabel(t.kind)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 whitespace-pre-line leading-relaxed m-0 mt-1.5 line-clamp-3">
                      {t.body}
                    </p>
                  </div>
                  <span className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                      onClick={() => setEditing(t)}
                      aria-label={`Ubah ${t.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-danger hover:bg-gray-50"
                      onClick={() => remove(t)}
                      aria-label={`Hapus ${t.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {suggestions.length > 0 && (
        <section className="card">
          <h3 className="text-base font-bold mb-1">Contoh siap pakai</h3>
          <p className="text-sm text-gray-500 m-0 mb-3">Tambahkan lalu ubah sesuai gaya perusahaan Anda.</p>
          <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
            {suggestions.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-gray-300 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{s.name}</div>
                  <div className="text-xs text-gray-400">{kindLabel(s.kind)}</div>
                </div>
                <button type="button" className="btn btn-ghost btn-sm shrink-0" onClick={() => addSuggestion(s)} disabled={full}>
                  <Plus size={14} /> Tambah
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {editing && <TemplateForm initial={editing} onSave={save} onClose={() => setEditing(null)} />}
    </>
  );
}
