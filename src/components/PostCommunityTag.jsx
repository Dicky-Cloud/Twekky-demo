import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCommunities } from "../context/CommunityContext";
import CommunityJoinButton from "./CommunityJoinButton";

// Penanda "di <komunitas>" pada kartu post yang berasal dari komunitas.
// Tombol Gabung hanya muncul bila pembaca belum menjadi anggota dan bukan
// pembuatnya; setelah bergabung (atau saat menunggu persetujuan) tombolnya
// otomatis berubah/hilang karena membaca status dari CommunityContext.
export default function PostCommunityTag({ community }) {
  const { user } = useAuth();
  const { joined } = useCommunities();
  if (!community) return null;

  const isOwner = !!user && community.owner_id === user.id;
  const isMember = joined.some((c) => c.id === community.id);
  const showJoin = !isOwner && !isMember;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
      <Users size={12} className="shrink-0" />
      <Link
        to={`/komunitas/${community.id}`}
        className="max-w-[180px] truncate font-semibold text-gray-600 no-underline hover:text-brand"
      >
        {community.name}
      </Link>
      {showJoin && (
        <span style={{ fontSize: 12 }} className="inline-flex">
          <CommunityJoinButton community={community} compact />
        </span>
      )}
    </span>
  );
}
