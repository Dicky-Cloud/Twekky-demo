import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ExternalLink, Lock, Plus, X } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { ErrorBanner } from "../../components/recruitment/StatusBadge";
import CompanyImages from "../../components/company/CompanyImages";
import VerificationCard from "../../components/recruitment/VerificationCard";
import { COMPANY_ACCENTS, COMPANY_SIZES } from "../../constants/recruitment";

const EMPTY = { tagline: "", about: "", website: "", location: "", industry: "", size: "", accent: "blue", benefits: [] };

export default function CompanyTab() {
  const { biz, reload } = useOutletContext();
  const { user } = useAuth();
  const custom = !!biz?.plan?.company_customization;

  const [form, setForm] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [benefitInput, setBenefitInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // isi form sekali, saat data paket & profil pertama kali tersedia
  useEffect(() => {
    if (!biz || loaded) return;
    const c = biz.company;
    setForm({
      tagline: c?.tagline || "",
      about: c?.about || "",
      website: c?.website || "",
      location: c?.location || "",
      industry: c?.industry || "",
      size: c?.size || "",
      accent: c?.accent || "blue",
      benefits: c?.benefits || [],
    });
    setLoaded(true);
  }, [biz, loaded]);

  if (!biz) return <p className="text-gray-500 text-sm">Memuat...</p>;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const accent = COMPANY_ACCENTS[form.accent] || COMPANY_ACCENTS.blue;

  const addBenefit = () => {
    const b = benefitInput.trim();
    if (!b) return;
    if (form.benefits.length >= 8) {
      setError("Benefit maksimal 8 item.");
      return;
    }
    if (b.length > 40) {
      setError("Setiap benefit maksimal 40 karakter.");
      return;
    }
    if (form.benefits.some((x) => x.toLowerCase() === b.toLowerCase())) {
      setBenefitInput("");
      return;
    }
    setError("");
    setForm((f) => ({ ...f, benefits: [...f.benefits, b] }));
    setBenefitInput("");
  };

  const removeBenefit = (b) => setForm((f) => ({ ...f, benefits: f.benefits.filter((x) => x !== b) }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.updateCompany(form);
      await reload();
      setNotice("Halaman perusahaan disimpan.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-gray-500 m-0 max-w-[60ch]">
          Halaman ini tampil publik di <span className="font-semibold">/perusahaan/{user.id.slice(0, 6)}…</span> dan terhubung dari
          setiap lowongan Anda.
        </p>
        <Link to={`/perusahaan/${user.id}`} className="btn btn-ghost btn-sm">
          <ExternalLink size={14} /> Lihat halaman publik
        </Link>
      </div>

      <ErrorBanner>{error}</ErrorBanner>
      {notice && (
        <div className="mb-4 rounded-lg border border-success bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">{notice}</div>
      )}

      <VerificationCard />

      <CompanyImages
        company={biz.company}
        name={user.company_name}
        gradient={custom ? accent.banner : COMPANY_ACCENTS.blue.banner}
        onChanged={reload}
      />

      <section className="card">
        <h3 className="text-base font-bold mb-4">Profil perusahaan</h3>
        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="c-tagline" className="field-label">Tagline</label>
          <input
            id="c-tagline"
            className="field-input"
            maxLength={100}
            placeholder="Satu kalimat tentang perusahaan Anda"
            value={form.tagline}
            onChange={set("tagline")}
          />
        </div>
        <div className="flex flex-col gap-1.5 mb-4">
          <label htmlFor="c-about" className="field-label">Tentang perusahaan</label>
          <textarea
            id="c-about"
            className="field-input min-h-[120px] resize-y"
            maxLength={2000}
            placeholder="Ceritakan bidang usaha, budaya kerja, dan apa yang membuat orang betah bekerja di sini."
            value={form.about}
            onChange={set("about")}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="c-website" className="field-label">Website</label>
            <input id="c-website" className="field-input" placeholder="https://perusahaan.com" value={form.website} onChange={set("website")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="c-location" className="field-label">Lokasi</label>
            <input id="c-location" className="field-input" placeholder="Jakarta" value={form.location} onChange={set("location")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="c-industry" className="field-label">Bidang usaha</label>
            <input id="c-industry" className="field-input" placeholder="Teknologi, Pendidikan, Ritel..." value={form.industry} onChange={set("industry")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="c-size" className="field-label">Ukuran perusahaan</label>
            <select id="c-size" className="field-input" value={form.size} onChange={set("size")}>
              {COMPANY_SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h3 className="text-base font-bold m-0">Kustomisasi</h3>
          {!custom && (
            <Link to="/rekrutmen/paket" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
              <Lock size={14} /> Tersedia di paket Growth
            </Link>
          )}
        </div>
        <p className="text-sm text-gray-500 m-0 mb-4">Warna halaman dan daftar benefit yang tampil di halaman publik.</p>

        <fieldset disabled={!custom} className={`border-0 p-0 m-0 ${custom ? "" : "opacity-50"}`}>
          <div className="mb-5">
            <div className="field-label mb-2">Warna aksen</div>
            <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Warna aksen">
              {Object.entries(COMPANY_ACCENTS).map(([key, a]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={form.accent === key}
                  aria-label={a.label}
                  title={a.label}
                  onClick={() => setForm((f) => ({ ...f, accent: key }))}
                  className={`w-9 h-9 rounded-full ${a.swatch} ring-offset-2 transition ${
                    form.accent === key ? "ring-2 ring-gray-900" : "hover:scale-105"
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="field-label mb-2">Benefit karyawan ({form.benefits.length}/8)</div>
            <div className="flex gap-2 mb-3">
              <input
                className="field-input flex-1"
                maxLength={40}
                placeholder="Contoh: Asuransi kesehatan, Kerja hybrid"
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBenefit();
                  }
                }}
                aria-label="Tambah benefit"
              />
              <button type="button" className="btn btn-ghost shrink-0" onClick={addBenefit}>
                <Plus size={15} /> Tambah
              </button>
            </div>
            {form.benefits.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.benefits.map((b) => (
                  <span key={b} className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft text-brand text-xs font-semibold pl-3 pr-1.5 py-1">
                    {b}
                    <button
                      type="button"
                      onClick={() => removeBenefit(b)}
                      aria-label={`Hapus ${b}`}
                      className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-brand hover:text-white transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </fieldset>
      </section>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-accent" disabled={busy}>
          {busy ? "Menyimpan..." : "Simpan halaman"}
        </button>
      </div>
    </form>
  );
}
