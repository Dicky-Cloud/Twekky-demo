import { useState } from "react";
import { Globe, Lock } from "lucide-react";
import { api } from "../api/client";
import { TOPICS } from "../constants/topics";
import Modal from "./Modal";

const JOIN_TYPES = [
  {
    value: "open",
    label: "Terbuka",
    desc: "Siapa saja bisa langsung bergabung.",
    icon: Globe,
  },
  {
    value: "approval",
    label: "Perlu persetujuan",
    desc: "Calon anggota mengirim permintaan, dan kamu yang menerima atau menolaknya.",
    icon: Lock,
  },
];

const RULES_MAX = 1000;

export default function CreateCommunityModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [joinType, setJoinType] = useState("open");
  const [rules, setRules] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const community = await api.createCommunity({ name, description, topic, joinType, rules });
      onCreated(community);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="Buat Komunitas" onClose={busy ? () => {} : onClose}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 rounded-lg border border-danger bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="cname" className="field-label">Nama komunitas</label>
          <input
            id="cname"
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="cdesc" className="field-label">Deskripsi</label>
          <textarea
            id="cdesc"
            className="field-input min-h-[80px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="ctopic" className="field-label">Topik</label>
          <select
            id="ctopic"
            className="field-input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          >
            <option value="" disabled>Pilih topik</option>
            {TOPICS.map((t) => (
              <option key={t.slug} value={t.slug}>{t.label}</option>
            ))}
          </select>
        </div>

        <fieldset className="m-0 mb-4 border-0 p-0">
          <legend className="field-label mb-1.5 p-0">Cara bergabung</legend>
          <div className="flex flex-col gap-2">
            {JOIN_TYPES.map(({ value, label, desc, icon: Icon }) => (
              <label
                key={value}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  joinType === value
                    ? "border-brand bg-brand-soft"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="join_type"
                  value={value}
                  checked={joinType === value}
                  onChange={() => setJoinType(value)}
                  className="mt-1 accent-brand"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-semibold">
                    <Icon size={15} strokeWidth={2} />
                    {label}
                  </div>
                  <p className="m-0 mt-0.5 text-xs text-gray-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5 mb-5">
          <label htmlFor="crules" className="field-label">Aturan komunitas (opsional)</label>
          <textarea
            id="crules"
            className="field-input min-h-[80px] resize-y"
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            maxLength={RULES_MAX}
            placeholder="Contoh: Saling menghormati, tidak spam, tetap sesuai topik."
          />
          <div className="text-xs text-gray-400 text-right">
            {rules.length}/{RULES_MAX}
          </div>
        </div>

        <div className="flex gap-2.5 justify-end">
          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button className="btn btn-accent" type="submit" disabled={busy}>
            {busy ? "Membuat..." : "Buat komunitas"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
