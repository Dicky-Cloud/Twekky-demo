import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { BadgeCheck, Check, Clock, Minus } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { ErrorBanner } from "../../components/recruitment/StatusBadge";
import { formatDate, formatRupiah } from "../../constants/recruitment";

function UsageBar({ label, used, max }) {
  const pct = max ? Math.min(100, (used / max) * 100) : 0;
  const full = max > 0 && used >= max;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">
          {used}
          {max > 0 ? ` / ${max}` : ""}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${full ? "bg-danger" : "bg-brand"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Feature({ ok = true, children }) {
  return (
    <li className={`flex items-start gap-2 text-sm ${ok ? "text-gray-700" : "text-gray-400"}`}>
      {ok ? (
        <Check size={16} className="text-success shrink-0 mt-0.5" />
      ) : (
        <Minus size={16} className="shrink-0 mt-0.5" />
      )}
      <span>{children}</span>
    </li>
  );
}

function PlanFeatures({ plan }) {
  return (
    <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
      <Feature>Maksimal {plan.max_active_jobs} lowongan aktif</Feature>
      <Feature>Dashboard pelamar, status lamaran, dan unduh CV</Feature>
      <Feature>Halaman perusahaan dasar</Feature>
      {plan.max_boosts > 0 ? (
        <Feature>
          Sorot lowongan: {plan.max_boosts} sorotan aktif bersamaan, {plan.boost_days} hari per sorotan
        </Feature>
      ) : (
        <Feature ok={false}>Sorot lowongan</Feature>
      )}
      <Feature ok={plan.company_customization}>Kustomisasi halaman perusahaan (warna aksen &amp; daftar benefit)</Feature>
      <Feature ok={plan.applicant_notes}>Catatan internal pada pelamar</Feature>
      {plan.max_message_templates > 0 ? (
        <Feature>Template pesan penolakan &amp; wawancara (sampai {plan.max_message_templates} template)</Feature>
      ) : (
        <Feature ok={false}>Template pesan penolakan &amp; wawancara</Feature>
      )}
      {plan.max_screening_questions > 0 ? (
        <Feature>Pertanyaan penyaring (sampai {plan.max_screening_questions} per lowongan)</Feature>
      ) : (
        <Feature ok={false}>Pertanyaan penyaring</Feature>
      )}
      <Feature ok={plan.job_viewer_list}>
        Daftar pelihat lowongan{plan.job_viewer_list ? "" : " (Starter hanya melihat jumlah)"}
      </Feature>
      <Feature ok={plan.match_score}>Skor kecocokan pelamar terhadap lowongan</Feature>
      <Feature ok={plan.applicant_ratings}>Penilaian pelamar (bintang &amp; label)</Feature>
      {plan.max_talent_pool > 0 ? (
        <Feature>Talent pool (sampai {plan.max_talent_pool} kandidat)</Feature>
      ) : (
        <Feature ok={false}>Talent pool</Feature>
      )}
      <Feature ok={plan.interview_scheduling}>Penjadwalan wawancara, undangan email &amp; pengingat otomatis</Feature>
    </ul>
  );
}

export default function PlanTab() {
  const { biz, reload } = useOutletContext();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [period, setPeriod] = useState("monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api
      .businessPlans()
      .then((d) => setPlans(d?.plans || []))
      .catch((err) => setError(err.message));
  }, []);

  if (!biz) return <p className="text-gray-500 text-sm">Memuat paket...</p>;

  const sub = biz.subscription;
  const active = biz.subscription_active;
  const over = biz.usage.active_jobs > biz.plan.max_active_jobs;

  const subscribe = async (plan) => {
    const periodLabel = period === "yearly" ? "tahunan" : "bulanan";
    if (!window.confirm(`Aktifkan paket ${plan.name} (${periodLabel})?`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.businessSubscribe(plan.id, period);
      await reload();
      setNotice(`Paket ${plan.name} aktif.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const cancelRenew = async () => {
    if (!window.confirm("Hentikan perpanjangan otomatis? Paket tetap berlaku sampai tanggal berakhir.")) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.businessCancelSubscription();
      await reload();
      setNotice("Perpanjangan otomatis dihentikan.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const growthSaving = (p) =>
    p.price_monthly > 0 ? Math.round((1 - p.price_yearly / (p.price_monthly * 12)) * 100) : 0;

  return (
    <>
      <ErrorBanner>{error}</ErrorBanner>
      {notice && (
        <div className="mb-4 rounded-lg border border-success bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          {notice}
        </div>
      )}
      {biz.payment_demo && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
          Mode demo: paket langsung aktif tanpa pembayaran. Pembayaran sungguhan belum terhubung.
        </div>
      )}

      {/* paket saat ini */}
      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-sm text-gray-500">Paket saat ini</div>
            <h3 className="text-xl font-bold m-0">{biz.plan.name}</h3>
            <p className="text-sm text-gray-500 m-0 mt-1">
              {active && sub
                ? `Aktif sampai ${formatDate(sub.expires_at)} · perpanjangan otomatis ${sub.auto_renew ? "aktif" : "dimatikan"}`
                : sub
                ? `Langganan ${sub.plan} berakhir pada ${formatDate(sub.expires_at)}. Akun kembali ke paket Starter.`
                : "Paket gratis"}
            </p>
          </div>
          {active && sub?.auto_renew && (
            <button className="btn btn-ghost btn-sm" onClick={cancelRenew} disabled={busy}>
              Hentikan perpanjangan otomatis
            </button>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <UsageBar label="Lowongan aktif" used={biz.usage.active_jobs} max={biz.plan.max_active_jobs} />
          {biz.plan.max_boosts > 0 && <UsageBar label="Sorotan aktif" used={biz.usage.boosts} max={biz.plan.max_boosts} />}
        </div>
        {over && (
          <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3.5 py-2.5 mt-4 mb-0">
            Anda memiliki {biz.usage.active_jobs} lowongan aktif, melebihi batas {biz.plan.max_active_jobs} paket{" "}
            {biz.plan.name}. Lowongan tetap tayang, tetapi Anda belum bisa memasang atau membuka lowongan lain sampai jumlahnya di
            bawah batas.
          </p>
        )}
      </section>

      {/* perbandingan paket */}
      <div className="flex items-center justify-between mb-3 mt-6">
        <h3 className="text-base font-bold m-0">Pilih paket</h3>
        <div className="flex gap-1 rounded-full border border-gray-200 bg-white p-1" role="tablist" aria-label="Periode">
          {[
            { v: "monthly", l: "Bulanan" },
            { v: "yearly", l: "Tahunan" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              role="tab"
              aria-selected={period === o.v}
              onClick={() => setPeriod(o.v)}
              className={`rounded-full px-3.5 py-1 text-[13px] font-semibold transition-colors ${
                period === o.v ? "bg-brand text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {plans.map((p) => {
          const current = biz.plan.id === p.id;
          const paid = p.price_monthly > 0;
          const price = period === "yearly" ? p.price_yearly : p.price_monthly;
          return (
            <div
              key={p.id}
              className={`rounded-xl border bg-white p-6 flex flex-col ${current ? "border-brand" : "border-gray-200"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-lg font-bold m-0">{p.name}</h4>
                {current && (
                  <span className="rounded-full bg-brand-soft text-brand text-[11px] font-bold px-2.5 py-0.5">Paket Anda</span>
                )}
              </div>
              <div className="mb-4">
                {paid ? (
                  <>
                    <span className="text-3xl font-bold">{formatRupiah(price)}</span>
                    <span className="text-sm text-gray-500"> / {period === "yearly" ? "tahun" : "bulan"}</span>
                    {period === "yearly" && growthSaving(p) > 0 && (
                      <div className="text-xs text-success font-semibold mt-1">Hemat {growthSaving(p)}% dibanding bulanan</div>
                    )}
                  </>
                ) : (
                  <span className="text-3xl font-bold">Gratis</span>
                )}
              </div>
              <div className="flex-1 mb-5">
                <PlanFeatures plan={p} />
              </div>
              {paid ? (
                <button className="btn btn-accent" disabled={busy} onClick={() => subscribe(p)}>
                  {busy ? "Memproses..." : current && active ? "Perpanjang" : "Berlangganan"}
                </button>
              ) : (
                <button className="btn btn-ghost" disabled>
                  {current ? "Paket saat ini" : "Paket gratis"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* verifikasi */}
      <section className="card !mb-0">
        <div className="flex items-start gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-success shrink-0">
            <BadgeCheck size={20} />
          </span>
          <div>
            <h3 className="text-base font-bold m-0">Lencana terverifikasi</h3>
            <p className="text-sm text-gray-500 m-0 mt-1 max-w-[62ch]">
              Lencana tidak dijual dan tidak termasuk paket mana pun. Lencana diberikan setelah dokumen usaha perusahaan
              diperiksa, supaya pelamar bisa mempercayainya.
            </p>
            <p
              className={`text-sm font-semibold m-0 mt-2 flex items-center gap-1.5 ${
                user?.verification_status === "verified" ? "text-success" : "text-amber-700"
              }`}
            >
              {user?.verification_status === "verified" ? (
                <>
                  <BadgeCheck size={15} /> Perusahaan Anda sudah terverifikasi
                </>
              ) : (
                <>
                  <Clock size={15} /> Menunggu verifikasi
                </>
              )}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
