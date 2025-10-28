import Card from "../../components/ui/Card";

export default function DashboardPage() {
  // Esses dados são mockados apenas para visual.
  const totalContratosAtivos = 5;
  const saldoDisponivel = "R$ 128.450,00";
  const gastoMesAtual = "R$ 32.900,00";

  const ultimasOS = [
    {
      osNumero: "OS 012/2025",
      contrato: "Contrato 009/2025",
      descricao: "Aquisição de cimento e pó de pedra",
      valor: "R$ 4.920,00",
      data: "20/10/2025",
    },
    {
      osNumero: "OS 011/2025",
      contrato: "Contrato 009/2025",
      descricao: "Cerâmica antiderrapante 45x45",
      valor: "R$ 1.610,00",
      data: "18/10/2025",
    },
  ];

  return (
    <div className="space-y-8">
      {/* título da página */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 leading-tight">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed max-w-2xl">
          Visão geral dos contratos, saldo disponível e últimas ordens de
          serviço registradas na Secretaria Municipal de Gestão e Orçamento.
        </p>
      </div>

      {/* cards de status */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          title="Contratos ativos"
          value={totalContratosAtivos}
          note="Contratos em vigência e com saldo disponível."
        />
        <Card
          title="Saldo disponível total"
          value={saldoDisponivel}
          note="Valor restante somado de todos os contratos ativos."
        />
        <Card
          title="Gasto no mês atual"
          value={gastoMesAtual}
          note="Somatório de itens baixados em ordens de serviço no período atual."
        />
      </section>

      {/* tabela últimas ordens de serviço */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 leading-tight">
              Últimas ordens de serviço
            </h2>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Movimentações recentes de materiais / quantitativos.
            </p>
          </div>

          <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500">
            Ver todas
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl ring-1 ring-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-medium">
            <tr>
              <th className="px-4 py-3">OS</th>
              <th className="px-4 py-3">Contrato</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Data</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
            {ultimasOS.map((item, idx) => (
              <tr key={idx} className="align-top">
                <td className="px-4 py-3 font-semibold text-gray-900">
                  {item.osNumero}
                </td>
                <td className="px-4 py-3 text-gray-800">
                  {item.contrato}
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm leading-relaxed">
                  {item.descricao}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {item.valor}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {item.data}
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
