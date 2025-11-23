import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getOrderById,
  downloadOrderXlsx,
} from "../../services/ordersService";
import { getContractById } from "../../services/contractsService";

const EXPENSE_OPTIONS = [
  "SERVIÇOS / OBRAS DE ENGENHARIA",
  "AQUIS. BENS / MAT. DE CONSUMO",
  "OUTROS  (Diárias; Passagens; etc.)",
];

const MODALITY_OPTIONS = [
  "DISPENSA DE LICITAÇÃO",
  "INEXIGIBILIDADE DE LICITAÇÃO",
  "CONC. PÚBLICA Nº",
  "PREGÃO ELETRÔNICO Nº 001/2024",
  "OUTROS",
];

function formatMoneyBRL(v) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dados extras para preencher o XLSX
  const [xlsxExtras, setXlsxExtras] = useState({
    // tipo de ordem
    orderTypeText: "",
    // De / Para
    deText: "SECRETARIA MUNICIPAL DE GESTÃO E ORÇAMENTO",
    paraText: "05.281.738/0001-98",
    // Nome / Razão + assinatura
    nomeRazao: "S. T. BORBA",
    // Endereço
    endereco: "RUA DEP. RAIMUNDO BACELAR,421, CENTRO, COELHO NETO-MA",
    // Texto extra do contrato
    celularTexto: "CONTRATO Nº 009 DE 09 DE JANEIRO DE 2025",
    // Justificativa
    justificativaCampo: "",
    // Tipos de despesa
    tiposDespesaSelecionados: ["SERVIÇOS / OBRAS DE ENGENHARIA"],
    // Modalidades de licitação
    modalidadesSelecionadas: ["PREGÃO ELETRÔNICO Nº 001/2024"],
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getOrderById(id);
        if (!alive) return;

        const formattedOrder = {
          id: data.id,
          orderNumber: data.orderNumber,
          orderType: data.orderType,
          // data amigável dd/mm/aaaa
          issueDate: data.issueDate
            ? new Date(data.issueDate).toLocaleDateString("pt-BR")
            : null,
          justification: data.justification,
          referencePeriod: data.referencePeriod,
          totalAmount: Number(data.totalAmount ?? 0),
          contractId: data.contractId,
          items: (data.items || []).map((it) => ({
            id: it.id,
            itemNo: it.itemNo ?? it.item_no,
            description: it.description,
            unit: it.unit,
            quantity: Number(it.quantity ?? 0),
            unitPrice: Number(it.unitPrice ?? it.unit_price ?? 0),
            totalPrice: Number(it.totalPrice ?? it.total_price ?? 0),
          })),
        };

        setOrder(formattedOrder);

        // Preenche defaults do formulário com base na ordem
        setXlsxExtras((prev) => {
          const justificativaBase =
            formattedOrder.justification || prev.justificativaCampo || "";
          const periodo = formattedOrder.referencePeriod
            ? ` Período de Referência: ${formattedOrder.referencePeriod}.`
            : "";
          return {
            ...prev,
            orderTypeText: formattedOrder.orderType || prev.orderTypeText,
            justificativaCampo: justificativaBase + periodo,
          };
        });

        if (data.contractId) {
          const c = await getContractById(data.contractId);
          if (!alive) return;
          setContract({
            id: c.id,
            number: c.number || c.numero,
            supplier: c.supplier || c.fornecedor,
          });
        }
      } catch (e) {
        console.error(e);
        if (alive) setError("Não foi possível carregar a ordem.");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id]);

  function handleChange(field, value) {
    setXlsxExtras((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function toggleExpenseSelection(value) {
    setXlsxExtras((prev) => {
      const exists = prev.tiposDespesaSelecionados.includes(value);
      const tiposDespesaSelecionados = exists
        ? prev.tiposDespesaSelecionados.filter((v) => v !== value)
        : [...prev.tiposDespesaSelecionados, value];
      return { ...prev, tiposDespesaSelecionados };
    });
  }

  function toggleModalitySelection(value) {
    setXlsxExtras((prev) => {
      const exists = prev.modalidadesSelecionadas.includes(value);
      const modalidadesSelecionadas = exists
        ? prev.modalidadesSelecionadas.filter((v) => v !== value)
        : [...prev.modalidadesSelecionadas, value];
      return { ...prev, modalidadesSelecionadas };
    });
  }

  async function handleDownloadXlsx() {
    try {
      const payload = {
        orderTypeText: xlsxExtras.orderTypeText,
        deText: xlsxExtras.deText,
        paraText: xlsxExtras.paraText,
        nomeRazao: xlsxExtras.nomeRazao,
        endereco: xlsxExtras.endereco,
        celularTexto: xlsxExtras.celularTexto,
        justificativaCampo: xlsxExtras.justificativaCampo,
        tiposDespesaSelecionados: xlsxExtras.tiposDespesaSelecionados,
        modalidadesSelecionadas: xlsxExtras.modalidadesSelecionadas,
      };

      const blob = await downloadOrderXlsx(id, payload);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const numero = order.orderNumber || order.id;
      a.href = url;
      a.download = `ordem_${numero}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Não foi possível baixar a ordem em XLSX.");
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <p className="text-xs sm:text-sm text-gray-500">Carregando ordem...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-3">
        {error && (
          <p className="text-xs sm:text-sm text-red-600">
            {error || "Ordem não encontrada."}
          </p>
        )}
        <button
          onClick={() => navigate("/orders")}
          className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-500"
        >
          Voltar para ordens
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header principal */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
            Ordem vinculada a contrato
          </p>
          <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
            {order.orderType || "Ordem"} nº {order.orderNumber || order.id}
          </h1>
          {order.issueDate && (
            <p className="text-xs sm:text-sm text-gray-500">
              Data da emissão:{" "}
              <span className="font-medium text-gray-700">
                {order.issueDate}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <button
            type="button"
            onClick={handleDownloadXlsx}
            className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-500 hover:border-indigo-500 self-start"
          >
            Baixar planilha
          </button>

          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-gray-200 hover:bg-gray-50 self-start"
          >
            Voltar
          </button>
        </div>
      </header>

      {/* Form para preencher campos do XLSX */}
      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-3 sm:p-5 space-y-4 sm:space-y-5">
        <div className="space-y-1">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Dados para geração da planilha
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Esses campos serão escritos diretamente no modelo XLSX antes do
            download. Você pode ajustar os textos conforme precisar.
          </p>
        </div>

        {/* Tipo de ordem */}
        <div className="space-y-1">
          <label className="block text-[11px] sm:text-xs font-medium text-gray-700">
            Tipo de ordem
          </label>
          <input
            type="text"
            value={xlsxExtras.orderTypeText}
            onChange={(e) => handleChange("orderTypeText", e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* De / Para */}
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-[11px] sm:text-xs font-medium text-gray-700">
              De
            </label>
            <input
              type="text"
              value={xlsxExtras.deText}
              onChange={(e) => handleChange("deText", e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] sm:text-xs font-medium text-gray-700">
              Para
            </label>
            <input
              type="text"
              value={xlsxExtras.paraText}
              onChange={(e) => handleChange("paraText", e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Nome / extra / endereço */}
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-[11px] sm:text-xs font-medium text-gray-700">
              Nome / Razão Social
            </label>
            <input
              type="text"
              value={xlsxExtras.nomeRazao}
              onChange={(e) => handleChange("nomeRazao", e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] sm:text-xs font-medium text-gray-700">
              Texto extra (ex.: informação do contrato)
            </label>
            <input
              type="text"
              value={xlsxExtras.celularTexto}
              onChange={(e) => handleChange("celularTexto", e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] sm:text-xs font-medium text-gray-700">
            Endereço
          </label>
          <input
            type="text"
            value={xlsxExtras.endereco}
            onChange={(e) => handleChange("endereco", e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Seleções */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[11px] sm:text-xs font-medium text-gray-700">
              Tipos de despesa
            </p>
            <div className="space-y-1.5">
              {EXPENSE_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-700"
                >
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={xlsxExtras.tiposDespesaSelecionados.includes(opt)}
                    onChange={() => toggleExpenseSelection(opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] sm:text-xs font-medium text-gray-700">
              Modalidades de licitação
            </p>
            <div className="space-y-1.5">
              {MODALITY_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-700"
                >
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={xlsxExtras.modalidadesSelecionadas.includes(opt)}
                    onChange={() => toggleModalitySelection(opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Justificativa */}
        <div className="space-y-1">
          <label className="block text-[11px] sm:text-xs font-medium text-gray-700">
            Justificativa / Finalidade / Período de Referência
          </label>
          <textarea
            rows={3}
            value={xlsxExtras.justificativaCampo}
            onChange={(e) =>
              handleChange("justificativaCampo", e.target.value)
            }
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </section>

      {/* Bloco do contrato / resumo ordem */}
      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-3 sm:p-5 space-y-4">
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
              Contrato
            </p>
            <p className="text-xs sm:text-sm font-semibold text-gray-900">
              {contract?.number || "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
              Fornecedor
            </p>
            <p className="text-xs sm:text-sm font-medium text-gray-900">
              {contract?.supplier || "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
              Total da ordem
            </p>
            <p className="text-sm sm:text-lg font-semibold text-gray-900">
              {formatMoneyBRL(order.totalAmount)}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3 sm:pt-4 space-y-1">
          <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
            Finalidade / Justificativa (dados originais da ordem)
          </p>
          <p className="text-xs sm:text-sm text-gray-800">
            {order.justification || "—"}
          </p>
        </div>
      </section>

      {/* Itens da ordem - padrão igual ao ContractDetailPage */}
      <OrderItemsTable items={order.items}/>
    </div>
  );
}

/* ===================== TABELA “SOLTA” COM SCROLL E BORDAS RETAS ===================== */

function OrderItemsTable({ items = [] }) {
  if (!items.length) {
    return (
      <section className="mt-2 sm:mt-3">
        <div className="flex items-center justify-between mb-1 sm:mb-2">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Itens desta ordem
          </h2>
          <span className="text-xs sm:text-sm text-gray-500">0 itens</span>
        </div>
        <p className="text-xs sm:text-sm text-gray-500">
          Nenhum item vinculado a esta ordem.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-2 sm:space-y-3 mt-2 sm:mt-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-semibold text-gray-900">
          Itens desta ordem
        </h2>
        <span className="text-xs sm:text-sm text-gray-500">
          {items.length} itens
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        {/* Scroll vertical sem card, tabela cobrindo toda a largura */}
        <div
          className="
            w-full
            max-h-80 sm:max-h-96 overflow-y-auto
            scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300
            hover:scrollbar-thumb-gray-400
          "
        >
          <table className="w-full text-[11px] sm:text-sm border border-gray-200 border-collapse">
            <thead className="bg-indigo-50 text-indigo-700 uppercase text-[10px] sm:text-xs sticky top-0 z-10">
            <tr>
              <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-left border-b border-gray-200">
                Item
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-left border-b border-gray-200">
                Descrição
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-left border-b border-gray-200 whitespace-nowrap">
                Unid.
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-right border-b border-gray-200 whitespace-nowrap">
                Quant.
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-right border-b border-gray-200 whitespace-nowrap">
                V. unitário
              </th>
              <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-right border-b border-gray-200 whitespace-nowrap">
                V. total
              </th>
            </tr>
            </thead>

            <tbody>
            {items.map((it) => (
              <tr
                key={it.id}
                className="bg-white odd:bg-white even:bg-gray-50"
              >
                <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-700 whitespace-nowrap border-b border-gray-100">
                  {it.itemNo ?? "-"}
                </td>
                <td className="px-2 sm:px-3 py-2 sm:py-2.5 border-b border-gray-100">
                    <span className="font-medium text-gray-800">
                      {it.description}
                    </span>
                </td>
                <td className="px-2 sm:px-3 py-2 sm:py-2.5 whitespace-nowrap text-gray-700 border-b border-gray-100">
                  {it.unit || "—"}
                </td>
                <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-right whitespace-nowrap text-gray-700 border-b border-gray-100">
                  {it.quantity}
                </td>
                <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-right whitespace-nowrap text-gray-700 border-b border-gray-100">
                  {formatMoneyBRL(it.unitPrice)}
                </td>
                <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-right whitespace-nowrap font-medium text-gray-900 border-b border-gray-100">
                  {formatMoneyBRL(it.totalPrice)}
                </td>
              </tr>
            ))}
            </tbody>

            <tfoot>
            <tr className="bg-white">
              <td
                className="px-2 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-sm text-gray-600"
                colSpan={5}
              >
                Total dos itens
              </td>
              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-right font-semibold text-gray-900">
                {formatMoneyBRL(
                  items.reduce((acc, it) => acc + (it.totalPrice || 0), 0)
                )}
              </td>
            </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
