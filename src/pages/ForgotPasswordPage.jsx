import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { api } from "../api/client";
import AuthShell, { AuthField, AuthButton, AuthAlert } from "../components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.forgotPassword(email);
      setSentTo(email);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const backLink = (
    <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-brand no-underline hover:underline">
      <ArrowLeft size={15} /> Kembali ke halaman masuk
    </Link>
  );

  if (sentTo) {
    return (
      <AuthShell title="Cek kotak masukmu" subtitle="Tautan atur ulang kata sandi sudah kami kirim.">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-brand-soft/60 px-5 py-7 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand shadow-sm">
            <MailCheck size={26} strokeWidth={2} />
          </span>
          <p className="m-0 text-sm leading-relaxed text-gray-600">
            Jika <span className="font-semibold text-gray-900">{sentTo}</span> terdaftar, kami sudah mengirim tautan
            untuk membuat kata sandi baru. Tautan berlaku 30 menit. Jika belum terlihat, cek juga folder spam.
          </p>
        </div>
        <div className="mt-6 flex flex-col items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => setSentTo("")}
            className="cursor-pointer border-none bg-transparent p-0 font-semibold text-gray-500 hover:text-gray-800"
          >
            Tidak menerima email? Coba lagi
          </button>
          {backLink}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Lupa kata sandi?"
      subtitle="Masukkan email akunmu. Kami akan mengirim tautan untuk membuat kata sandi baru."
      footer={backLink}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <AuthAlert>{error}</AuthAlert>}
        <AuthField
          id="email"
          type="email"
          label="Email"
          icon={Mail}
          autoComplete="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <AuthButton disabled={busy}>{busy ? "Mengirim..." : "Kirim tautan"}</AuthButton>
      </form>
    </AuthShell>
  );
}