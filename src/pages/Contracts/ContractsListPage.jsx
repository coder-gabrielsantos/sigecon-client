import { Search, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContractUploadModal from "./ContractUploadModal";
import { listContracts } from "../../services/contractsService";

export default function ContractsListPage() {
  const navigate = useNavigate();
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contratos, setContratos] = useState([]);

  async function reload() {
    try {
      setLoading(true);
      setError("");
      const data = await listContracts();
      setContratos(data.map(normalizeSummaryFromApi));
    } catch (e) {
      console.error(e);
      setError("Não foi possível carregar os contratos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const list = contratos.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.numero || "").toLowerCase().includes(q) ||
      (c.fornecedor || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* HEADER / CONTROLES */}
      <section className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-3 sm:p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 leading-tight">
              Contratos
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
              Acompanhamento de contratos vigentes, fornecedor e saldo
              disponível.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 w-full sm:w-auto"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white"/>
              <span>Novo contrato</span>
            </button>
          </div>
        </div>

        {/* Linha 2: busca */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mt-4 sm:mt-5">
          <div className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            <p>
              {loading
                ? "Carregando..."
                : `${list.length} contrato${
                  list.length === 1 ? " listado" : "s listados"
                }`}{" "}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-72">
            <div className="flex items-center w-full rounded-xl ring-1 ring-gray-300 bg-white px-3 py-2 text-xs sm:text-sm text-gray-700 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500">
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 mr-2 flex-shrink-0"/>
              <input
                className="flex-1 outline-none placeholder-gray-400 text-xs sm:text-sm text-gray-700 min-w-0"
                placeholder="Buscar contratos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* TABELA */}
      <section className="rounded-2xl ring-1 ring-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 leading-tight">
              Lista de contratos
            </h2>
          </div>
        </div>

        {error && (
          <div className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Tabela */}
        <div
          className="
            w-full
            max-h-[28rem]
            overflow-auto
            scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300
            hover:scrollbar-thumb-gray-400
          "
        >
          <table className="min-w-full text-left text-xs sm:text-sm border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-gray-50 text-[11px] sm:text-xs uppercase font-medium border-b border-gray-200 text-gray-600">
            <tr>
              <th className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                Contrato
              </th>
              <th className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                Fornecedor
              </th>
              <th className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-right">
                Valor total
              </th>
              <th className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-right">
                Usado
              </th>
              <th className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap text-right">
                Saldo
              </th>
            </tr>
            </thead>

            <tbody className="text-gray-700">
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-3 py-2 sm:px-4 sm:py-3">
                    <div className="h-3 bg-gray-200 rounded w-32 sm:w-40"/>
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3">
                    <div className="h-3 bg-gray-200 rounded w-40 sm:w-48"/>
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-right">
                    <div className="h-3 bg-gray-200 rounded w-16 sm:w-20 ml-auto"/>
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-right">
                    <div className="h-3 bg-gray-200 rounded w-16 sm:w-20 ml-auto"/>
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-right">
                    <div className="h-3 bg-gray-200 rounded w-16 sm:w-20 ml-auto"/>
                  </td>
                </tr>
              ))}

            {!loading &&
              list.map((c, idx) => (
                <tr
                  key={c.id || idx}
                  className="align-top cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => c.id && navigate(`/contracts/${c.id}`)}
                >
                  <td className="px-3 py-2 sm:px-4 sm:py-3 font-semibold text-gray-900 whitespace-nowrap text-xs sm:text-sm">
                    {c.numero}
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-800 whitespace-nowrap text-xs sm:text-sm">
                    {c.fornecedor}
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 font-medium text-gray-900 text-right whitespace-nowrap text-xs sm:text-sm">
                    {formatCurrency(c.valorTotal)}
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 font-medium text-gray-900 text-right whitespace-nowrap text-xs sm:text-sm">
                    {formatCurrency(c.valorUsado)}
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3 font-medium text-gray-900 text-right whitespace-nowrap text-xs sm:text-sm">
                    {formatCurrency(c.saldoRestante)}
                  </td>
                </tr>
              ))}

            {!loading && list.length === 0 && (
              <tr>
                <td
                  className="px-3 sm:px-4 py-8 sm:py-10 text-center text-xs sm:text-sm text-gray-500"
                  colSpan={5}
                >
                  Nenhum contrato encontrado.
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal — upload de XLSX */}
      <ContractUploadModal
        open={isUploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={(contract) => {
          setUploadOpen(false);

          if (contract && contract.id) {
            navigate(`/contracts/${contract.id}`);
          } else {
            reload();
          }
        }}
      />
    </div>
  );
}

/* ==== helpers & UI ==== */
function normalizeSummaryFromApi(api) {
  const numero = api.number || api.numero || "Contrato";
  const fornecedor = api.supplier || api.fornecedor || "—";
  const valorTotal = Number(api.totalAmount ?? 0);
  const valorUsado = Number(api.usedAmount ?? 0);
  const saldoRestante = Number(
    api.remainingAmount ?? valorTotal - valorUsado
  );

  return {
    id: api.id,
    numero,
    fornecedor,
    valorTotal,
    valorUsado,
    saldoRestante,
  };
}

function formatCurrency(v) {
  const num = Number(v);
  if (Number.isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}
