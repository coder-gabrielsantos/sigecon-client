import http from "./http";

/**
 * Cria um contrato a partir dos dados extraídos do PDF.
 * Ajusta o payload conforme o que tua API do server espera.
 */
export async function createContractFromExtract(extractData, fileName) {
  const payload = {
    fileName,
    columns: extractData.columns,
    rows: extractData.rows,
    total: extractData.soma_valor_total,
    totalUnit: extractData.soma_valor_unit,
    issues: extractData.issues || [],
  };

  // Exemplo de endpoint no server:
  // POST /contracts/import
  // Implementa no backend para:
  // - salvar o PDF (se quiser)
  // - criar contrato
  // - criar itens do contrato a partir de rows
  const res = await http.post("/contracts/import", payload);
  return res.data;
}
