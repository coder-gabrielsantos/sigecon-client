import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, BarChart3 } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="flex flex-col w-64 bg-gray-900 text-white h-full">
      {/* topo / branding */}
      <div className="h-16 flex items-center px-4 border-b border-white/10">
        <div className="h-10 w-10 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-semibold text-sm shadow-md shadow-indigo-500/30">
          CN
        </div>
        <div className="ml-3 leading-tight">
          <p className="text-[11px] font-medium text-white/70">
            Gestão e Orçamento
          </p>
          <p className="text-sm font-semibold text-white">
            Painel Interno
          </p>
        </div>
      </div>

      {/* navegação */}
      <nav className="flex-1 px-3 py-4 text-sm overflow-y-auto">
        <SidebarLink to="/dashboard" label="Dashboard">
          <LayoutDashboard className="h-4 w-4"/>
        </SidebarLink>

        <SidebarLink to="/contracts" label="Contratos">
          <FileText className="h-4 w-4"/>
        </SidebarLink>

        <SidebarDisabled label="Relatórios">
          <BarChart3 className="h-4 w-4"/>
        </SidebarDisabled>
      </nav>

      <div className="px-4 py-4 border-t border-white/10 text-[11px] text-white/40">
        v0.1 protótipo
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
          "group flex items-center gap-2 rounded-xl px-3 py-2 mb-1 font-medium transition-colors",
          isActive
            ? "bg-white text-gray-900 shadow-sm"
            : "text-white/80 hover:text-white hover:bg-white/5",
        ].join(" ")
      }
    >
      {/* ícone */}
      <span
        className={
          "text-white/70 group-[.active]:text-gray-900 flex-shrink-0"
        }
      >
        {children}
      </span>
      {/* rótulo */}
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function SidebarDisabled({ label, children }) {
  return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-white/30 cursor-not-allowed select-none">
      <span className="flex-shrink-0">{children}</span>
      <span className="truncate">{label}</span>
      <span className="ml-auto text-[10px] uppercase tracking-wide text-white/20 bg-white/10 rounded px-1 py-[1px]">
        em breve
      </span>
    </div>
  );
}
