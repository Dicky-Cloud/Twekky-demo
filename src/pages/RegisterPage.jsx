import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthShell, { AuthField, PasswordField, AuthButton, AuthAlert } from "../components/auth/AuthShell";

// Skor kekuatan kata sandi 0-3: panjang, campuran huruf besar/kecil, dan angka atau simbol.
function passwordScore(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}
const SCORE_LABEL = ["", "Lemah", "Cukup", "Kuat"];
const SCORE_BAR = ["bg-gray-200", "bg-danger", "bg-amber-400", "bg-emerald-500"];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const score = passwordScore(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Buat akun Twekky"
      subtitle="Satu akun untuk forum kerja dan lowongan."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link to="/login" className="font-semibold text-brand no-underline hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <AuthAlert>{error}</AuthAlert>}
        <AuthField
          id="name"
          label="Nama lengkap"
          icon={User}
          autoComplete="name"
          placeholder="Nama kamu"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
        <div className="flex flex-col gap-2">
          <PasswordField
            id="password"
            label="Kata sandi"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          {password && (
            <div className="flex items-center gap-2.5">
              <div className="flex flex-1 gap-1.5">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${score >= i ? SCORE_BAR[score] : "bg-gray-200"}`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-500">{SCORE_LABEL[score]}</span>
            </div>
          )}
        </div>
        <AuthButton disabled={busy}>{busy ? "Memproses..." : "Daftar"}</AuthButton>
        <p className="m-0 text-center text-xs leading-relaxed text-gray-400">
          Dengan mendaftar, kamu menyetujui aturan komunitas Twekky.
        </p>
      </form>
    </AuthShell>
  );
}