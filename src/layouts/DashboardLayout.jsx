import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar fixa à esquerda */}
      <Sidebar/>

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header topo interno */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
          <div>
            <p className="text-xs font-medium text-gray-500 leading-tight">
              PREFEITURA MUNICIPAL DE COELHO NETO
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                Usuário Interno
              </p>
              <p className="text-[11px] text-gray-500 leading-tight">
                CPF: 000.000.000-00
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-semibold text-xs shadow-md shadow-indigo-600/30">
              CN
            </div>
          </div>
        </header>

        {/* Conteúdo da página atual */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet/>
        </main>
      </div>
    </div>
  );
}
