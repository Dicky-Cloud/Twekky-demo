import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Lock, Pencil, Search, Send, Trash2 } from "lucide-react";
import { api } from "../../api/client";
import { EXPERIENCE_LABELS, timeAgo } from "../../constants/recruitment";
import { Avatar, ErrorBanner } from "../../components/recruitment/StatusBadge";
import { EvalBadge, RatingStars } from "../../components/recruitment/EvaluationCard";

const NOTE_MAX = 500;

function TalentCard({ e, busy, onSaveNote, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(e.note);

  const save = async () => {
    const ok = await onSaveNote(e, text.trim());
    if (ok) setEditing(false);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 mb-3">
      <div className="flex items-start gap-3.5">
        <Avatar name={e.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-[15px] font-bold truncate">{e.name}</span>
            {e.rating > 0 && <RatingStars value={e.rating} size={13} />}
            <EvalBadge label={e.label} />
          </div>
          <div className="text-sm text-gray-500">
            Dari lamaran {e.source_job} · disimpan {timeAgo(e.created_at).toLowerCase()}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {EXPERIENCE_LABELS[e.experience] || e.experience || "Pengalaman: tidak diisi"}
            {e.skills ? ` · ${e.skills}` : ""}
          </div>

          {editing ? (
            <div className="mt-2.5">
              <textarea
                className="field-input min-h-[64px] resize-y"
                value={text}
                maxLength={NOTE_MAX}
                onChange={(ev) => setText(ev.target.value)}
                aria-label={`Catatan untuk ${e.name}`}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setText(e.note);
                    setEditing(false);
                  }}
                  disabled={busy}
                >
                  Batal
                </button>
                <button type="button" className="btn btn-accent btn-sm" onClick={save} disabled={busy}>
                  {busy ? "Menyimpan..." : "Simpan catatan"}
                </button>
              </div>
            </div>
          ) : e.note ? (
            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed m-0 mt-2.5 rounded-lg bg-gray-50 px-3 py-2">
              {e.note}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
        {e.application_exists ? (
          <Link to={`/rekrutmen/pelamar/${e.application_id}`} className="btn btn-ghost btn-sm">
            Lihat lamaran
          </Link>
        ) : (
          <span className="text-xs text-gray-400 self-center mr-1">Lamaran asli sudah dibatalkan pelamar</span>
        )}
        <Link to={`/pesan?ke=${encodeURIComponent(e.applicant_id)}`} className="btn btn-accent btn-sm">
          <Send size={13} /> Kirim pesan
        </Link>
        {!editing && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(true)} disabled={busy}>
            <Pencil size={13} /> Ubah catatan
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm text-danger ml-auto" onClick={() => onRemove(e)} disabled={busy}>
          <Trash2 size={13} /> Keluarkan
        </button>
      </div>
    </div>
  );
}

// Kandidat pilihan yang disimpan perekrut untuk lowongan berikutnya.
export default function TalentPoolTab() {
  const [data, setData] = useState(null); // { allowed, limit, count, items }
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api.talentPool());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = data?.items || [];
    if (!q) return all;
    return all.filter((e) => `${e.name} ${e.skills} ${e.source_job} ${e.note}`.toLowerCase().includes(q));
  }, [data, query]);

  const saveNote = async (e, note) => {
    setBusyId(e.id);
    setError("");
    try {
      await api.updateTalentNote(e.id, note);
      await load();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusyId("");
    }
  };

  const remove = async (e) => {
    if (!window.confirm(`Keluarkan ${e.name} dari talent pool?`)) return;
    setBusyId(e.id);
    setError("");
    try {
      await api.removeFromTalentPool(e.id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  };

  if (!data && !error) return <p className="text-gray-500 text-sm">Memuat talent pool...</p>;

  if (data && !data.allowed) {
    return (
      <>
        <ErrorBanner>{error}</ErrorBanner>
        <div className="card text-center py-10">
          <Lock size={32} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-bold mb-1">Talent pool ada di paket Growth</h3>
          <p className="text-sm text-gray-500 max-w-[48ch] mx-auto mb-5">
            Simpan kandidat bagus yang belum cocok untuk lowongan sekarang, lengkap dengan catatan, lalu hubungi mereka saat ada
            posisi baru.
            {data.count > 0 ? ` ${data.count} kandidat Anda tetap tersimpan dan muncul lagi setelah berlangganan.` : ""}
          </p>
          <Link to="/rekrutmen/paket" className="btn btn-accent">
            Lihat paket
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <ErrorBanner>{error}</ErrorBanner>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="field-input !pl-9"
            placeholder="Cari nama, keahlian, atau catatan..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Cari kandidat"
          />
        </div>
        {data && (
          <span className="text-sm text-gray-500 shrink-0">
            {data.count} / {data.limit} kandidat
          </span>
        )}
      </div>

      {data && data.items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 text-gray-500 text-sm text-center py-10">
          <Bookmark size={28} className="mx-auto text-gray-300 mb-2" />
          Talent pool masih kosong. Buka detail pelamar lalu pilih &ldquo;Simpan ke talent pool&rdquo;.
          <div className="mt-3">
            <Link to="/rekrutmen/pelamar" className="btn btn-accent btn-sm">
              Buka daftar pelamar
            </Link>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 text-gray-500 text-sm text-center py-8">
          Tidak ada kandidat yang cocok dengan pencarian.
        </div>
      ) : (
        items.map((e) => <TalentCard key={e.id} e={e} busy={busyId === e.id} onSaveNote={saveNote} onRemove={remove} />)
      )}
    </>
  );
}
