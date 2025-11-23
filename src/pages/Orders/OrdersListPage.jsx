import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import {
  listContractsSummary,
  getContractById,
} from "../../services/contractsService";
import {
  createOrder,
  listOrders,
} from "../../services/ordersService";

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
            fornecedor: o.contractSupplier,
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
    // permite apagar o campo
    if (value === "") {
      setItemsQuantities((prev) => ({
        ...prev,
        [id]: "",
      }));
      return;
    }

    // normaliza para número (remove pontos, troca vírgula por ponto)
    const numeric = Number(
      value.toString().replace(/\./g, "").replace(",", ".")
    );

    const item = contractItems.find((it) => it.id === id);
    const available = item?.availableQuantity ?? null;

    let finalQty = numeric;

    // se não for número válido ou menor/igual a zero, zera
    if (!Number.isFinite(numeric) || numeric <= 0) {
      finalQty = "";
    }
    // se passar da quantidade disponível, usa a disponível
    else if (available != null && numeric > available) {
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
      fontSize: "0.875rem", // text-sm
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
    "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* CABEÇALHO */}
      <header className="space-y-1">
        <h1 className="text-lg font-semibold text-gray-900">
          Ordens vinculadas a contratos
        </h1>
        <p className="text-sm text-gray-500">
          Emita ordens de fornecimento ou serviço a partir de um contrato já
          cadastrado. O valor é debitado automaticamente do saldo do contrato.
        </p>
      </header>

      {/* ALERTA DE ERRO */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* CARD DE EMISSÃO */}
      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-5 sm:p-6 space-y-5">
        {/* TÍTULO */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-base font-semibold text-gray-900">
              Emitir nova ordem
            </p>
            <p className="text-sm text-gray-500">
              Escolha o contrato, o tipo de ordem, os itens e a finalidade.
            </p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleCreateOrder}>
          {/* LINHA 1: contrato / tipo / data */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">
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
              <label className="text-xs font-medium text-gray-700">
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
                className="text-xs font-medium text-gray-700"
              >
                Data da emissão
              </label>
              <input
                id="issueDate"
                type="date"
                className="w-full rounded-full border border-gray-300 px-3 text-sm h-10 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
          </div>

          {/* FINALIDADE */}
          <div className="space-y-1">
            <label
              htmlFor="justification"
              className="text-xs font-medium text-gray-700"
            >
              Finalidade / Justificativa
            </label>
            <input
              id="justification"
              type="text"
              className="w-full rounded-full border border-gray-300 px-3 text-sm h-10 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Descreva a finalidade da ordem (ex.: aquisição de materiais de construção...)"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
            <p className="text-xs text-gray-400">
              Campo em linha única, sem aumento de altura.
            </p>
          </div>

          {/* ITENS DO CONTRATO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-gray-900">
                Itens deste contrato
              </p>
              <p className="text-sm text-gray-500">
                Informe a quantidade para cada item que fará parte da ordem.
              </p>
            </div>

            {!selectedContract && (
              <p className="text-sm text-gray-500">
                Selecione um contrato para visualizar os itens.
              </p>
            )}

            {selectedContract && itemsLoading && (
              <p className="text-sm text-gray-500">
                Carregando itens do contrato...
              </p>
            )}

            {selectedContract &&
              !itemsLoading &&
              contractItems.length === 0 && (
                <p className="text-sm text-gray-500">
                  Nenhum item cadastrado neste contrato.
                </p>
              )}

            {selectedContract &&
              !itemsLoading &&
              contractItems.length > 0 && (
                <div className="border border-gray-200 bg-gray-50 max-h-72 overflow-y-auto overflow-x-auto">
                  <table className="min-w-[900px] text-sm">
                    <thead>
                    <tr className="bg-gray-100 text-xs text-gray-600 uppercase tracking-wide sticky top-0 z-10">
                      <th className="px-3 py-2 text-left">Item</th>
                      <th className="px-3 py-2 text-left">Descrição</th>
                      <th className="px-2 py-2 text-right w-20 whitespace-nowrap">
                        Qtd disponível
                      </th>
                      <th className="px-2 py-2 text-right w-24 whitespace-nowrap">
                        Qtd p/ ordem
                      </th>
                      <th className="px-3 py-2 text-right">V. unit.</th>
                      <th className="px-4 py-2 text-right min-w-[140px]">
                        V. total (ordem)
                      </th>
                    </tr>
                    </thead>
                    <tbody>
                    {contractItems
                      .filter((it) => (it.description || "").trim() !== "")
                      .map((it) => {
                        const qStr = itemsQuantities[it.id] || "";
                        const numeric = Number(
                          qStr
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
                            className="border-t border-gray-200 bg-white"
                          >
                            <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                              {it.itemNo ?? "-"}
                            </td>
                            <td className="px-3 py-2 text-gray-800">
                              {it.description}
                            </td>
                            <td className="px-2 py-2 text-right text-gray-700 whitespace-nowrap w-20">
                              {it.availableQuantity}
                            </td>
                            <td className="px-2 py-2 text-right whitespace-nowrap w-24">
                              <input
                                type="text"
                                className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm text-right text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="0"
                                value={qStr}
                                onChange={(e) =>
                                  handleItemQuantityChange(
                                    it.id,
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap">
                              {formatMoneyBRL(it.unitPrice)}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900 font-medium whitespace-nowrap">
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
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total da ordem
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {formatMoneyBRL(orderTotal)}
              </p>
              {selectedContract && (
                <p className="text-xs text-gray-500">
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
      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="space-y-1">
            <p className="text-base font-semibold text-gray-900">
              Ordens emitidas
            </p>
            <p className="text-sm text-gray-500">
              Histórico das ordens geradas a partir dos contratos.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              setLoadingOrders(true);
              try {
                const data = await listOrders();
                setOrders(
                  (data || []).map((o) => ({
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
              } finally {
                setLoadingOrders(false);
              }
            }}
            className={`${smallButtonClasses} border border-gray-300 text-gray-700 bg-white hover:bg-gray-50`}
          >
            {loadingOrders ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {loadingOrders ? (
          <div className="px-4 py-4 text-sm text-gray-500">
            Carregando ordens...
          </div>
        ) : orders.length === 0 ? (
          <div className="px-4 py-4 text-sm text-gray-500">
            Nenhuma ordem emitida até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
              <tr className="bg-gray-100 text-xs text-gray-600 uppercase tracking-wide">
                <th className="px-3 py-2 text-left font-medium">Nº</th>
                <th className="px-3 py-2 text-left font-medium">Tipo</th>
                <th className="px-3 py-2 text-left font-medium">Contrato</th>
                <th className="px-3 py-2 text-left font-medium">
                  Fornecedor
                </th>
                <th className="px-3 py-2 text-left font-medium">Data</th>
                <th className="px-3 py-2 text-right font-medium">
                  Valor total
                </th>
              </tr>
              </thead>
              <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/orders/${o.id}`)}
                >
                  <td className="px-3 py-2 font-semibold text-gray-900 whitespace-nowrap">
                    {o.numero}
                  </td>
                  <td className="px-3 py-2 text-gray-800 whitespace-nowrap">
                    {o.tipo}
                  </td>
                  <td className="px-3 py-2 text-gray-800 whitespace-nowrap">
                    {o.contratoNumero}
                  </td>
                  <td className="px-3 py-2 text-gray-800 whitespace-nowrap">
                    {o.fornecedor}
                  </td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                    {o.data}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900 whitespace-nowrap">
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
