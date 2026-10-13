import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import Modal from "../Modal";
import { ErrorBanner } from "./StatusBadge";

const KIND_TEXT = {
  rejection: {
    title: "Tolak dengan template",
    status: "rejected",
    confirm: "Tolak pelamar",
    empty: "Belum ada template penolakan.",
  },
  interview: {
    title: "Undang wawancara dengan template",
    status: "interview",
    confirm: "Undang wawancara",
    empty: "Belum ada template undangan wawancara.",
  },
};

// Memilih template, melihat pratinjau yang sudah terisi data pelamar, lalu
// (opsional) mengirimnya lewat pesan Twekky dan mengubah status lamaran.
// Pesan dikirim lewat endpoint pesan biasa, jadi aturan blokir tetap berlaku.
export default function UseTemplateModal({ applicant, kind, onClose, onDone }) {
  const t = KIND_TEXT[kind];
  const [list, setList] = useState(null); // { allowed, templates }
  const [selected, setSelected] = useState("");
  const [text, setText] = useState("");
  const [sendMessage, setSendMessage] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .messageTemplates(kind)
      .then(setList)
      .catch((err) => setError(err.message));
  }, [kind]);

  const pick = async (id) => {
    setSelected(id);
    setText("");
    setError("");
    if (!id) return;
    setLoadingPreview(true);
    try {
      const r = await api.renderMessageTemplate(id, applicant.id);
      setText(r.body);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      if (sendMessage && text.trim()) {
        await api.sendMessage(applicant.applicant_id, text.trim());
      }
      const updated = await api.setApplicantStatus(applicant.id, t.status);
      onDone(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const templates = list?.templates || [];

  return (
    <Modal title={t.title} onClose={onClose} maxWidth="max-w-lg">
      <ErrorBanner>{error}</ErrorBanner>

      {!list ? (
        <p className="text-sm text-gray-400 m-0">Memuat template...</p>
      ) : !list.allowed ? (
        <div className="text-center py-2">
          <p className="text-sm text-gray-600 m-0 mb-3">Template pesan tersedia di paket Growth.</p>
          <Link to="/rekrutmen/paket" className="btn btn-accent btn-sm" onClick={onClose}>
            Lihat paket
          </Link>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-2">
          <p className="text-sm text-gray-600 m-0 mb-3">{t.empty}</p>
          <Link to="/rekrutmen/template" className="btn btn-accent btn-sm" onClick={onClose}>
            Buat template
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="tpl-pick" className="field-label">
              Template
            </label>
            <select id="tpl-pick" className="field-input" value={selected} onChange={(e) => pick(e.target.value)}>
              <option value="">Pilih template...</option>
              {templates.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.name}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div>
              <label htmlFor="tpl-preview" className="field-label">
                Pratinjau untuk {applicant.name} (boleh diedit sebelum dikirim)
              </label>
              <textarea
                id="tpl-preview"
                className="field-input min-h-[200px] resize-y"
                value={loadingPreview ? "Memuat pratinjau..." : text}
                onChange={(e) => setText(e.target.value)}
                disabled={loadingPreview}
              />
            </div>
          )}

          <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={sendMessage}
              onChange={(e) => setSendMessage(e.target.checked)}
            />
            <span>Kirim pesan ini ke pelamar lewat Twekky</span>
          </label>
          <p className="text-xs text-gray-400 m-0">
            Status lamaran akan diubah ke &quot;{kind === "rejection" ? "Ditolak" : "Wawancara"}&quot; dan pelamar mendapat
            notifikasi.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>
              Batal
            </button>
            <button
              type="button"
              className={`btn btn-sm ${kind === "rejection" ? "bg-danger text-white hover:opacity-90" : "btn-accent"}`}
              onClick={confirm}
              disabled={busy || !selected || loadingPreview || (sendMessage && !text.trim())}
            >
              {busy ? "Memproses..." : t.confirm}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
