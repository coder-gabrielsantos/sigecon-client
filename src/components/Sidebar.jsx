import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, BarChart3, LogOut } from "lucide-react";
import { clearSession } from "../services/authService";

export default function Sidebar() {
  function handleLogout() {
    try {
      clearSession();
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // ignora erros de localStorage
    }
    // Recarrega a página; o ProtectedRoute redireciona para /login?redirectTo=...
    window.location.reload();
  }

  return (
    <aside className="flex flex-col w-64 bg-gray-900 text-white h-screen">
      {/* topo / branding */}
      <div className="h-16 flex items-center px-4 border-b border-white/10">
        <div className="h-10 w-10 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-semibold text-sm shadow-md shadow-indigo-500/30">
          CN
        </div>
        <div className="ml-3 leading-tight">
          <p className="text-[11px] font-medium text-white/70">
            Gestão e Orçamento
          </p>
          <p className="text-sm font-semibold text-white">Painel Interno</p>
        </div>
      </div>

      {/* navegação */}
      <nav className="flex-1 px-3 py-4 text-sm overflow-y-auto">
        <SidebarLink to="/contracts" label="Contratos">
          <FileText className="h-4 w-4"/>
        </SidebarLink>

        <SidebarLink to="/orders" label="Ordens">
          <LayoutDashboard className="h-4 w-4"/>
        </SidebarLink>

        <SidebarLink to="/user" label="Usuário">
          <BarChart3 className="h-4 w-4"/>
        </SidebarLink>
      </nav>

      {/* footer + logout */}
      <div className="px-4 py-4 border-t border-white/10 flex items-center justify-between text-[11px]">
        <span className="text-white/40">v0.1 protótipo</span>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/5 px-2 py-1 rounded-lg transition"
        >
          <LogOut className="h-3.5 w-3.5"/>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({ to, label, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-xl px-3 py-2 mb-1 font-medium transition-colors",
          isActive
            ? "bg-white text-gray-900 shadow-sm"
            : "text-white/80 hover:text-white hover:bg-white/5",
        ].join(" ")
      }
    >
      <span className="flex-shrink-0">{children}</span>
      <span className="truncate">{label}</span>
    </NavLink>
  );
}
