import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getOrderById,
  downloadOrderXlsx,
  updateOrder,
  deleteOrder,
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
  "CONC. PÚBLICA",
  "PREGÃO ELETRÔNICO",
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
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [order, setOrder] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // edição
  const [editMode, setEditMode] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDeleteOrderModalOpen, setIsDeleteOrderModalOpen] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

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
        setEditError("");
        setEditSuccess("");
        setEditMode(false);

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

        // itens para edição (mantém a quantidade como string para input)
        setEditItems(
          (formattedOrder.items || []).map((it) => ({
            ...it,
            quantityInput:
              it.quantity !== undefined && it.quantity !== null
                ? String(it.quantity)
                : "",
          }))
        );

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

  // edição de itens
  function handleEditItemQuantityChange(itemId, value) {
    setEditItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, quantityInput: value } : it))
    );
  }

  const editedTotalAmount = useMemo(() => {
    if (!editMode || !editItems.length) {
      return order?.totalAmount ?? 0;
    }
    let total = 0;
    for (const it of editItems) {
      const raw = it.quantityInput ?? "";
      if (!raw) continue;
      const numeric = Number(
        raw.toString().replace(/\./g, "").replace(",", ".")
      );
      if (!numeric || numeric <= 0) continue;
      total += numeric * (it.unitPrice || 0);
    }
    return total;
  }, [editMode, editItems, order]);

  async function handleSaveEdits() {
    if (!editMode) return;

    setEditError("");
    setEditSuccess("");

    const itemsPayload = [];
    for (const it of editItems) {
      const raw = it.quantityInput ?? "";
      const numeric = Number(
        raw.toString().replace(/\./g, "").replace(",", ".")
      );
      if (!numeric || numeric <= 0) {
        continue;
      }
      itemsPayload.push({
        orderItemId: it.id,
        quantity: numeric,
      });
    }

    if (!itemsPayload.length) {
      setEditError("Informe uma quantidade válida para pelo menos um item.");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateOrder(id, { items: itemsPayload });

      const formattedOrder = {
        id: updated.id,
        orderNumber: updated.orderNumber,
        orderType: updated.orderType,
        issueDate: updated.issueDate
          ? new Date(updated.issueDate).toLocaleDateString("pt-BR")
          : null,
        justification: updated.justification,
        referencePeriod: updated.referencePeriod,
        totalAmount: Number(updated.totalAmount ?? 0),
        contractId: updated.contractId,
        items: (updated.items || []).map((it) => ({
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
      setEditItems(
        (formattedOrder.items || []).map((it) => ({
          ...it,
          quantityInput:
            it.quantity !== undefined && it.quantity !== null
              ? String(it.quantity)
              : "",
        }))
      );
      setEditMode(false);
      setEditSuccess("Itens da ordem atualizados com sucesso.");
      setTimeout(() => setEditSuccess(""), 2500);
    } catch (e) {
      console.error(e);
      setEditError(
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Não foi possível salvar as alterações da ordem."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleOpenDeleteOrderModal() {
    setIsDeleteOrderModalOpen(true);
  }

  function handleCloseDeleteOrderModal() {
    if (deleteLoading) return;
    setIsDeleteOrderModalOpen(false);
  }

  async function handleConfirmDeleteOrder() {
    try {
      setEditError("");
      setEditSuccess("");
      setDeleteLoading(true);
      await deleteOrder(id);
      navigate("/orders");
    } catch (e) {
      console.error(e);
      setEditError(
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Não foi possível excluir a ordem."
      );
    } finally {
      setDeleteLoading(false);
      setIsDeleteOrderModalOpen(false);
    }
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

      {/* mensagens de erro/sucesso da edição */}
      {(editError || editSuccess) && (
        <div className="space-y-2">
          {editError && (
            <p className="text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {editError}
            </p>
          )}
          {editSuccess && (
            <p className="text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {editSuccess}
            </p>
          )}
        </div>
      )}

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
              {formatMoneyBRL(editedTotalAmount)}
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

      {/* Itens da ordem */}
      <section className="space-y-2 sm:space-y-3 mt-2 sm:mt-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">
              Itens desta ordem
            </h2>
            <span className="text-xs sm:text-sm text-gray-500">
              {editMode ? editItems.length : order.items.length} itens
            </span>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 self-start">
              <button
                type="button"
                onClick={() => {
                  setEditError("");
                  setEditSuccess("");
                  setEditMode((prev) => !prev);
                }}
                className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-amber-500 text-amber-700 bg-amber-50 hover:bg-amber-100"
              >
                {editMode ? "Cancelar edição" : "Editar itens"}
              </button>

              <button
                type="button"
                onClick={handleOpenDeleteOrderModal}
                disabled={deleteLoading}
                className="text-xs sm:text-sm text-red-600 hover:text-red-700 px-3 py-2 rounded-xl border border-red-200 hover:bg-red-50 disabled:opacity-60"
              >
                {deleteLoading ? "Excluindo..." : "Excluir ordem"}
              </button>
            </div>
          )}
        </div>

        <OrderItemsTable
          items={editMode ? editItems : order.items}
          editable={isAdmin && editMode}
          onChangeQuantity={handleEditItemQuantityChange}
        />

        {isAdmin && editMode && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleSaveEdits}
              disabled={saving}
              className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-500 hover:border-indigo-500 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        )}
      </section>

      {/* Modal de confirmação para excluir ordem */}
      {isDeleteOrderModalOpen && (
        <DeleteOrderModal
          open={isDeleteOrderModalOpen}
          onClose={handleCloseDeleteOrderModal}
          onConfirm={handleConfirmDeleteOrder}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

/* ===================== TABELA “SOLTA” COM SCROLL E BORDAS RETAS ===================== */

function OrderItemsTable({ items = [], editable = false, onChangeQuantity }) {
  if (!items.length) {
    return (
      <section className="mt-2 sm:mt-3">
        <p className="text-xs sm:text-sm text-gray-500">
          Nenhum item vinculado a esta ordem.
        </p>
      </section>
    );
  }

  // total para o rodapé (já considerando edição, se houver)
  const totalSum = items.reduce((acc, it) => {
    let qtyRaw = editable ? it.quantityInput ?? "" : it.quantity;
    if (!qtyRaw) return acc;
    const numeric = Number(
      qtyRaw.toString().replace(/\./g, "").replace(",", ".")
    );
    if (!numeric || numeric <= 0) return acc;
    return acc + numeric * (it.unitPrice || 0);
  }, 0);

  return (
    <section>
      <div className="w-full overflow-x-auto">
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
            {items.map((it) => {
              const qtyRaw = editable ? it.quantityInput ?? "" : it.quantity;
              const numeric = Number(
                (qtyRaw ?? "")
                  .toString()
                  .replace(/\./g, "")
                  .replace(",", ".")
              );
              const lineTotal =
                !numeric || numeric <= 0
                  ? 0
                  : numeric * (it.unitPrice || 0);

              return (
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
                    {editable ? (
                      <input
                        type="text"
                        className="
                          w-full max-w-[80px]
                          rounded-lg
                          border border-gray-300
                          px-2 py-1
                          text-[11px] sm:text-sm
                          text-right text-gray-800
                          focus:outline-none
                          focus:border-indigo-500
                          focus:ring-0
                        "
                        placeholder="0"
                        value={qtyRaw ?? ""}
                        onChange={(e) =>
                          onChangeQuantity && onChangeQuantity(it.id, e.target.value)
                        }
                      />

                    ) : (
                      it.quantity
                    )}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-right whitespace-nowrap text-gray-700 border-b border-gray-100">
                    {formatMoneyBRL(it.unitPrice)}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-right whitespace-nowrap font-medium text-gray-900 border-b border-gray-100">
                    {formatMoneyBRL(lineTotal)}
                  </td>
                </tr>
              );
            })}
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
                {formatMoneyBRL(totalSum)}
              </td>
            </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ===================== MODAL EXCLUSÃO ORDEM ===================== */

function DeleteOrderModal({ open, onClose, onConfirm, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm px-3 sm:px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
        <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-gray-100 flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">
              Excluir ordem
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-3 inline-flex items-center justify-center rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          >
            <span className="sr-only">Fechar</span>
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 8.586 4.293 2.879A1 1 0 0 0 2.879 4.293L8.586 10l-5.707 5.707a1 1 0 1 0 1.414 1.414L10 11.414l5.707 5.707a1 1 0 0 0 1.414-1.414L11.414 10l5.707-5.707A1 1 0 0 0 15.707 2.88L10 8.586Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="px-4 sm:px-6 pt-4 pb-4 sm:pb-5 space-y-4">
          <p className="text-xs sm:text-sm text-gray-600">
            Tem certeza que deseja excluir esta ordem? Todos os itens vinculados
            serão removidos.
          </p>

          <div className="mt-2 flex flex-col sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs sm:text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl shadow-sm disabled:opacity-60"
            >
              {loading ? "Excluindo..." : "Excluir ordem"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
