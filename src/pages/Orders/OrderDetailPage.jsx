import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import { getOrderById, downloadOrderPdf } from "../../services/ordersService";
import { getContractById } from "../../services/contractsService";

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

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getOrderById(id);
        if (!alive) return;

        setOrder({
          id: data.id,
          orderNumber: data.orderNumber,
          orderType: data.orderType,
          issueDate: data.issueDate,
          justification: data.justification,
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

  async function handleDownloadPdf() {
    try {
      const blob = await downloadOrderPdf(order.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ordem-${order.orderNumber || order.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      // eslint-disable-next-line no-alert
      alert("Não foi possível gerar o PDF da ordem.");
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <p className="text-sm text-gray-500">Carregando ordem.</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-3">
        {error && (
          <p className="text-sm text-red-600">
            {error || "Ordem não encontrada."}
          </p>
        )}
        <button
          onClick={() => navigate("/orders")}
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          Voltar para ordens
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header principal */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Ordem vinculada a contrato
          </p>
          <h1 className="text-2xl font-semibold text-gray-900">
            {order.orderType || "Ordem"} nº {order.orderNumber || order.id}
          </h1>
          {order.issueDate && (
            <p className="text-xs text-gray-500">
              Data da emissão:{" "}
              <span className="font-medium text-gray-700">
                {order.issueDate}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Button
            type="button"
            onClick={handleDownloadPdf}
          >
            Baixar PDF
          </Button>
        </div>
      </header>

      {/* Contrato e resumo */}
      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-5 sm:p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
              Contrato
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {contract?.number || "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
              Fornecedor
            </p>
            <p className="text-sm font-medium text-gray-900">
              {contract?.supplier || "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
              Total da ordem
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {formatMoneyBRL(order.totalAmount)}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-1">
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            Finalidade / Justificativa
          </p>
          <p className="text-sm text-gray-800">
            {order.justification || "—"}
          </p>
        </div>
      </section>

      {/* Itens da ordem */}
      <section className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200">
        <div className="px-4 py-4 border-b border-gray-200">
          <p className="text-sm font-semibold text-gray-900">
            Itens desta ordem
          </p>
          <p className="text-[11px] text-gray-500">
            Baseado nos itens do contrato selecionado.
          </p>
        </div>

        {order.items.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">
            Nenhum item vinculado a esta ordem.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
              <tr className="bg-gray-100 text-[11px] text-gray-600 uppercase tracking-wide">
                <th className="px-3 py-2 text-left font-medium">Item</th>
                <th className="px-3 py-2 text-left font-medium">
                  Descrição
                </th>
                <th className="px-3 py-2 text-left font-medium">Unid.</th>
                <th className="px-3 py-2 text-right font-medium">
                  Quant.
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  V. unitário
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  V. total
                </th>
              </tr>
              </thead>
              <tbody>
              {order.items.map((it) => (
                <tr key={it.id} className="border-t border-gray-200">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {it.itemNo ?? "-"}
                  </td>
                  <td className="px-3 py-2">
                      <span className="font-medium text-gray-800">
                        {it.description}
                      </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {it.unit || "—"}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {it.quantity}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {formatMoneyBRL(it.unitPrice)}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    {formatMoneyBRL(it.totalPrice)}
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
