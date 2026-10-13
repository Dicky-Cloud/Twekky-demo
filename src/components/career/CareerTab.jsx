import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, ExternalLink, FileText, Info, ShieldCheck, Upload, Star } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import {
  useCareer, upsertEntry, removeEntry, careerProgress, durationLabel, addCareerCv, removeCareerCv,
  setPrimaryCareerCv, syncCareer,
  LEVELS, STATUSES, WORK_MODES,
} from "../../api/careerStore";
import ChipField, { OptionChips } from "./ChipField";
import EntryModal, { KINDS } from "./EntryModal";

const MAX_CV = 5 * 1024 * 1024;
const MAX_CVS = 4; // sama dengan batas di server

function Card({ title, hint, action, children }) {
  return (
    <section className="bg-white p-0 sm:rounded-2xl sm:border sm:border-gray-200 sm:p-5 sm:shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-base font-bold text-gray-900">{title}</h3>
          {hint && <p className="m-0 mt-0.5 text-xs text-gray-500">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ icon, label, hint, children }) {
  return (
    <div className="border-t border-gray-100 py-4 first:border-t-0 first:pt-0">
      <div className="mb-2 flex items-baseline gap-2">
        <h4 className="m-0 text-sm font-bold text-gray-900">{label}</h4>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const AddButton = ({ onClick }) => (
  <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3.5 py-1.5 text-sm font-semibold text-brand border-none cursor-pointer">
    <Plus size={14} /> Tambah
  </button>
);

// Ringkasan satu entri menurut jenisnya
function describe(kind, e) {
  if (kind === "education") return { t: e.school, s: [e.level, e.major].filter(Boolean).join(" · "), m: [e.start, e.end].filter(Boolean).join(" – ") };
  if (kind === "certifications") return { t: e.title, s: e.company, m: e.start };
  if (kind === "portfolio") return { t: e.title, s: e.url, m: "" };
  return {
    t: e.title,
    s: [e.company, e.industry].filter(Boolean).join(" · "),
    m: durationLabel(e.start, e.end, e.current),
  };
}

function EntrySection({ kind, title, hint, list, empty, onAdd, onEdit }) {
  return (
    <Card title={title} hint={hint} action={<AddButton onClick={onAdd} />}>
      {list.length === 0 ? (
        <p className="m-0 text-sm text-gray-400">{empty}</p>
      ) : (
        <ul className="m-0 flex list-none flex-col divide-y divide-gray-100 p-0">
          {list.map((e, i) => {
            const d = describe(kind, e);
            return (
              <li key={e.id} className="flex items-start gap-3 py-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900">{d.t}</div>
                  {d.s && (kind === "portfolio"
                    ? <a href={e.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-xs text-brand"><ExternalLink size={11} /> {d.s}</a>
                    : <div className="truncate text-xs text-gray-500">{d.s}</div>)}
                  {d.m && <span className="mt-1.5 inline-block rounded-md border border-gray-200 px-2 py-0.5 text-xs text-gray-600">{d.m}</span>}
                  {e.desc && <p className="m-0 mt-1.5 text-xs leading-relaxed text-gray-600">{e.desc}</p>}
                </div>
                <button type="button" onClick={() => onEdit(e)} aria-label={`Ubah ${d.t}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-none bg-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-700">
                  <Pencil size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export default function CareerTab() {
  const { user } = useAuth();
  const [c, update] = useCareer(user.id);
  const [modal, setModal] = useState(null); // { kind, entry }
  const [cvError, setCvError] = useState("");
  const [cvBusy, setCvBusy] = useState(false);
  const { percent, complete } = careerProgress(c);

  const open = (kind, entry = null) => setModal({ kind, entry });
  const save = (entry) => {
    upsertEntry(user.id, KINDS[modal.kind].list, entry);
    setModal(null);
  };
  const del = (id) => {
    removeEntry(user.id, KINDS[modal.kind].list, id);
    setModal(null);
  };

  const pickCv = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setCvError("");
    if (!file) return;
    if (c.cvs.length >= MAX_CVS) return setCvError("Maksimal 4 CV. Hapus salah satu dulu.");
    if (!/\.(pdf|docx?)$/i.test(file.name)) return setCvError("Format harus PDF, DOC, atau DOCX.");
    if (file.size > MAX_CV) return setCvError("Ukuran file maksimal 5 MB.");
    setCvBusy(true);
    try {
      const info = await api.uploadProfileCV(file);
      addCareerCv(user.id, info);
    } catch (err) {
      setCvError(err.message || "Gagal mengunggah CV.");
    } finally {
      setCvBusy(false);
    }
  };

  // CV utama = urutan pertama. Tampilan diganti dulu, lalu server diberi tahu.
  const makePrimary = async (cv) => {
    setCvError("");
    setPrimaryCareerCv(user.id, cv.id);
    try {
      await api.setPrimaryProfileCV(cv.id);
    } catch (err) {
      setCvError(err.message || "Gagal mengubah CV utama.");
      syncCareer(user.id, { force: true });
    }
  };

  const removeCv = async (cv) => {
    setCvError("");
    try {
      await api.deleteProfileCV(cv.id);
      removeCareerCv(user.id, cv.id);
    } catch (err) {
      setCvError(err.message || "Gagal menghapus CV.");
    }
  };

  const downloadCv = (cv) => api.downloadProfileCV(cv.id, cv.name).catch((err) => setCvError(err.message));

  const salary = c.salaryMin === "" ? "" : new Intl.NumberFormat("id-ID").format(c.salaryMin);

  return (
    <div className="space-y-5">
      <Link
        to="/mentor"
        className="flex items-center justify-between gap-3 rounded-xl bg-brand-soft px-4 py-3 text-sm font-semibold text-brand no-underline"
      >
        Butuh bimbingan karier? Cari mentor
        <span aria-hidden="true">→</span>
      </Link>
      <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${complete ? "bg-emerald-50 text-emerald-800" : "bg-brand-soft text-brand"}`}>
        <Info size={17} className="mt-0.5 shrink-0" />
        <span>
          {complete
            ? "Profil kariermu lengkap dan siap dilihat perekrut."
            : `Profil karier ${percent}% lengkap. Lengkapi agar lamaranmu tampil meyakinkan di mata perekrut.`}
        </span>
      </div>

      <Card title="Informasi karier" hint="Tampil di bawah namamu di profil.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
            Headline
            <input className="field-input" maxLength={80} value={c.headline} onChange={(e) => update({ headline: e.target.value })} placeholder="Fresh graduate Akuntansi / Product Designer" />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
            Kota domisili
            <input className="field-input" maxLength={60} value={c.city} onChange={(e) => update({ city: e.target.value })} placeholder="Semarang" />
          </label>
        </div>
      </Card>

      <EntrySection kind="experience" title="Pengalaman Kerja" list={c.experience} empty="Belum ada pengalaman kerja. Fresh graduate? Isi pendidikan dan organisasi saja." onAdd={() => open("experience")} onEdit={(e) => open("experience", e)} />
      <EntrySection kind="education" title="Pendidikan" list={c.education} empty="Belum ada riwayat pendidikan." onAdd={() => open("education")} onEdit={(e) => open("education", e)} />
      <EntrySection kind="organizations" title="Pengalaman Organisasi" list={c.organizations} empty="Belum ada pengalaman organisasi." onAdd={() => open("organizations")} onEdit={(e) => open("organizations", e)} />
      <EntrySection kind="certifications" title="Sertifikasi / Prestasi" list={c.certifications} empty="Belum ada sertifikasi atau prestasi." onAdd={() => open("certifications")} onEdit={(e) => open("certifications", e)} />

      <Card title="Preferensi Karier" hint="Tersimpan otomatis. Dipakai untuk pencocokan lowongan.">
        <div className="mb-4 flex items-start justify-between gap-4 rounded-xl bg-brand-soft px-4 py-3">
          <div>
            <div className="text-sm font-bold text-brand">Bagikan profilku ke perekrut</div>
            <p className="m-0 mt-0.5 text-xs leading-relaxed text-gray-600">Perekrut dapat melihat profilmu dan menghubungi untuk peluang kerja.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={c.share}
            aria-label="Bagikan profil ke perekrut"
            onClick={() => update({ share: !c.share })}
            className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border-none transition-colors ${c.share ? "bg-brand" : "bg-gray-300"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${c.share ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>

        <Row label="Status mencari kerja"><OptionChips options={STATUSES} value={c.status} onChange={(v) => update({ status: v })} /></Row>
        <Row label="Level pengalaman"><OptionChips options={LEVELS} value={c.level} onChange={(v) => update({ level: v })} /></Row>
        <Row label="Gaji minimal yang diharapkan" hint="per bulan">
          <div className="flex max-w-sm overflow-hidden rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-brand">
            <span className="flex items-center bg-gray-50 px-3.5 text-sm text-gray-500">Rp</span>
            <input
              inputMode="numeric"
              value={salary}
              onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 10); update({ salaryMin: d === "" ? "" : Number(d) }); }}
              placeholder="4.500.000"
              className="w-full border-none px-3 py-2.5 text-sm outline-none"
            />
          </div>
          <p className="m-0 mt-1.5 flex items-center gap-1 text-xs text-gray-400"><ShieldCheck size={12} /> Tidak tampil di profil publik.</p>
        </Row>
        <Row label="Keahlian" hint="minimal 3"><ChipField items={c.skills} onChange={(v) => update({ skills: v })} addLabel="Tambah keahlian" max={30} /></Row>
        <Row label="Preferensi posisi"><ChipField items={c.roles} onChange={(v) => update({ roles: v })} addLabel="Tambah posisi" max={8} /></Row>
        <Row label="Pengaturan kerja"><OptionChips multi options={WORK_MODES} value={c.workModes} onChange={(v) => update({ workModes: v })} /></Row>
        <Row label="Lokasi kerja"><ChipField items={c.locations} onChange={(v) => update({ locations: v })} addLabel="Tambah lokasi" max={8} /></Row>
        <Row label="Sembunyikan profil dari perusahaan ini"><ChipField items={c.hiddenCompanies} onChange={(v) => update({ hiddenCompanies: v })} addLabel="Tambah perusahaan" max={20} /></Row>

        <Row label="CV" hint={`${c.cvs.length}/${MAX_CVS} · PDF/DOC/DOCX, maks. 5 MB`}>
          <div className="flex flex-col items-stretch gap-2">
            {c.cvs.map((cv, i) => (
              <div
                key={cv.id}
                className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border px-3 py-2.5 ${i === 0 ? "border-brand bg-brand-soft/60" : "border-gray-200 bg-white"}`}
              >
                <FileText size={16} className="shrink-0 text-brand" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{cv.name}</span>
                {i === 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white"><Star size={11} fill="currentColor" /> CV utama</span>
                ) : (
                  <button type="button" onClick={() => makePrimary(cv)} className="border-none bg-transparent p-0 text-xs font-semibold text-brand underline">Jadikan utama</button>
                )}
                <button type="button" onClick={() => downloadCv(cv)} className="border-none bg-transparent p-0 text-xs text-gray-500 underline">Unduh</button>
                <button type="button" onClick={() => removeCv(cv)} className="border-none bg-transparent p-0 text-xs text-gray-500 underline">Hapus</button>
              </div>
            ))}
            {c.cvs.length < MAX_CVS ? (
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-brand/40">
                <Upload size={14} /> {cvBusy ? "Mengunggah..." : c.cvs.length ? "Tambah CV" : "Unggah CV"}
                <input type="file" accept=".pdf,.doc,.docx" onChange={pickCv} disabled={cvBusy} className="hidden" />
              </label>
            ) : (
              <p className="m-0 text-xs text-gray-500">Sudah 4 CV. Hapus salah satu untuk menambah yang baru.</p>
            )}
          </div>
          {cvError && <p className="m-0 mt-1.5 text-xs text-danger">{cvError}</p>}
          <p className="m-0 mt-1.5 text-[11px] text-gray-400">Simpan hingga 4 CV (misal versi Indonesia dan Inggris). CV utama dipakai otomatis saat melamar; kamu bisa mengganti CV utama kapan saja.</p>
        </Row>

        <Row label="Portofolio">
          <div className="flex flex-col items-start gap-2">
            {c.portfolio.map((p) => (
              <button key={p.id} type="button" onClick={() => open("portfolio", p)} className="inline-flex max-w-full items-center gap-1.5 truncate rounded-lg border border-brand/20 bg-brand-soft px-3 py-1.5 text-sm font-medium text-brand">
                <ExternalLink size={13} /> {p.title}
              </button>
            ))}
            <button type="button" onClick={() => open("portfolio")} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-brand/40">
              <Plus size={14} /> Tambah portofolio
            </button>
          </div>
        </Row>
      </Card>

      {modal && <EntryModal key={modal.entry?.id || modal.kind} kind={modal.kind} entry={modal.entry} onSave={save} onDelete={del} onClose={() => setModal(null)} />}
    </div>
  );
}