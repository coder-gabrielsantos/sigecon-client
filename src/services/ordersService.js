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

export async function downloadOrderXlsx(id) {
  const response = await http.get(`/orders/${id}/xlsx`, {
    responseType: "blob",
  });
  return response.data; // Blob
}
