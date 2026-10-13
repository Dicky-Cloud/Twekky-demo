// Menyorot @mention dan #hashtag di dalam teks komentar. Keduanya cuma
// disorot secara visual, bukan tautan — Twekky belum punya halaman profil
// per pengguna atau halaman pencarian tagar untuk dituju.
const TOKEN_RE = /([@#][A-Za-z0-9_.]{2,30})/g;

export default function MentionHashtagText({ text, className = "" }) {
  if (!text) return null;
  const parts = text.split(TOKEN_RE);

  return (
    <p className={`m-0 whitespace-pre-wrap break-words ${className}`}>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          return (
            <span key={i} className="text-brand font-semibold">
              {part}
            </span>
          );
        }
        if (part.startsWith("#")) {
          return (
            <span key={i} className="text-brand-dark font-medium">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
