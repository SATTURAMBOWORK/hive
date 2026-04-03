import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { Building2, KeyRound, Eye, EyeOff } from "lucide-react";

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm transition-colors";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", tenantSlug: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");

  function handleEmailChange(e) {
    const val = e.target.value;
    setForm((p) => ({ ...p, email: val }));
    if (val && !EMAIL_REGEX.test(val)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (emailError) return;
    setError("");
    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-200">

        {/* Left Side */}
        <div className="relative hidden w-full bg-slate-50 md:block md:w-5/12 lg:w-1/2 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/apartment.png')] bg-cover bg-center opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-100 via-slate-50/60 to-transparent" />
          <div className="absolute bottom-12 left-10 right-10">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
              <Building2 className="h-7 w-7" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 font-[Nunito]">
              Welcome Home.
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600 max-w-sm">
              A simple, beautiful place to stay connected with your apartment community.
              Get notices, book amenities, and more.
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full p-8 sm:p-12 md:w-7/12 lg:w-1/2 flex flex-col justify-center">
          <div className="md:hidden mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <Building2 className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Welcome back</h2>
          </div>

          <div className="hidden md:block">
            <h3 className="text-2xl font-extrabold text-slate-900 font-[Nunito]">Sign in</h3>
            <p className="mt-2 text-sm text-slate-600">Secure access to your society portal</p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-inset ring-rose-200/50">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 pb-1" htmlFor="tenantSlug">
                Society Code
              </label>
              <input
                id="tenantSlug"
                className={inputCls}
                placeholder="green-heights"
                value={form.tenantSlug}
                onChange={(e) => setForm((p) => ({ ...p, tenantSlug: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 pb-1" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className={`${inputCls} ${emailError ? "border-rose-400 focus:border-rose-400 focus:ring-rose-400" : ""}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={handleEmailChange}
                required
              />
              {emailError && (
                <p className="mt-1.5 text-xs text-rose-600">{emailError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 pb-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`${inputCls} pr-11`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 transition-all"
            >
              <KeyRound className="h-4 w-4" />
              Sign in
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6 text-center md:text-left">
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <Link to="/register" className="font-semibold text-emerald-700 hover:text-emerald-800 transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
