import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Check, Download, Info, Eye, ZoomIn, ZoomOut, Maximize2, RotateCcw, X, LayoutTemplate, Palette } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { profileImageUrl } from "../api/client";
import { usePro, ProCrown } from "../context/ProContext";
import { useCareer } from "../api/careerStore";
import Topbar from "../components/Topbar";
import CvDocument from "../components/cv/CvDocument";
import { CV_SAMPLE } from "../constants/cvSample";
import {
  A4_W, A4_H, PAGE_CONTENT_H, CV_TEMPLATES, CV_ACCENTS, CV_PALETTES, CV_FONTS_URL, DEFAULT_ACCENT, FREE_TEMPLATE_COUNT, getTemplate,
} from "../constants/cvTemplates";

// Pilihan pengguna disimpan di perangkat ini (localStorage), per akun.
const prefsKey = (uid) => `twekky_cv_prefs_v1:${uid}`;
const DEFAULT_PREFS = {
  templateId: "klasik",
  accent: DEFAULT_ACCENT,
  accent2: null, // warna pendamping (kombinasi warna), hanya Pro
  summary: null, // null = pakai bio profil
  languages: "", // dipisah koma atau baris baru
  interests: "",
  photo: null, // null = otomatis (tampil bila pengguna punya foto profil)
  email: true,
  phone: true,
  sections: { summary: true, experience: true, education: true, skills: true, languages: true, interests: true, organizations: true, certifications: true, portfolio: true },
};

function readPrefs(uid) {
  try {
    const p = JSON.parse(localStorage.getItem(prefsKey(uid)) || "{}");
    return { ...DEFAULT_PREFS, ...p, sections: { ...DEFAULT_PREFS.sections, ...(p.sections || {}) } };
  } catch {
    return DEFAULT_PREFS;
  }
}

const parseList = (t) => String(t || "").split(/[,\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 12);

// Kepadatan isi untuk model 1 halaman: dicoba dari normal hingga paling rapat.
const DENSITY_STEPS = [1, 0.94, 0.88, 0.82];

const SECTION_ROWS = [
  { key: "summary", label: "Ringkasan diri" },
  { key: "experience", label: "Pengalaman kerja" },
  { key: "education", label: "Pendidikan" },
  { key: "skills", label: "Keahlian" },
  { key: "languages", label: "Bahasa" },
  { key: "interests", label: "Minat" },
  { key: "organizations", label: "Organisasi" },
  { key: "certifications", label: "Sertifikasi dan prestasi" },
  { key: "portfolio", label: "Portofolio" },
];

const SAMPLE_SHOW = Object.fromEntries(["summary", "experience", "education", "skills", "languages", "interests", "organizations", "certifications", "portfolio"].map((k) => [k, true]));

// Scrollbar disembunyikan (tetap bisa digulir dengan roda mouse, trackpad, atau sentuh).
const scrollCss = `
.cv-noscroll{scrollbar-width:none;-ms-overflow-style:none}
.cv-noscroll::-webkit-scrollbar{display:none;width:0;height:0}
html{scrollbar-width:none}
html::-webkit-scrollbar{display:none}`;

// Langkah zoom pratinjau (kelipatan dari ukuran "pas lebar").
const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];
const stepZoom = (z, dir) =>
  dir > 0 ? ZOOM_STEPS.find((v) => v > z + 0.001) ?? z : [...ZOOM_STEPS].reverse().find((v) => v < z - 0.001) ?? z;

// CSS cetak: saat dicetak hanya CV (di luar #root) yang tampil, ukuran A4.
const printCss = (onePage) => `
.cv-print-root{display:none}
@media print{
  @page{size:A4;margin:${onePage ? "0" : "14mm 0"}}
  html,body{background:#fff!important}
  #root{display:none!important}
  .cv-viewer{display:none!important}
  .cv-print-root{display:block!important}
}`;

