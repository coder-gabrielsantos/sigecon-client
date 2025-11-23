import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getContractById,
  updateContract,
  deleteContract,
  updateContractItem,
} from "../../services/contractsService";

/** Página de detalhes do contrato */
export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [contract, setContract] = useState(null);

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

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Tem certeza que deseja excluir este contrato e todos os itens?"
      )
    )
      return;
    try {
      setRemoving(true);
      await deleteContract(id);
      navigate("/contracts");
    } catch (e) {
      console.error(e);
      setError("Não foi possível excluir o contrato.");
      setRemoving(false);
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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <p className="text-sm text-gray-500">Carregando contrato...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <p className="text-sm text-red-600">Contrato não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Detalhes do contrato
          </h1>
          <p className="text-sm text-gray-500">
            Atualize os dados principais, gerencie itens e acompanhe o saldo
            disponível.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/contracts")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Voltar para a lista
        </button>
      </div>

      {/* Resumo financeiro do contrato */}
      <ContractFinancialSummary contract={contract}/>

      {/* Formulário de dados gerais */}
      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 sm:p-6 space-y-4"
      >
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Número do contrato
            </label>
            <input
              type="text"
              value={contract.number || ""}
              onChange={(e) => handleChange("number", e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Fornecedor
            </label>
            <input
              type="text"
              value={contract.supplier || ""}
              onChange={(e) => handleChange("supplier", e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Início
            </label>
            <input
              type="date"
              value={contract.startDate || ""}
              onChange={(e) => handleChange("startDate", e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Fim
            </label>
            <input
              type="date"
              value={contract.endDate || ""}
              onChange={(e) => handleChange("endDate", e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={removing}
            className="text-sm text-red-600 hover:text-red-700 px-3 py-2 rounded-xl border border-red-200 hover:bg-red-50 disabled:opacity-60"
          >
            {removing ? "Excluindo..." : "Excluir contrato"}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl shadow-sm disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>

      {/* Form para adicionar/atualizar item */}
      <ContractItemForm contractId={id} onUpdated={handleItemsUpdated}/>

      {/* Tabela de itens */}
      <ContractItemsTable items={contract.items}/>
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
    <section className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Resumo financeiro
          </h2>
          <p className="text-sm text-gray-500">
            Visão geral do valor contratado, uso e saldo disponível.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center">
        <div className="flex-1 space-y-1 text-left">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Valor total do contrato
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {fmtMoney(total)}
          </p>
        </div>

        <div className="flex-1 mt-3 sm:mt-0 space-y-1 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Valor utilizado
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {fmtMoney(used)}
          </p>
        </div>

        <div className="flex-1 mt-3 sm:mt-0 space-y-1 text-right">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Saldo restante
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {fmtMoney(remaining)}
          </p>
        </div>
      </div>

    </section>
  );
}

/* ===================== FORM DE ITEM ===================== */
/**
 * Regra:
 * - Se o usuário informar um Nº do item que já existe, ele será ATUALIZADO.
 * - Se deixar o Nº do item em branco, será ADICIONADO um novo item ao contrato.
 */
function ContractItemForm({ contractId, onUpdated }) {
  const [itemNo, setItemNo] = useState("");
  const [form, setForm] = useState({
    description: "",
    unit: "",
    quantity: "",
    unitPrice: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const hasAnyField =
      form.description.trim() ||
      form.unit.trim() ||
      form.quantity.trim() ||
      form.unitPrice.trim();

    if (!hasAnyField) {
      setError("Preencha pelo menos um campo do item.");
      return;
    }

    const payload = {};

    const itemNoTrim = String(itemNo || "").trim();
    if (itemNoTrim) {
      const n = Number(itemNoTrim);
      if (!n || Number.isNaN(n)) {
        setError(
          "Informe um número de item válido ou deixe em branco para adicionar."
        );
        return;
      }
      payload.itemNo = n;
    }

    const qNum = form.quantity.trim() !== "" ? num(form.quantity) : null;
    const vuNum = form.unitPrice.trim() !== "" ? num(form.unitPrice) : null;

    if (form.description.trim()) payload.description = form.description.trim();
    if (form.unit.trim()) payload.unit = form.unit.trim();
    if (qNum != null) payload.quantity = qNum;
    if (vuNum != null) payload.unitPrice = vuNum;

    // total calculado internamente (qtd x v.unit)
    if (qNum != null && vuNum != null) {
      payload.totalPrice = qNum * vuNum;
    }

    try {
      setLoading(true);
      const updatedContract = await updateContractItem(contractId, payload);
      setSuccess(
        payload.itemNo
          ? "Item atualizado com sucesso."
          : "Novo item adicionado ao contrato."
      );
      setError("");
      setForm({
        description: "",
        unit: "",
        quantity: "",
        unitPrice: "",
      });
      setItemNo("");
      setTimeout(() => setSuccess(""), 2500);
      onUpdated?.(updatedContract);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Não foi possível salvar o item.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Itens do contrato — adicionar ou atualizar
          </h2>
          <p className="text-sm text-gray-500">
            Para atualizar, informe o número do item. Para adicionar um novo,
            deixe o campo de número em branco.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Inputs em linha no desktop, empilhados no mobile */}
        <div className="grid gap-3 sm:grid-cols-12">
          {/* Nº do item (compacto) */}
          <div className="space-y-1 sm:col-span-1">
            <label className="text-xs font-medium text-gray-600">Item</label>
            <input
              type="number"
              min={1}
              value={itemNo}
              onChange={(e) => setItemNo(e.target.value)}
              placeholder=""
              className="w-full rounded-xl border border-gray-300 px-2.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Descrição (larga) */}
          <div className="space-y-1 sm:col-span-5">
            <label className="text-xs font-medium text-gray-600">
              Descrição
            </label>
            <input
              name="description"
              type="text"
              value={form.description}
              onChange={handleChange}
              placeholder="Ex: Tubo PVC soldável 50mm..."
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Unidade (compacto) */}
          <div className="space-y-1 sm:col-span-1">
            <label className="text-xs font-medium text-gray-600">
              Unidade
            </label>
            <input
              name="unit"
              type="text"
              value={form.unit}
              onChange={handleChange}
              placeholder="UN, CJ"
              className="w-full rounded-xl border border-gray-300 px-2.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quantidade (compacto) */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-medium text-gray-600">
              Quantidade
            </label>
            <input
              name="quantity"
              type="text"
              value={form.quantity}
              onChange={handleChange}
              placeholder="Ex: 100"
              className="w-full rounded-xl border border-gray-300 px-2.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* V. unitário (compacto) */}
          <div className="space-y-1 sm:col-span-3">
            <label className="text-xs font-medium text-gray-600">
              V. unitário
            </label>
            <input
              name="unitPrice"
              type="text"
              value={form.unitPrice}
              onChange={handleChange}
              placeholder="Ex: 1234,56"
              className="w-full rounded-xl border border-gray-300 px-2.5 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            {success}
          </p>
        )}

        {/* Botão embaixo, alinhado à direita, igual ao "Salvar alterações" */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl shadow-sm disabled:opacity-60"
          >
            {loading ? "Salvando item..." : "Salvar item"}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ===================== TABELA DE ITENS ===================== */

function ContractItemsTable({ items = [] }) {
  const { sortedItems, totalGeral } = prepareContractItems(items);

  return (
    <section className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-gray-900">
          Itens do contrato
        </h2>
        <span className="text-sm text-gray-500">
          {sortedItems.length} itens
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="min-w-full text-sm border-separate border-spacing-y-2">
          <thead className="bg-indigo-50 text-indigo-700 uppercase text-xs">
          <tr>
            <th className="px-3 py-3 text-left">Item</th>
            <th className="px-3 py-3 text-left">Descrição</th>
            <th className="px-3 py-3 text-left">Unid.</th>
            <th className="px-3 py-3 text-right">Qtd</th>
            <th className="px-3 py-3 text-right">V. Unit.</th>
            <th className="px-3 py-3 text-right">V. Total</th>
          </tr>
          </thead>

          <tbody>
          {sortedItems.map((it, i) => (
            <tr
              key={it.id ?? `${i}-${it.itemNo ?? it.item_no ?? ""}`}
              className="bg-white even:bg-gray-50"
            >
              <td className="px-3 py-3 rounded-l-xl text-gray-700">
                {displayItemNo(it, i)}
              </td>
              <td className="px-3 py-2 text-gray-800 max-w-[320px] whitespace-nowrap overflow-hidden text-ellipsis">
                {it.description}
              </td>
              <td className="px-3 py-3 text-gray-700">{it.unit}</td>
              <td className="px-3 py-3 text-right tabular-nums text-gray-700">
                {fmtNum(it.quantity)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-gray-700">
                {fmtMoney(it.unitPrice ?? it.unit_price)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums rounded-r-xl font-medium text-gray-900">
                {fmtMoney(it.totalPrice ?? it.total_price)}
              </td>
            </tr>
          ))}
          </tbody>

          <tfoot>
          <tr className="bg-white">
            <td
              className="px-3 py-3 text-gray-600 rounded-l-xl"
              colSpan={5}
            >
              Total dos itens
            </td>
            <td className="px-3 py-3 text-right rounded-r-xl font-semibold text-gray-900">
              {fmtMoney(totalGeral)}
            </td>
          </tr>
          </tfoot>
        </table>
      </div>
    </section>
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
