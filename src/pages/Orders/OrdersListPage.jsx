import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import {
  listContractsSummary,
  getContractById,
} from "../../services/contractsService";
import { createOrder, listOrders } from "../../services/ordersService";

function formatMoneyBRL(v) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

const ORDER_TYPES = [
  { value: "FORNECIMENTO", label: "Ordem de fornecimento" },
  { value: "SERVICO", label: "Ordem de serviço" },
  { value: "OUTRO", label: "Outro tipo de ordem" },
];

export default function OrdersListPage() {
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loadingContracts, setLoadingContracts] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");

  // formulário
  const [selectedContract, setSelectedContract] = useState(null);
  const [orderType, setOrderType] = useState(ORDER_TYPES[0]);
  const [issueDate, setIssueDate] = useState("");
  const [justification, setJustification] = useState("");
  const [contractItems, setContractItems] = useState([]);

  // quantidade digitada por item da ordem (id -> string)
  const [itemsQuantities, setItemsQuantities] = useState({});

  // -------------------------
  // Carregamento inicial
  // -------------------------
  useEffect(() => {
    let alive = true;

    async function loadContracts() {
      try {
        setLoadingContracts(true);
        const data = await listContractsSummary();
        if (!alive) return;

        const list = (data || []).map((api) => ({
          id: api.id,
          numero: api.number || api.numero || "Contrato",
          fornecedor: api.supplier || api.fornecedor || "—",
          totalAmount: Number(api.totalAmount ?? 0),
          usedAmount: Number(api.usedAmount ?? 0),
          remainingAmount: Number(
            api.remainingAmount ??
            Number(api.totalAmount ?? 0) - Number(api.usedAmount ?? 0)
          ),
        }));

        setContracts(list);
      } catch (e) {
        console.error(e);
        if (alive) setError("Não foi possível carregar os contratos.");
      } finally {
        if (alive) setLoadingContracts(false);
      }
    }

    async function loadOrders() {
      try {
        setLoadingOrders(true);
        const data = await listOrders();
        if (!alive) return;

        setOrders(
          (data || []).map((o) => ({
            id: o.id,
            numero: o.orderNumber || `Ordem #${o.id}`,
            tipo: o.orderType,
            contratoNumero: o.contractNumber,
            fornecedor: o.supplier,
            data: o.issueDate
              ? new Date(o.issueDate).toLocaleDateString("pt-BR")
              : "—",
            total: Number(o.totalAmount ?? 0),
          }))
        );
      } catch (e) {
        console.error(e);
        if (alive) setError("Não foi possível carregar as ordens.");
      } finally {
        if (alive) setLoadingOrders(false);
      }
    }

    loadContracts();
    loadOrders();

    return () => {
      alive = false;
    };
  }, []);

  // -------------------------
  // Opções do react-select
  // -------------------------
  const contractOptions = useMemo(
    () =>
      contracts.map((c) => ({
        value: c.id,
        label: c.numero, // apenas o nome/numero do contrato
      })),
    [contracts]
  );

  // -------------------------
  // Quando seleciona contrato, busca itens
  // -------------------------
  useEffect(() => {
    async function loadItems() {
      if (!selectedContract) {
        setContractItems([]);
        setItemsQuantities({});
        return;
      }

      try {
        setItemsLoading(true);
        setError("");
        const data = await getContractById(selectedContract.value);

        const items = (data.items || []).map((it) => ({
          id: it.id,
          itemNo: it.itemNo ?? it.item_no,
          description: it.description,
          unit: it.unit,
          contractQuantity: Number(it.quantity ?? 0), // total contratado
          availableQuantity: Number(
            it.availableQuantity ?? it.available_quantity ?? it.quantity ?? 0
          ),
          unitPrice: Number(it.unitPrice ?? it.unit_price ?? 0),
          totalPrice: Number(it.totalPrice ?? it.total_price ?? 0),
        }));

        setContractItems(items);
        setItemsQuantities({});
      } catch (e) {
        console.error(e);
        setError("Não foi possível carregar os itens do contrato.");
      } finally {
        setItemsLoading(false);
      }
    }

    loadItems();
  }, [selectedContract]);

  // -------------------------
  // Quantidade por item + total da ordem
  // -------------------------
  function handleItemQuantityChange(id, value) {
    if (value === "") {
      setItemsQuantities((prev) => ({
        ...prev,
        [id]: "",
      }));
      return;
    }

    const numeric = Number(
      value.toString().replace(/\./g, "").replace(",", ".")
    );

    const item = contractItems.find((it) => it.id === id);
    const available = item?.availableQuantity ?? null;

    let finalQty = numeric;

    if (!Number.isFinite(numeric) || numeric <= 0) {
      finalQty = "";
    } else if (available != null && numeric > available) {
      finalQty = available;
    }

    setItemsQuantities((prev) => ({
      ...prev,
      [id]: finalQty === "" ? "" : String(Math.floor(finalQty)),
    }));
  }

  const orderTotal = useMemo(() => {
    let total = 0;
    for (const it of contractItems) {
      const qStr = itemsQuantities[it.id];
      if (!qStr) continue;

      const numeric = Number(
        qStr.toString().replace(/\./g, "").replace(",", ".")
      );
      if (!numeric || numeric <= 0) continue;

      total += numeric * (it.unitPrice || 0);
    }
    return total;
  }, [contractItems, itemsQuantities]);

  // -------------------------
  // Emitir ordem
  // -------------------------
  async function handleCreateOrder(e) {
    e.preventDefault();
    setError("");

    if (!selectedContract) {
      setError("Selecione um contrato.");
      return;
    }
    if (!issueDate) {
      setError("Informe a data de emissão.");
      return;
    }

    const itemsPayload = [];
    for (const it of contractItems) {
      const qStr = itemsQuantities[it.id];
      if (!qStr) continue;

      const numeric = Number(
        qStr.toString().replace(/\./g, "").replace(",", ".")
      );
      if (!numeric || numeric <= 0) continue;

      itemsPayload.push({
        contractItemId: it.id,
        quantity: qStr,
      });
    }

    if (!itemsPayload.length) {
      setError("Informe a quantidade para pelo menos um item.");
      return;
    }

    try {
      setCreating(true);

      const payload = {
        contractId: selectedContract.value,
        orderType: orderType.value,
        issueDate,
        justification: justification.trim() || null,
        items: itemsPayload,
      };

      await createOrder(payload);

      // limpa form
      setJustification("");
      setIssueDate("");
      setItemsQuantities({});
      setOrderType(ORDER_TYPES[0]);

      // recarrega ordens e contratos (para atualizar saldo)
      const [contractsNew, ordersNew] = await Promise.all([
        listContractsSummary(),
        listOrders(),
      ]);

      setContracts(
        (contractsNew || []).map((api) => ({
          id: api.id,
          numero: api.number || api.numero || "Contrato",
          fornecedor: api.supplier || api.fornecedor || "—",
          totalAmount: Number(api.totalAmount ?? 0),
          usedAmount: Number(api.usedAmount ?? 0),
          remainingAmount: Number(
            api.remainingAmount ??
            Number(api.totalAmount ?? 0) - Number(api.usedAmount ?? 0)
          ),
        }))
      );

      setOrders(
        (ordersNew || []).map((o) => ({
          id: o.id,
          numero: o.orderNumber || `Ordem #${o.id}`,
          tipo: o.orderType,
          contratoNumero: o.contractNumber,
          fornecedor: o.contractSupplier,
          data: o.issueDate
            ? new Date(o.issueDate).toLocaleDateString("pt-BR")
            : "—",
          total: Number(o.totalAmount ?? 0),
        }))
      );

      // recarrega itens do contrato selecionado para atualizar a quantidade disponível
      if (selectedContract) {
        try {
          const updatedContract = await getContractById(selectedContract.value);

          const updatedItems = (updatedContract.items || []).map((it) => ({
            id: it.id,
            itemNo: it.itemNo ?? it.item_no,
            description: it.description,
            unit: it.unit,
            contractQuantity: Number(it.quantity ?? 0),
            availableQuantity: Number(
              it.availableQuantity ??
              it.available_quantity ??
              it.quantity ??
              0
            ),
            unitPrice: Number(it.unitPrice ?? it.unit_price ?? 0),
            totalPrice: Number(it.totalPrice ?? it.total_price ?? 0),
          }));

          setContractItems(updatedItems);
          setItemsQuantities({});
        } catch (e) {
          console.error("Erro ao recarregar itens do contrato", e);
        }
      }
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Erro ao emitir a ordem.");
    } finally {
      setCreating(false);
    }
  }

  // -------------------------
  // Estilo do react-select
  // -------------------------
  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: 40,
      borderRadius: 9999,
      borderColor: "#d1d5db",
      boxShadow: "none",
      "&:hover": { borderColor: "#4f46e5" },
      fontSize: "0.875rem",
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "2px 12px",
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: 40,
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 0,
      zIndex: 30,
      fontSize: "0.875rem",
    }),
  };

  const smallButtonClasses =
    "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1";

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 lg:space-y-8">
      {/* CABEÇALHO */}
      <header className="space-y-1">
        <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">
          Ordens vinculadas a contratos
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Emita ordens de fornecimento ou serviço a partir de um contrato já
          cadastrado. O valor é debitado automaticamente do saldo do contrato.
        </p>
      </header>

      {/* ALERTA DE ERRO */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CARD DE EMISSÃO */}
      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-3 sm:p-5 space-y-4 sm:space-y-5">
        {/* TÍTULO */}
        <div className="space-y-1">
          <p className="text-sm sm:text-base font-semibold text-gray-900">
            Emitir nova ordem
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            Escolha o contrato, o tipo de ordem, os itens e a finalidade.
          </p>
        </div>

        <form className="space-y-4 sm:space-y-5" onSubmit={handleCreateOrder}>
          {/* LINHA 1: contrato / tipo / data */}
          <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-[11px] sm:text-xs font-medium text-gray-700">
                Contrato vinculado
              </label>
              <Select
                options={contractOptions}
                value={selectedContract}
                onChange={setSelectedContract}
                isLoading={loadingContracts}
                placeholder="Selecione um contrato..."
                classNamePrefix="react-select"
                styles={selectStyles}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] sm:text-xs font-medium text-gray-700">
                Tipo de ordem
              </label>
              <Select
                options={ORDER_TYPES}
                value={orderType}
                onChange={setOrderType}
                classNamePrefix="react-select"
                styles={selectStyles}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="issueDate"
                className="text-[11px] sm:text-xs font-medium text-gray-700"
              >
                Data da emissão
              </label>
              <input
                id="issueDate"
                type="date"
                className="w-full rounded-full border border-gray-300 px-3 text-xs sm:text-sm h-9 sm:h-10 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
          </div>

          {/* FINALIDADE */}
          <div className="space-y-1">
            <label
              htmlFor="justification"
              className="text-[11px] sm:text-xs font-medium text-gray-700"
            >
              Finalidade / Justificativa
            </label>
            <input
              id="justification"
              type="text"
              className="w-full rounded-full border border-gray-300 px-3 text-xs sm:text-sm h-9 sm:h-10 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Descreva a finalidade da ordem (ex.: aquisição de materiais de construção...)"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </div>

          {/* ITENS DO CONTRATO */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
              <p className="text-sm sm:text-base font-semibold text-gray-900">
                Itens deste contrato
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Informe a quantidade para cada item que fará parte da ordem.
              </p>
            </div>

            {!selectedContract && (
              <p className="text-xs sm:text-sm text-gray-500">
                Selecione um contrato para visualizar os itens.
              </p>
            )}

            {selectedContract && itemsLoading && (
              <p className="text-xs sm:text-sm text-gray-500">
                Carregando itens do contrato...
              </p>
            )}

            {selectedContract &&
              !itemsLoading &&
              contractItems.length === 0 && (
                <p className="text-xs sm:text-sm text-gray-500">
                  Nenhum item cadastrado neste contrato.
                </p>
              )}

            {selectedContract &&
              !itemsLoading &&
              contractItems.length > 0 && (
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
                  <table className="min-w-[900px] text-[11px] sm:text-sm border-separate border-spacing-0">
                    <thead className="bg-indigo-50 text-indigo-700 uppercase text-[10px] sm:text-xs sticky top-0 z-20">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-left border-b border-gray-200">
                        Item
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-left border-b border-gray-200">
                        Descrição
                      </th>
                      <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-right border-b border-gray-200 whitespace-nowrap">
                        Qtd disponível
                      </th>
                      {/* Qtd p/ ordem MAIS ESTREITA */}
                      <th className="w-20 sm:w-24 px-2 sm:px-3 py-2 sm:py-2.5 text-right border-b border-gray-200 whitespace-nowrap">
                        Qtd p/ ordem
                      </th>
                      {/* V. total (ordem) COM MAIS ESPAÇO */}
                      <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-right border-b border-gray-200 whitespace-nowrap">
                        V. unit.
                      </th>
                      <th className="min-w-[120px] sm:min-w-[150px] px-2 sm:px-3 py-2 sm:py-2.5 text-right border-b border-gray-200 whitespace-nowrap">
                        V. total
                      </th>
                    </tr>
                    </thead>
                    <tbody>
                    {contractItems
                      .filter((it) => (it.description || "").trim() !== "")
                      .map((it) => {
                        const qStr = itemsQuantities[it.id] || "";
                        const numeric = Number(
                          qStr.toString().replace(/\./g, "").replace(",", ".")
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
                            <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-right text-gray-700 whitespace-nowrap border-b border-gray-100">
                              {it.availableQuantity}
                            </td>
                            {/* TD da Qtd p/ ordem com menos espaço */}
                            <td className="w-20 sm:w-24 px-2 sm:px-3 py-2 sm:py-2.5 text-right whitespace-nowrap border-b border-gray-100">
                              <input
                                type="text"
                                className="w-full rounded-lg border border-gray-300 px-2 py-1 text-[11px] sm:text-sm text-right text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="0"
                                value={qStr}
                                onChange={(e) =>
                                  handleItemQuantityChange(it.id, e.target.value)
                                }
                              />
                            </td>
                            <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-right text-gray-700 whitespace-nowrap border-b border-gray-100">
                              {formatMoneyBRL(it.unitPrice)}
                            </td>
                            {/* TD da V. total (ordem) com mais espaço */}
                            <td className="min-w-[120px] sm:min-w-[150px] px-2 sm:px-3 py-2 sm:py-2.5 text-right font-medium text-gray-900 whitespace-nowrap border-b border-gray-100">
                              {formatMoneyBRL(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
          </div>

          {/* TOTAL + BOTÃO EMITIR */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100">
            <div className="space-y-1">
              <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total da ordem
              </p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">
                {formatMoneyBRL(orderTotal)}
              </p>
              {selectedContract && (
                <p className="text-[11px] sm:text-xs text-gray-500">
                  Este valor será debitado do saldo do contrato selecionado.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={creating || !selectedContract}
              className={`${smallButtonClasses} bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {creating ? "Emitindo..." : "Emitir ordem"}
            </button>
          </div>
        </form>
      </section>

      {/* LISTA DE ORDENS */}
      <section className="bg-white rounded-t-2xl shadow-sm ring-1 ring-gray-200 mt-6">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="space-y-1">
            <p className="text-sm sm:text-base font-semibold text-gray-900">
              Ordens emitidas
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              Histórico das ordens geradas a partir dos contratos.
            </p>
          </div>
        </div>

        {loadingOrders ? (
          <div className="px-4 py-4 text-xs sm:text-sm text-gray-500">
            Carregando ordens...
          </div>
        ) : orders.length === 0 ? (
          <div className="px-4 py-4 text-xs sm:text-sm text-gray-500">
            Nenhuma ordem emitida até o momento.
          </div>
        ) : (
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
                  Nº
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-left border-b border-gray-200">
                  Tipo
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-left border-b border-gray-200">
                  Contrato
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-left border-b border-gray-200">
                  Fornecedor
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-left border-b border-gray-200">
                  Data
                </th>
                <th className="px-2 sm:px-3 py-2 sm:py-2.5 text-right border-b border-gray-200">
                  V. Total
                </th>
              </tr>
              </thead>

              <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="bg-white odd:bg-white even:bg-gray-50 cursor-pointer hover:bg-indigo-50/60 transition-colors"
                  onClick={() => navigate(`/orders/${o.id}`)}
                >
                  <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-700 whitespace-nowrap border-b border-gray-100">
                    {o.numero}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-800 border-b border-gray-100">
                    {o.tipo}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-700 whitespace-nowrap border-b border-gray-100">
                    {o.contratoNumero}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-700 whitespace-nowrap border-b border-gray-100">
                    {o.fornecedor}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-gray-700 whitespace-nowrap border-b border-gray-100">
                    {o.data}
                  </td>
                  <td className="px-2 sm:px-3 py-2 sm:py-2.5 text-right tabular-nums font-medium text-gray-900 whitespace-nowrap border-b border-gray-100">
                    {formatMoneyBRL(o.total)}
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
