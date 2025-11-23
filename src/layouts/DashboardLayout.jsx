import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // lê o usuário salvo no localStorage depois do login
  const [user] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("sigecon_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const displayName = user?.nome || user?.name || "Usuário interno";
  const displayRole = user?.role || "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SIDEBAR FIXA DESKTOP */}
      <div className="hidden md:block">
        <div className="fixed inset-y-0 left-0 z-30">
          <Sidebar/>
        </div>
      </div>

      {/* SIDEBAR MOBILE (drawer) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative z-50 w-64 max-w-[80%] bg-gray-900 text-white shadow-xl h-full">
            <Sidebar/>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        {/* HEADER */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
          {/* lado esquerdo */}
          <div className="flex items-center gap-3 min-w-0">
            {/* botão menu mobile */}
            <button
              className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 ring-1 ring-gray-300"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5"/>
            </button>

            <div className="leading-tight hidden sm:block">
              <p className="text-xs font-medium text-gray-700 leading-tight truncate">
                PREFEITURA MUNICIPAL DE COELHO NETO
              </p>
            </div>
          </div>

          {/* lado direito - usuário logado */}
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-gray-900">
                {displayName}
              </p>

              {displayRole && (
                <p className="text-[11px] text-gray-500">
                  {displayRole}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* CONTEÚDO DA ROTA ATUAL */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet/>
        </main>
      </div>
    </div>
  );
}
