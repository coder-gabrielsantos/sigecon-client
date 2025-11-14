import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext.jsx";

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
    navigate(redirect ? decodeURIComponent(redirect) : "/dashboard", {
      replace: true,
    });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gray-50">
      {/* LEFT SIDE - IMAGE / BRAND AREA */}
      <div className="hidden lg:flex relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1581092334607-25b1d1c5c5d4?fit=crop&w=1200&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-black/40"/>

        <div className="relative z-10 flex flex-col justify-between p-8 w-full">
          <div>
            <div className="text-white leading-tight">
              <p className="text-sm font-medium text-white/80">
                PREFEITURA MUNICIPAL DE COELHO NETO
              </p>
            </div>
          </div>

          <div className="text-white">
            <h2 className="text-xl font-semibold leading-tight">
              Sistema de Gestão de Contratos e Ordens de Serviço
            </h2>
            <p className="text-sm text-white/80 mt-2 max-w-sm">
              Acesso interno para controle de contratos, emissão de ordens de
              serviço e acompanhamento de saldo orçamentário.
            </p>
            <p className="text-[11px] text-white/50 mt-6">
              © {new Date().getFullYear()} Prefeitura Municipal de Coelho Neto
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN CARD */}
      <div className="flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:mb-10">
            <div className="leading-tight">
              <p className="text-[11px] font-medium text-gray-500">
                PREFEITURA MUNICIPAL DE COELHO NETO
              </p>
              <p className="text-base font-semibold text-gray-900 mt-1">
                Acesso ao sistema
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* CPF */}
              <div className="space-y-1">
                <label
                  htmlFor="cpf"
                  className="text-sm font-medium text-gray-700"
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
                />
              </div>

              {/* Senha com ícone de mostrar/ocultar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Senha
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Esqueci a senha
                  </button>
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
                    className="pr-10"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <p className="text-[11px] text-gray-500 text-center mt-6 leading-relaxed">
              O uso deste sistema é restrito. Todas as ações são registradas.
            </p>
          </div>

          <p className="text-[11px] text-gray-400 text-center mt-6">
            v0.1 • Uso interno
          </p>
        </div>
      </div>
    </div>
  );
}
