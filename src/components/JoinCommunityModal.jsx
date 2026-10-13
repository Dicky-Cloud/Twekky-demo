import { useState } from "react";
import Modal from "./Modal";

const MESSAGE_MAX = 300;

// Dipakai dua kondisi:
// - komunitas "approval": kirim permintaan + pesan opsional
// - komunitas terbuka yang punya aturan: konfirmasi aturan lalu bergabung
export default function JoinCommunityModal({ community, busy, error, onSubmit, onClose }) {
  const needsApproval = community.join_type === "approval";
  const [message, setMessage] = useState("");

  return (
    <Modal
      title={needsApproval ? "Minta Bergabung" : "Bergabung ke Komunitas"}
      onClose={busy ? () => {} : onClose}
    >
      <p className="m-0 mb-1 text-sm font-semibold">{community.name}</p>
      {needsApproval && (
        <p className="m-0 mb-4 text-sm text-gray-500">
          Komunitas ini perlu persetujuan pembuatnya. Kamu baru menjadi anggota setelah
          permintaanmu diterima.
        </p>
      )}

      {community.rules && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="field-label mb-1">Aturan komunitas</div>
          <p className="m-0 text-sm text-gray-700 whitespace-pre-line">{community.rules}</p>
          {!needsApproval && (
            <p className="m-0 mt-2 text-xs text-gray-500">
              Dengan bergabung, kamu setuju mengikuti aturan di atas.
            </p>
          )}
        </div>
      )}

      {needsApproval && (
        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="jmsg" className="field-label">Pesan untuk pembuat (opsional)</label>
          <textarea
            id="jmsg"
            className="field-input min-h-[80px] resize-y"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MESSAGE_MAX}
            placeholder="Ceritakan singkat kenapa kamu ingin bergabung"
          />
          <div className="text-xs text-gray-400 text-right">
            {message.length}/{MESSAGE_MAX}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex gap-2.5 justify-end">
        <button className="btn btn-ghost" type="button" onClick={onClose} disabled={busy}>
          Batal
        </button>
        <button
          className="btn btn-accent"
          type="button"
          onClick={() => onSubmit(message)}
          disabled={busy}
        >
          {busy ? "Memproses..." : needsApproval ? "Kirim permintaan" : "Setuju & Gabung"}
        </button>
      </div>
    </Modal>
  );
}
