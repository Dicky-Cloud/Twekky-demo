import { useSearchParams } from "react-router-dom";
import CreatePostModal from "../components/CreatePostModal";

// Halaman "Buat Post" untuk HP (rute /buat-post). Formulirnya sama dengan popup di desktop;
// komponen yang sama dipakai dalam mode halaman supaya logikanya tidak digandakan.
export default function CreatePostPage() {
  const [params] = useSearchParams();
  return <CreatePostModal page initialCommunityId={params.get("komunitas") || ""} initialTopic={params.get("topik") || ""} />;
}