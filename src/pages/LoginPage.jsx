import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { USE_MOCK } from "../api/client";
import AuthShell, { AuthField, PasswordField, AuthButton, AuthAlert } from "../components/auth/AuthShell";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      // kembali ke halaman asal (bila dikirim dari tombol yang butuh login); hanya path internal
      const from = location.state?.from;
      navigate(typeof from === "string" && from.startsWith("/") && !from.startsWith("//") ? from : "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Selamat datang kembali"
      subtitle="Masuk untuk lanjut berdiskusi, cari kerja, dan bertemu mentor."
      footer={
        <>
          Belum punya akun?{" "}
          <Link to="/register" className="font-semibold text-brand no-underline hover:underline">
            Daftar sekarang
          </Link>
        </>
      }
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
        <PasswordField
          id="password"
          label="Kata sandi"
          autoComplete="current-password"
          placeholder="Masukkan kata sandi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          action={
            <Link to="/lupa-password" className="text-xs font-semibold text-brand no-underline hover:underline">
              Lupa kata sandi?
            </Link>
          }
          required
        />
        <AuthButton disabled={busy}>{busy ? "Memproses..." : "Masuk"}</AuthButton>
      </form>

      {USE_MOCK && (
        <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-600">
          <p className="mb-2 font-semibold text-gray-700">Mode demo — klik untuk mengisi akun (kata sandi: demo1234)</p>
          <div className="flex flex-wrap gap-2">
            {[
              ["Pencari kerja", "rina@demo.com"],
              ["Engineer", "budi@demo.com"],
              ["HR (Pro)", "sari@demo.com"],
              ["Perusahaan", "hr@majudigital.com"],
            ].map(([label, mail]) => (
              <button
                key={mail}
                type="button"
                onClick={() => {
                  setEmail(mail);
                  setPassword("demo1234");
                }}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 font-medium text-gray-700 hover:border-gray-400"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthShell>
  );
}