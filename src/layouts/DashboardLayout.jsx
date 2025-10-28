import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";

export default function DashboardLayout() {
  // estado local para abrir/fechar sidebar no mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR DESKTOP */}
      <div className="hidden md:block">
        <Sidebar/>
      </div>

      {/* SIDEBAR MOBILE (drawer simples) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* fundo escuro clicável para fechar */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* painel lateral */}
          <div className="relative z-50 w-64 max-w-[80%] bg-gray-900 text-white shadow-xl h-full">
            <Sidebar/>
          </div>
        </div>
      )}

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER SUPERIOR */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
          {/* lado esquerdo */}
          <div className="flex items-center gap-3 min-w-0">
            {/* botão hambúrguer só no mobile */}
            <button
              className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 ring-1 ring-gray-300"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5"/>
            </button>

            <div className="leading-tight">
              <p className="text-xs font-medium text-gray-700 leading-tight truncate">
                PREFEITURA MUNICIPAL DE COELHO NETO
              </p>
              {/* Removido: SECRETARIA MUNICIPAL DE GESTÃO E ORÇAMENTO */}
            </div>
          </div>

          {/* lado direito (usuário logado) */}
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-gray-900">
                Usuário Interno
              </p>
              <p className="text-[11px] text-gray-500">CPF: 000.000.000-00</p>
            </div>
          </div>
        </header>

        {/* CONTEÚDO DA ROTA ATUAL */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet/>
        </main>
      </div>
    </div>
  );
}
