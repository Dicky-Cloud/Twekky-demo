import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Clock, ShieldCheck } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCommunities } from "../context/CommunityContext";
import JoinCommunityModal from "./JoinCommunityModal";

// Tombol gabung yang paham 4 keadaan:
// pembuat / anggota / menunggu persetujuan / belum bergabung.
// variant "card" untuk kartu putih, "hero" untuk banner biru.
export default function CommunityJoinButton({
  community,
  variant = "card",
  compact = false, // versi kecil untuk disisipkan di baris info (mis. kartu post)
  onCommunityChange,
  onError,
}) {
  const { user } = useAuth();
  const { joined, pendingIds, refresh } = useCommunities();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");

  const hero = variant === "hero";
  const isOwner = !!user && community.owner_id === user.id;
  const isMember = joined.some((c) => c.id === community.id);
  const isPending = pendingIds.includes(community.id);
  const needsApproval = community.join_type === "approval";

  // Aksi langsung (gabung terbuka, keluar, batalkan permintaan).
  const run = async (action) => {
    setBusy(true);
    onError?.("");
    try {
      const result = await action();
      await refresh();
      if (result?.id) onCommunityChange?.(result);
    } catch (err) {
      onError?.(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleClick = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (isMember) return run(() => api.leaveCommunity(community.id));
    if (isPending) return run(() => api.cancelJoinRequest(community.id));
    if (needsApproval || community.rules) {
      setModalError("");
      setModalOpen(true);
      return;
    }
    return run(() => api.joinCommunity(community.id));
  };

  const handleModalSubmit = async (message) => {
    setBusy(true);
    setModalError("");
    try {
      const result = needsApproval
        ? await api.requestJoinCommunity(community.id, message)
        : await api.joinCommunity(community.id);
      await refresh();
      if (result?.id) onCommunityChange?.(result);
      setModalOpen(false);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (isOwner) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${
          hero ? "bg-white/20 text-white" : "bg-brand-soft text-brand"
        }`}
      >
        <ShieldCheck size={14} strokeWidth={2.5} /> Pembuat
      </span>
    );
  }

  let stateClass;
  if (isMember) {
    stateClass = hero
      ? "bg-white/20 text-white hover:bg-white/30"
      : "bg-brand-soft text-brand border border-brand hover:bg-brand-soft";
  } else if (isPending) {
    stateClass = hero
      ? "bg-white/20 text-white hover:bg-white/30"
      : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100";
  } else {
    stateClass = hero ? "btn-white" : "btn-accent";
  }

  let title;
  if (!user) title = "Masuk untuk bergabung";
  else if (isMember) title = "Klik untuk keluar dari komunitas";
  else if (isPending) title = "Klik untuk membatalkan permintaan";

  return (
    <>
      <button
        onClick={handleClick}
        disabled={busy && !modalOpen}
        title={title}
        style={compact ? { padding: "1px 10px", fontSize: 12, lineHeight: "18px", minHeight: 0 } : undefined}
        className={`btn btn-sm shrink-0 ${stateClass}`}
      >
        {busy && !modalOpen ? (
          "..."
        ) : isMember ? (
          <>
            <Check size={14} strokeWidth={2.5} /> Tergabung
          </>
        ) : isPending ? (
          <>
            <Clock size={14} strokeWidth={2.5} /> Menunggu persetujuan
          </>
        ) : needsApproval ? (
          "Minta Bergabung"
        ) : (
          "Gabung"
        )}
      </button>

      {modalOpen && (
        <JoinCommunityModal
          community={community}
          busy={busy}
          error={modalError}
          onSubmit={handleModalSubmit}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
