import http from "./http";

export async function createContractFromExtract(extractData, fileName) {
  const res = await http.post("/contracts/import", {
    fileName,
    ...extractData,
  });
  return res.data;
}

export async function createEmptyContract(payload = {}) {
  const res = await http.post("/contracts", payload);
  return res.data;
}

export async function getContractById(id) {
  const res = await http.get(`/contracts/${id}`);
  return res.data;
}

export async function updateContract(id, payload) {
  const res = await http.put(`/contracts/${id}`, payload);
  return res.data;
}

export async function deleteContract(id) {
  await http.delete(`/contracts/${id}`);
}

export async function listContracts() {
  const res = await http.get("/contracts");
  return res.data;
}

export async function listContractsSummary() {
  const res = await http.get("/contracts");
  return res.data;
}

export async function updateContractItem(contractId, payload) {
  const res = await http.put(`/contracts/${contractId}/items`, payload);
  return res.data;
}

// NOVO: deletar item do contrato pelo ID
export async function deleteContractItem(contractId, itemId) {
  const res = await http.delete(`/contracts/${contractId}/items/${itemId}`);
  return res.data;
}
