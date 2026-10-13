import { useState } from "react";
import { Info, Check, FileText, ChevronLeft } from "lucide-react";
import { TOPICS, topicLabel } from "../../constants/topics";
import { MENTOR_FEE_PERCENT, mentorFee, mentorNet, formatRupiah } from "../../constants/mentors";

const STEPS = ["Profil", "Bukti keahlian", "Harga & jadwal", "Tinjau"];
const MAX_FILE = 5 * 1024 * 1024;

const splitList = (s, max) =>
  [...new Set(String(s).split(/[\n,]/).map((x) => x.trim()).filter(Boolean))].slice(0, max);

const validUrl = (s) => {
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

function Field({ label, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
      <span>
        {label} {hint && <span className="font-normal text-gray-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

// Pemberitahuan komisi: angka dinamis mengikuti harga yang diisi.
export function CommissionNotice({ price }) {
  const example = price > 0 ? price : 150000;
  return (
    <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <Info size={18} className="mt-0.5 shrink-0 text-amber-600" />
      <div className="space-y-1">
        <p className="m-0 font-bold">Komisi platform {MENTOR_FEE_PERCENT}% di setiap sesi</p>
        <p className="m-0 text-[13px] leading-relaxed">
          Dari harga yang kamu tetapkan, {MENTOR_FEE_PERCENT}% menjadi komisi Twekky dan kamu menerima {100 - MENTOR_FEE_PERCENT}%.{" "}
          {price > 0 ? "Pada harga kamu" : "Contoh"}: {formatRupiah(example)} → komisi {formatRupiah(mentorFee(example))} → kamu
          terima <b>{formatRupiah(mentorNet(example))}</b>.
        </p>
        <p className="m-0 text-xs text-amber-800/80">Komisi ini belum termasuk kewajiban pajak pribadi kamu sendiri.</p>
      </div>
    </div>
  );
}

function Breakdown({ price }) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
      <div className="flex justify-between text-gray-600"><span>Harga sesi</span><span>{formatRupiah(price)}</span></div>
      <div className="flex justify-between text-gray-600"><span>Komisi platform {MENTOR_FEE_PERCENT}%</span><span>− {formatRupiah(mentorFee(price))}</span></div>
      <div className="mt-1.5 flex justify-between border-t border-gray-200 pt-1.5 font-bold text-gray-900"><span>Kamu terima</span><span>{formatRupiah(mentorNet(price))}</span></div>
    </div>
  );
}

// Wizard 4 langkah. `initial` (opsional) dipakai saat memperbaiki pengajuan.
export default function MentorApplyWizard({ initial, onCancel, onSubmit }) {
  const [step, setStep] = useState(0);
  const [fileError, setFileError] = useState("");
  const [f, setF] = useState({
    title: initial?.title || "",
    org: initial?.org || "",
    topic: initial?.topic || TOPICS[0]?.slug || "",
    expertise: initial?.expertise?.join(", ") || "",
    bio: initial?.bio || "",
    portfolioUrl: initial?.portfolioUrl || "",
    cvName: initial?.cvName || "",
    certNames: initial?.certNames || [],
    workEmail: initial?.workEmail || "",
    price: initial?.price ? String(initial.price) : "",
    slots: initial?.slots?.join(", ") || "",
    agree: false,
  });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const price = Math.floor(Number(f.price)) || 0;
  const expertise = splitList(f.expertise, 6);
  const slots = splitList(f.slots, 7);

  const valid = [
    f.title.trim() && f.org.trim() && f.topic && f.bio.trim().length >= 20 && expertise.length > 0,
    validUrl(f.portfolioUrl) || Boolean(f.cvName),
    price > 0 && slots.length > 0,
    f.agree,
  ];

  const pickFiles = (kind) => (e) => {
    const files = [...e.target.files];
    setFileError("");
    if (files.some((x) => x.size > MAX_FILE)) {
      setFileError("Ukuran tiap berkas maksimal 5 MB.");
      return;
    }
    // DEMO: berkas belum diunggah ke server, hanya namanya yang dicatat.
    if (kind === "cv") setF((x) => ({ ...x, cvName: files[0]?.name || "" }));
    else setF((x) => ({ ...x, certNames: files.map((x2) => x2.name).slice(0, 5) }));
  };

  const submit = () => {
    if (!valid[3]) return;
    onSubmit({
      title: f.title.trim(),
      org: f.org.trim(),
      topic: f.topic,
      expertise,
      bio: f.bio.trim(),
      portfolioUrl: f.portfolioUrl.trim(),
      cvName: f.cvName,
      certNames: f.certNames,
      workEmail: f.workEmail.trim(),
      price,
      slots,
      feePercent: MENTOR_FEE_PERCENT,
      feeAgreedAt: new Date().toISOString(),
    });
  };

  return (
    <div>
      {/* indikator langkah */}
      <ol className="m-0 mb-5 flex list-none gap-1.5 p-0">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? "bg-brand" : "bg-gray-200"}`} />
            <div className={`mt-1.5 text-[11px] font-semibold ${i === step ? "text-brand" : "text-gray-400"}`}>
              {i + 1}. {s}
            </div>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Jabatan"><input className="field-input" value={f.title} onChange={set("title")} placeholder="Senior Product Designer" /></Field>
            <Field label="Perusahaan / bidang"><input className="field-input" value={f.org} onChange={set("org")} placeholder="Startup e-commerce" /></Field>
          </div>
          <Field label="Topik utama">
            <select className="field-input" value={f.topic} onChange={set("topic")}>
              {TOPICS.map((t) => <option key={t.slug} value={t.slug}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Keahlian" hint="(pisahkan dengan koma, maks. 6)">
            <input className="field-input" value={f.expertise} onChange={set("expertise")} placeholder="Portofolio desain, UX research, Review karya" />
          </Field>
          <Field label="Tentang kamu" hint="(minimal 20 karakter)">
            <textarea className="field-input min-h-[90px] resize-y" value={f.bio} onChange={set("bio")} placeholder="Ceritakan pengalaman dan bantuan apa yang bisa kamu berikan." />
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <p className="m-0 text-sm text-gray-600">
            Bukti membantu tim Twekky memastikan keahlianmu. Isi <b>tautan</b> atau unggah <b>CV</b> (salah satu wajib).
          </p>
          <Field label="Tautan LinkedIn / portofolio">
            <input className="field-input" value={f.portfolioUrl} onChange={set("portfolioUrl")} placeholder="https://linkedin.com/in/namakamu" />
          </Field>
          {f.portfolioUrl && !validUrl(f.portfolioUrl) && <p className="-mt-2 m-0 text-xs text-danger">Tautan harus diawali http:// atau https://</p>}
          <Field label="CV" hint="(PDF/JPG/PNG, maks. 5 MB)">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={pickFiles("cv")} className="text-sm" />
          </Field>
          <Field label="Sertifikat / bukti kerja" hint="(opsional, maks. 5 berkas)">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={pickFiles("cert")} className="text-sm" />
          </Field>
          <Field label="Email kantor" hint="(opsional, menambah kepercayaan)">
            <input type="email" className="field-input" value={f.workEmail} onChange={set("workEmail")} placeholder="nama@perusahaan.com" />
          </Field>
          {fileError && <p className="m-0 text-xs text-danger">{fileError}</p>}
          {(f.cvName || f.certNames.length > 0) && (
            <ul className="m-0 flex list-none flex-col gap-1 p-0 text-xs text-gray-600">
              {[f.cvName && `CV: ${f.cvName}`, ...f.certNames.map((n) => `Bukti: ${n}`)].filter(Boolean).map((n) => (
                <li key={n} className="flex items-center gap-1.5"><FileText size={13} /> {n}</li>
              ))}
            </ul>
          )}
          <p className="m-0 text-[11px] text-gray-400">DEMO: berkas belum diunggah ke server, hanya nama berkas yang dicatat. Data pembayaran tidak diminta sekarang; baru saat kamu menarik saldo.</p>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <CommissionNotice price={price} />
          <Field label="Harga per sesi (60 menit), dalam Rupiah">
            <input type="number" min="1" step="1000" inputMode="numeric" className="field-input" value={f.price} onChange={set("price")} placeholder="150000" />
          </Field>
          {price > 0 && <Breakdown price={price} />}
          <Field label="Jadwal tersedia mingguan" hint="(pisahkan dengan koma, maks. 7)">
            <input className="field-input" value={f.slots} onChange={set("slots")} placeholder="Senin 19.00, Rabu 20.00, Sabtu 10.00" />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-gray-200 p-4 text-sm">
            <div className="font-bold text-gray-900">{f.title} · {f.org}</div>
            <div className="mt-0.5 text-xs text-gray-500">{topicLabel(f.topic)} · {expertise.join(", ")}</div>
            <p className="m-0 mt-2 text-[13px] leading-relaxed text-gray-700">{f.bio}</p>
            <div className="mt-3 text-xs text-gray-500">
              Bukti: {[validUrl(f.portfolioUrl) && "tautan", f.cvName && "CV", f.certNames.length > 0 && `${f.certNames.length} sertifikat`, f.workEmail && "email kantor"].filter(Boolean).join(", ")}
            </div>
            <div className="mt-1 text-xs text-gray-500">Jadwal: {slots.join(" · ")}</div>
          </div>
          <Breakdown price={price} />
          <CommissionNotice price={price} />
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-800">
            <input type="checkbox" className="mt-1" checked={f.agree} onChange={(e) => setF((x) => ({ ...x, agree: e.target.checked }))} />
            <span>
              Saya mengerti bahwa setiap sesi dipotong komisi platform {MENTOR_FEE_PERCENT}% dan saya menerima {100 - MENTOR_FEE_PERCENT}% dari harga sesi.
            </span>
          </label>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <button type="button" className="btn btn-ghost" onClick={step === 0 ? onCancel : () => setStep(step - 1)}>
          {step > 0 && <ChevronLeft size={15} />} {step === 0 ? "Batal" : "Kembali"}
        </button>
        {step < 3 ? (
          <button type="button" className="btn btn-accent" disabled={!valid[step]} onClick={() => setStep(step + 1)}>
            Lanjut
          </button>
        ) : (
          <button type="button" className="btn btn-accent" disabled={!valid[3]} onClick={submit}>
            <Check size={15} /> Kirim Pengajuan
          </button>
        )}
      </div>
    </div>
  );
}
