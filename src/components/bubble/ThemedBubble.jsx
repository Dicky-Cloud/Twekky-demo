import "./bubbleThemes.css";
import { findBubbleTheme } from "../../constants/bubbleThemes";

// Membungkus isi (pesan chat atau isi post) dengan gaya bubble bertema.
//
//   themeId   id tema dari constants/bubbleThemes.js (tema polos/tidak dikenal
//             dirender tanpa gaya tambahan)
//   side      "left" | "right": sisi karakter mengintip dan ekor bubble
//   variant   "chat" (Pesan) | "post" (isi post di Feed)
//   compact   hanya untuk variant "post": jarak bawah lebih rapat (Feed padat)
//   className kelas tata letak dari pemanggil (lebar maks, self-end, dll.)
export default function ThemedBubble({
  themeId,
  side = "left",
  variant = "chat",
  compact = false,
  className = "",
  children,
}) {
  const theme = findBubbleTheme(themeId);
  if (!theme || theme.plain) {
    // tema bawaan: jangan ubah apa pun
    return <div className={className}>{children}</div>;
  }

  const style = {
    "--tb-bg": theme.bg,
    "--tb-border": theme.border,
    "--tb-text": theme.text,
    "--tb-shadow": theme.shadow || "none",
  };
  const classes = [
    "tb",
    `tb-${variant}`,
    `tb-${side}`,
    theme.mono ? "tb-mono" : "",
    theme.mascot ? "tb-has-mascot" : "",
    theme.decor?.length ? "tb-has-decor" : "",
    compact ? "tb-compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} style={style} data-bubble-theme={theme.id}>
      {theme.mascot && (
        <svg
          className="tb-mascot"
          viewBox="0 0 36 36"
          aria-hidden="true"
          focusable="false"
          dangerouslySetInnerHTML={{ __html: theme.mascot }}
        />
      )}
      {children}
      {theme.decor?.map(([shape, slot, color], i) => (
        <i
          key={i}
          aria-hidden="true"
          className={`tb-d tb-sh-${shape} tb-sl-${slot}`}
          style={{ background: color, animationDelay: `${i * 0.5}s` }}
        />
      ))}
    </div>
  );
}