function ZoomBar({ zoom, scale, onIn, onOut, onReset, light = false }) {
  const btn = `inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border disabled:cursor-not-allowed disabled:opacity-40 ${
    light ? "border-white/30 bg-white/10 text-white hover:bg-white/20" : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
  }`;
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Zoom CV">
      <button type="button" className={btn} onClick={onOut} disabled={zoom <= ZOOM_STEPS[0]} aria-label="Perkecil" title="Perkecil (-)"><ZoomOut size={18} /></button>
      <span className={`min-w-[48px] text-center text-sm font-semibold tabular-nums ${light ? "text-white" : "text-gray-900"}`} aria-live="polite">{Math.round(scale * 100)}%</span>
      <button type="button" className={btn} onClick={onIn} disabled={zoom >= ZOOM_STEPS[ZOOM_STEPS.length - 1]} aria-label="Perbesar" title="Perbesar (+)"><ZoomIn size={18} /></button>
      <button type="button" className={btn} onClick={onReset} disabled={zoom === 1} aria-label="Pas layar" title="Pas layar (0)"><RotateCcw size={16} /></button>
    </div>
  );
}

// Tampilan penuh: CV besar di atas latar gelap, dengan zoom, geser dengan drag, dan tombol Esc untuk menutup.
function CvViewer({ children, onePage, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [base, setBase] = useState(1);
  const boxRef = useRef(null);
  const drag = useRef(null);
  const scale = base * zoom;

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const w = (el.clientWidth - 48) / A4_W;
      const h = (el.clientHeight - 48) / A4_H;
      setBase(Math.max(0.2, onePage ? Math.min(w, h) : w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onePage]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") setZoom((z) => stepZoom(z, 1));
      else if (e.key === "-") setZoom((z) => stepZoom(z, -1));
      else if (e.key === "0") setZoom(1);
    };
    window.addEventListener("keydown", onKey);
    const el = boxRef.current;
    const onWheel = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      setZoom((z) => stepZoom(z, e.deltaY < 0 ? 1 : -1));
    };
    el?.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      el?.removeEventListener("wheel", onWheel);
    };
  }, [onClose]);

  const down = (e) => {
    if (e.button !== 0) return;
    const el = boxRef.current;
    drag.current = { x: e.clientX, y: e.clientY, l: el.scrollLeft, t: el.scrollTop };
    el.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const el = boxRef.current;
    el.scrollLeft = d.l - (e.clientX - d.x);
    el.scrollTop = d.t - (e.clientY - d.y);
  };
  const up = () => { drag.current = null; };

  return createPortal(
    <div className="cv-viewer fixed inset-0 z-[100] flex flex-col bg-gray-900/95" role="dialog" aria-modal="true" aria-label="Tampilan penuh CV">
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
        <div className="text-sm font-semibold text-white">Tampilan penuh <span className="hidden font-normal text-white/60 sm:inline">· drag untuk menggeser, Ctrl + roda untuk zoom</span></div>
        <div className="flex items-center gap-3">
          <ZoomBar light zoom={zoom} scale={scale} onIn={() => setZoom((z) => stepZoom(z, 1))} onOut={() => setZoom((z) => stepZoom(z, -1))} onReset={() => setZoom(1)} />
          <button type="button" onClick={onClose} aria-label="Tutup tampilan penuh" title="Tutup (Esc)" className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white hover:bg-white/20"><X size={18} /></button>
        </div>
      </div>
      <div
        ref={boxRef}
        className="cv-noscroll min-h-0 flex-1 cursor-grab overflow-auto active:cursor-grabbing"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        style={{ touchAction: "pan-x pan-y" }}
      >
        <div style={{ width: "max-content", minWidth: "100%", display: "flex", justifyContent: "center", padding: 24 }}>
          <div style={{ width: A4_W * scale, height: (onePage ? A4_H - 1 : A4_H) * scale, flex: "none", boxShadow: "0 10px 40px rgba(0,0,0,.5)" }}>
            <div style={{ width: A4_W, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }}>{children}</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Thumb({ tpl, active, locked, onPick, doc }) {
  const w = 142;
  const scale = w / A4_W;
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      aria-label={`Model ${tpl.name}${tpl.pro ? ", Pro" : ""}${active ? ", dipilih" : ""}`}
      className={`cursor-pointer overflow-hidden rounded-xl bg-white p-0 text-left transition-shadow ${
        active ? "border-2 border-brand" : "border border-gray-300 hover:shadow-md"
      }`}
    >
      <div className="relative overflow-hidden bg-gray-50" style={{ width: "100%", height: 200 }}>
        <div style={{ width: A4_W, height: A4_H, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }} aria-hidden="true">
          {doc}
        </div>
        {active && (
          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
            <Check size={12} strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-900">
        {tpl.name}
        {tpl.pro && (locked ? <ProCrown size={13} /> : <span className="rounded bg-brand px-1.5 py-px text-[10px] text-white">PRO</span>)}
      </div>
    </button>
  );
}

export default function CvBuilderPage() {
  const { user } = useAuth();
  const { isPro, openPro } = usePro();
  const [career] = useCareer(user.id);
  const [prefs, setPrefs] = useState(() => readPrefs(user.id));
  const [useSample, setUseSample] = useState(false); // tampilan data contoh (tidak disimpan)
  const [pages, setPages] = useState(1);
  const [overflow, setOverflow] = useState(false);
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [viewer, setViewer] = useState(false);
  const [styleSheet, setStyleSheet] = useState(null); // HP: lembar bawah, null | "model" | "warna"
  const scale = baseScale * zoom;
  const stageRef = useRef(null);
  const docRef = useRef(null);

  // font CV (sekali saja)
  useEffect(() => {
    if (document.getElementById("cv-fonts")) return;
    const l = document.createElement("link");
    l.id = "cv-fonts";
    l.rel = "stylesheet";
    l.href = CV_FONTS_URL;
    document.head.appendChild(l);
  }, []);

  const update = (patch) =>
    setPrefs((p) => {
      const next = { ...p, ...patch };
      try {
        localStorage.setItem(prefsKey(user.id), JSON.stringify(next));
      } catch {
        /* penyimpanan lokal tidak tersedia */
      }
      return next;
    });
  const toggleSection = (key) => update({ sections: { ...prefs.sections, [key]: !prefs.sections[key] } });

  // Model/warna Pro yang tersimpan tetap dipakai hanya bila akun masih Pro.
  const picked = getTemplate(prefs.templateId);
  const tpl = picked.pro && !isPro ? CV_TEMPLATES[0] : picked;
  const accent = isPro && /^#[0-9a-f]{6}$/i.test(prefs.accent) ? prefs.accent : DEFAULT_ACCENT; // dipakai apa adanya
  const selectedColor = accent;
  const accent2 = isPro && /^#[0-9a-f]{6}$/i.test(prefs.accent2 || "") ? prefs.accent2 : null; // warna pendamping

  const summary = (prefs.summary ?? user.bio ?? "").trim();
  const data = useMemo(
    () => ({
      name: user.name || "Nama Lengkap",
      headline: career.headline,
      contact: [prefs.email && user.email, prefs.phone && career.phone, career.city].filter(Boolean),
      summary,
      photo: prefs.photo !== false && user.avatar ? profileImageUrl(user.avatar) : null,
      skills: career.skills,
      languages: parseList(prefs.languages),
      interests: parseList(prefs.interests),
      experience: career.experience,
      education: career.education,
      organizations: career.organizations,
      certifications: career.certifications,
      portfolio: career.portfolio,
    }),
    [user, career, prefs.email, prefs.phone, prefs.photo, prefs.languages, prefs.interests, summary]
  );

  const counts = useMemo(
    () => ({
      summary: summary ? 1 : 0,
      experience: data.experience.length,
      education: data.education.length,
      skills: data.skills.length,
      languages: data.languages.length,
      interests: data.interests.length,
      organizations: data.organizations.length,
      certifications: data.certifications.length,
      portfolio: data.portfolio.length,
    }),
    [data, summary]
  );
  const show = useMemo(
    () => Object.fromEntries(SECTION_ROWS.map((r) => [r.key, prefs.sections[r.key] && counts[r.key] > 0])),
    [prefs.sections, counts]
  );
  const isEmpty = !counts.experience && !counts.education && !counts.skills;

  // Pratinjau memakai data contoh bila diminta. Thumbnail juga memakai data contoh
  // saat profil masih kosong, supaya semua model tampak berbeda.
  const previewData = useSample ? CV_SAMPLE : data;
  const previewShow = useSample ? SAMPLE_SHOW : show;
  const thumbSample = useSample || isEmpty;
  const thumbData = thumbSample ? CV_SAMPLE : data;
  const thumbShow = thumbSample ? SAMPLE_SHOW : show;

  // skala pratinjau mengikuti lebar kolom
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setBaseScale(Math.min(1, (el.clientWidth - 32) / A4_W));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Model 1 halaman: bila isi melebihi halaman, kepadatan dinaikkan bertahap (huruf dan jarak
  // dirapatkan) sampai muat. Hanya bila masih melebihi di kepadatan terendah muncul peringatan.
  const fitKey = useMemo(
    () => `${tpl.id}|${JSON.stringify(previewData)}|${JSON.stringify(previewShow)}`,
    [tpl.id, previewData, previewShow]
  );
  const [fit, setFit] = useState({ key: "", step: 0 });
  const step = fit.key === fitKey ? fit.step : 0;
  const density = tpl.onePage ? DENSITY_STEPS[step] : 1;

  useLayoutEffect(() => {
    const root = docRef.current;
    const el = root?.firstElementChild;
    if (!el) return;
    if (tpl.onePage) {
      const over = el.scrollHeight > el.clientHeight + 1;
      if (over && step < DENSITY_STEPS.length - 1) {
        setFit({ key: fitKey, step: step + 1 });
        return;
      }
      setOverflow(over);
      setPages(1);
    } else {
      setOverflow(false);
      setPages(Math.max(1, Math.ceil((root.offsetHeight - 106) / PAGE_CONTENT_H)));
    }
  });

  const PRO_REASON = "Model CV lengkap, pilihan warna, kombinasi warna, dan warna kustom tersedia di Pro.";
  const pickTemplate = (t) => {
    if (t.pro && !isPro) return openPro(PRO_REASON);
    update({ templateId: t.id });
  };
  const pickAccent = (a) => {
    if (a.pro && !isPro) return openPro(PRO_REASON);
    update({ accent: a.color });
  };

  const pickPalette = (p) => {
    if (!isPro) return openPro(PRO_REASON);
    update({ accent: p.accent, accent2: p.accent2 });
  };
  const closeViewer = useCallback(() => setViewer(false), []);

  const download = () => {
    if (useSample) return;
    const prev = document.title;
    document.title = `CV ${data.name}`;
    const restore = () => {
      document.title = prev;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

  const sectionCls = "border-t border-gray-100 pt-4 first:border-t-0 first:pt-0";
  const checkCls = "h-[18px] w-[18px] accent-black";

  // Bagian model dan bagian warna dipisah: tombol Model & Warna di HP membuka salah satunya.
  const modelPanel = (
    <>
          <div className="flex items-baseline justify-between">
            <h2 className="m-0 text-base font-bold text-gray-900">Pilih model</h2>
            <span className="text-xs text-gray-500">{CV_TEMPLATES.length} model</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {CV_TEMPLATES.map((t) => (
              <Thumb
                key={t.id}
                tpl={t}
                active={t.id === tpl.id}
                locked={t.pro && !isPro}
                onPick={() => pickTemplate(t)}
                doc={<CvDocument data={thumbData} tpl={t} accent={accent} accent2={accent2} show={thumbShow} preview />}
              />
            ))}
          </div>

    </>
  );
  const colorPanel = (
    <>
          <div className={sectionCls}>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
              Warna aksen {!isPro && <ProCrown />}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {CV_ACCENTS.map((a) => {
                const on = selectedColor.toLowerCase() === a.color;
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-label={`${a.label}${a.pro && !isPro ? ", Pro" : ""}${on ? ", dipilih" : ""}`}
                    aria-pressed={on}
                    title={a.label}
                    onClick={() => pickAccent(a)}
                    className="h-10 w-10 cursor-pointer rounded-full border-[3px] border-white p-0"
                    style={{ background: a.color, outline: on ? "2px solid #111" : "1px solid #d1d5db", opacity: a.pro && !isPro ? 0.55 : 1 }}
                  />
                );
              })}
            </div>
            <label className="mt-3 flex min-h-[44px] items-center gap-3 text-sm text-gray-900">
              <input
                type="color"
                className="h-9 w-12 cursor-pointer rounded-lg border border-gray-300 bg-white p-0.5"
                value={/^#[0-9a-f]{6}$/i.test(selectedColor) ? selectedColor : DEFAULT_ACCENT}
                onClick={(e) => {
                  if (!isPro) {
                    e.preventDefault();
                    openPro(PRO_REASON);
                  }
                }}
                onChange={(e) => update({ accent: e.target.value })}
                aria-label="Warna kustom"
              />
              Warna kustom
            </label>
            <p className="m-0 mt-1 text-xs text-gray-500">
              {isPro ? "Pilih warna apa saja. Teks di atas warna terang otomatis menjadi gelap." : "Gratis memakai warna hitam. Pro membuka 20 warna dan warna kustom."}
            </p>
          </div>

          <div className={sectionCls}>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-900">
              Kombinasi warna {!isPro && <ProCrown />}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CV_PALETTES.map((p) => {
                const on = isPro && selectedColor.toLowerCase() === p.accent && (accent2 || "") === p.accent2;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    aria-label={`${p.label}${!isPro ? ", Pro" : ""}${on ? ", dipilih" : ""}`}
                    onClick={() => pickPalette(p)}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border bg-white p-2 text-left hover:bg-gray-50"
                    style={{ borderColor: on ? "#111" : "#d1d5db", borderWidth: on ? 2 : 1, opacity: isPro ? 1 : 0.6 }}
                  >
                    <span className="flex h-8 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200" aria-hidden="true">
                      <i className="block flex-1" style={{ background: p.accent }} />
                      <i className="block flex-1" style={{ background: p.accent2 }} />
                    </span>
                    <span className="text-xs font-semibold leading-tight text-gray-900">{p.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <label className="flex min-h-[44px] flex-1 items-center gap-3 text-sm text-gray-900">
                <input
                  type="color"
                  className="h-9 w-12 cursor-pointer rounded-lg border border-gray-300 bg-white p-0.5"
                  value={accent2 || "#d4a64a"}
                  onClick={(e) => {
                    if (!isPro) {
                      e.preventDefault();
                      openPro(PRO_REASON);
                    }
                  }}
                  onChange={(e) => update({ accent2: e.target.value })}
                  aria-label="Warna pendamping"
                />
                Warna pendamping
              </label>
              {accent2 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => update({ accent2: null })}>Hapus</button>
              )}
            </div>
            <p className="m-0 mt-1 text-xs text-gray-500">Warna pendamping dipakai untuk latar lembut dan hiasan. Warna aksen tetap untuk judul, kepala, dan sidebar.</p>
          </div>

          <div className="rounded-xl bg-gray-100 p-3.5 text-xs leading-relaxed text-gray-700">
            <b className="text-gray-900">Ramah ATS:</b>{" "}
            {CV_TEMPLATES.filter((t) => t.ats).map((t) => t.name).join(", ")} memakai tata letak sederhana yang mudah dibaca sistem seleksi otomatis.
          </div>

          {!isPro && (
            <div className="flex flex-col gap-2.5 rounded-xl border border-brand p-3.5">
              <div className="font-bold text-gray-900">Buka semua model dengan Pro</div>
              <p className="m-0 text-xs leading-relaxed text-gray-600">
                Gratis: {FREE_TEMPLATE_COUNT} model. Pro: {CV_TEMPLATES.length} model, 20 warna, kombinasi warna, dan warna kustom bebas.
              </p>
              <button type="button" className="btn btn-accent" onClick={() => openPro(PRO_REASON)}>
                Lihat Pro
              </button>
            </div>
          )}
    </>
  );

  return (
    <>
      <Topbar title="Pembuat CV" />
      <style>{scrollCss + printCss(Boolean(tpl.onePage))}</style>

      <div className="flex flex-col lg:h-[calc(100vh-64px)] lg:flex-row">
        {/* kiri: isi CV */}
        <aside className="order-3 flex w-full shrink-0 flex-col gap-5 cv-noscroll overflow-y-auto border-gray-200 bg-white p-5 lg:order-1 lg:w-72 lg:border-r">
          <div className={sectionCls}>
            <h2 className="m-0 mb-2 text-sm font-bold text-gray-900">Bagian yang ditampilkan</h2>
            <ul className="m-0 flex list-none flex-col p-0">
              {SECTION_ROWS.map((r) => {
                const empty = counts[r.key] === 0;
                return (
                  <li key={r.key}>
                    <label className={`flex min-h-[44px] items-center gap-3 text-sm ${empty ? "text-gray-400" : "text-gray-900"}`}>
                      <input
                        type="checkbox"
                        className={checkCls}
                        checked={prefs.sections[r.key] && !empty}
                        disabled={empty}
                        onChange={() => toggleSection(r.key)}
                      />
                      <span className="flex-1">{r.label}</span>
                      <span className="text-xs text-gray-500">{empty ? "kosong" : r.key === "summary" ? "" : `${counts[r.key]}`}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <Link to="/profil" className="btn btn-ghost btn-sm mt-2 w-full justify-center">Edit data di profil</Link>
            <p className="m-0 mt-2 text-xs leading-relaxed text-gray-500">Perubahan di profil otomatis ikut ke semua model.</p>
          </div>

          <div className={sectionCls}>
            <label className="flex flex-col gap-1.5 text-sm font-bold text-gray-900">
              Ringkasan diri
              <textarea
                className="field-input min-h-[110px] resize-y text-sm font-normal"
                maxLength={600}
                placeholder="Tulis 2-3 kalimat tentang dirimu."
                value={prefs.summary ?? user.bio ?? ""}
                onChange={(e) => update({ summary: e.target.value })}
              />
            </label>
            <p className="m-0 mt-1 text-xs text-gray-500">Awalnya diambil dari bio profil. Mengubahnya di sini tidak mengubah profil.</p>
          </div>

          <div className={`${sectionCls} flex flex-col gap-3`}>
            <label className="flex flex-col gap-1.5 text-sm font-bold text-gray-900">
              Bahasa
              <input
                className="field-input text-sm font-normal"
                maxLength={160}
                placeholder="Indonesia (ibu), Inggris (aktif)"
                value={prefs.languages}
                onChange={(e) => update({ languages: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-bold text-gray-900">
              Minat
              <input
                className="field-input text-sm font-normal"
                maxLength={160}
                placeholder="Membaca, bulu tangkis"
                value={prefs.interests}
                onChange={(e) => update({ interests: e.target.value })}
              />
            </label>
            <p className="m-0 text-xs text-gray-500">Pisahkan dengan koma. Dua isian ini hanya tersimpan untuk CV.</p>
          </div>

          <div className={sectionCls}>
            <h2 className="m-0 mb-1 text-sm font-bold text-gray-900">Data pribadi di CV</h2>
            <label className="flex min-h-[44px] items-center gap-3 text-sm">
              <input type="checkbox" className={checkCls} checked={prefs.email} onChange={(e) => update({ email: e.target.checked })} />
              Tampilkan email
            </label>
            <label className="flex min-h-[44px] items-center gap-3 text-sm">
              <input type="checkbox" className={checkCls} checked={prefs.phone} onChange={(e) => update({ phone: e.target.checked })} />
              Tampilkan nomor telepon
            </label>
            <label className={`flex min-h-[44px] items-center gap-3 text-sm ${user.avatar ? "" : "text-gray-400"}`}>
              <input type="checkbox" className={checkCls} checked={prefs.photo !== false && Boolean(user.avatar)} disabled={!user.avatar} onChange={(e) => update({ photo: e.target.checked })} />
              Tampilkan foto profil {!user.avatar && <span className="text-xs">(belum ada foto)</span>}
            </label>
          </div>
        </aside>

        {/* tengah: pratinjau */}
        <main className="order-1 cv-noscroll min-w-0 flex-1 overflow-auto bg-gray-100 lg:order-2" ref={stageRef}>
          <div className="sticky left-0 top-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-gray-100 px-4 pb-2 pt-4">
            <div className="text-sm text-gray-600">
              {tpl.onePage
                ? "Model ini selalu 1 halaman"
                : pages > 1
                  ? `Perkiraan ${pages} halaman. Ringkas isi agar muat 1 halaman.`
                  : "Perkiraan 1 halaman"}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ZoomBar zoom={zoom} scale={scale} onIn={() => setZoom((z) => stepZoom(z, 1))} onOut={() => setZoom((z) => stepZoom(z, -1))} onReset={() => setZoom(1)} />
              <button
                type="button"
                onClick={() => setViewer(true)}
                aria-label="Tampilan penuh"
                title="Tampilan penuh"
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
              >
                <Maximize2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => setUseSample((v) => !v)}
                aria-pressed={useSample}
                className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold ${
                  useSample ? "border-brand bg-brand text-white" : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Eye size={16} /> Data contoh
              </button>
              <button
                type="button"
                onClick={download}
                disabled={useSample}
                title={useSample ? "Matikan data contoh untuk mengunduh CV-mu" : undefined}
                className="btn btn-accent inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={16} /> Unduh PDF
              </button>
            </div>
          </div>
          <p className="m-0 flex items-start gap-1.5 px-4 pb-3 text-xs text-gray-500">
            <Info size={13} className="mt-px shrink-0" />
            {useSample
              ? "Ini data contoh, bukan datamu. Matikan \"Data contoh\" untuk mengunduh CV-mu."
              : "Di jendela cetak pilih \"Simpan sebagai PDF\" dan matikan opsi \"Header dan footer\"."}
          </p>

          {isEmpty && !useSample && (
            <div className="mx-4 mb-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
              Profilmu belum punya pengalaman, pendidikan, atau keahlian. <Link to="/profil" className="font-semibold text-brand">Lengkapi di profil</Link> agar CV terisi, atau klik "Data contoh" untuk melihat tampilan tiap model.
            </div>
          )}
          {overflow && !useSample && (
            <div role="alert" className="mx-4 mb-3 rounded-xl border border-danger bg-danger-soft p-4 text-sm text-danger">
              Isi terlalu panjang untuk model ini dan akan terpotong di PDF. Matikan beberapa bagian, ringkas isinya, atau pilih model yang boleh lebih dari 1 halaman.
            </div>
          )}

          <div className="flex gap-2 px-4 pb-3 lg:hidden">
            <button
              type="button"
              onClick={() => setStyleSheet("model")}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-900"
            >
              <LayoutTemplate size={17} /> Model
            </button>
            <button
              type="button"
              onClick={() => setStyleSheet("warna")}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-900"
            >
              <Palette size={17} /> Warna
              <span className="h-4 w-4 rounded-full border border-gray-300" style={{ background: accent }} aria-hidden="true" />
            </button>
          </div>

          <div className="flex px-4 pb-8" style={{ width: "max-content", minWidth: "100%", justifyContent: "center" }}>
            <div style={{ width: A4_W * scale, height: (tpl.onePage ? A4_H - 1 : A4_H) * scale, flex: "none" }} className="relative overflow-visible shadow-lg">
              <div style={{ width: A4_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                <div ref={docRef}>
                  <CvDocument data={previewData} tpl={tpl} accent={accent} accent2={accent2} show={previewShow} preview density={density} />
                </div>
              </div>
            </div>
          </div>
        </main>

        {styleSheet && (
          <div
            className="fixed inset-0 z-50 flex items-end bg-black/40 lg:hidden"
            onMouseDown={(e) => e.target === e.currentTarget && setStyleSheet(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={styleSheet === "model" ? "Pilih model" : "Warna"}
              className="flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <h2 className="m-0 text-base font-bold text-gray-900">{styleSheet === "model" ? "Pilih model" : "Warna"}</h2>
                <button
                  type="button"
                  onClick={() => setStyleSheet(false)}
                  aria-label="Tutup"
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-gray-500 hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="cv-noscroll overflow-y-auto p-5">
                <div className="flex flex-col gap-5">{styleSheet === "model" ? modelPanel : colorPanel}</div>
              </div>
            </div>
          </div>
        )}

        {/* kanan: model & warna */}
        <aside className="order-2 hidden w-full shrink-0 flex-col gap-5 cv-noscroll overflow-y-auto border-gray-200 bg-white p-5 lg:order-3 lg:flex lg:w-[340px] lg:border-l">
          {modelPanel}
          {colorPanel}
        </aside>
      </div>

      {viewer && (
        <CvViewer onePage={Boolean(tpl.onePage)} onClose={closeViewer}>
          <CvDocument data={previewData} tpl={tpl} accent={accent} accent2={accent2} show={previewShow} preview density={density} />
        </CvViewer>
      )}

      {/* salinan ukuran penuh khusus untuk dicetak (selalu data asli) */}
      {createPortal(
        <div className="cv-print-root">
          <CvDocument data={data} tpl={tpl} accent={accent} accent2={accent2} show={show} density={density} />
        </div>,
        document.body
      )}
    </>
  );
}