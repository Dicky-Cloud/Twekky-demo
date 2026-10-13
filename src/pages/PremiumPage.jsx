import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Crown, Check, Minus, Building2, ArrowLeft, RotateCw, Info } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";

// Halaman langganan Twekky. Satu halaman, dua paket: Pro (pencari kerja) dan
// Bisnis (perekrut). Mentor bukan langganan: lihat halaman Mentor.
// Fitur terkunci mengarah ke sini lewat openPro()/openSubscription() di
// ProContext, membawa alasan dan halaman asal lewat location.state.
// Tiap kartu paket bisa dibalik: sisi belakang menjelaskan fungsi tiap fitur.

// Status tiap fitur: "Ada" sudah live, "Baru" fitur terbaru yang sudah live,
// "Segera hadir" kodenya sudah ada tapi belum diaktifkan.
// Daftar ini hanya memuat fitur yang benar-benar membedakan Pro dari Gratis.
// Fitur yang gratis untuk semua (Lamar Cepat, filter lanjutan, simpan lowongan
// & postingan) tidak dimasukkan; lihat catatan di bawah tabel.
const PRO_GROUPS = [
  {
    title: "Menonjol saat melamar",
    rows: [
      ["Lamaran prioritas (lencana Pro)", "—", "10 / bulan", "Ada"],
      ["Pembuat CV (unduh PDF)", "3 model", "16 model + 20 warna & warna kustom", "Baru"],
    ],
  },
  {
    title: "Dilihat lebih banyak",
    rows: [
      ["Pengunjung profilmu", "Jumlah saja (30 hari)", "Daftar nama atau perusahaan (90 hari)", "Ada"],
      ["Jumlah pelamar per lowongan", "—", "✓", "Ada"],
    ],
  },
  {
    title: "Pantau dan tindak lanjut",
    rows: [
      ["Pencarian tersimpan", "1", "10 dengan notifikasi instan", "Ada"],
      ["Waktu lamaran dilihat perekrut", "Dilihat / belum", "Lengkap dengan jam", "Ada"],
      ["Pesan ke HR per lamaran", "1", "Sampai 5 (jeda 24 jam)", "Ada"],
      ["Catatan & pengingat lamaran", "—", "✓ (di aplikasi)", "Ada"],
    ],
  },
];

// Penjelasan fungsi tiap fitur: tampil di sisi belakang kartu Pro.
const PRO_HELP = [
  { title: "Lamaran prioritas", text: "Centang \"Jadikan lamaran prioritas\" saat melamar. Lamaranmu tampil lebih dulu di dashboard perekrut dan diberi lencana Pro. Kuota 10 per bulan." },
  { title: "Pengunjung profilmu", text: "Tab Pengunjung di profil. Gratis hanya melihat jumlah pengunjung; Pro melihat siapa saja yang membuka profilmu (kecuali yang memilih anonim)." },
  { title: "Jumlah pelamar", text: "Di daftar lowongan, Pro melihat berapa orang yang sudah melamar, jadi kamu tahu seberapa ramai persaingannya." },
  { title: "Pembuat CV", text: "Menu Buat CV membuat CV dari data profilmu dan mengunduhnya sebagai PDF. Gratis memakai 3 model berwarna hitam; Pro membuka 16 model, 20 pilihan warna, dan warna kustom bebas." },
  { title: "Pencarian tersimpan", text: "Tombol Simpan pencarian di halaman Lowongan menyimpan kata kunci dan filter. Pro mendapat notifikasi instan saat ada lowongan baru yang cocok." },
  { title: "Waktu lamaran dilihat", text: "Di tab Lamaran Saya. Gratis hanya tahu sudah dilihat atau belum; Pro tahu jam persisnya perekrut membuka lamaranmu." },
  { title: "Pesan ke HR", text: "Tombol Chat HR di tab Lamaran Saya untuk menanyakan kabar lamaran. Gratis 1 pesan per lamaran, Pro sampai 5." },
  { title: "Catatan & pengingat", text: "Tulis catatan (mis. nama HRD) dan atur pengingat follow-up di setiap lamaran di tab Lamaran Saya." },
];

const BUSINESS_FEATURES = [
  "Pasang lowongan dan kelola pelamar di dashboard rekrutmen",
  "Sorot lowongan agar tampil lebih menonjol",
  "Kustomisasi halaman perusahaan (warna aksen & daftar benefit)",
];

