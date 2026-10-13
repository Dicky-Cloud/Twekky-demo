import { useState } from "react";
import { fmtMonth } from "../../api/careerStore";
import { A4_W, A4_H, CV_FONTS } from "../../constants/cvTemplates";
import { tint, shade, isLight, textSafe } from "../../utils/cvColor";

// Merender satu CV berukuran A4 (794 x 1123 px) dari data profil + konfigurasi model.
// Hanya memakai gaya inline supaya hasil cetak/PDF sama dengan pratinjau.
//
// data: { name, headline, contact[], summary, photo, skills[], languages[], interests[],
//         experience[], education[], organizations[], certifications[], portfolio[] }
// show: { summary, experience, education, skills, languages, interests,
//         organizations, certifications, portfolio }
// preview: true menambah jarak atas/bawah (meniru margin cetak 14 mm) pada model
//          yang boleh lebih dari satu halaman.

// Foto yang gagal dimuat tidak meninggalkan lingkaran kosong: tampilkan cadangan.
function SafeImg({ src, style, fallback = null }) {
  const [bad, setBad] = useState(false);
  if (bad) return fallback;
  return <img src={src} alt="" style={style} referrerPolicy="no-referrer" onError={() => setBad(true)} />;
}

const monthRange = (e) =>
  [fmtMonth(e.start), e.current ? "Sekarang" : fmtMonth(e.end)].filter(Boolean).join(" – ");
const yearRange = (e) => [e.start, e.end].filter(Boolean).join(" – ");

