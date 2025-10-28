export default function ContractsListPage() {
  // Mock de contratos
  const contratos = [
    {
      numero: "Contrato 009/2025",
      fornecedor: "S. T. BORBA",
      descricao:
        "Aquisição de materiais de construção, hidráulico e elétrico para atender as necessidades da Secretaria Municipal de Obras e Infraestrutura.",
      valorTotal: 10651.5, // R$
      valorUsado: 6920.3,
      saldoRestante: 3731.2,
      status: "OK", // "OK" | "BAIXO" | "ENCERRADO"
    },
    {
      numero: "Contrato 014/2025",
      fornecedor: "Concretex Serviços",
      descricao:
        "Fornecimento de pó de pedra, brita e cimento CP II-F32 para manutenção emergencial.",
      valorTotal: 50000.0,
      valorUsado: 48000.0,
      saldoRestante: 2000.0,
      status: "BAIXO",
    },
    {
      numero: "Contrato 002/2024",
      fornecedor: "Alpha Hidráulica",
      descricao:
        "Materiais de instalação hidráulica e registros esfera soldável (20mm a 50mm).",
      valorTotal: 18000.0,
      valorUsado: 18000.0,
      saldoRestante: 0.0,
      status: "ENCERRADO",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Cabeçalho da página */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 leading-tight">
            Contratos
          </h1>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed max-w-2xl">
            Lista de contratos em vigência, com fornecedor, valores e saldo
            disponível. Essas informações orientam a emissão de novas Ordens de
            Serviço e o planejamento orçamentário.
          </p>
        </div>

        <div className="flex flex-col sm:items-end">
          <button className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-sm bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30">
            + Novo contrato
          </button>
          <p className="text-[11px] text-gray-400 mt-2 leading-relaxed text-right">
            Função ilustrativa no protótipo
          </p>
        </div>
      </div>

      {/* Tabela */}
      <section>
        <div className="overflow-hidden rounded-2xl ring-1 ring-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-medium">
            <tr>
              <th className="px-4 py-3">Contrato</th>
              <th className="px-4 py-3">Fornecedor</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3 text-right">Valor total</th>
              <th className="px-4 py-3 text-right">Usado</th>
              <th className="px-4 py-3 text-right">Saldo</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-gray-700">
            {contratos.map((c, idx) => (
              <tr key={idx} className="align-top">
                {/* Número do contrato */}
                <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                  {c.numero}
                </td>

                {/* Fornecedor */}
                <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                  {c.fornecedor}
                </td>

                {/* Descrição */}
                <td className="px-4 py-3 text-gray-600 text-sm leading-relaxed max-w-md">
                  <p className="line-clamp-2">
                    {c.descricao}
                  </p>
                </td>

                {/* Valor total */}
                <td className="px-4 py-3 font-medium text-gray-900 text-right whitespace-nowrap">
                  {formatCurrency(c.valorTotal)}
                </td>

                {/* Valor usado */}
                <td className="px-4 py-3 font-medium text-gray-900 text-right whitespace-nowrap">
                  {formatCurrency(c.valorUsado)}
                </td>

                {/* Saldo restante */}
                <td className="px-4 py-3 font-medium text-gray-900 text-right whitespace-nowrap">
                  {formatCurrency(c.saldoRestante)}
                </td>

                {/* Status */}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <StatusPill status={c.status}/>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>

        {/* legenda de status */}
        <div className="flex flex-wrap gap-4 text-[11px] text-gray-500 mt-4">
          <div className="flex items-center gap-2">
            <StatusPill status="OK"/>
            <span>Saldo disponível</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status="BAIXO"/>
            <span>Saldo baixo</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status="ENCERRADO"/>
            <span>Contrato encerrado / sem saldo</span>
          </div>
        </div>
      </section>
    </div>
  );
}

// formata número para R$ com 2 casas
function formatCurrency(v) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

// Badge de status visual reutilizável
function StatusPill({ status }) {
  let style = "";
  let label = "";

  switch (status) {
    case "OK":
      style =
        "bg-emerald-100 text-emerald-700 ring-emerald-200";
      label = "OK";
      break;
    case "BAIXO":
      style =
        "bg-amber-100 text-amber-700 ring-amber-200";
      label = "Saldo baixo";
      break;
    case "ENCERRADO":
      style =
        "bg-gray-200 text-gray-700 ring-gray-300 line-through";
      label = "Encerrado";
      break;
    default:
      style =
        "bg-gray-100 text-gray-700 ring-gray-200";
      label = status;
  }

  return (
    <span
      className={
        "inline-flex items-center rounded-lg px-2 py-1 text-[11px] font-medium ring-1 " +
        style
      }
    >
      {label}
    </span>
  );
}
