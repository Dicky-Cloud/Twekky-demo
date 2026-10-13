import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "../api/client";
import AuthShell, { PasswordField, AuthButton, AuthAlert } from "../components/auth/AuthShell";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }
    if (password !== confirm) {
      setError("Konfirmasi kata sandi belum sama.");
      return;
    }
    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
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

  if (!token) {
    return (
      <AuthShell title="Tautan tidak lengkap" subtitle="Tautan atur ulang kata sandi ini tidak valid.">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-danger-soft px-5 py-7 text-center">
          <AlertTriangle size={28} className="text-danger" />
          <p className="m-0 text-sm text-gray-600">Coba minta tautan baru dari halaman lupa kata sandi.</p>
        </div>
        <div className="mt-6 flex flex-col items-center gap-3 text-sm">
          <Link to="/lupa-password" className="font-semibold text-brand no-underline hover:underline">
            Minta tautan baru
          </Link>
          {backLink}
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Kata sandi diperbarui" subtitle="Kamu bisa masuk lagi dengan kata sandi baru.">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-emerald-50 px-5 py-7 text-center">
          <CheckCircle2 size={30} className="text-emerald-600" />
          <p className="m-0 text-sm text-gray-600">Tautan ini sekarang sudah tidak berlaku lagi.</p>
        </div>
        <Link
          to="/login"
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-brand py-3 text-[15px] font-semibold text-white no-underline shadow-lg shadow-gray-900/15 hover:bg-brand-dark"
        >
          Masuk sekarang
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Buat kata sandi baru" subtitle="Gunakan kombinasi yang sulit ditebak, minimal 8 karakter." footer={backLink}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <AuthAlert>{error}</AuthAlert>}
        <PasswordField
          id="password"
          label="Kata sandi baru"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <PasswordField
          id="confirm"
          label="Ulangi kata sandi"
          autoComplete="new-password"
          placeholder="Ketik ulang kata sandi"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <AuthButton disabled={busy}>{busy ? "Menyimpan..." : "Simpan kata sandi"}</AuthButton>
      </form>
    </AuthShell>
  );
}