export default function CvDocument({ data, tpl, accent, accent2 = null, show, preview = false, density = 1 }) {
  const L = tpl.layout;
  const compact = L === "compact";
  const dark = L === "darkSide" || L === "sideGold";
  const chipSkills = L === "curve" || L === "bluebar"; // keahlian sebagai pil berwarna lembut
  const lineMode = L === "timeline" ? "dot" : dark; // garis waktu pada pengalaman/pendidikan
  const fs = (compact ? 11.5 : 12.5) * density; // density < 1 memadatkan isi agar muat 1 halaman
  const dk = isLight(accent); // aksen terang: teks di atasnya dibuat gelap
  const onAcc = dk ? "#111827" : "#ffffff";
  const ow = (a) => (dk ? `rgba(17,24,39,${a})` : `rgba(255,255,255,${a})`); // teks/hiasan di atas warna aksen
  const accentText = textSafe(accent); // aksen sebagai teks di atas putih (digelapkan hanya bila terlalu terang)
  const night = L === "night" || L === "memphis"; // halaman gelap
  const hi = night ? tint(accent, 0.6) : accentText; // warna sorot (lebih terang di halaman gelap)
  const muted = night ? "#9ca3af" : "#4b5563";
  const sideMuted = ow(.8); // teks kecil di sidebar gelap
  const ink = night ? "#f9fafb" : "#111827";
  // Warna pendamping (kombinasi warna): bila ada, dipakai untuk latar lembut dan hiasan.
  const second = /^#[0-9a-f]{6}$/i.test(accent2 || "") ? accent2 : null;
  const t2 = (amt) => tint(second || accent, amt); // turunan lembut dari warna pendamping (atau aksen)
  const soft = t2(second ? 0.86 : 0.9);
  const bodyText = night ? "#d1d5db" : "#374151";

  // ---- potongan kecil ------------------------------------------------------
  const Heading = ({ children, light = false }) => {
    if (L === "tabs" || L === "ledger") return null; // judul dipindah ke tab vertikal
    const color = light ? onAcc : hi;
    const m = compact ? `${13 * density}px 0 ${6 * density}px` : `${20 * density}px 0 ${8 * density}px`;
    const px = (n) => n * density;
    const base = { margin: m, fontWeight: 700, color, breakAfter: "avoid" };
    const exact = { WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" };
    switch (tpl.heading) {
      case "italic":
        return <div style={{ ...base, color: accentText, fontSize: px(15), fontStyle: "italic", fontWeight: 600, borderBottom: `1px solid ${ink}`, paddingBottom: 2 }}>{children}</div>;
      case "marker":
        return (
          <div style={{ margin: m, breakAfter: "avoid" }}>
            <span style={{ fontSize: px(14), fontWeight: 700, padding: "0 6px", background: `linear-gradient(transparent 50%, ${tint(accent, 0.72)} 50%)`, ...exact }}>{children}</span>
          </div>
        );
      case "label":
        return (
          <div style={{ margin: m, breakAfter: "avoid" }}>
            <span style={{ display: "inline-block", background: soft, color: accentText, padding: "3px 10px", borderRadius: 3, fontSize: px(13), fontWeight: 700, ...exact }}>{children}</span>
          </div>
        );
      case "ribbon":
        return (
          <div style={{ margin: m, marginLeft: -48, breakAfter: "avoid" }}>
            <span style={{ display: "inline-block", background: accent, color: onAcc, padding: "4px 34px 4px 48px", fontSize: px(13), fontWeight: 700, clipPath: "polygon(0 0, calc(100% - 13px) 0, 100% 50%, calc(100% - 13px) 100%, 0 100%)", ...exact }}>{children}</span>
          </div>
        );
      case "pill":
        return (
          <div style={{ margin: m, breakAfter: "avoid" }}>
            <span style={{ display: "inline-block", background: accent, color: onAcc, padding: "3px 14px", borderRadius: 99, fontSize: px(12.5), fontWeight: 700, ...exact }}>{children}</span>
          </div>
        );
      case "square":
        return (
          <div style={{ margin: m, display: "flex", alignItems: "center", gap: 10, breakAfter: "avoid" }}>
            <span style={{ width: px(14), height: px(14), background: second || accent, flex: "none", ...exact }} />
            <span style={{ fontWeight: 700, fontSize: px(13.5), letterSpacing: "0.05em", textTransform: "uppercase", color }}>{children}</span>
          </div>
        );
      case "capsule":
        return (
          <div style={{ margin: m, breakAfter: "avoid" }}>
            <span style={{ display: "inline-block", background: tint(accent, 0.82), color: accentText, padding: "5px 20px", borderRadius: 99, fontSize: px(13.5), fontWeight: 700, ...exact }}>{children}</span>
          </div>
        );
      case "dots":
        return <div style={{ ...base, fontSize: px(13), borderBottom: `2px dotted ${accent}`, paddingBottom: 3 }}>{children}</div>;
      case "rule":
        return (
          <div style={{ ...base, fontSize: px(11.5), letterSpacing: "0.07em", textTransform: "uppercase", borderBottom: `1px solid ${light ? ow(0.45) : accent}`, paddingBottom: 3 }}>
            {children}
          </div>
        );
      case "bar":
        return (
          <div style={{ ...base, fontSize: px(13) }}>
            {children}
            <div style={{ width: 28, height: 3, background: light ? onAcc : (second || accent), marginTop: 3 }} />
          </div>
        );
      default:
        return <div style={{ ...base, fontSize: px(14) }}>{children}</div>;
    }
  };

  const Entry = ({ title, sub, date, desc, line = false, mc = muted, dc = bodyText }) => (
    <div style={{ breakInside: "avoid", marginBottom: (compact ? 7 : 11) * density, ...(line ? { position: "relative", borderLeft: `2px solid ${accent}`, paddingLeft: line === "dot" ? 16 : 12 } : {}) }}>
      {line === "dot" && (
        <span style={{ position: "absolute", left: -8, top: 3, width: 14, height: 14, boxSizing: "border-box", borderRadius: "50%", background: "#fff", border: `3px solid ${accent}` }} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontWeight: 700 }}>{title}</span>
        {date && <span style={{ color: mc, whiteSpace: "nowrap", fontSize: fs - 1 }}>{date}</span>}
      </div>
      {sub && <div style={{ color: mc }}>{sub}</div>}
      {desc && <div style={{ whiteSpace: "pre-wrap", marginTop: 3, color: dc }}>{desc}</div>}
    </div>
  );

  const initials = (data.name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  const Photo = ({ size = 84, ring = false, fallback = false, h, radius = "50%" }) => {
    const initial = fallback ? (
      <div style={{ width: size, height: h ?? size, boxSizing: "border-box", borderRadius: radius, background: soft, color: accentText, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.36, flex: "none", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact", ...(ring ? { border: "4px solid #fff" } : {}) }}>
        {initials}
      </div>
    ) : null;
    return data.photo ? (
      <SafeImg src={data.photo} fallback={initial} style={{ width: size, height: h ?? size, boxSizing: "border-box", borderRadius: radius, objectFit: "cover", flex: "none", ...(ring ? { border: "4px solid #fff" } : {}) }} />
    ) : initial;
  };

  const icon = (c) => {
    const d = c.includes("@")
      ? "M3 6h18v12H3zM3 6l9 7 9-7"
      : /^[+\d][\d\s()-]{5,}$/.test(c)
        ? "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"
        : "M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z";
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accentText} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><path d={d} /></svg>;
  };
  const IconContact = ({ vertical = false }) => (
    <div style={{ display: "flex", flexDirection: vertical ? "column" : "row", flexWrap: "wrap", gap: vertical ? 4 : "4px 16px", fontSize: fs - 0.5, color: "#374151" }}>
      {data.contact.map((c) => (
        <span key={c} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{icon(c)}{c}</span>
      ))}
    </div>
  );
  const Contact = ({ vertical = false, color = muted, center = false, sep = false }) => (
    <div style={{ color, fontSize: fs - 0.5, display: "flex", flexDirection: vertical ? "column" : "row", flexWrap: "wrap", gap: vertical ? 3 : "2px 10px", justifyContent: center ? "center" : "flex-start" }}>
      {data.contact.map((c, i) => (
        <span key={c} style={vertical ? { wordBreak: "break-word" } : undefined}>{sep && i > 0 ? "| " : ""}{c}</span>
      ))}
    </div>
  );

  // ---- bagian-bagian isi (vertical = kolom sempit: daftar ke bawah) ----------
  const list = (items, vertical, chips = false) => {
    if (vertical) return <div style={{ lineHeight: 1.6 }}>{items.map((s) => <div key={s}>{s}</div>)}</div>;
    if (chips) {
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {items.map((s) => <span key={s} style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "2px 9px" }}>{s}</span>)}
        </div>
      );
    }
    return <div style={{ color: bodyText, lineHeight: 1.6 }}>{items.join(", ")}</div>;
  };

  const sec = {
    summary: () =>
      show.summary && (
        <div key="summary">
          <Heading>Ringkasan</Heading>
          <div style={{ whiteSpace: "pre-wrap", color: bodyText }}>{data.summary}</div>
        </div>
      ),
    experience: () =>
      show.experience && (
        <div key="experience">
          <Heading>Pengalaman Kerja</Heading>
          {data.experience.map((e) => (
            <Entry key={e.id} line={lineMode} title={e.title} sub={[e.company, e.industry].filter(Boolean).join(" · ")} date={monthRange(e)} desc={e.desc} />
          ))}
        </div>
      ),
    education: () =>
      show.education && (
        <div key="education">
          <Heading>Pendidikan</Heading>
          {data.education.map((e) => (
            <Entry key={e.id} line={lineMode} title={e.school} sub={[e.level, e.major].filter(Boolean).join(" · ")} date={yearRange(e)} />
          ))}
        </div>
      ),
    organizations: () =>
      show.organizations && (
        <div key="organizations">
          <Heading>Organisasi</Heading>
          {data.organizations.map((e) => (
            <Entry key={e.id} line={lineMode} title={e.title} sub={e.company} date={monthRange(e)} desc={e.desc} />
          ))}
        </div>
      ),
    certifications: (v) =>
      show.certifications && (
        <div key="certifications">
          <Heading light={dark && v}>Sertifikasi dan Prestasi</Heading>
          {data.certifications.map((e) => (
            <Entry key={e.id} title={e.title} sub={e.company} date={v ? "" : e.start} desc={v ? e.start : ""} mc={dark && v ? sideMuted : muted} dc={dark && v ? sideMuted : bodyText} />
          ))}
        </div>
      ),
    skills: (v) =>
      show.skills && (
        <div key="skills">
          <Heading light={dark && v}>Keahlian</Heading>
          {chipSkills ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {data.skills.map((x) => (
                <span key={x} style={{ background: L === "bluebar" ? "#fff" : soft, borderRadius: 99, padding: "2px 10px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{x}</span>
              ))}
            </div>
          ) : (
            list(data.skills, v, !v && !compact)
          )}
        </div>
      ),
    languages: (v) =>
      show.languages && (
        <div key="languages">
          <Heading light={dark && v}>Bahasa</Heading>
          {list(data.languages, v)}
        </div>
      ),
    interests: (v) =>
      show.interests && (
        <div key="interests">
          <Heading light={dark && v}>Minat</Heading>
          {list(data.interests, v)}
        </div>
      ),
    portfolio: (v) =>
      show.portfolio && (
        <div key="portfolio">
          <Heading light={dark && v}>Portofolio</Heading>
          {data.portfolio.map((p) => (
            <div key={p.id} style={{ breakInside: "avoid", marginBottom: 6, wordBreak: "break-all" }}>
              <div style={{ fontWeight: 700 }}>{p.title}</div>
              <div style={{ color: dark && v ? sideMuted : muted }}>{p.url}</div>
            </div>
          ))}
        </div>
      ),
  };
  const render = (keys, vertical = false) => keys.map((k) => sec[k](vertical));

  const NameBlock = ({ size = 30, light = false }) => (
    <>
      <div style={{ fontSize: size, fontWeight: 700, lineHeight: 1.12, letterSpacing: "-0.01em", color: light ? onAcc : ink }}>{data.name}</div>
      {data.headline && <div style={{ fontSize: fs + 2, marginTop: 4, color: light ? ow(0.88) : hi }}>{data.headline}</div>}
    </>
  );

  // ---- rangka halaman --------------------------------------------------------
  const base = {
    width: A4_W,
    boxSizing: "border-box",
    background: "#fff",
    color: ink,
    fontFamily: CV_FONTS[tpl.font] || CV_FONTS.sans,
    fontSize: fs,
    lineHeight: density < 1 ? 1.42 : 1.5,
  };
  const flow = { ...base, minHeight: preview ? A4_H : undefined, padding: preview ? "53px 48px" : "0 48px" };
  // Model berlatar penuh: tepat satu halaman, isi berlebih dipotong.
  const fixed = { ...base, position: "relative", height: A4_H - 1, overflow: "hidden", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" };

  // 1) sidebar kiri/kanan (tanpa latar penuh)
  if (L === "sidebarLeft" || L === "sidebarRight") {
    const left = L === "sidebarLeft";
    const side = (
      <div style={{ [left ? "paddingRight" : "paddingLeft"]: 22, [left ? "borderRight" : "borderLeft"]: "1px solid #e5e7eb" }}>
        {data.photo && <div style={{ marginBottom: 14 }}><Photo size={96} /></div>}
        {data.contact.length > 0 && (<div><Heading>Kontak</Heading><Contact vertical color="#374151" /></div>)}
        {render(["skills", "languages", "interests", "certifications", "portfolio"], true)}
      </div>
    );
    const main = (
      <div style={{ minWidth: 0 }}>
        <NameBlock />
        {render(["summary", "experience", "education", "organizations"])}
      </div>
    );
    return (
      <div style={{ ...flow, display: "grid", gridTemplateColumns: left ? "225px 1fr" : "1fr 225px", gap: 26, alignItems: "start" }}>
        {left ? side : main}
        {left ? main : side}
      </div>
    );
  }

  // 2) sidebar warna penuh + garis waktu (1 halaman)
  if (L === "darkSide") {
    return (
      <div style={{ ...fixed, display: "grid", gridTemplateColumns: "240px 1fr" }}>
        <div style={{ background: accent, color: onAcc, padding: "44px 24px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          {data.photo && <div style={{ marginBottom: 6 }}><Photo size={104} ring /></div>}
          {data.contact.length > 0 && (<div><Heading light>Kontak</Heading><Contact vertical color={onAcc} /></div>)}
          {render(["skills", "languages", "interests", "certifications", "portfolio"], true)}
        </div>
        <div style={{ padding: "44px 40px 44px 32px", minWidth: 0 }}>
          <NameBlock size={32} />
          {render(["summary", "experience", "education", "organizations"])}
        </div>
      </div>
    );
  }

  // 3) kolom kanan berwarna (1 halaman)
  if (L === "colorCol") {
    return (
      <div style={{ ...fixed, display: "grid", gridTemplateColumns: "1fr 250px" }}>
        <div style={{ padding: "44px 30px 44px 48px", minWidth: 0 }}>
          <NameBlock size={32} />
          {render(["summary", "experience", "education", "organizations"])}
        </div>
        <div style={{ background: soft, padding: "44px 24px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          {data.photo && <div style={{ marginBottom: 6 }}><Photo size={104} /></div>}
          {data.contact.length > 0 && (<div><Heading>Kontak</Heading><Contact vertical color="#374151" /></div>)}
          {render(["skills", "languages", "interests", "certifications", "portfolio"], true)}
        </div>
      </div>
    );
  }

  // 4a) lengkung: lingkaran besar di kiri atas + foto bulat
  if (L === "curve") {
    return (
      <div style={fixed}>
        <svg width={A4_W} height={370} viewBox={`0 0 ${A4_W} 370`} style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
          <circle cx="130" cy="110" r="250" fill={soft} />
          <circle cx="130" cy="110" r="205" fill={accent} />
        </svg>
        <div style={{ position: "absolute", left: 50, top: 30 }}><Photo size={160} ring fallback /></div>
        <div style={{ position: "absolute", left: 400, top: 56, width: 346 }}>
          <NameBlock size={34} />
          {show.summary && <div style={{ marginTop: 12, whiteSpace: "pre-wrap", color: bodyText }}>{data.summary}</div>}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 382, padding: "0 48px", display: "grid", gridTemplateColumns: "230px 1fr", gap: 30, alignItems: "start" }}>
          <div>
            {data.contact.length > 0 && (<div><Heading>Kontak</Heading><Contact vertical color="#374151" /></div>)}
            {render(["skills", "languages", "interests", "certifications", "portfolio"], true)}
          </div>
          <div style={{ minWidth: 0 }}>{render(["experience", "education", "organizations"])}</div>
        </div>
      </div>
    );
  }

  // 4b) gelombang: kepala bergelombang + panel lembut
  if (L === "wave") {
    return (
      <div style={fixed}>
        <svg width={A4_W} height={290} viewBox={`0 0 ${A4_W} 290`} style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
          <path d="M0 0H794V224C700 264 610 190 500 224C390 258 300 188 190 224C110 250 50 234 0 242Z" fill={soft} />
          <path d="M0 0H794V196C700 236 610 162 500 196C390 230 300 160 190 196C110 222 50 206 0 214Z" fill={accent} />
        </svg>
        <div style={{ position: "absolute", left: 48, top: 54, width: 540 }}>
          <NameBlock size={34} light />
          <div style={{ marginTop: 14 }}><Contact color={ow(.92)} /></div>
        </div>
        <div style={{ position: "absolute", right: 56, top: 40 }}><Photo size={132} ring fallback /></div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 262, padding: "0 48px", display: "grid", gridTemplateColumns: "235px 1fr", gap: 28, alignItems: "start" }}>
          <div style={{ background: soft, borderRadius: 16, padding: "2px 18px 18px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            {render(["skills", "languages", "interests", "certifications"], true)}
          </div>
          <div style={{ minWidth: 0 }}>{render(["summary", "experience", "education", "organizations", "portfolio"])}</div>
        </div>
      </div>
    );
  }

  // 4c) diagonal: kepala dipotong miring, foto di tepi potongan
  if (L === "diagonal") {
    return (
      <div style={fixed}>
        <div style={{ position: "absolute", left: 0, top: 0, width: A4_W, height: 290, background: soft, clipPath: "polygon(0 0, 100% 0, 100% 56%, 0 100%)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: A4_W, height: 262, background: accent, clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 92%)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        <div style={{ position: "absolute", left: 48, top: 50, width: 480 }}>
          <NameBlock size={36} light />
          <div style={{ marginTop: 16, width: 430 }}><Contact color={ow(.92)} /></div>
        </div>
        <div style={{ position: "absolute", right: 56, top: 66 }}><Photo size={136} ring fallback /></div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, padding: "0 48px", display: "grid", gridTemplateColumns: "1fr 215px", gap: 28, alignItems: "start" }}>
          <div style={{ minWidth: 0 }}>{render(["summary", "experience", "education", "organizations"])}</div>
          <div style={{ borderLeft: "1px solid #e5e7eb", paddingLeft: 20 }}>
            {render(["skills", "languages", "interests", "certifications", "portfolio"], true)}
          </div>
        </div>
      </div>
    );
  }

  // 4e) garis waktu: sidebar lembut + titik pada pengalaman dan pendidikan
  if (L === "timeline") {
    return (
      <div style={{ ...fixed, display: "grid", gridTemplateColumns: "252px 1fr" }}>
        <div style={{ background: soft, padding: "44px 24px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><Photo size={132} ring fallback /></div>
          {data.contact.length > 0 && (<div><Heading>Kontak</Heading><Contact vertical color="#374151" /></div>)}
          {render(["skills", "languages", "interests", "certifications", "portfolio"], true)}
        </div>
        <div style={{ padding: "48px 44px 44px 38px", minWidth: 0 }}>
          <NameBlock size={36} />
          <div style={{ height: 4, width: 60, background: accent, margin: "14px 0 2px" }} />
          {render(["summary", "experience", "education", "organizations"])}
        </div>
      </div>
    );
  }

  const heroSplit = (data.name || "").split(/\s+/);
  const HEX = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";
  const hexPts = (cx, cy, r) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");
  const twoCol = (mainKeys, sideKeys, w = 215, gap = 28, sideStyle = {}) => (
    <div style={{ display: "grid", gridTemplateColumns: `1fr ${w}px`, gap, alignItems: "start" }}>
      <div style={{ minWidth: 0 }}>{render(mainKeys)}</div>
      <div style={sideStyle}>{render(sideKeys, true)}</div>
    </div>
  );

  // N1) bingkai: bingkai ganda + judul tengah
  if (L === "frame") {
    return (
      <div style={fixed}>
        <div style={{ position: "absolute", inset: 24, border: `3px solid ${accent}` }} />
        <div style={{ position: "absolute", inset: 34, border: `1px solid ${accent}` }} />
        <div style={{ position: "absolute", inset: 0, padding: "64px 66px" }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <Photo size={100} fallback />
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 6 }}>{data.name}</div>
            {data.headline && <div style={{ color: accentText, fontSize: fs + 2, letterSpacing: "0.08em" }}>{data.headline}</div>}
            <Contact center />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 2px" }}>
            <div style={{ flex: 1, height: 1, background: accent }} />
            <div style={{ width: 8, height: 8, background: accent, transform: "rotate(45deg)" }} />
            <div style={{ flex: 1, height: 1, background: accent }} />
          </div>
          {twoCol(["summary", "experience", "education", "organizations"], ["skills", "languages", "interests", "certifications", "portfolio"], 200, 26, { borderLeft: "1px solid #e5e7eb", paddingLeft: 18 })}
        </div>
      </div>
    );
  }

  // N2) monogram: huruf inisial besar di latar + nama bertipografi besar
  if (L === "monogram") {
    return (
      <div style={fixed}>
        <div aria-hidden="true" style={{ position: "absolute", left: -34, top: -120, fontSize: 520, fontWeight: 700, lineHeight: 1, color: tint(accent, 0.9), fontFamily: CV_FONTS.serif, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{initials.slice(0, 1)}</div>
        <div style={{ position: "absolute", inset: 0, padding: "70px 58px 0" }}>
          {data.photo && <div style={{ position: "absolute", right: 58, top: 70 }}><Photo size={104} /></div>}
          <div style={{ fontSize: 58, lineHeight: 1.02, letterSpacing: "-0.02em" }}>
            <span style={{ fontWeight: 400 }}>{heroSplit[0]}</span>
            {heroSplit.length > 1 && (<><br /><b>{heroSplit.slice(1).join(" ")}</b></>)}
          </div>
          {data.headline && <div style={{ fontSize: fs + 4, fontStyle: "italic", color: accentText, marginTop: 12 }}>{data.headline}</div>}
          <div style={{ marginTop: 14 }}><Contact /></div>
          <div style={{ marginTop: 18 }}>
            {twoCol(["summary", "experience", "education", "organizations"], ["skills", "languages", "interests", "certifications", "portfolio"], 215, 30, { borderLeft: `3px solid ${accent}`, paddingLeft: 18 })}
          </div>
        </div>
      </div>
    );
  }

  // N3) pita: judul bagian berbentuk pita dari tepi halaman
  if (L === "ribbon") {
    return (
      <div style={{ ...fixed, padding: "46px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ flex: 1 }}><NameBlock size={38} /></div>
          <Photo size={108} fallback />
        </div>
        <div style={{ margin: "16px -48px 0", background: soft, padding: "8px 48px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          <Contact color={ink} />
        </div>
        {render(["summary", "experience", "education", "skills", "languages", "organizations", "certifications", "interests", "portfolio"])}
      </div>
    );
  }

  // N4) heksagon: foto segi enam + hiasan sarang lebah
  if (L === "hex") {
    const hexInitials = (
      <div style={{ width: 132, height: 132, clipPath: HEX, background: soft, color: accentText, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 48, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{initials}</div>
    );
    return (
      <div style={fixed}>
        <svg width={320} height={290} viewBox="0 0 320 290" style={{ position: "absolute", right: 0, top: 0 }} aria-hidden="true">
          <polygon points={hexPts(260, 70, 74)} fill={soft} />
          <polygon points={hexPts(170, 40, 34)} fill="none" stroke={accent} strokeWidth="2" />
          <polygon points={hexPts(300, 190, 40)} fill={accent} opacity="0.85" />
          <polygon points={hexPts(205, 215, 26)} fill={soft} />
        </svg>
        <div style={{ position: "absolute", right: 74, top: 56, width: 152, height: 152, clipPath: HEX, background: accent, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />
        <div style={{ position: "absolute", right: 80, top: 62, width: 140, height: 140, clipPath: HEX, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {data.photo ? (
            <SafeImg src={data.photo} style={{ width: 132, height: 132, objectFit: "cover", clipPath: HEX }} fallback={hexInitials} />
          ) : (
            hexInitials
          )}
        </div>
        <div style={{ position: "absolute", left: 52, top: 70, width: 430 }}>
          <NameBlock size={40} />
          <div style={{ marginTop: 16 }}><IconContact vertical /></div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 300, padding: "0 52px" }}>
          {twoCol(["summary", "experience", "education", "organizations"], ["skills", "languages", "interests", "certifications", "portfolio"], 215, 30, { borderLeft: "1px solid #e5e7eb", paddingLeft: 20 })}
        </div>
      </div>
    );
  }

  // N5) gradien: kepala gradasi bersudut bulat + foto di tepi
  if (L === "gradient") {
    return (
      <div style={fixed}>
        <div style={{ position: "absolute", left: 0, top: 0, width: A4_W, height: 300, borderRadius: "0 0 56px 56px", background: `linear-gradient(135deg, ${accent}, ${tint(accent, 0.4)})`, overflow: "hidden", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          <div style={{ position: "absolute", right: -70, top: -70, width: 260, height: 260, borderRadius: "50%", background: ow(.12) }} />
          <div style={{ position: "absolute", right: 190, top: 170, width: 130, height: 130, borderRadius: "50%", background: ow(.1) }} />
        </div>
        <div style={{ position: "absolute", left: 48, top: 48, width: 500 }}>
          <NameBlock size={38} light />
          {show.summary && <div style={{ marginTop: 12, whiteSpace: "pre-wrap", color: ow(.92) }}>{data.summary}</div>}
        </div>
        <div style={{ position: "absolute", left: 48, top: 244, width: 560, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {data.contact.map((c) => (
            <span key={c} style={{ background: ow(.2), color: onAcc, padding: "3px 12px", borderRadius: 99, fontSize: fs - 1, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>{c}</span>
          ))}
        </div>
        <div style={{ position: "absolute", right: 56, top: 232 }}><Photo size={132} ring fallback /></div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 336, padding: "0 48px" }}>
          {twoCol(["experience", "education", "organizations"], ["skills", "languages", "interests", "certifications", "portfolio"], 215, 28, {})}
        </div>
      </div>
    );
  }

  const sideKeys = ["skills", "languages", "interests", "certifications", "portfolio"];

  // ======================= model tambahan (1 halaman kecuali dicatat) =======================
  const fullName = (data.name || "").trim();
  const first = heroSplit[0] || "";
  const rest = heroSplit.slice(1).join(" ");
  const heading2 = { fontSize: fs + 2, letterSpacing: "0.22em", textTransform: "uppercase" };
  const exact2 = { WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" };
  const contactBlock = data.contact.length > 0 && (<div><Heading>Kontak</Heading><IconContact vertical /></div>);
  const card = (keys, v = false) =>
    keys.map((k) => {
      const el = sec[k](v);
      return el ? (
        <div key={k} style={{ background: "#fff", borderRadius: 16, padding: "0 20px 12px", marginBottom: 16, boxShadow: `0 2px 10px ${t2(0.75)}`, ...exact2 }}>
          <div style={{ marginTop: -8 }}>{el}</div>
        </div>
      ) : null;
    });

  // A1) hijau batik: kepala warna penuh bergelombang + foto bulat + dua kolom
  if (L === "batik") {
    return (
      <div style={fixed}>
        <svg width={A4_W} height={340} viewBox="0 0 794 340" style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
          <rect width="794" height="318" fill={accent} />
          <circle cx="740" cy="110" r="150" fill="none" stroke={ow(0.1)} strokeWidth="22" />
          <circle cx="740" cy="110" r="90" fill="none" stroke={ow(0.1)} strokeWidth="22" />
          <path d="M0 0H150C60 90 150 200 40 318H0Z" fill={ow(0.14)} />
          <path d="M60 0C10 110 120 200 30 318" fill="none" stroke={ow(0.85)} strokeWidth="5" />
          <path d="M95 0C45 110 155 200 70 318" fill="none" stroke={ow(0.85)} strokeWidth="3" />
          <rect y="318" width="794" height="22" fill={t2(0.35)} />
        </svg>
        <div style={{ position: "absolute", left: 48, top: 78 }}><Photo size={190} ring fallback /></div>
        <div style={{ position: "absolute", left: 272, top: 72, width: 480 }}>
          <NameBlock size={38} light />
          {show.summary && <div style={{ marginTop: 14, fontSize: fs - 1.5, lineHeight: 1.65, color: ow(0.92), whiteSpace: "pre-wrap", maxHeight: 150, overflow: "hidden" }}>{data.summary}</div>}
        </div>
        <div style={{ position: "absolute", left: 48, top: 356, width: 290 }}>
          {contactBlock}
          {render(sideKeys, true)}
        </div>
        <div style={{ position: "absolute", left: 396, top: 356, width: 350 }}>{render(["experience", "education", "organizations"])}</div>
        <svg width={A4_W} height={90} viewBox="0 0 794 90" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: 0 }} aria-hidden="true">
          <path d="M0 50C150 90 260 10 420 30C560 48 660 80 794 20V90H0Z" fill={t2(0.35)} />
          <path d="M0 70C140 96 280 40 430 56C580 72 680 92 794 52V90H0Z" fill={accent} />
        </svg>
      </div>
    );
  }

  // A2) navy emas: sidebar warna penuh bergaris emas + nama dua baris
  if (L === "sideGold") {
    const gold = second || "#d4a64a";
    return (
      <div style={{ ...fixed, display: "grid", gridTemplateColumns: "272px 1fr" }}>
        <div style={{ background: accent, color: onAcc, padding: "48px 28px", borderRight: `4px solid ${gold}`, ...exact2 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><Photo size={150} ring fallback /></div>
          {data.contact.length > 0 && (<div><Heading light>Kontak</Heading><Contact vertical color={onAcc} /></div>)}
          {render(sideKeys, true)}
        </div>
        <div style={{ padding: "56px 44px 44px", minWidth: 0 }}>
          <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.08 }}>{first}{rest && <><br />{rest}</>}</div>
          {data.headline && <div style={{ fontSize: fs + 1, letterSpacing: "0.2em", textTransform: "uppercase", color: "#b78a2e", margin: "10px 0 14px" }}>{data.headline}</div>}
          {render(["summary", "experience", "education", "organizations"])}
        </div>
      </div>
    );
  }

  // A3) elegan: nama huruf besar di tengah, dua kolom ramping
  if (L === "elegant") {
    return (
      <div style={{ ...fixed, padding: "62px 62px 0" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.1 }}>{fullName}</div>
          {data.headline && <div style={{ ...heading2, letterSpacing: "0.4em", margin: "12px 0 14px", color: accentText }}>{data.headline}</div>}
          <div style={{ borderTop: `1px solid ${ink}`, borderBottom: `1px solid ${ink}`, padding: "8px 0" }}><Contact center /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 36, marginTop: 8, alignItems: "start" }}>
          <div>{render(["summary", "skills", "languages", "interests"], true)}</div>
          <div style={{ minWidth: 0 }}>{render(["experience", "education", "organizations", "certifications", "portfolio"])}</div>
        </div>
      </div>
    );
  }

  // A4) terakota: kepala miring, foto persegi membulat, bagian dalam kartu
  if (L === "terra") {
    return (
      <div style={{ ...fixed, background: t2(0.94) }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: A4_W, height: 300, background: accent, clipPath: "polygon(0 0, 100% 0, 100% 62%, 0 100%)", ...exact2 }} />
        <div style={{ position: "absolute", left: 56, top: 54 }}><Photo size={170} h={170} radius={26} ring fallback /></div>
        <div style={{ position: "absolute", left: 262, top: 76, width: 480 }}><NameBlock size={38} light /></div>
        <div style={{ position: "absolute", left: 56, top: 318, width: 250 }}>
          {data.contact.length > 0 && (<div style={{ background: "#fff", borderRadius: 16, padding: "0 20px 14px", marginBottom: 16, boxShadow: `0 2px 10px ${t2(0.75)}`, ...exact2 }}><div style={{ marginTop: -8 }}><Heading>Kontak</Heading><Contact vertical color="#374151" /></div></div>)}
          {card(sideKeys, true)}
        </div>
        <div style={{ position: "absolute", left: 330, top: 318, width: 408 }}>{card(["summary", "experience", "education", "organizations"])}</div>
      </div>
    );
  }

  // A5) biru modern: kepala gradasi + sidebar lembut di kanan
  if (L === "bluebar") {
    return (
      <div style={fixed}>
        <div style={{ height: 210, background: `linear-gradient(120deg, ${accent}, ${second && !isLight(second) ? second : tint(accent, 0.3)})`, padding: "46px 56px", display: "flex", alignItems: "center", gap: 28, ...exact2 }}>
          <Photo size={116} ring fallback />
          <div style={{ minWidth: 0 }}><NameBlock size={36} light /></div>
        </div>
        <div style={{ position: "absolute", left: 56, top: 232, width: 430 }}>{render(["summary", "experience", "education", "organizations"])}</div>
        <div style={{ position: "absolute", right: 0, top: 210, bottom: 0, width: 250, background: t2(0.95), padding: "14px 28px", ...exact2 }}>
          {data.contact.length > 0 && (<div><Heading>Kontak</Heading><Contact vertical color="#374151" /></div>)}
          {render(["skills", "languages", "interests", "certifications", "portfolio"], true)}
        </div>
      </div>
    );
  }

  // A6) sage: foto di tengah atas, garis waktu putus-putus di tengah
  if (L === "dashed") {
    return (
      <div style={{ ...fixed, background: t2(0.94) }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 46, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <Photo size={130} fallback />
          <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, marginTop: 8 }}>{fullName}</div>
          {data.headline && <div style={{ ...heading2, color: accentText }}>{data.headline}</div>}
          <Contact center />
          {show.summary && <div style={{ width: 520, marginTop: 10, whiteSpace: "pre-wrap", color: bodyText, maxHeight: 96, overflow: "hidden" }}>{data.summary}</div>}
        </div>
        <div style={{ position: "absolute", left: 60, right: 60, top: 390, display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
          <div style={{ paddingRight: 32, minWidth: 0 }}>{render(["experience", "organizations", "certifications"])}</div>
          <div style={{ paddingLeft: 32, borderLeft: `2px dashed ${t2(0.4)}`, minWidth: 0 }}>{render(["education", "skills", "languages", "interests", "portfolio"], true)}</div>
        </div>
      </div>
    );
  }

  // A7) pink bulat: panel membulat, lingkaran foto besar, cincin gradasi
  if (L === "bubble") {
    return (
      <div style={{ ...fixed, background: t2(0.94) }}>
        <svg width={A4_W} height={A4_H} viewBox={`0 0 ${A4_W} ${A4_H}`} style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
          <defs><linearGradient id="cvBubble" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={t2(0.3)} /><stop offset="1" stopColor={second || accent} /></linearGradient></defs>
          <circle cx="96" cy="95" r="62" fill="none" stroke="url(#cvBubble)" strokeWidth="30" />
          <circle cx="812" cy="48" r="68" fill="none" stroke="url(#cvBubble)" strokeWidth="26" />
          <circle cx="397" cy="1170" r="62" fill="none" stroke="url(#cvBubble)" strokeWidth="22" />
          <path d="M38 245H397V1045Q397 1081 361 1081H74Q38 1081 38 1045Z" fill={t2(0.72)} />
          <circle cx="217" cy="218" r="180" fill={t2(0.45)} />
        </svg>
        <div style={{ position: "absolute", left: 37, top: 38 }}><Photo size={360} fallback /></div>
        <div style={{ position: "absolute", left: 435, top: 36, width: 320 }}>
          <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.18, color: accentText, wordBreak: "break-word" }}>{fullName}</div>
          {data.headline && <div style={{ fontSize: fs + 4, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 12 }}>{data.headline}</div>}
          <div style={{ borderTop: `1.5px solid ${ink}`, margin: "16px 0 14px" }} />
          {show.summary && <div style={{ whiteSpace: "pre-wrap", color: bodyText, textAlign: "justify", maxHeight: 130, overflow: "hidden" }}>{data.summary}</div>}
        </div>
        <div style={{ position: "absolute", left: 62, top: 410, width: 300 }}>
          {data.contact.length > 0 && (<div><Heading>Kontak</Heading><IconContact vertical /></div>)}
          {render(["skills", "languages", "interests", "certifications"], true)}
        </div>
        <div style={{ position: "absolute", left: 435, top: 380, width: 320 }}>{render(["education", "experience", "organizations"])}</div>
      </div>
    );
  }

  // A8) eksekutif: kepala pita warna + kolom utama dan kolom samping (ramah ATS, boleh >1 halaman)
  if (L === "exec") {
    return (
      <div style={flow}>
        <div style={{ background: accent, color: onAcc, padding: "38px 56px 28px", margin: "0 -48px", ...exact2 }}>
          <NameBlock size={38} light />
          <div style={{ marginTop: 14 }}><Contact color={ow(0.92)} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 235px", gap: 32, alignItems: "start" }}>
          <div style={{ minWidth: 0 }}>{render(["summary", "experience", "organizations"])}</div>
          <div>{render(["skills", "education", "certifications", "languages", "interests", "portfolio"], true)}</div>
        </div>
      </div>
    );
  }

  // A9) bilah skill: sidebar lembut bergaris aksen + nama dua warna
  if (L === "skillbar") {
    return (
      <div style={{ ...fixed, display: "grid", gridTemplateColumns: "260px 1fr" }}>
        <div style={{ background: t2(0.93), borderRight: `4px solid ${accent}`, padding: "48px 28px", ...exact2 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}><Photo size={128} fallback /></div>
          {data.contact.length > 0 && (<div><Heading>Kontak</Heading><Contact vertical color="#374151" /></div>)}
          {show.skills && (
            <div>
              <Heading>Keahlian</Heading>
              {data.skills.map((x) => (<div key={x} style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 9, marginBottom: 7 }}>{x}</div>))}
            </div>
          )}
          {render(["languages", "interests", "certifications", "portfolio"], true)}
        </div>
        <div style={{ padding: "56px 44px 44px", minWidth: 0 }}>
          <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.02 }}>{first}{rest && <><br /><span style={{ color: accentText }}>{rest}</span></>}</div>
          {data.headline && <div style={{ letterSpacing: "0.3em", textTransform: "uppercase", fontSize: fs + 1, margin: "12px 0 8px" }}>{data.headline}</div>}
          {render(["summary", "experience", "education", "organizations"])}
        </div>
      </div>
    );
  }

  // A10) klasik baris: judul bagian di kiri, isi di kanan (ramah ATS, boleh >1 halaman)
  if (L === "ledger") {
    const rows = [["summary", "Profil"], ["experience", "Pengalaman"], ["education", "Pendidikan"], ["skills", "Keahlian"], ["languages", "Bahasa"], ["organizations", "Organisasi"], ["certifications", "Sertifikasi"], ["interests", "Minat"], ["portfolio", "Portofolio"]];
    return (
      <div style={flow}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, paddingBottom: 18 }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>{fullName}</div>
            {data.headline && <div style={{ letterSpacing: "0.16em", textTransform: "uppercase", color: accentText, marginTop: 6 }}>{data.headline}</div>}
          </div>
          <div style={{ textAlign: "right" }}><Contact vertical color="#374151" /></div>
        </div>
        {rows.map(([k, title]) => {
          const el = sec[k](false);
          return el ? (
            <div key={k} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 24, borderTop: `2px solid ${accent}`, padding: "14px 0 4px", breakInside: "avoid" }}>
              <div style={{ fontWeight: 700, color: accentText, fontSize: fs + 2 }}>{title}</div>
              <div style={{ minWidth: 0 }}>{el}</div>
            </div>
          ) : null;
        })}
      </div>
    );
  }

  // A11) organik: bentuk blob lembut + nama berhuruf lebar
  if (L === "organic") {
    return (
      <div style={fixed}>
        <svg width={A4_W} height={A4_H} viewBox={`0 0 ${A4_W} ${A4_H}`} style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
          <path d="M360 0H794V250C700 330 520 330 470 240C420 150 440 60 360 0Z" fill={t2(0.9)} />
          <path d="M0 0H250C300 120 190 250 270 380C330 480 250 610 100 590C30 580 0 540 0 500Z" fill={t2(0.84)} />
          <path d="M0 880C90 860 190 900 230 1000C260 1070 300 1100 330 1123H0Z" fill={t2(0.8)} />
        </svg>
        <div style={{ position: "absolute", left: 36, top: 36 }}><Photo size={200} fallback /></div>
        <div style={{ position: "absolute", left: 430, top: 60, width: 320 }}>
          <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1.12, wordBreak: "break-word" }}>{fullName}</div>
          {data.headline && <div style={{ ...heading2, letterSpacing: "0.3em", color: accentText, marginTop: 14 }}>{data.headline}</div>}
        </div>
        <div style={{ position: "absolute", left: 56, top: 330, width: 250 }}>{render(["summary"])}</div>
        <div style={{ position: "absolute", left: 56, top: 560, width: 230 }}>{render(["skills", "languages", "interests"], true)}</div>
        <div style={{ position: "absolute", left: 56, top: 900, width: 230 }}>{data.contact.length > 0 && (<div><Heading>Kontak</Heading><Contact vertical color="#374151" /></div>)}</div>
        <div style={{ position: "absolute", left: 350, top: 330, width: 390 }}>{render(["education", "experience", "organizations", "certifications", "portfolio"])}</div>
      </div>
    );
  }

  // A12) pasir: kolom kiri warna lembut + pita kepala melengkung
  if (L === "slider") {
    return (
      <div style={fixed}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 270, background: t2(0.9), ...exact2 }} />
        <div style={{ position: "absolute", left: 150, top: 44, right: 0, height: 150, background: accent, borderRadius: "75px 0 0 75px", padding: "40px 40px 0 112px", ...exact2 }}>
          <NameBlock size={34} light />
        </div>
        <div style={{ position: "absolute", left: 50, top: 34 }}><Photo size={170} ring fallback /></div>
        <div style={{ position: "absolute", left: 36, top: 232, width: 200 }}>
          {data.contact.length > 0 && (<div><Heading>Kontak</Heading><Contact vertical color="#374151" /></div>)}
          {render(["languages", "skills", "interests", "certifications", "portfolio"], true)}
        </div>
        <div style={{ position: "absolute", left: 310, top: 232, width: 430 }}>{render(["summary", "education", "experience", "organizations"])}</div>
      </div>
    );
  }

  // A13) memphis: halaman gelap dengan hiasan geometris
  if (L === "memphis") {
    const bgm = shade(accent, 0.78);
    const hl = t2(0.6);
    return (
      <div style={{ ...fixed, background: bgm, color: ink, ...exact2 }}>
        <svg width={A4_W} height={A4_H} viewBox={`0 0 ${A4_W} ${A4_H}`} style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
          <circle cx="740" cy="40" r="50" fill={hl} />
          <path d="M30 60l14-10 14 10 14-10 14 10" fill="none" stroke={t2(0.35)} strokeWidth="3" />
          <path d="M700 1070l14-10 14 10 14-10 14 10" fill="none" stroke={t2(0.35)} strokeWidth="3" />
          <path d="M40 1060l24 40H16Z" fill={t2(0.75)} />
          <circle cx="150" cy="150" r="108" fill="none" stroke={t2(0.75)} strokeWidth="4" strokeDasharray="2 10" strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", left: 60, top: 60 }}><Photo size={180} ring fallback /></div>
        <div style={{ position: "absolute", left: 40, top: 262, width: 220, textAlign: "center" }}><NameBlock size={24} /></div>
        <div style={{ position: "absolute", left: 56, top: 360, width: 200 }}>
          {render(["summary"], true)}
          {data.contact.length > 0 && (<div><Heading>Kontak</Heading><Contact vertical color={bodyText} /></div>)}
          {render(["skills", "languages", "interests", "certifications", "portfolio"], true)}
        </div>
        <div style={{ position: "absolute", left: 310, top: 100, width: 430 }}>{render(["education", "experience", "organizations"])}</div>
      </div>
    );
  }

  // A14) arch: foto berbentuk lengkung + panel lembut di kiri bawah
  if (L === "arch") {
    return (
      <div style={{ ...fixed, background: t2(0.96) }}>
        <svg width={A4_W} height={A4_H} viewBox={`0 0 ${A4_W} ${A4_H}`} style={{ position: "absolute", left: 0, top: 0 }} aria-hidden="true">
          <circle cx="30" cy="20" r="46" fill={t2(0.5)} />
          <path d="M794 0V170A170 170 0 0 1 624 0Z" fill={accent} />
          <path d="M0 520C0 470 60 440 120 450H300V1123H0Z" fill={t2(0.82)} />
        </svg>
        <div style={{ position: "absolute", left: 72, top: 60, width: 190, height: 260, borderRadius: "95px 95px 0 0", background: accent, ...exact2 }} />
        <div style={{ position: "absolute", left: 58, top: 74 }}><Photo size={190} h={260} radius="95px 95px 0 0" fallback /></div>
        <div style={{ position: "absolute", left: 320, top: 84, width: 400 }}>
          <NameBlock size={36} />
          <div style={{ marginTop: 14 }}><Contact /></div>
        </div>
        <div style={{ position: "absolute", left: 40, top: 480, width: 230 }}>{render(["summary", "education", "languages"], true)}</div>
        <div style={{ position: "absolute", left: 330, top: 300, width: 410 }}>{render(["skills", "experience", "organizations", "certifications", "interests", "portfolio"])}</div>
      </div>
    );
  }

  // M1) koran: kepala surat kabar + huruf awal besar
  if (L === "paper") {
    const sum = data.summary || "";
    return (
      <div style={fixed}>
        <div style={{ position: "absolute", inset: 0, padding: "44px 54px" }}>
          <div style={{ borderTop: `6px solid ${ink}` }} />
          <div style={{ textAlign: "center", fontSize: 50, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", lineHeight: 1.1, padding: "14px 0 12px" }}>{data.name}</div>
          <div style={{ borderTop: `1px solid ${ink}`, borderBottom: `3px double ${ink}`, padding: "6px 2px", display: "flex", justifyContent: "space-between", gap: 16, fontSize: fs - 1, fontStyle: "italic" }}>
            <span>{data.headline}</span>
            <span>{data.contact.join("   ·   ")}</span>
          </div>
          {show.summary && sum && (
            <div style={{ overflow: "hidden", margin: "18px 0 6px" }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, fontStyle: "italic", color: bodyText, whiteSpace: "pre-wrap" }}>
                <span style={{ float: "left", fontSize: 52, lineHeight: 0.8, padding: "6px 8px 0 0", color: accentText, fontWeight: 700, fontStyle: "normal" }}>{sum.slice(0, 1)}</span>
                {sum.slice(1)}
              </p>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 205px", marginTop: 6 }}>
            <div style={{ minWidth: 0, paddingRight: 24 }}>{render(["experience", "education", "organizations"])}</div>
            <div style={{ borderLeft: `1px solid ${ink}`, paddingLeft: 20 }}>
              {data.photo && <div style={{ marginTop: 18 }}><Photo size={96} /></div>}
              {render(sideKeys, true)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // M3) tab vertikal: judul bagian diputar 90 derajat di tab samping
  if (L === "tabs") {
    const rows = [
      ["summary", "Profil"], ["experience", "Pengalaman"], ["education", "Pendidikan"], ["skills", "Keahlian"],
      ["languages", "Bahasa"], ["organizations", "Organisasi"], ["certifications", "Sertifikat"], ["interests", "Minat"], ["portfolio", "Portofolio"],
    ];
    return (
      <div style={{ ...fixed, padding: "38px 52px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ flex: 1 }}>
            <NameBlock size={38} />
            <div style={{ height: 4, width: 56, background: accent, margin: "10px 0 8px" }} />
            <IconContact />
          </div>
          <Photo size={100} fallback />
        </div>
        <div style={{ marginTop: 14 }}>
          {rows.map(([k, title]) => {
            const el = sec[k](false);
            return el ? (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 18, marginBottom: 9, breakInside: "avoid" }}>
                <div style={{ background: soft, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 10, fontWeight: 700, color: accentText, letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap", padding: "7px 0" }}>{title}</span>
                </div>
                <div style={{ minWidth: 0, paddingTop: 2 }}>{el}</div>
              </div>
            ) : null;
          })}
        </div>
      </div>
    );
  }

  // M4) malam: halaman gelap dengan warna sorot
  if (L === "night") {
    const bg = shade(accent, 0.78);
    return (
      <div style={{ ...fixed, background: bg, color: ink, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <svg width={360} height={360} viewBox="0 0 360 360" style={{ position: "absolute", right: -90, top: -90 }} aria-hidden="true">
          <circle cx="180" cy="180" r="170" fill="none" stroke={hi} strokeWidth="2" opacity="0.35" />
          <circle cx="180" cy="180" r="120" fill="none" stroke={hi} strokeWidth="2" opacity="0.25" />
          <circle cx="180" cy="180" r="70" fill={hi} opacity="0.12" />
        </svg>
        <div style={{ position: "absolute", inset: 0, padding: "52px 50px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <Photo size={116} fallback />
            <div style={{ flex: 1, minWidth: 0 }}>
              <NameBlock size={38} />
              <div style={{ height: 3, width: 54, background: hi, margin: "12px 0 10px" }} />
              <Contact />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 235px", gap: 26, marginTop: 8, alignItems: "start" }}>
            <div style={{ minWidth: 0 }}>{render(["summary", "experience", "education", "organizations"])}</div>
            <div style={{ background: tint(bg, 0.1), borderRadius: 16, padding: "2px 20px 20px", marginTop: 12, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
              {render(sideKeys, true)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // M5) polaroid: foto bergaya polaroid miring dengan selotip
  if (L === "polaroid") {
    const polaroidInitials = (
      <div style={{ width: 166, height: 166, background: soft, color: accentText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 58, fontWeight: 700 }}>{initials}</div>
    );
    return (
      <div style={{ ...fixed, background: tint(accent, 0.96), WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <div style={{ position: "absolute", left: 62, top: 50, width: 190, background: "#fff", padding: "12px 12px 34px", boxShadow: "0 6px 18px rgba(0,0,0,.18)", transform: "rotate(-4deg)" }}>
          <div style={{ position: "absolute", left: 60, top: -12, width: 74, height: 24, background: t2(0.6), opacity: 0.75, transform: "rotate(3deg)" }} />
          {data.photo ? (
            <SafeImg src={data.photo} style={{ width: 166, height: 166, objectFit: "cover", display: "block" }} fallback={polaroidInitials} />
          ) : (
            polaroidInitials
          )}
          <div style={{ marginTop: 8, textAlign: "center", fontSize: fs, fontStyle: "italic", color: muted }}>{heroSplit[0]}</div>
        </div>
        <div style={{ position: "absolute", left: 300, top: 56, width: 446 }}>
          <NameBlock size={40} />
          <div style={{ margin: "12px 0" }}><IconContact /></div>
          {show.summary && <div style={{ whiteSpace: "pre-wrap", color: bodyText, fontStyle: "italic" }}>{data.summary}</div>}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 336, padding: "0 52px" }}>
          {twoCol(["experience", "education", "organizations"], sideKeys, 215, 30, { borderLeft: `2px dotted ${accent}`, paddingLeft: 20 })}
        </div>
      </div>
    );
  }

  // 4) pita warna di atas + dua kolom
  if (L === "band") {
    return (
      <div style={{ ...base, minHeight: preview ? A4_H : undefined, padding: preview ? "53px 0" : 0 }}>
        <div style={{ background: accent, color: onAcc, padding: "26px 48px", display: "flex", alignItems: "center", gap: 20, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
          <div style={{ flex: 1 }}>
            <NameBlock size={30} light />
            <div style={{ marginTop: 9 }}><Contact color={ow(.92)} /></div>
          </div>
          <Photo size={84} ring />
        </div>
        <div style={{ padding: "6px 48px 0", display: "grid", gridTemplateColumns: "1fr 215px", gap: 28, alignItems: "start" }}>
          <div style={{ minWidth: 0 }}>{render(["summary", "experience", "organizations"])}</div>
          <div style={{ borderLeft: "1px solid #e5e7eb", paddingLeft: 20 }}>
            {render(["skills", "education", "languages", "certifications", "interests", "portfolio"], true)}
          </div>
        </div>
      </div>
    );
  }

  // 5) bar kontak di atas + judul berlabel + dua kolom
  if (L === "labels") {
    return (
      <div style={{ ...base, minHeight: preview ? A4_H : undefined, padding: preview ? "53px 0" : 0 }}>
        {data.contact.length > 0 && (
          <div style={{ background: soft, padding: "9px 48px", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
            <Contact color={ink} />
          </div>
        )}
        <div style={{ padding: "22px 48px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ flex: 1 }}>
              <NameBlock size={32} />
              {show.summary && <div style={{ marginTop: 10, whiteSpace: "pre-wrap", color: bodyText }}>{data.summary}</div>}
            </div>
            <Photo size={88} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "205px 1fr", gap: 28, alignItems: "start" }}>
            <div>{render(["skills", "education", "languages", "certifications", "interests"], true)}</div>
            <div style={{ minWidth: 0 }}>{render(["experience", "organizations", "portfolio"])}</div>
          </div>
        </div>
      </div>
    );
  }

  // 6) satu kolom (single / compact) dengan kepala sesuai konfigurasi
  const nameSize = compact ? 24 : 28;
  const nameEl = <div style={{ fontSize: nameSize, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.01em" }}>{data.name}</div>;
  const headEl = data.headline && (
    <div style={{ fontSize: fs + 1, marginTop: 3, color: tpl.header === "block" ? ow(.88) : accentText }}>{data.headline}</div>
  );
  let header;
  if (tpl.header === "simple") {
    header = (
      <div style={{ position: "relative", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        {data.photo && <div style={{ position: "absolute", right: 0, top: 0 }}><Photo size={78} /></div>}
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.02em", textTransform: "uppercase", ...(data.photo ? { maxWidth: 520 } : {}) }}>{data.name}</div>
        {data.headline && <div style={{ fontSize: fs + 1, fontWeight: 600 }}>{data.headline}</div>}
        <Contact center sep color="#374151" />
      </div>
    );
  } else if (tpl.header === "center") {
    header = (
      <div style={{ textAlign: "center", borderBottom: `2px solid ${accent}`, paddingBottom: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
        <Photo size={72} />
        {nameEl}
        {headEl}
        <Contact center />
      </div>
    );
  } else if (tpl.header === "block") {
    header = (
      <div style={{ background: accent, color: onAcc, padding: "22px 26px 22px 70px", margin: "0 -48px", display: "flex", alignItems: "center", gap: 18, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        <div style={{ flex: 1 }}>
          {nameEl}
          {headEl}
          <div style={{ marginTop: 8 }}><Contact color={ow(.92)} /></div>
        </div>
        <Photo size={78} ring />
      </div>
    );
  } else if (tpl.header === "rule") {
    header = (
      <div style={{ borderTop: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, padding: "14px 0", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          {nameEl}
          {headEl}
          <div style={{ marginTop: 7 }}><Contact /></div>
        </div>
        <Photo size={76} />
      </div>
    );
  } else {
    header = (
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          {nameEl}
          {headEl}
          <div style={{ marginTop: 7 }}><Contact /></div>
        </div>
        <Photo size={80} />
      </div>
    );
  }

  return (
    <div style={flow}>
      {header}
      {render(["summary", "experience", "education", "skills", "languages", "organizations", "certifications", "interests", "portfolio"])}
    </div>
  );
}