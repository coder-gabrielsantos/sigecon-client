import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getContractById,
  updateContract,
  deleteContract,
  updateContractItem,
  deleteContractItem,
} from "../../services/contractsService";
import { getMe } from "../../services/authService";

/** Página de detalhes do contrato */
export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [contract, setContract] = useState(null);

  // role do usuário logado
  const [role, setRole] = useState(null);

  // item selecionado para edição/exclusão
  const [activeItem, setActiveItem] = useState(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);

  // modal de confirmação para excluir contrato
  const [isDeleteContractModalOpen, setIsDeleteContractModalOpen] =
    useState(false);

  // carrega contrato
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getContractById(id);
        if (!alive) return;
        // normaliza datas (YYYY-MM-DD) para <input type="date">
        setContract({
          ...data,
          startDate: normalizeDateForInput(data.startDate || data.start_date),
          endDate: normalizeDateForInput(data.endDate || data.end_date),
        });
      } catch (e) {
        console.error(e);
        if (alive) setError("Não foi possível carregar o contrato.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // carrega role do usuário (ADMIN / OPERADOR)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await getMe();
        if (!alive) return;
        setRole(me?.role || null);
      } catch (e) {
        console.error("Erro ao carregar role do usuário", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const isAdmin = role === "ADMIN";

  const handleChange = (field, value) => {
    setContract((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!contract) return;
    setError("");
    try {
      setSaving(true);
      const payload = {
        number: contract.number,
        supplier: contract.supplier,
        startDate: contract.startDate || null,
        endDate: contract.endDate || null,
      };
      const updated = await updateContract(id, payload);
      // mantém datas normalizadas após retorno
      setContract({
        ...updated,
        startDate: normalizeDateForInput(
          updated.startDate || updated.start_date
        ),
        endDate: normalizeDateForInput(updated.endDate || updated.end_date),
      });
    } catch (e) {
      console.error(e);
      setError("Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteContractModal = () => {
    setIsDeleteContractModalOpen(true);
  };

  const handleCloseDeleteContractModal = () => {
    setIsDeleteContractModalOpen(false);
  };

  const handleConfirmDeleteContract = async () => {
    try {
      setRemoving(true);
      setError("");
      await deleteContract(id);
      navigate("/contracts");
    } catch (e) {
      console.error(e);
      setError("Não foi possível excluir o contrato.");
      setRemoving(false);
      setIsDeleteContractModalOpen(false);
    }
  };

  const handleItemsUpdated = (updatedContract) => {
    setContract({
      ...updatedContract,
      startDate: normalizeDateForInput(
        updatedContract.startDate || updatedContract.start_date
      ),
      endDate: normalizeDateForInput(
        updatedContract.endDate || updatedContract.end_date
      ),
    });
  };

  const handleItemClick = (item) => {
    if (!item) return;
    setActiveItem(item);
    setIsItemModalOpen(true);
  };

  const handleCloseItemModal = () => {
    setIsItemModalOpen(false);
    setActiveItem(null);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <p className="text-xs sm:text-sm text-gray-500">
          Carregando contrato...
        </p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <p className="text-xs sm:text-sm text-red-600">
          Contrato não encontrado.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 lg:space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 leading-tight">
            Detalhes do contrato
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
            Atualize os dados principais, gerencie itens e acompanhe o saldo
            disponível.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/contracts")}
          className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-gray-200 hover:bg-gray-50 self-start"
        >
          Voltar para a lista
        </button>
      </div>

      {/* Resumo financeiro do contrato */}
      <ContractFinancialSummary contract={contract}/>

      {/* Formulário de dados gerais */}
      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-3 sm:p-5 space-y-4"
      >
        {error && (
          <p className="text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
              Número do contrato
            </label>
            <input
              type="text"
              value={contract.number || ""}
              onChange={(e) => handleChange("number", e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
              Fornecedor
            </label>
            <input
              type="text"
              value={contract.supplier || ""}
              onChange={(e) => handleChange("supplier", e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
              Início
            </label>
            <input
              type="date"
              value={contract.startDate || ""}
              onChange={(e) => handleChange("startDate", e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
              Fim
            </label>
            <input
              type="date"
              value={contract.endDate || ""}
              onChange={(e) => handleChange("endDate", e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
          <button
            type="button"
            onClick={handleOpenDeleteContractModal}
            disabled={removing}
            className="text-xs sm:text-sm text-red-600 hover:text-red-700 px-3 py-2 rounded-xl border border-red-200 hover:bg-red-50 disabled:opacity-60 w-full sm:w-auto text-center"
          >
            {removing ? "Excluindo..." : "Excluir contrato"}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl shadow-sm disabled:opacity-60 w-full sm:w-auto"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>

      {/* Form para ADICIONAR novo item (apenas ADMIN) */}
      <ContractItemForm
        contractId={id}
        onUpdated={handleItemsUpdated}
        isAdmin={isAdmin}
      />

      {/* Tabela “solta” no final da página */}
      <ContractItemsTable items={contract.items} onItemClick={handleItemClick}/>

      {/* Modal moderno para atualizar / excluir item */}
      {activeItem && isItemModalOpen && (
        <ContractItemModal
          open={isItemModalOpen}
          item={activeItem}
          onClose={handleCloseItemModal}
          isAdmin={isAdmin}
          contractId={id}
          onUpdated={handleItemsUpdated}
        />
      )}

      {/* Modal de confirmação para excluir contrato */}
      {isDeleteContractModalOpen && (
        <DeleteContractModal
          open={isDeleteContractModalOpen}
          onClose={handleCloseDeleteContractModal}
          onConfirm={handleConfirmDeleteContract}
          loading={removing}
        />
      )}
    </div>
  );
}

/* ===================== RESUMO FINANCEIRO ===================== */

function ContractFinancialSummary({ contract }) {
  if (!contract) return null;

  const { totalGeral } = prepareContractItems(contract.items || []);
  const total = totalGeral;

  const usedRaw = contract.usedAmount ?? contract.used_amount;
  const used = usedRaw != null ? num(usedRaw) ?? 0 : 0;

  const remainingRaw = contract.remainingAmount ?? contract.remaining_amount;
  const remaining =
    remainingRaw != null ? num(remainingRaw) ?? 0 : total - used;

  return (
    <section className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-3 sm:p-5 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Resumo financeiro
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Visão geral do valor contratado, uso e saldo disponível.
          </p>
        </div>
      </div>

      <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:divide-x sm:divide-gray-200">
        <div className="flex-1 space-y-1 text-left pb-2 sm:pb-0 sm:pr-4">
          <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
            Valor total do contrato
          </p>
          <p className="text-sm sm:text-base font-semibold text-gray-900">
            {fmtMoney(total)}
          </p>
        </div>

        <div className="flex-1 space-y-1 text-left sm:text-center py-2 sm:px-4">
          <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
            Valor utilizado
          </p>
          <p className="text-sm sm:text-base font-semibold text-gray-900">
            {fmtMoney(used)}
          </p>
        </div>

        <div className="flex-1 space-y-1 text-left sm:text-right pt-2 sm:pt-0 sm:pl-4">
          <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
            Saldo restante
          </p>
          <p className="text-sm sm:text-base font-semibold text-gray-900">
            {fmtMoney(remaining)}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ===================== FORM DE ITEM (APENAS ADICIONAR) ===================== */
/**
 * Agora:
 * - Este container serve apenas para ADICIONAR um novo item ao contrato.
 * - Apenas ADMIN pode adicionar novos itens.
 * - Para atualizar ou excluir, o usuário clica no item da tabela e usa o modal.
 */
function ContractItemForm({ contractId, onUpdated, isAdmin }) {
  const [form, setForm] = useState({
    description: "",
    unit: "",
    quantity: "",
    unitPrice: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isAdmin) {
    // Operador não adiciona itens; apenas atualiza via modal
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const description = form.description.trim();
    const unit = form.unit.trim();
    const qNum = form.quantity.trim() !== "" ? num(form.quantity) : null;
    const vuNum = form.unitPrice.trim() !== "" ? num(form.unitPrice) : null;

    if (!description || !unit || qNum == null || vuNum == null) {
      setError(
        "Preencha descrição, unidade, quantidade e valor unitário para adicionar um novo item."
      );
      return;
    }

    const payload = {
      description,
      unit,
      quantity: qNum,
      unitPrice: vuNum,
      totalPrice: qNum * vuNum,
    };

    try {
      setLoading(true);
      const updatedContract = await updateContractItem(contractId, payload);
      setSuccess("Novo item adicionado ao contrato.");
      setForm({
        description: "",
        unit: "",
        quantity: "",
        unitPrice: "",
      });
      setTimeout(() => setSuccess(""), 2500);
      onUpdated?.(updatedContract);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Não foi possível adicionar o item.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-3 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Itens do contrato — adicionar novo item
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Adicione novos itens ao contrato. Para atualizar ou excluir, clique
            em um item na tabela abaixo.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-12">
          {/* Descrição */}
          <div className="space-y-1 sm:col-span-6">
            <label className="text-[11px] sm:text-xs font-medium text-gray-600">
              Descrição
            </label>
            <input
              name="description"
              type="text"
              value={form.description}
              onChange={handleChange}
              placeholder="Ex: Tubo PVC soldável 50mm..."
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Unidade */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] sm:text-xs font-medium text-gray-600">
              Unidade
            </label>
            <input
              name="unit"
              type="text"
              value={form.unit}
              onChange={handleChange}
              placeholder="UN, CJ"
              className="w-full rounded-xl border border-gray-300 px-2.5 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quantidade */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] sm:text-xs font-medium text-gray-600">
              Quantidade
            </label>
            <input
              name="quantity"
              type="text"
              value={form.quantity}
              onChange={handleChange}
              placeholder="Ex: 100"
              className="w-full rounded-xl border border-gray-300 px-2.5 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* V. unitário */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[11px] sm:text-xs font-medium text-gray-600">
              V. unitário
            </label>
            <input
              name="unitPrice"
              type="text"
              value={form.unitPrice}
              onChange={handleChange}
              placeholder="Ex: 1234,56"
              className="w-full rounded-xl border border-gray-300 px-2.5 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="text-xs sm:text-sm text-emerald-700 bg-emerald-50 border-emerald-200 border rounded-lg px-3 py-2">
            {success}
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <button
            type="submit"
            disabled={loading}
            className="text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl shadow-sm disabled:opacity-60 w-full sm:w-auto"
          >
            {loading ? "Adicionando item..." : "Adicionar item"}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ===================== MODAL DE ITEM (ATUALIZAR / EXCLUIR) ===================== */

function ContractItemModal({
                             open,
                             item,
                             onClose,
                             isAdmin,
                             contractId,
                             onUpdated,
                           }) {
  const [form, setForm] = useState({
    description: "",
    unit: "",
    quantity: "",
    unitPrice: "",
  });
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!item) return;
    setForm({
      description: item.description ?? "",
      unit: item.unit ?? "",
      quantity:
        item.quantity != null && item.quantity !== ""
          ? String(item.quantity)
          : "",
      unitPrice:
        item.unitPrice != null
          ? String(item.unitPrice)
          : item.unit_price != null
            ? String(item.unit_price)
            : "",
    });
    setError("");
    setSuccess("");
  }, [item]);

  if (!open || !item) return null;

  const itemNo = getItemNo(item);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!itemNo) {
      setError("Não foi possível identificar o número do item.");
      return;
    }

    const payload = { itemNo };

    const qNum =
      form.quantity.trim() !== "" ? num(form.quantity.trim()) : null;
    const vuNum =
      form.unitPrice.trim() !== "" ? num(form.unitPrice.trim()) : null;

    if (!isAdmin) {
      // OPERADOR: só pode alterar QUANTIDADE
      if (qNum == null) {
        setError("Informe a nova quantidade para atualizar o item.");
        return;
      }
      payload.quantity = qNum;
    } else {
      // ADMIN: pode alterar todos os campos
      const description = form.description.trim();
      const unit = form.unit.trim();
      if (description) payload.description = description;
      if (unit) payload.unit = unit;
      if (qNum != null) payload.quantity = qNum;
      if (vuNum != null) payload.unitPrice = vuNum;
      if (qNum != null && vuNum != null) {
        payload.totalPrice = qNum * vuNum;
      }
    }

    try {
      setLoadingUpdate(true);
      const updatedContract = await updateContractItem(contractId, payload);
      setSuccess("Item atualizado com sucesso.");
      onUpdated?.(updatedContract);
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Não foi possível atualizar o item.";
      setError(msg);
    } finally {
      setLoadingUpdate(false);
    }
  };

  const handleDelete = async () => {
    setError("");
    setSuccess("");

    if (!isAdmin) {
      setError("Apenas administradores podem excluir itens do contrato.");
      return;
    }

    if (!itemNo) {
      setError("Não foi possível identificar o número do item para excluir.");
      return;
    }

    try {
      setLoadingDelete(true);
      const updatedContract = await deleteContractItem(contractId, itemNo);
      setSuccess("Item removido com sucesso.");
      onUpdated?.(updatedContract);
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Não foi possível remover o item.";
      setError(msg);
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm px-3 sm:px-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
        {/* header */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 pb-3 border-b border-gray-100">
          <div className="space-y-1">
            <p className="text-[11px] sm:text-xs font-medium text-indigo-600 uppercase tracking-wide">
              Item {itemNo ?? ""}
            </p>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">
              Detalhes do item
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              Atualize a quantidade ou demais campos. Para excluir, use o botão
              abaixo.
            </p>
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

        {/* body */}
        <form
          onSubmit={handleUpdate}
          className="px-4 sm:px-6 pt-4 pb-4 sm:pb-5 space-y-4"
        >
          <div className="grid gap-3 sm:grid-cols-12">
            {/* descrição - linha inteira */}
            <div className="space-y-1 sm:col-span-12">
              <label className="text-[11px] sm:text-xs font-medium text-gray-600">
                Descrição
              </label>
              <input
                name="description"
                type="text"
                value={form.description}
                onChange={handleChange}
                disabled={!isAdmin}
                className={`w-full rounded-xl border border-gray-300 px-3 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  !isAdmin ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              />
            </div>

            {/* segunda linha: os 3 campos lado a lado */}
            <div className="space-y-1 sm:col-span-4">
              <label className="text-[11px] sm:text-xs font-medium text-gray-600">
                Unidade
              </label>
              <input
                name="unit"
                type="text"
                value={form.unit}
                onChange={handleChange}
                disabled={!isAdmin}
                className={`w-full rounded-xl border border-gray-300 px-2.5 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  !isAdmin ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              />
            </div>

            <div className="space-y-1 sm:col-span-4">
              <label className="text-[11px] sm:text-xs font-medium text-gray-600">
                Quantidade
              </label>
              <input
                name="quantity"
                type="text"
                value={form.quantity}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-2.5 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-4">
              <label className="text-[11px] sm:text-xs font-medium text-gray-600">
                V. unitário
              </label>
              <input
                name="unitPrice"
                type="text"
                value={form.unitPrice}
                onChange={handleChange}
                disabled={!isAdmin}
                className={`w-full rounded-xl border border-gray-300 px-2.5 py-2 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  !isAdmin ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          {/* footer */}
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loadingDelete}
                  className="text-xs sm:text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl shadow-sm disabled:opacity-60"
                >
                  {loadingDelete ? "Excluindo..." : "Excluir item"}
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="text-xs sm:text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loadingUpdate}
                className="text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl shadow-sm disabled:opacity-60"
              >
                {loadingUpdate ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===================== MODAL EXCLUSÃO CONTRATO ===================== */

function DeleteContractModal({ open, onClose, onConfirm, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm px-3 sm:px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
        <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-gray-100 flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">
              Excluir contrato
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
            Tem certeza que deseja excluir este contrato? Todos os itens
            vinculados serão removidos.
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
              {loading ? "Excluindo..." : "Excluir contrato"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== TABELA “SOLTA” COM SCROLL E BORDAS RETAS ===================== */

function ContractItemsTable({ items = [], onItemClick }) {
  const { sortedItems, totalGeral } = prepareContractItems(items);

  return (
    <div className="space-y-2 sm:space-y-3 mt-2 sm:mt-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Itens do contrato
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Clique em um item para atualizar ou excluir.
          </p>
        </div>
        <span className="text-xs sm:text-sm text-gray-500">
          {sortedItems.length} itens
        </span>
      </div>

      {/* container ÚNICO com scroll + borda em volta da lista */}
      <div
        className="
          w-full
          max-h-80 sm:max-h-96
          overflow-auto
          border border-gray-200
          scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-gray-300
          hover:scrollbar-thumb-gray-400
        "
      >
        <table className="min-w-full text-[11px] sm:text-sm border-separate border-spacing-0">
          <thead className="bg-indigo-50 text-indigo-700 uppercase text-[10px] sm:text-xs sticky top-0 z-20">
          <tr>
            <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-left border-b border-gray-200">
              Item
            </th>
            <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-left border-b border-gray-200">
              Descrição
            </th>
            <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-left border-b border-gray-200">
              Unid.
            </th>
            <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-right border-b border-gray-200">
              Qtd
            </th>
            <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-right border-b border-gray-200">
              V. Unit.
            </th>
            <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-right border-b border-gray-200">
              V. Total
            </th>
          </tr>
          </thead>

          <tbody>
          {sortedItems.map((it, i) => (
            <tr
              key={it.id ?? `${i}-${it.itemNo ?? it.item_no ?? ""}`}
              className="bg-white odd:bg-white even:bg-gray-50 cursor-pointer hover:bg-indigo-50/60 transition-colors"
              onClick={() => onItemClick?.(it)}
            >
              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-700 whitespace-nowrap border-b border-gray-100">
                {displayItemNo(it, i)}
              </td>
              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-800 max-w-[220px] sm:max-w-[320px] whitespace-nowrap overflow-hidden text-ellipsis border-b border-gray-100">
                {it.description}
              </td>
              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-700 whitespace-nowrap border-b border-gray-100">
                {it.unit}
              </td>
              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-right tabular-nums text-gray-700 whitespace-nowrap border-b border-gray-100">
                {fmtNum(it.quantity)}
              </td>
              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-right tabular-nums text-gray-700 whitespace-nowrap border-b border-gray-100">
                {fmtMoney(it.unitPrice ?? it.unit_price)}
              </td>
              <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-right tabular-nums font-medium text-gray-900 whitespace-nowrap border-b border-gray-100">
                {fmtMoney(it.totalPrice ?? it.total_price)}
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
              {fmtMoney(totalGeral)}
            </td>
          </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ===================== HELPERS ===================== */

function prepareContractItems(items = []) {
  const validItems = (items || []).filter((raw) => {
    const desc = String(raw.description ?? "").trim();
    if (!desc) return false;

    if (/^total\b/i.test(desc) || /\btotal\b/i.test(desc)) return false;

    const q = num(raw.quantity);
    const vu = num(raw.unitPrice ?? raw.unit_price);
    const vt = num(raw.totalPrice ?? raw.total_price);

    if ((q === null || q === 0) && (vu === null || vu === 0) && vt !== null) {
      return false;
    }

    const nums = [q, vu, vt].filter((n) => n !== null);
    if (nums.length === 0) return false;
    if (nums.every((n) => n === 0)) return false;

    return true;
  });

  const sortedItems = [...validItems].sort((a, b) => {
    const A = getItemNo(a);
    const B = getItemNo(b);
    if (A === null && B === null) return 0;
    if (A === null) return 1;
    if (B === null) return -1;
    return A - B;
  });

  const totalGeral = sortedItems.reduce(
    (s, it) => s + (num(it.totalPrice ?? it.total_price) || 0),
    0
  );

  return { sortedItems, totalGeral };
}

function normalizeDateForInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parser BR para números e BRL */
function sanitize(str) {
  return String(str ?? "").replace(/\s+/g, "").replace(/R\$/gi, "");
}

function num(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  const raw = sanitize(v);

  if (/^\d{1,3}(\.\d{3})+,\d{2}$/.test(raw))
    return Number(raw.replace(/\./g, "").replace(",", "."));
  if (/^\d+,\d{2}$/.test(raw)) return Number(raw.replace(",", "."));
  if (/^\d+\.\d{2}$/.test(raw)) return Number(raw);
  if (/^\d+$/.test(raw)) return Number(raw);

  const n = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

function fmtNum(v) {
  const n = num(v);
  if (n === null) return "";
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

function fmtMoney(v) {
  const n = num(v) ?? 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** ITEM usando item_no do banco (fallback: índice) */
function getItemNo(it) {
  const raw = it.itemNo ?? it.item_no;
  if (raw === null || raw === undefined) return null;
  const digits = String(raw).match(/\d+/)?.[0];
  const n = digits !== undefined ? Number(digits) : Number(raw);
  return Number.isNaN(n) ? null : n;
}

function displayItemNo(it, idx) {
  const n = getItemNo(it);
  return n ?? idx + 1;
}
