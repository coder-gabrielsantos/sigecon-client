import { Search, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContractUploadModal from "./ContractUploadModal";

export default function ContractsListPage() {
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Mock inicial (até integrar GET /contracts real)
  const [contratos, setContratos] = useState([
    {
      numero: "Contrato 009/2025",
      fornecedor: "S. T. BORBA",
      valorTotal: 10651.5,
      valorUsado: 6920.3,
      saldoRestante: 3731.2,
      status: "OK",
    },
    {
      numero: "Contrato 014/2025",
      fornecedor: "Concretex Serviços",
      valorTotal: 50000.0,
      valorUsado: 48000.0,
      saldoRestante: 2000.0,
      status: "BAIXO",
    },
    {
      numero: "Contrato 002/2024",
      fornecedor: "Alpha Hidráulica",
      valorTotal: 18000.0,
      valorUsado: 18000.0,
      saldoRestante: 0.0,
      status: "ENCERRADO",
    },
  ]);

  // Filtro de busca simples (número do contrato ou fornecedor)
  const list = contratos.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.numero || "").toLowerCase().includes(q) ||
      (c.fornecedor || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* HEADER / CONTROLES */}
      <section className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 leading-tight">
              Contratos
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Acompanhamento de contratos vigentes, fornecedor e saldo disponível.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 text-white"/>
              <span>Novo contrato</span>
            </button>
          </div>
        </div>

        {/* Linha 2: busca */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-6">
          <div className="text-xs text-gray-500 leading-relaxed">
            <p>
              {list.length} contratos listados · controle interno da prefeitura
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-64">
            <div className="flex items-center w-full rounded-xl ring-1 ring-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500">
              <Search className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0"/>
              <input
                className="flex-1 outline-none placeholder-gray-400 text-sm text-gray-700 min-w-0"
                placeholder="Buscar contrato, fornecedor..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* TABELA DE CONTRATOS */}
      <section className="rounded-2xl ring-1 ring-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header da tabela */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 px-4 py-4 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 leading-tight">
              Lista de contratos
            </h2>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Número do contrato, fornecedor, valores e status de saldo.
            </p>
          </div>

          <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500 w-fit">
            Ver todos os detalhes
          </button>
        </div>

        {/* Tabela responsiva */}
        <div className="w-full overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-gray-600 text-[11px] uppercase font-medium bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Contrato</th>
              <th className="px-4 py-3 whitespace-nowrap">Fornecedor</th>
              <th className="px-4 py-3 whitespace-nowrap text-right">
                Valor total
              </th>
              <th className="px-4 py-3 whitespace-nowrap text-right">
                Usado
              </th>
              <th className="px-4 py-3 whitespace-nowrap text-right">
                Saldo
              </th>
              <th className="px-4 py-3 whitespace-nowrap text-right">
                Status
              </th>
            </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-gray-700">
            {list.map((c, idx) => (
              <tr
                key={c.id || idx}
                className="align-top cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  if (c.id) {
                    navigate(`/contracts/${c.id}`);
                  }
                }}
              >
                <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap text-xs sm:text-sm">
                  {c.numero}
                </td>
                <td className="px-4 py-3 text-gray-800 whitespace-nowrap text-xs sm:text-sm">
                  {c.fornecedor}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900 text-right whitespace-nowrap text-xs sm:text-sm">
                  {formatCurrency(c.valorTotal)}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900 text-right whitespace-nowrap text-xs sm:text-sm">
                  {formatCurrency(c.valorUsado)}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900 text-right whitespace-nowrap text-xs sm:text-sm">
                  {formatCurrency(c.saldoRestante)}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap text-xs sm:text-sm">
                  <StatusPill status={c.status}/>
                </td>
              </tr>
            ))}

            {list.length === 0 && (
              <tr>
                <td
                  className="px-4 py-10 text-center text-sm text-gray-500"
                  colSpan={6}
                >
                  Nenhum contrato encontrado para “{query}”.
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal — upload de PDF */}
      <ContractUploadModal
        open={isUploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={(savedContract) => {
          if (!savedContract) return;
          const normalized = normalizeContractFromApi(savedContract);
          setContratos((prev) => [normalized, ...prev]);
        }}
      />
    </div>
  );
}

/** Converte resposta do backend para o formato da tabela */
function normalizeContractFromApi(api) {
  const id = api.id;

  const numero =
    api.number || api.numero || "Contrato importado (sem número)";
  const fornecedor =
    api.supplier || api.fornecedor || "Fornecedor não informado";

  const valorTotal = Number(api.totalAmount ?? 0);

  const valorUsado = Array.isArray(api.items)
    ? api.items.reduce(
      (sum, it) => sum + Number(it.totalPrice ?? it.total_price ?? 0),
      0
    )
    : 0;

  const saldoRestante = valorTotal - valorUsado;

  let status = "OK";
  if (valorTotal > 0) {
    if (saldoRestante <= 0) status = "ENCERRADO";
    else if (saldoRestante / valorTotal <= 0.1) status = "BAIXO";
  }

  return {
    id,
    numero,
    fornecedor,
    valorTotal,
    valorUsado,
    saldoRestante,
    status,
  };
}

/** Badge de status */
function StatusPill({ status }) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-2 py-1 text-[11px] font-medium ring-1 min-w-[110px] text-center";
  if (status === "OK")
    return (
      <span className={base + " bg-emerald-50 text-emerald-700 ring-emerald-200"}>
        OK
      </span>
    );
  if (status === "BAIXO")
    return (
      <span className={base + " bg-amber-50 text-amber-700 ring-amber-200"}>
        Saldo baixo
      </span>
    );
  if (status === "ENCERRADO")
    return (
      <span className={base + " bg-red-50 text-red-700 ring-red-200"}>
        Encerrado
      </span>
    );
  return (
    <span className={base + " bg-gray-100 text-gray-700 ring-gray-200"}>
      {status || "OK"}
    </span>
  );
}

/** Utilitário BRL defensivo */
function formatCurrency(v) {
  const num = Number(v);
  if (Number.isNaN(num)) {
    return "R$ 0,00";
  }
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}
