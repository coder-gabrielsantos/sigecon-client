import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext.jsx";
import banner from "../../utils/images/banner.png";

function formatCPF(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 9);
  const part4 = digits.slice(9, 11);

  let formatted = part1;
  if (part2) formatted += "." + part2;
  if (part3) formatted += "." + part3;
  if (part4) formatted += "-" + part4;

  return formatted;
}

export default function LoginPage() {
  const [form, setForm] = useState({ cpf: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, loading } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "cpf") {
      const formatted = formatCPF(value);
      setForm((p) => ({ ...p, cpf: formatted }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const { ok, message } = await login(
      form.cpf.replace(/\D/g, ""),
      form.password
    );
    if (!ok) {
      setError(message || "Falha no login.");
      return;
    }

    const redirect = params.get("redirectTo");
    navigate(redirect ? decodeURIComponent(redirect) : "/contracts", {
      replace: true,
    });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* LEFT SIDE - IMAGE / BRAND AREA */}
      <div className="hidden lg:flex relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${banner})`,
          }}
        />
        <div className="absolute inset-0 bg-black/55"/>

        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <div className="flex items-center gap-3">
            <div className="text-white leading-tight">
              <p className="text-xs font-medium tracking-[0.18em] text-white/70 uppercase">
                PREFEITURA MUNICIPAL DE COELHO NETO
              </p>
            </div>
          </div>

          <div className="text-white max-w-lg">
            <h2 className="text-2xl font-semibold leading-snug">
              Sistema de Gestão de Contratos e Ordens
            </h2>
            <p className="text-[14px] text-white/50">
              © {new Date().getFullYear()} Prefeitura Municipal de Coelho Neto
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN CARD */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-6 sm:py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:mb-10 flex items-center justify-between gap-4">
            <div className="leading-tight">
              <p className="text-base sm:text-lg font-semibold text-slate-50 mt-1">
                Acesso ao sistema
              </p>
              <p className="text-s text-slate-400 mt-1">
                Entre com seu CPF e senha para continuar.
              </p>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl ring-1 ring-slate-200/80 p-6 sm:p-7 space-y-6">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                Entrar na sua conta
              </p>
              <p className="text-xs text-slate-500">
                Credenciais fornecidas pela administração do sistema.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* CPF */}
              <div className="space-y-1.5">
                <label
                  htmlFor="cpf"
                  className="text-sm font-medium text-slate-700"
                >
                  CPF
                </label>
                <Input
                  id="cpf"
                  name="cpf"
                  type="text"
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={handleChange}
                  maxLength={14}
                  required
                  className="text-sm"
                />
              </div>

              {/* Senha com ícone de mostrar/ocultar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Senha
                  </label>
                </div>

                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    className="pr-10 text-sm"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      // ícone olho fechado
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.027-2.977 2.993-5.298 5.39-6.68"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.11 11 8-.51 1.48-1.23 2.8-2.13 3.93"/>
                        <path d="M14.12 9.88A3 3 0 0 1 9.88 14.12"/>
                        <path d="m1 1 22 22"/>
                      </svg>
                    ) : (
                      // ícone olho aberto
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12C2.73 7.11 7 4 12 4s9.27 3.11 11 8c-1.73 4.89-6 8-11 8S2.73 16.89 1 12Z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 ring-1 ring-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </div>

          {/* Créditos do desenvolvedor */}
          <p className="mt-4 text-[12px] text-center text-slate-400">
            Desenvolvido por{" "}
            <a
              href="https://jogabriel-santos.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-slate-100 underline underline-offset-2 hover:text-slate-50"
            >
              Gabriel Santos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
