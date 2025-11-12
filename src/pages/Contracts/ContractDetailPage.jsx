import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getContractById,
  updateContract,
  deleteContract,
} from "../../services/contractsService";

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [contract, setContract] = useState(null);

  // Carrega contrato
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        const data = await getContractById(id);
        if (isMounted) setContract(data);
      } catch (e) {
        console.error(e);
        if (isMounted) setError("Não foi possível carregar o contrato.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleChange = (field, value) => {
    setContract((prev) => ({
      ...prev,
      [field]: value,
    }));
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
        totalAmount: contract.totalAmount,
        startDate: contract.startDate,
        endDate: contract.endDate,
      };
      const updated = await updateContract(id, payload);
      setContract(updated);
    } catch (e) {
      console.error(e);
      setError("Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este contrato e todos os itens?")) {
      return;
    }
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
      <div className="p-6">
        <p className="text-sm text-gray-500">Carregando contrato...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">
          Contrato não encontrado.
        </p>
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
          <p className="text-xs text-gray-500">
            Atualize os dados principais ou exclua o contrato.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/contracts")}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Voltar para a lista
        </button>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 sm:p-6 space-y-4"
      >
        {error && (
          <p className="text-xs text-red-600 mb-2">
            {error}
          </p>
        )}

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

          <div>
            <label className="block text-[11px] font-medium text-gray-600 mb-1">
              Valor total
            </label>
            <input
              type="number"
              step="0.01"
              value={contract.totalAmount ?? ""}
              onChange={(e) =>
                handleChange("totalAmount", e.target.value)
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Início
              </label>
              <input
                type="date"
                value={contract.startDate || ""}
                onChange={(e) =>
                  handleChange("startDate", e.target.value)
                }
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
                onChange={(e) =>
                  handleChange("endDate", e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-4">
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

      {/* Itens do contrato apenas leitura por enquanto */}
      {Array.isArray(contract.items) && contract.items.length > 0 && (
        <section className="bg-white rounded-2xl ring-1 ring-gray-200 shadow-sm p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            Itens do contrato
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                <th className="px-2 py-2 text-left">Item</th>
                <th className="px-2 py-2 text-left">Descrição</th>
                <th className="px-2 py-2 text-left">Unid.</th>
                <th className="px-2 py-2 text-right">Qtd</th>
                <th className="px-2 py-2 text-right">V. Unit.</th>
                <th className="px-2 py-2 text-right">V. Total</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
              {contract.items.map((it) => (
                <tr key={it.id}>
                  <td className="px-2 py-1">{it.itemNo}</td>
                  <td className="px-2 py-1">{it.description}</td>
                  <td className="px-2 py-1">{it.unit}</td>
                  <td className="px-2 py-1 text-right">
                    {it.quantity}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {formatCurrency(it.unitPrice)}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {formatCurrency(it.totalPrice)}
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[10px] text-gray-400">
            Edição detalhada dos itens pode ser adicionada depois. Por
            enquanto, utilize o cabeçalho do contrato para ajustes gerais.
          </p>
        </section>
      )}
    </div>
  );
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
