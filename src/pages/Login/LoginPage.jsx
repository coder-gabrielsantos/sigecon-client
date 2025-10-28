import { useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function LoginPage() {
  const [form, setForm] = useState({
    cpf: "",
    password: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // depois vamos validar CPF/senha e redirecionar para /dashboard
    console.log("login attempt:", form);
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
        {/* overlay pra contraste */}
        <div className="absolute inset-0 bg-black/40"/>

        {/* conteúdo sobre a imagem */}
        <div className="relative z-10 flex flex-col justify-between p-8 w-full">
          {/* topo - marca */}
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/10 ring-1 ring-white/30 flex items-center justify-center text-white font-semibold text-sm uppercase">
                CN
              </div>
              <div className="text-white leading-tight">
                <p className="text-sm font-medium text-white/80">
                  PREFEITURA MUNICIPAL DE COELHO NETO
                </p>
              </div>
            </div>
          </div>

          {/* bottom - mensagem institucional */}
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
          {/* topo / marca para mobile */}
          <div className="mb-8 lg:mb-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm uppercase shadow-md shadow-indigo-600/30">
                CN
              </div>
              <div className="leading-tight">
                <p className="text-[11px] font-medium text-gray-500">
                  PREFEITURA MUNICIPAL DE COELHO NETO
                </p>
                <p className="text-base font-semibold text-gray-900 mt-1">
                  Acesso ao sistema
                </p>
              </div>
            </div>
          </div>

          {/* form card */}
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
                  autoComplete="username"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Senha */}
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

                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>

            <p className="text-[11px] text-gray-500 text-center mt-6 leading-relaxed">
              O uso deste sistema é restrito a servidores autorizados da
              Secretaria Municipal de Gestão e Orçamento. Todas as ações são
              registradas com identificação do usuário, data e hora.
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
