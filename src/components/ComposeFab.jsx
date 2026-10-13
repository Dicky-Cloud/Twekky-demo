// src/components/ComposeFab.jsx
// Tombol "Buat post" melayang untuk layar HP (di desktop tombol Post ada di Sidebar).
// Hanya tampil untuk pengguna yang login di Feed, Komunitas, dan Profil. Di halaman
// komunitas tombol hanya muncul bagi anggota dan langsung memilih komunitas itu.
// Prop `hidden` datang dari Appshell, jadi tombol sembunyi dan muncul bersamaan dengan bar bawah.
import { matchPath, useLocation } from "react-router-dom";
import { Pencil } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCommunities } from "../context/CommunityContext";
import { usePostComposer } from "../context/PostComposerContext";
import { topicLabel } from "../constants/topics";

export default function ComposeFab({ hidden = false }) {
  const { user } = useAuth();
  const { joined } = useCommunities();
  const { openComposer } = usePostComposer();
  const { pathname, search } = useLocation();

  let target = null; // { communityId, topic } bila tombol perlu tampil
  if (user) {
    if (pathname === "/") {
      const t = new URLSearchParams(search).get("topik");
      target = { communityId: "", topic: topicLabel(t) ? t : "" };
    } else if (pathname === "/profil" || (pathname === "/komunitas" && new URLSearchParams(search).get("tab") !== "mentor")) {
      target = { communityId: "", topic: "" };
    } else {
      const m = matchPath("/komunitas/:id", pathname);
      if (m && joined.some((c) => c.id === m.params.id)) target = { communityId: m.params.id, topic: "" };
    }
  }
  if (!target) return null;

  return (
    <button
      type="button"
      onClick={() => openComposer(target.communityId, target.topic)}
      aria-label="Buat post"
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : 0}
      className={`fixed right-4 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-none bg-brand text-white shadow-lg transition-all duration-200 hover:bg-brand-dark active:scale-95 md:hidden ${
        hidden ? "pointer-events-none translate-y-24 opacity-0" : "translate-y-0 opacity-100"
      }`}
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 4.75rem)" }}
    >
      <Pencil size={22} strokeWidth={2.25} />
    </button>
  );
}