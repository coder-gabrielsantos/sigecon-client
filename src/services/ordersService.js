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

/**
 * Lista ordens (resumo para tabela).
 */
export async function listOrders() {
  const res = await http.get("/orders");
  return res.data;
}

/**
 * Busca ordem completa (com itens) por ID.
 */
export async function getOrderById(id) {
  const res = await http.get(`/orders/${id}`);
  return res.data;
}

/**
 * Atualiza itens da ordem (e eventualmente outros campos no futuro).
 * payload típico:
 * {
 *   items: [{ orderItemId, quantity }]
 * }
 */
export async function updateOrder(id, payload) {
  const res = await http.put(`/orders/${id}`, payload);
  return res.data;
}

/**
 * Exclui uma ordem e seus itens.
 */
export async function deleteOrder(id) {
  await http.delete(`/orders/${id}`);
}

/**
 * Gera e baixa a planilha XLSX da ordem.
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
