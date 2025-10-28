import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-gray-900 text-white">
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
      <nav className="flex-1 px-3 py-4 text-sm">
        <SidebarLink to="/dashboard" label="Dashboard"/>
        <SidebarLink to="/contracts" label="Contratos"/>
        <SidebarDisabled label="Relatórios"/>
      </nav>

      <div className="px-4 py-4 border-t border-white/10 text-[11px] text-white/40">
        v0.1 protótipo
      </div>
    </aside>
  );
}

function SidebarLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center rounded-xl px-3 py-2 mb-1 font-medium transition-colors",
          isActive
            ? "bg-white text-gray-900 shadow-sm"
            : "text-white/80 hover:text-white hover:bg-white/5",
        ].join(" ")
      }
    >
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function SidebarDisabled({ label }) {
  return (
    <div className="flex items-center rounded-xl px-3 py-2 text-white/30 cursor-not-allowed select-none">
      <span className="truncate">{label}</span>
      <span className="ml-auto text-[10px] uppercase tracking-wide text-white/20 bg-white/10 rounded px-1 py-[1px]">
        em breve
      </span>
    </div>
  );
}
