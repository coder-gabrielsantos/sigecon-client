import http from "./http";

export async function createContractFromExtract(extractData, fileName) {
  const res = await http.post("/contracts/import", {
    fileName,
    ...extractData,
  });
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
