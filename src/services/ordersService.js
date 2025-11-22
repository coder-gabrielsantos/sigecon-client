import http from "./http";

/**
 * Cria uma ordem a partir de um contrato e itens selecionados.
 * payload:
 * {
 *   contractId,
 *   orderType,
 *   orderNumber?,
 *   issueDate?,
 *   referencePeriod?,
 *   justification?,
 *   items: [{ contractItemId, quantity }]
 * }
 */
export async function createOrder(payload) {
  const res = await http.post("/orders", payload);
  return res.data;
}

export async function listOrders() {
  const res = await http.get("/orders");
  return res.data;
}

export async function getOrderById(id) {
  const res = await http.get(`/orders/${id}`);
  return res.data;
}

/**
 * Baixa a planilha XLSX da ordem já preenchida com base no template.
 * Envia junto os dados extras preenchidos no formulário da tela.
 *
 * extras:
 * {
 *   orderTypeText,
 *   deText,
 *   paraText,
 *   nomeRazao,
 *   endereco,
 *   celularTexto,
 *   justificativaCampo,
 *   tiposDespesaSelecionados: string[],
 *   modalidadesSelecionadas: string[]
 * }
 */
export async function downloadOrderXlsx(id, extras) {
  const res = await http.post(`/orders/${id}/xlsx`, extras, {
    responseType: "blob",
  });
  return res.data; // Blob do XLSX
}
