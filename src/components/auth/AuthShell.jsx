// Kerangka halaman masuk, daftar, dan atur ulang kata sandi.
// Layar lebar: panel brand di kiri dan form di kanan. Di HP: header brand melengkung,
// dengan kartu form yang sedikit naik menutupi batasnya.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Check } from "lucide-react";
import twekkyLogo from "../../assets/twekky_logo.png";

const HIGHLIGHTS = [
  "Diskusi di komunitas sesuai bidang kerjamu",
  "Cari lowongan dan lamar dari satu tempat",
  "Bimbingan karier bersama mentor berpengalaman",
];

export default function AuthShell({ title, subtitle, footer, children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Panel brand: desktop */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-brand to-brand-dark text-white md:flex md:w-[44%] md:flex-col md:justify-between md:p-12 lg:p-16">
        <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-36 -left-24 h-96 w-96 rounded-full bg-white/5" />

        <Link to="/" className="relative flex items-center gap-3 text-white no-underline">
          <img src={twekkyLogo} alt="" className="h-10 w-10 rounded-xl object-contain" />
          <span className="text-lg font-bold tracking-tight">Twekky</span>
        </Link>

        <div className="relative">
          <h2 className="m-0 text-3xl font-bold leading-tight lg:text-4xl">
            Satu akun untuk forum kerja dan loker.
          </h2>
          <ul className="m-0 mt-8 list-none space-y-4 p-0 text-sm text-white/85">
            {HIGHLIGHTS.map((text) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Check size={14} strokeWidth={2.5} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative m-0 text-xs text-white/60">© Twekky</p>
      </aside>

      {/* Header brand: HP */}
      <div className="relative overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-brand to-brand-dark px-6 pb-14 pt-10 text-white md:hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-2.5">
          <img src={twekkyLogo} alt="" className="h-9 w-9 rounded-xl object-contain" />
          <span className="text-base font-bold tracking-tight">Twekky</span>
        </div>
      </div>

      {/* Form */}
      <main className="relative -mt-10 flex flex-1 items-start justify-center px-4 pb-10 md:mt-0 md:items-center md:px-10 lg:px-16">
        <div className="w-full max-w-[400px] rounded-3xl bg-white p-6 shadow-xl ring-1 ring-gray-100 sm:p-8 md:p-0 md:shadow-none md:ring-0">
          <h1 className="m-0 text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
          {subtitle && <p className="m-0 mt-1.5 text-sm leading-relaxed text-gray-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <p className="m-0 mt-6 text-center text-sm text-gray-500">{footer}</p>}
        </div>
      </main>
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-gray-200 bg-gray-50 py-3 text-[15px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10";

export function AuthField({ id, label, icon: Icon, action, trailing, ...rest }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-gray-700">
          {label}
        </label>
        {action}
      </div>
      <div className="relative">
        {Icon && (
          <Icon size={18} strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        )}
        <input
          id={id}
          className={`${inputBase} ${Icon ? "pl-11" : "pl-4"} ${trailing ? "pr-12" : "pr-4"}`}
          {...rest}
        />
        {trailing}
      </div>
    </div>
  );
}

export function PasswordField({ id, label, action, ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <AuthField
      id={id}
      label={label}
      icon={Lock}
      action={action}
      type={show ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-gray-400 transition-colors hover:text-gray-700"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      }
      {...rest}
    />
  );
}

export function AuthButton({ children, type = "submit", className = "", ...rest }) {
  return (
    <button
      type={type}
      className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-brand py-3 text-[15px] font-semibold text-white shadow-lg shadow-gray-900/15 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function AuthAlert({ children }) {
  return (
    <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
      {children}
    </div>
  );
}