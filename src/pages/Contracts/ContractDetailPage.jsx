import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getContractById, updateContract, deleteContract } from "../../services/contractsService";

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
        startDate: normalizeDateForInput(updated.startDate || updated.start_date),
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
    if (!window.confirm("Tem certeza que deseja excluir este contrato e todos os itens?")) return;
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
          <h1 className="text-lg font-semibold text-gray-900">Detalhes do contrato</h1>
          <p className="text-xs text-gray-500">Atualize os dados principais ou exclua o contrato.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/contracts")}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Voltar para a lista
        </button>
      </div>

      {/* Resumo financeiro do contrato (usa soma dos itens) */}
      <ContractFinancialSummary contract={contract}/>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 sm:p-6 space-y-4"
      >
        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
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
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
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
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
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
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
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
            className="text-xs text-red-600 hover:text-red-700 px-3 py-2 rounded-xl border border-red-200 hover:bg-red-50 disabled:opacity-60"
          >
            {removing ? "Excluindo..." : "Excluir contrato"}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl shadow-sm disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>

      <ContractItemsTable items={contract.items}/>
    </div>
  );
}

/* ===================== RESUMO FINANCEIRO ===================== */

function ContractFinancialSummary({ contract }) {
  if (!contract) return null;

  const { totalGeral } = prepareContractItems(contract.items || []);

  // No futuro, se o backend passar usedAmount / remainingAmount / status,
  // eles entram aqui. Por enquanto, deixamos "—" para esses campos.
  const usado = contract.usedAmount ?? contract.used_amount;
  const saldo = contract.remainingAmount ?? contract.remaining_amount;
  const status = contract.status;

  const displayMoney = (v) => {
    if (v === undefined || v === null) return "—";
    return fmtMoney(v);
  };

  const displayStatus = status || "—";

  return (
    <section className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Resumo financeiro
          </h2>
          <p className="text-[11px] text-gray-500">
            Visão geral do valor contratado, uso e saldo disponível.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Valor total = soma dos itens filtrados (totalGeral) */}
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            Valor total do contrato
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {fmtMoney(totalGeral)}
          </p>
        </div>

        {/* Valor utilizado (quando backend fornecer) */}
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            Valor utilizado
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {displayMoney(usado)}
          </p>
        </div>

        {/* Saldo restante (quando backend fornecer) */}
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            Saldo restante
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {displayMoney(saldo)}
          </p>
        </div>

        {/* Status (quando backend fornecer) */}
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            Status
          </p>
          <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700 ring-1 ring-gray-200">
            {displayStatus}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ===================== TABELA DE ITENS ===================== */

function ContractItemsTable({ items = [] }) {
  const { sortedItems, totalGeral } = prepareContractItems(items);

  return (
    <section className="bg-white rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Itens do contrato</h2>
        <span className="text-xs text-gray-500">{sortedItems.length} itens</span>
      </div>

      <table className="min-w-full text-xs sm:text-sm border-separate border-spacing-y-2">
        <thead className="bg-indigo-50 text-indigo-700 uppercase text-[11px]">
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
            <td className="px-3 py-3 text-gray-800">{it.description}</td>
            <td className="px-3 py-3">{it.unit}</td>
            <td className="px-3 py-3 text-right tabular-nums">
              {fmtNum(it.quantity)}
            </td>
            <td className="px-3 py-3 text-right tabular-nums">
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
          <td className="px-3 py-3 text-gray-600 rounded-l-xl" colSpan={5}>
            Total dos itens
          </td>
          <td className="px-3 py-3 text-right rounded-r-xl font-semibold text-gray-900">
            {fmtMoney(totalGeral)}
          </td>
        </tr>
        </tfoot>
      </table>
    </section>
  );
}

/* ===================== HELPERS ===================== */

function prepareContractItems(items = []) {
  // Filtra linhas inválidas (sem descrição / "total" / números todos nulos/zero)
  const validItems = (items || []).filter((raw) => {
    const desc = String(raw.description ?? "").trim();

    // precisa ter alguma descrição
    if (!desc) return false;

    // desc que contém "total" (ex: "VALOR TOTAL DO CONTRATO") são linhas de resumo
    if (/^total\b/i.test(desc) || /\btotal\b/i.test(desc)) return false;

    const q = num(raw.quantity);
    const vu = num(raw.unitPrice ?? raw.unit_price);
    const vt = num(raw.totalPrice ?? raw.total_price);

    // *** NOVO ***
    // Linha de "TOTAL DO CONTRATO":
    // não tem quantidade nem valor unitário, só total_price.
    if ((q === null || q === 0) && (vu === null || vu === 0) && vt !== null) {
      return false;
    }

    const nums = [q, vu, vt].filter((n) => n !== null);
    if (nums.length === 0) return false;
    if (nums.every((n) => n === 0)) return false;

    return true;
  });

  // Ordena pelo item_no do banco quando existir
  const sortedItems = [...validItems].sort((a, b) => {
    const A = getItemNo(a);
    const B = getItemNo(b);
    if (A === null && B === null) return 0;
    if (A === null) return 1;
    if (B === null) return -1;
    return A - B;
  });

  // TOTAL = soma da coluna V. Total (já sem a linha de resumo)
  const totalGeral = sortedItems.reduce(
    (s, it) => s + (num(it.totalPrice ?? it.total_price) || 0),
    0
  );

  return { sortedItems, totalGeral };
}

function normalizeDateForInput(value) {
  if (!value) return "";
  // aceita 'YYYY-MM-DD', ISO ou Date
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

  if (/^\d{1,3}(\.\d{3})+,\d{2}$/.test(raw)) return Number(raw.replace(/\./g, "").replace(",", "."));
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
