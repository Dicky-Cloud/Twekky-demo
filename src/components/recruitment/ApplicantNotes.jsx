import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Pencil, StickyNote, Trash2 } from "lucide-react";
import { api } from "../../api/client";
import { timeAgo } from "../../constants/recruitment";
import { ErrorBanner } from "./StatusBadge";

const MAX = 1000;

// Catatan internal perekrut pada satu pelamar. Tidak pernah terlihat oleh
// pelamar. Di paket tanpa fitur ini, kartu menampilkan ajakan upgrade.
export default function ApplicantNotes({ applicationId }) {
  const [data, setData] = useState(null); // { allowed, count, notes }
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setData(null);
    api
      .applicantNotes(applicationId)
      .then((d) => !cancelled && setData(d))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      setData(await api.applicantNotes(applicationId));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    run(async () => {
      const body = text.trim();
      if (!body) return;
      if (editingId) await api.updateApplicantNote(applicationId, editingId, body);
      else await api.addApplicantNote(applicationId, body);
      setText("");
      setEditingId("");
    });

  const remove = (id) => {
    if (!window.confirm("Hapus catatan ini?")) return;
    run(() => api.deleteApplicantNote(applicationId, id));
  };

  const startEdit = (n) => {
    setEditingId(n.id);
    setText(n.body);
  };

  const cancelEdit = () => {
    setEditingId("");
    setText("");
  };

  return (
    <section className="card">
      <div className="flex items-center gap-2 mb-1">
        <StickyNote size={17} className="text-brand" />
        <h3 className="text-base font-bold m-0">Catatan internal</h3>
      </div>
      <p className="text-xs text-gray-400 m-0 mb-3">Hanya terlihat oleh Anda. Pelamar tidak bisa melihat catatan ini.</p>
      <ErrorBanner>{error}</ErrorBanner>

      {!data ? (
        <p className="text-sm text-gray-400 m-0">Memuat catatan...</p>
      ) : !data.allowed ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-center">
          <Lock size={20} className="mx-auto text-gray-400 mb-1.5" />
          <p className="text-sm text-gray-600 m-0 mb-3">
            Catatan pelamar tersedia di paket Growth.
            {data.count > 0 ? ` ${data.count} catatan lama Anda tersimpan dan akan muncul lagi setelah berlangganan.` : ""}
          </p>
          <Link to="/rekrutmen/paket" className="btn btn-accent btn-sm">
            Lihat paket
          </Link>
        </div>
      ) : (
        <>
          <textarea
            className="field-input min-h-[84px] resize-y"
            placeholder="Contoh: Wawancara telepon 12 Okt, komunikasi bagus, minta gaji 6 juta."
            value={text}
            maxLength={MAX}
            onChange={(e) => setText(e.target.value)}
            aria-label="Tulis catatan"
          />
          <div className="flex items-center justify-between gap-2 mt-2">
            <span className="text-xs text-gray-400">
              {text.length} / {MAX}
            </span>
            <div className="flex gap-2">
              {editingId && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit} disabled={busy}>
                  Batal
                </button>
              )}
              <button type="button" className="btn btn-accent btn-sm" onClick={save} disabled={busy || !text.trim()}>
                {busy ? "Menyimpan..." : editingId ? "Simpan perubahan" : "Tambah catatan"}
              </button>
            </div>
          </div>

          {data.notes.length === 0 ? (
            <p className="text-sm text-gray-400 m-0 mt-4">Belum ada catatan untuk pelamar ini.</p>
          ) : (
            <ul className="list-none p-0 m-0 mt-4 flex flex-col gap-2.5">
              {data.notes.map((n) => (
                <li key={n.id} className="rounded-lg border border-gray-200 px-3.5 py-3">
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed m-0">{n.body}</p>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="text-xs text-gray-400">
                      {timeAgo(n.created_at)}
                      {n.updated_at !== n.created_at ? " · diubah" : ""}
                    </span>
                    <span className="flex gap-1">
                      <button
                        type="button"
                        className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                        onClick={() => startEdit(n)}
                        aria-label="Ubah catatan"
                        disabled={busy}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-danger hover:bg-gray-50"
                        onClick={() => remove(n.id)}
                        aria-label="Hapus catatan"
                        disabled={busy}
                      >
                        <Trash2 size={14} />
                      </button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
