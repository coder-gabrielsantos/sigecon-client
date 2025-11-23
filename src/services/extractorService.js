import axios from "axios";

const extractorApi = axios.create({
  baseURL: import.meta.env.EXTRACTOR_URL,
});

export async function extractContractTable(file, onUploadProgress) {
  const fd = new FormData();
  fd.append("file", file); // precisa ser "file" para o FastAPI

  const res = await extractorApi.post("/extract", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });

  return res.data;
}
