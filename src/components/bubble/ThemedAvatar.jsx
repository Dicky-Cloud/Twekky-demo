import "./bubbleThemes.css";
import { findBubbleTheme } from "../../constants/bubbleThemes";

// Tampilan penulis bertema di Feed. Semua helper mengembalikan "tidak ada apa-apa"
// untuk tema polos/tidak dikenal, jadi baris Feed pengguna biasa tidak berubah.

// Avatar: cincin gradien + karakter yang mengintip di sudut (bila tema punya).
export default function ThemedAvatar({ themeId, children }) {
  const theme = findBubbleTheme(themeId);
  if (!theme || theme.plain) return <>{children}</>;
  const [r1, r2] = theme.ring || [theme.border, theme.border];
  return (
    <div className="tb-av" style={{ "--tb-ring1": r1, "--tb-ring2": r2 }} data-bubble-theme={theme.id}>
      {children}
      {theme.mascot && (
        <svg
          className="tb-av-mascot"
          viewBox="0 0 36 36"
          aria-hidden="true"
          focusable="false"
          dangerouslySetInnerHTML={{ __html: theme.mascot }}
        />
      )}
    </div>
  );
}

// Gaya teks nama: gradien warna tema. Undefined bila tema polos.
export function themedNameStyle(themeId) {
  const theme = findBubbleTheme(themeId);
  if (!theme || theme.plain || !theme.name) return undefined;
  return {
    backgroundImage: `linear-gradient(90deg, ${theme.name[0]}, ${theme.name[1]})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };
}

// Bintang kecil berkedip di samping nama (hiasan, bukan label).
export function ThemeSparkle({ themeId }) {
  const theme = findBubbleTheme(themeId);
  if (!theme || theme.plain) return null;
  return (
    <i
      aria-hidden="true"
      className="tb-d tb-sh-star tb-spark"
      style={{ background: theme.border }}
    />
  );
}

// Kartu stiker untuk post penulis bertema: kelas + variabel warna untuk <article>.
// Tidak ada yang berubah untuk tema polos/tidak dikenal.
export function postFrame(themeId) {
  const theme = findBubbleTheme(themeId);
  if (!theme || theme.plain) return { className: "", style: undefined };
  return {
    className: "tb-post-card",
    style: { "--tb-border": theme.border, "--tb-tint": theme.tint || "#fff" },
  };
}

// Hiasan kecil di sudut kartu post (kanan atas dan kanan bawah).
export function ThemeDecor({ themeId }) {
  const theme = findBubbleTheme(themeId);
  if (!theme || theme.plain || !theme.decor) return null;
  return theme.decor.map(([shape, slot, color], i) => (
    <i
      key={i}
      aria-hidden="true"
      className={`tb-d tb-sh-${shape} tb-sl-${slot}`}
      style={{ background: color, animationDelay: `${i * 0.5}s` }}
    />
  ));
}