const BUSINESS_HELP = [
  { title: "Dashboard rekrutmen", text: "Pasang lowongan, tinjau pelamar, ubah status lamaran (ditinjau, interview, diterima, ditolak), dan unduh CV serta surat pengantar mereka." },
  { title: "Sorot lowongan", text: "Lowongan yang disorot tampil di urutan teratas daftar dan diberi label Disorot, jadi lebih mudah ditemukan pencari kerja." },
  { title: "Halaman perusahaan", text: "Atur warna aksen dan daftar benefit di halaman perusahaanmu agar kandidat mendapat gambaran yang menarik tentang tempat kerjamu." },
  { title: "Batas tiap paket", text: "Jumlah lowongan aktif, kuota sorotan, dan batas lain berbeda per paket. Lihat detailnya di halaman Paket." },
];

const STATUS_STYLE = {
  Ada: "bg-gray-100 text-gray-600",
  Baru: "bg-emerald-50 text-emerald-700",
  "Segera hadir": "bg-yellow-50 text-yellow-700",
};

function StatusBadge({ status }) {
  return (
    <span className={`ml-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[status] || STATUS_STYLE.Ada}`}>
      {status}
    </span>
  );
}

// Kartu paket yang bisa dibalik. Kedua sisi ditumpuk di satu sel grid, jadi
// tinggi kartu mengikuti sisi yang lebih tinggi dan tidak melompat saat dibalik.
function PlanCard({ highlighted, icon: Icon, name, tagline, price, active, help, children }) {
  const [flipped, setFlipped] = useState(false);

  const face = `rounded-2xl border bg-white p-6 shadow-sm ${
    highlighted ? "border-brand ring-2 ring-brand/20" : "border-gray-200"
  }`;
  const faceStyle = { gridArea: "1 / 1", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" };
  // sisi yang tidak terlihat disembunyikan setelah animasi, supaya tombolnya tidak bisa difokus
  const visibility = (show) => ({
    visibility: show ? "visible" : "hidden",
    transition: show ? "visibility 0s" : "visibility 0s linear 0.6s",
  });

  return (
    <div style={{ perspective: "1400px" }}>
      <div
        className="grid transition-transform duration-[600ms] ease-in-out motion-reduce:transition-none"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "none" }}
      >
        {/* sisi depan */}
        <section
          className={`flex flex-col ${face}`}
          style={{ ...faceStyle, ...visibility(!flipped) }}
          aria-hidden={flipped}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon size={20} />
              </span>
              <div>
                <h2 className="m-0 text-lg font-bold text-gray-900">{name}</h2>
                <p className="m-0 text-xs text-gray-500">{tagline}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {active && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-success">Aktif</span>
              )}
              <button
                type="button"
                onClick={() => setFlipped(true)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 hover:border-brand hover:text-brand"
                title="Balik kartu untuk melihat fungsi tiap fitur"
              >
                <Info size={13} /> Panduan fitur
              </button>
            </div>
          </div>
          {price && <p className="m-0 mt-4 text-2xl font-bold text-gray-900">{price}</p>}
          <div className="mt-4 flex flex-1 flex-col gap-4">{children}</div>
        </section>

        {/* sisi belakang: fungsi tiap fitur */}
        <section
          className={`flex flex-col ${face}`}
          style={{ ...faceStyle, transform: "rotateY(180deg)", ...visibility(flipped) }}
          aria-hidden={!flipped}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="m-0 text-lg font-bold text-gray-900">Panduan fitur {name}</h2>
              <p className="m-0 text-xs text-gray-500">Apa fungsi tiap fitur dan di mana menemukannya.</p>
            </div>
            <button
              type="button"
              onClick={() => setFlipped(false)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 hover:border-brand hover:text-brand"
            >
              <RotateCw size={13} /> Kembali
            </button>
          </div>
          <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
            {help.map((h) => (
              <li key={h.title} className="flex items-start gap-2.5">
                <Check size={16} className="mt-0.5 shrink-0 text-brand" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900">{h.title}</div>
                  <p className="m-0 text-xs leading-relaxed text-gray-600">{h.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function ProPlan({ highlighted, from }) {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [justActivated, setJustActivated] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      await refreshUser();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <PlanCard
      highlighted={highlighted}
      icon={Crown}
      name="Pro"
      tagline="Untuk pencari kerja"
      price="Rp20.000 / bulan"
      active={Boolean(user?.is_pro)}
      help={PRO_HELP}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500">
            <th className="py-1 font-medium">Fitur</th>
            <th className="font-medium">Gratis</th>
            <th className="font-medium text-brand">Pro</th>
          </tr>
        </thead>
        {PRO_GROUPS.map((g) => (
          <tbody key={g.title}>
            <tr>
              <th colSpan={3} className="pb-1 pt-4 text-left text-xs font-bold uppercase tracking-wide text-gray-900">
                {g.title}
              </th>
            </tr>
            {g.rows.map(([f, a, b, status]) => (
              <tr key={f} className="border-t border-gray-100 align-top">
                <td className="py-2 pr-2">
                  {f}
                  <StatusBadge status={status} />
                </td>
                <td className="py-2 pr-2 text-gray-600">{a}</td>
                <td className="py-2 font-medium">{b}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
      <p className="m-0 text-xs text-gray-500">
        Tetap gratis untuk semua: diskusi, komentar, melamar (termasuk Lamar Cepat dengan cek kelengkapan karier),
        filter lanjutan, serta simpan lowongan dan postingan.
      </p>
      {error && <p className="m-0 text-sm text-red-600">{error}</p>}

      <div className="mt-auto space-y-2">
        {user?.is_pro ? (
          <>
            <p className="m-0 flex items-center gap-1.5 text-sm text-green-700">
              <Check size={14} /> {justActivated ? "Pro aktif sekarang." : "Pro kamu aktif."}
            </p>
            {justActivated && from && (
              <button type="button" className="btn btn-accent w-full" onClick={() => navigate(from)}>
                Lanjut ke halaman sebelumnya
              </button>
            )}
            {confirmCancel ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Yakin berhenti berlangganan?</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmCancel(false)} disabled={busy}>
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-sm text-red-600"
                  disabled={busy}
                  onClick={async () => {
                    if (await run(() => api.proCancel())) {
                      setConfirmCancel(false);
                      setJustActivated(false);
                    }
                  }}
                >
                  {busy ? "Memproses…" : "Ya, berhenti"}
                </button>
              </div>
            ) : (
              <button type="button" className="text-xs text-gray-500 underline" onClick={() => setConfirmCancel(true)}>
                Berhenti berlangganan
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (await run(() => api.proSubscribe())) setJustActivated(true);
            }}
            className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Memproses…" : "Aktifkan Pro (demo)"}
          </button>
        )}
      </div>
    </PlanCard>
  );
}

function BusinessPlan({ highlighted }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isBusiness = user?.account_type === "business";

  return (
    <PlanCard
      highlighted={highlighted}
      icon={Building2}
      name="Bisnis"
      tagline="Untuk perusahaan dan perekrut"
      help={BUSINESS_HELP}
    >
      <p className="m-0 text-sm text-gray-600">
        Paket Bisnis untuk perusahaan dan perekrut. Harga dan batas tiap paket ada di halaman Paket.
      </p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {BUSINESS_FEATURES.map((t) => (
          <li key={t} className="flex items-start gap-2 text-sm text-gray-700">
            <Check size={16} className="mt-0.5 shrink-0 text-success" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto space-y-2">
        {isBusiness ? (
          <button type="button" className="btn btn-accent w-full" onClick={() => navigate("/rekrutmen/paket")}>
            Lihat & kelola paket
          </button>
        ) : (
          <>
            <p className="m-0 flex items-center gap-1.5 text-xs text-gray-500">
              <Minus size={13} /> Paket Bisnis hanya untuk akun Bisnis.
            </p>
            <button type="button" className="btn btn-accent w-full" onClick={() => navigate("/profil?pengaturan=bisnis")}>
              Buat akun Bisnis
            </button>
          </>
        )}
      </div>
    </PlanCard>
  );
}

export default function PremiumPage() {
  const { state } = useLocation();
  const reason = state?.reason || "";
  const from = state?.from || "";
  const focus = state?.tab === "business" ? "business" : "pro";

  return (
    <>
      <Topbar title="Premium" />
      <div className="mx-auto w-full max-w-5xl p-6 lg:p-8">
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-8 text-white">
          <div className="mb-2 flex items-center gap-3">
            <Crown size={30} strokeWidth={2} />
            <h1 className="m-0 text-2xl font-bold">Twekky Premium</h1>
          </div>
          <p className="m-0 max-w-[56ch] text-sm opacity-90">
            Percepat pencarian kerja atau rekrutmen. Diskusi, komentar, dan melamar tetap gratis untuk semua orang.
          </p>
        </div>

        {reason && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <span>{reason}</span>
            {from && (
              <Link to={from} className="inline-flex items-center gap-1 font-semibold text-yellow-900 no-underline hover:underline">
                <ArrowLeft size={14} /> Kembali
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
          <ProPlan highlighted={focus === "pro" && Boolean(reason)} from={from} />
          <BusinessPlan highlighted={focus === "business" && Boolean(reason)} />
        </div>
      </div>
    </>
  );
}