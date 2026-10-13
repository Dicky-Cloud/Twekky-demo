import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Check, Minus, Building2 } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";

// Modal khusus semua fitur langganan Twekky. Satu pintu, dua paket:
// Pro (pencari kerja) dan Bisnis (perekrut). Mentor bukan langganan: lihat halaman Mentor.

const PRO_ROWS = [
  ["Pencarian tersimpan", "1", "10 + alert instan"],
  ["Lamaran prioritas (lencana Pro)", "—", "10 / bulan"],
  ["Waktu lamaran dilihat perekrut", "Dilihat / belum", "Dengan jam"],
  ["Pesan ke HR per lamaran", "1", "Sampai 5"],
  ["Catatan & pengingat lamaran", "—", "✓"],
  ["Jumlah pelamar per lowongan", "—", "✓"],
  ["Pengunjung profilmu", "Jumlah saja (30 hari)", "Daftar lengkap (90 hari)"],
];

const BUSINESS_FEATURES = [
  "Pasang lowongan dan kelola pelamar di dashboard rekrutmen",
  "Sorot lowongan agar tampil lebih menonjol",
  "Kustomisasi halaman perusahaan (warna aksen & daftar benefit)",
];

const TABS = [
  { key: "pro", label: "Pro", icon: Crown },
  { key: "business", label: "Bisnis", icon: Building2 },
];

function FeatureList({ items }) {
  return (
    <ul className="list-none p-0 m-0 flex flex-col gap-2">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2 text-sm text-gray-700">
          <Check size={16} className="text-success shrink-0 mt-0.5" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function ActiveNote({ children }) {
  return (
    <p className="m-0 text-sm text-green-700 flex items-center gap-1.5">
      <Check size={14} /> {children}
    </p>
  );
}

function ProPanel({ reason, onDone }) {
  const { user, refreshUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await refreshUser();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const subscribe = async () => {
    if (await run(() => api.proSubscribe())) onDone();
  };
  const cancel = async () => {
    if (await run(() => api.proCancel())) setConfirmCancel(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Crown className="text-yellow-500 fill-yellow-400" size={20} />
        <p className="m-0 font-bold">Rp20.000 / bulan</p>
      </div>
      {reason && <p className="m-0 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">{reason}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 text-xs">
            <th className="py-1">Fitur</th>
            <th>Gratis</th>
            <th className="text-brand">Pro</th>
          </tr>
        </thead>
        <tbody>
          {PRO_ROWS.map(([f, a, b]) => (
            <tr key={f} className="border-t border-gray-100">
              <td className="py-1.5 pr-2">{f}</td>
              <td className="pr-2">{a}</td>
              <td className="font-medium">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="m-0 text-xs text-gray-500">Diskusi, komentar, dan melamar tetap gratis.</p>
      {error && <p className="m-0 text-sm text-red-600">{error}</p>}

      {user?.is_pro ? (
        <div className="space-y-2">
          <ActiveNote>Pro kamu aktif.</ActiveNote>
          {confirmCancel ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Yakin berhenti berlangganan?</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmCancel(false)} disabled={busy}>
                Batal
              </button>
              <button type="button" className="btn btn-sm text-red-600" onClick={cancel} disabled={busy}>
                {busy ? "Memproses…" : "Ya, berhenti"}
              </button>
            </div>
          ) : (
            <button type="button" className="text-xs text-gray-500 underline" onClick={() => setConfirmCancel(true)}>
              Berhenti berlangganan
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={subscribe}
          disabled={busy}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand hover:bg-brand-dark text-white disabled:opacity-60"
        >
          {busy ? "Memproses…" : "Aktifkan Pro (demo)"}
        </button>
      )}
    </div>
  );
}

function BusinessPanel({ reason, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isBusiness = user?.account_type === "business";
  const go = (path) => { onClose(); navigate(path); };
  return (
    <div className="space-y-4">
      {reason && <p className="m-0 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">{reason}</p>}
      <p className="m-0 text-sm text-gray-600">Paket Bisnis untuk perusahaan dan perekrut. Harga dan batas tiap paket ada di halaman Paket.</p>
      <FeatureList items={BUSINESS_FEATURES} />
      {isBusiness ? (
        <button type="button" className="w-full btn btn-accent" onClick={() => go("/rekrutmen/paket")}>
          Lihat & kelola paket
        </button>
      ) : (
        <>
          <p className="m-0 flex items-center gap-1.5 text-xs text-gray-500">
            <Minus size={13} /> Paket Bisnis hanya untuk akun Bisnis.
          </p>
          <button type="button" className="w-full btn btn-accent" onClick={() => go("/profil?pengaturan=bisnis")}>
            Buat akun Bisnis
          </button>
        </>
      )}
    </div>
  );
}

export default function SubscriptionModal({ initialTab = "pro", reason = "", onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState(TABS.some((t) => t.key === initialTab) ? initialTab : "pro");
  const activeMap = {
    pro: Boolean(user?.is_pro),
    business: false,
  };
  // alasan hanya relevan untuk tab yang dibuka dari fitur terkunci
  const tabReason = tab === initialTab ? reason.trim() : "";

  return (
    <Modal title="Langganan Twekky" onClose={onClose} maxWidth="max-w-lg">
      <div role="tablist" className="mb-4 flex gap-1 rounded-xl bg-gray-50 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === key ? "bg-white text-brand shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <Icon size={15} />
            {label}
            {activeMap[key] && <span className="rounded-full bg-emerald-50 px-1.5 text-[10px] font-bold text-success">Aktif</span>}
          </button>
        ))}
      </div>

      {tab === "pro" && <ProPanel reason={tabReason} onDone={onClose} />}
      {tab === "business" && <BusinessPanel reason={tabReason} onClose={onClose} />}
    </Modal>
  );
}
