// pages/Orders/OrdersListPage.jsx
import { useEffect, useMemo, useState } from "react";
import { listContracts, getContractById } from "../../services/contractsService";
import { createOrder, listOrders } from "../../services/ordersService";

function fmtMoney(v) {
  const num = Number(v);
  if (Number.isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export default function OrdersListPage() {
  const [contracts, setContracts] = useState([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsError, setContractsError] = useState("");

  const [selectedContractId, setSelectedContractId] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractLoading, setContractLoading] = useState(false);

  const [form, setForm] = useState({
    orderType: "ORDEM DE FORNECIMENTO",
    orderNumber: "",
    issueDate: new Date().toISOString().slice(0, 10),
    referencePeriod: "",
    justification: "",
  });

  const [itemsQuantities, setItemsQuantities] = useState({}); // { contractItemId: quantity }

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  // Carrega contratos para o seletor
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setContractsLoading(true);
        const data = await listContracts();
        if (!alive) return;
        setContracts(data || []);
      } catch (e) {
        console.error(e);
        if (alive) setContractsError("Não foi possível carregar os contratos.");
      } finally {
        if (alive) setContractsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Carrega ordens existentes (resumo)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setOrdersLoading(true);
        const data = await listOrders();
        if (!alive) return;
        setOrders(data || []);
      } catch (e) {
        console.error(e);
        if (alive) setOrdersError("Não foi possível carregar as ordens já emitidas.");
      } finally {
        if (alive) setOrdersLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Quando o usuário escolhe um contrato
  async function handleSelectContract(e) {
    const id = e.target.value;
    setSelectedContractId(id);
    setSelectedContract(null);
    setItemsQuantities({});
    setContractLoading(true);

    if (!id) {
      setContractLoading(false);
      return;
    }

    try {
      const data = await getContractById(id);
      setSelectedContract(data);
    } catch (err) {
      console.error(err);
    } finally {
      setContractLoading(false);
    }
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleItemQuantityChange(itemId, value) {
    const raw = value.replace(",", "."); // deixa o usuário escrever 1,5 etc.
    setItemsQuantities((prev) => ({
      ...prev,
      [itemId]: raw,
    }));
  }

  // Calcula total da ordem com base nas quantidades
  const orderTotal = useMemo(() => {
    if (!selectedContract || !Array.isArray(selectedContract.items)) return 0;
    let total = 0;
    for (const it of selectedContract.items) {
      const qStr = itemsQuantities[it.id];
      if (!qStr) continue;
      const q = Number(qStr.toString().replace(/\./g, "").replace(",", "."));
      if (!q || q <= 0) continue;
      const unitPrice = Number(it.unitPrice ?? it.unit_price ?? 0);
      total += q * unitPrice;
    }
    return total;
  }, [selectedContract, itemsQuantities]);

  async function handleCreateOrder(e) {
    e.preventDefault();
    if (!selectedContractId) {
      setCreateError("Selecione um contrato para emitir a ordem.");
      setCreateSuccess("");
      return;
    }

    if (!selectedContract || !Array.isArray(selectedContract.items)) {
      setCreateError("Contrato selecionado inválido.");
      setCreateSuccess("");
      return;
    }

    const itemsPayload = [];
    for (const it of selectedContract.items) {
      const qStr = itemsQuantities[it.id];
      if (!qStr) continue;

      const q = Number(qStr.toString().replace(/\./g, "").replace(",", "."));
      if (!q || q <= 0) continue;

      itemsPayload.push({
        contractItemId: it.id,
        quantity: qStr,
      });
    }

    if (!itemsPayload.length) {
      setCreateError("Informe a quantidade para pelo menos um item.");
      setCreateSuccess("");
      return;
    }

    setCreating(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      const payload = {
        contractId: selectedContractId,
        orderType: form.orderType,
        orderNumber: form.orderNumber || null,
        issueDate: form.issueDate || null,
        referencePeriod: form.referencePeriod || null,
        justification: form.justification || null,
        items: itemsPayload,
      };

      const created = await createOrder(payload);

      setCreateSuccess(
        created.orderNumber
          ? `Ordem ${created.orderNumber} criada com sucesso.`
          : "Ordem criada com sucesso."
      );
      setCreateError("");

      // limpa quantidades, mas mantém contrato selecionado
      setItemsQuantities({});

      // recarrega lista de ordens
      try {
        setOrdersLoading(true);
        const data = await listOrders();
        setOrders(data || []);
      } finally {
        setOrdersLoading(false);
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error ||
        "Não foi possível criar a ordem. Verifique os dados e tente novamente.";
      setCreateError(msg);
      setCreateSuccess("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Emissão de ordens
          </h1>
          <p className="text-xs text-gray-500">
            Selecione um contrato, escolha os itens e gere a ordem (fornecimento, serviço, etc.).
          </p>
        </div>
      </div>

      {/* Seletor de contrato + formulário da ordem */}
      <section className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Seleção de contrato */}
        <div className="space-y-2">
          <label className="block text-[11px] font-medium text-gray-600 mb-1">
            Contrato
          </label>
          <select
            className="w-full max-w-md rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedContractId}
            onChange={handleSelectContract}
          >
            <option value="">Selecione um contrato</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.number || c.numero} — {c.supplier || c.fornecedor}
              </option>
            ))}
          </select>
          {contractsLoading && (
            <p className="text-xs text-gray-500">Carregando contratos...</p>
          )}
          {contractsError && (
            <p className="text-xs text-red-600">{contractsError}</p>
          )}
        </div>

        {/* Formulário da ordem */}
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Tipo de ordem
              </label>
              <select
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.orderType}
                onChange={(e) => handleFormChange("orderType", e.target.value)}
              >
                <option value="ORDEM DE FORNECIMENTO">
                  Ordem de fornecimento
                </option>
                <option value="ORDEM DE SERVIÇO">Ordem de serviço</option>
                <option value="ORDEM">Outro (genérico)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Número da ordem
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: OF 001/2025"
                value={form.orderNumber}
                onChange={(e) =>
                  handleFormChange("orderNumber", e.target.value)
                }
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Data de emissão
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.issueDate}
                onChange={(e) =>
                  handleFormChange("issueDate", e.target.value)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Período de referência
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: Janeiro/2025"
                value={form.referencePeriod}
                onChange={(e) =>
                  handleFormChange("referencePeriod", e.target.value)
                }
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Finalidade / Justificativa
              </label>
              <textarea
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                placeholder="Descreva a finalidade da ordem..."
                value={form.justification}
                onChange={(e) =>
                  handleFormChange("justification", e.target.value)
                }
              />
            </div>
          </div>

          {/* Tabela de itens do contrato */}
          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">
                Itens do contrato
              </p>
              <p className="text-xs text-gray-500">
                Informe a quantidade para os itens que farão parte da ordem.
              </p>
            </div>

            {contractLoading ? (
              <p className="text-xs text-gray-500">
                Carregando itens do contrato...
              </p>
            ) : !selectedContract ? (
              <p className="text-xs text-gray-500">
                Selecione um contrato para visualizar os itens.
              </p>
            ) : !selectedContract.items ||
            selectedContract.items.length === 0 ? (
              <p className="text-xs text-gray-500">
                Este contrato não possui itens cadastrados.
              </p>
            ) : (
              <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-gray-50">
                <table className="min-w-full text-xs sm:text-sm border-separate border-spacing-y-1">
                  <thead>
                  <tr className="bg-gray-100 text-[11px] text-gray-600 uppercase tracking-wide">
                    <th className="px-3 py-2 text-left">Item</th>
                    <th className="px-3 py-2 text-left">Descrição</th>
                    <th className="px-3 py-2 text-left">Unid.</th>
                    <th className="px-3 py-2 text-right">Qtd contrato</th>
                    <th className="px-3 py-2 text-right">Qtd p/ ordem</th>
                    <th className="px-3 py-2 text-right">V. Unit.</th>
                    <th className="px-3 py-2 text-right">V. Total (ordem)</th>
                  </tr>
                  </thead>
                  <tbody>
                  {selectedContract.items.map((it, idx) => {
                    const qStr = itemsQuantities[it.id] || "";
                    const qNum = Number(
                      qStr.toString().replace(/\./g, "").replace(",", ".")
                    );
                    const unitPrice = Number(
                      it.unitPrice ?? it.unit_price ?? 0
                    );
                    const totalLine =
                      !qNum || qNum <= 0 ? 0 : qNum * unitPrice;

                    return (
                      <tr
                        key={it.id ?? `${idx}-${it.itemNo ?? it.item_no ?? ""}`}
                        className="bg-white"
                      >
                        <td className="px-3 py-2 text-gray-700">
                          {it.itemNo ?? it.item_no ?? idx + 1}
                        </td>
                        <td className="px-3 py-2 text-gray-800 max-w-[260px] whitespace-nowrap overflow-hidden text-ellipsis">
                          {it.description}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {it.unit}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {it.quantity}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="text"
                            className="w-24 text-right rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="0"
                            value={qStr}
                            onChange={(e) =>
                              handleItemQuantityChange(it.id, e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700 tabular-nums">
                          {fmtMoney(unitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-900 font-medium tabular-nums">
                          {fmtMoney(totalLine)}
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                  <tfoot>
                  <tr className="bg-white">
                    <td
                      className="px-3 py-3 text-gray-600 font-medium"
                      colSpan={6}
                    >
                      Total da ordem
                    </td>
                    <td className="px-3 py-3 text-right text-gray-900 font-semibold">
                      {fmtMoney(orderTotal)}
                    </td>
                  </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Feedback e botão */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <div className="space-y-1">
              {createError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {createError}
                </p>
              )}
              {createSuccess && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  {createSuccess}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? "Gerando ordem..." : "Gerar ordem"}
            </button>
          </div>
        </form>
      </section>

      {/* Lista de ordens já emitidas (simples) */}
      <section className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">
            Ordens já emitidas
          </p>
        </div>

        {ordersLoading ? (
          <p className="text-xs text-gray-500">Carregando ordens...</p>
        ) : ordersError ? (
          <p className="text-xs text-red-600">{ordersError}</p>
        ) : !orders.length ? (
          <p className="text-xs text-gray-500">
            Nenhuma ordem emitida até o momento.
          </p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead>
              <tr className="bg-gray-100 text-[11px] text-gray-600 uppercase tracking-wide">
                <th className="px-3 py-2 text-left">Nº ordem</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-left">Contrato</th>
                <th className="px-3 py-2 text-left">Fornecedor</th>
                <th className="px-3 py-2 text-right">Data</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
              </thead>
              <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-900">
                    {o.orderNumber || `Ordem #${o.id}`}
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {o.orderType}
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {o.contractNumber}
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {o.supplier}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {o.issueDate
                      ? new Date(o.issueDate).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900 font-medium">
                    {fmtMoney(o.totalAmount)}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
