import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { TOPICS } from "../constants/topics";
import { MENTOR_FEE_PERCENT, mentorFee, mentorNet, formatRupiah } from "../constants/mentors";
import Modal from "./Modal";

const splitList = (s, max) =>
  [...new Set(String(s).split(/[\n,]/).map((x) => x.trim()).filter(Boolean))].slice(0, max);

// Modal pengajuan diri sebagai mentor. Penghasilan = harga sesi dikurangi
// biaya platform (lihat MENTOR_FEE_PERCENT di constants/mentors.js).
export default function BecomeMentorModal({ userName, onClose, onSubmit }) {
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    title: "",
    org: "",
    topic: TOPICS[0]?.slug || "",
    expertise: "",
    bio: "",
    price: "",
    slots: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const price = Math.floor(Number(form.price)) || 0;
  const expertise = splitList(form.expertise, 6);
  const slots = splitList(form.slots, 7);
  const valid =
    form.title.trim() && form.org.trim() && form.topic && form.bio.trim() && price > 0 && expertise.length > 0 && slots.length > 0;

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({
      name: userName,
      title: form.title.trim(),
      org: form.org.trim(),
      topic: form.topic,
      expertise,
      bio: form.bio.trim(),
      price,
      slots,
    });
    setDone(true);
  };

  if (done) {
    return (
      <Modal title="Jadi Mentor" onClose={onClose}>
        <div className="py-4 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-success">
            <CheckCircle2 size={28} />
          </div>
          <h4 className="m-0 text-base font-bold text-gray-900">Pengajuan terkirim</h4>
          <p className="mx-auto mt-1.5 mb-5 max-w-sm text-sm leading-relaxed text-gray-600">
            Pengajuanmu akan ditinjau sebelum tampil di daftar mentor. Statusnya bisa kamu lihat di halaman Mentor.
          </p>
          <button type="button" className="btn btn-accent" onClick={onClose}>Selesai</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Ajukan diri sebagai mentor" onClose={onClose} maxWidth="max-w-xl">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
            Jabatan
            <input className="field-input" value={form.title} onChange={set("title")} placeholder="Senior Product Designer" required />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
            Perusahaan / bidang
            <input className="field-input" value={form.org} onChange={set("org")} placeholder="Startup e-commerce" required />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
          Topik utama
          <select className="field-input" value={form.topic} onChange={set("topic")}>
            {TOPICS.map((t) => (
              <option key={t.slug} value={t.slug}>{t.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
          Keahlian <span className="font-normal text-gray-400">(pisahkan dengan koma, maks. 6)</span>
          <input className="field-input" value={form.expertise} onChange={set("expertise")} placeholder="Portofolio desain, UX research, Review karya" required />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
          Tentang kamu
          <textarea className="field-input min-h-[90px] resize-y" value={form.bio} onChange={set("bio")} placeholder="Ceritakan pengalaman dan bantuan apa yang bisa kamu berikan." required />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
          Jadwal tersedia mingguan <span className="font-normal text-gray-400">(pisahkan dengan koma, maks. 7)</span>
          <input className="field-input" value={form.slots} onChange={set("slots")} placeholder="Senin 19.00, Rabu 20.00, Sabtu 10.00" required />
        </label>

        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-700">
            Harga per sesi (60 menit), dalam Rupiah
            <input type="number" min="1" step="1000" inputMode="numeric" className="field-input" value={form.price} onChange={set("price")} placeholder="150000" required />
          </label>
          {price > 0 && (
            <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
              <div className="flex justify-between text-gray-600"><span>Harga sesi</span><span>{formatRupiah(price)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Biaya platform {MENTOR_FEE_PERCENT}%</span><span>− {formatRupiah(mentorFee(price))}</span></div>
              <div className="mt-1.5 flex justify-between border-t border-gray-200 pt-1.5 font-bold text-gray-900"><span>Kamu terima</span><span>{formatRupiah(mentorNet(price))}</span></div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-4">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Batal</button>
          <button type="submit" className="btn btn-accent" disabled={!valid}>Kirim Pengajuan</button>
        </div>
      </form>
    </Modal>
  );
}
