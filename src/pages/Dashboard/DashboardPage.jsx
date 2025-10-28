import {
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  FileText,
} from "lucide-react";
import IconButton from "../../components/ui/IconButton";

export default function DashboardPage() {
  // KPIs administrativos (mantidos)
  const cards = [
    {
      title: "Contratos ativos",
      value: "5",
      deltaLabel: "vigentes",
      deltaValue: "em execução",
      deltaColor: "text-emerald-600 bg-emerald-50 ring-emerald-200",
    },
    {
      title: "Saldo disponível total",
      value: "R$ 128.450,00",
      deltaLabel: "saldo contratual somado",
      deltaValue: "+ R$ 3.700 restante",
      deltaColor: "text-indigo-600 bg-indigo-50 ring-indigo-200",
    },
    {
      title: "Movimentado este mês",
      value: "R$ 32.900,00",
      deltaLabel: "em outubro / 2025",
      deltaValue: "↑ 12%",
      deltaColor: "text-amber-600 bg-amber-50 ring-amber-200",
    },
  ];

  // movimentações recentes agora só com:
  // - Ordem de Serviço
  // - Ordem de Fornecimento
  const movimentacoesRecentes = [
    {
      numero: "OF 045/2025",
      tipo: "Ordem de Fornecimento",
      contrato: "Contrato 009/2025",
      valor: "R$ 4.920,00",
      data: "20/10/2025",
    },
    {
      numero: "OS 012/2025",
      tipo: "Ordem de Serviço",
      contrato: "Contrato 009/2025",
      valor: "R$ 1.610,00",
      data: "18/10/2025",
    },
    {
      numero: "OF 044/2025",
      tipo: "Ordem de Fornecimento",
      contrato: "Contrato 014/2025",
      valor: "R$ 2.380,00",
      data: "17/10/2025",
    },
  ];

  return (
    <div className="space-y-8">
      {/* BLOCO SUPERIOR / CONTROLES */}
      <section className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 sm:p-6">
        {/* título + ações */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* esquerda */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 leading-tight">
              Painel Administrativo
            </h1>

            <p className="text-sm text-gray-500 leading-relaxed">
              Acompanhamento de contratos, saldo e últimas ordens emitidas.
            </p>

            {/* abas */}
            <div className="flex flex-wrap items-center gap-4 text-sm mt-4">
              <button className="text-indigo-600 font-semibold flex flex-col">
                <span>Visão geral</span>
                <span className="block h-[2px] w-full bg-indigo-600 rounded-full mt-1" />
              </button>

              <button className="text-gray-500 hover:text-gray-700 font-medium">
                Contratos
              </button>

              <button className="text-gray-500 hover:text-gray-700 font-medium">
                Ordens
              </button>

              <button className="text-gray-500 hover:text-gray-700 font-medium">
                Relatórios
              </button>
            </div>
          </div>

          {/* direita (ações) */}
          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
            <button className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-300 bg-white hover:bg-gray-50 w-full sm:w-auto">
              Exportar
            </button>
            <button className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 w-full sm:w-auto">
              + Nova ordem
            </button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="rounded-xl ring-1 ring-gray-200 bg-white p-4 flex flex-col justify-between shadow-xs"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-gray-600 leading-tight">
                  {card.title}
                </p>
                <IconButton className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                  <MoreHorizontal className="h-4 w-4" />
                </IconButton>
              </div>

              <p className="text-2xl font-semibold text-gray-900 mt-2 break-words">
                {card.value}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span
                  className={
                    "text-[11px] font-medium leading-none rounded-lg px-2 py-1 ring-1 " +
                    card.deltaColor
                  }
                >
                  {card.deltaValue}
                </span>
                <span className="text-[11px] text-gray-500 leading-none">
                  {card.deltaLabel}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* FILTROS + BUSCA */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-8">
          {/* filtros resumidos (mantemos padrão visual para consistência futura) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <FilterChip label="Outubro / 2025" />
            <FilterChip label="Contrato 009/2025" />
            <FilterChip label="Ordem de Fornecimento" />
            <button className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-300 bg-white hover:bg-gray-50">
              + Filtros
            </button>
          </div>

          {/* busca */}
          <div className="flex items-center gap-2 w-full lg:w-64">
            <div className="flex items-center w-full rounded-xl ring-1 ring-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500">
              <Search className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
              <input
                className="flex-1 outline-none placeholder-gray-400 text-sm text-gray-700 min-w-0"
                placeholder="Buscar ordem, contrato..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* TABELA DE ORDENS (Movimentações Recentes) */}
      <section className="rounded-2xl ring-1 ring-gray-200 bg-white shadow-sm overflow-hidden">
        {/* header da tabela */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-4 py-4 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 leading-tight">
              Últimas ordens emitidas
            </h2>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Registros mais recentes de Ordem de Fornecimento e Ordem de
              Serviço.
            </p>
          </div>

          <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500 w-fit">
            Ver todas
          </button>
        </div>

        {/* tabela scrollável no mobile */}
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-gray-600 text-[11px] uppercase font-medium bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Documento</th>
              <th className="px-4 py-3 whitespace-nowrap">Tipo</th>
              <th className="px-4 py-3 whitespace-nowrap">Contrato</th>
              <th className="px-4 py-3 whitespace-nowrap text-right">
                Valor
              </th>
              <th className="px-4 py-3 whitespace-nowrap text-right">
                Data
              </th>
              <th className="px-4 py-3 whitespace-nowrap text-right">
                Ações
              </th>
            </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-gray-700">
            {movimentacoesRecentes.map((item, idx) => (
              <tr key={idx} className="align-top">
                {/* número do documento */}
                <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2 rounded-md ring-1 ring-gray-300 bg-white text-gray-700 text-[11px] font-medium px-2 py-1">
                      <FileText className="h-3.5 w-3.5 text-gray-500" />
                      <span className="truncate">{item.numero}</span>
                    </span>
                </td>

                {/* tipo da ordem */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <TipoBadge tipo={item.tipo} />
                </td>

                {/* contrato vinculado */}
                <td className="px-4 py-3 text-gray-800 whitespace-nowrap text-xs sm:text-sm">
                  {item.contrato}
                </td>

                {/* valor */}
                <td className="px-4 py-3 font-medium text-gray-900 text-right whitespace-nowrap text-xs sm:text-sm">
                  {item.valor}
                </td>

                {/* data */}
                <td className="px-4 py-3 text-gray-500 text-right whitespace-nowrap text-[11px] sm:text-xs">
                  {item.data}
                </td>

                {/* ações */}
                <td className="px-4 py-3 text-right whitespace-nowrap text-xs">
                  <IconButton>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function FilterChip({ label }) {
  return (
    <span className="inline-flex items-center rounded-lg px-2 py-1 bg-white ring-1 ring-gray-300 text-gray-700 font-medium text-[11px] sm:text-xs">
      {label}
      <button className="ml-2 text-gray-400 hover:text-gray-600 text-[10px] leading-none">
        ✕
      </button>
    </span>
  );
}

// Só dois tipos: Ordem de Serviço (verde) e Ordem de Fornecimento (azul)
function TipoBadge({ tipo }) {
  let style = "";
  let label = tipo;

  if (tipo === "Ordem de Serviço") {
    style = "bg-emerald-50 text-emerald-700 ring-emerald-200";
  } else if (tipo === "Ordem de Fornecimento") {
    style = "bg-indigo-50 text-indigo-700 ring-indigo-200";
  } else {
    style = "bg-gray-100 text-gray-700 ring-gray-200";
  }

  return (
    <span
      className={
        "inline-flex items-center rounded-lg px-2 py-1 text-[11px] font-medium ring-1 " +
        style
      }
    >
      {label}
    </span>
  );
}
