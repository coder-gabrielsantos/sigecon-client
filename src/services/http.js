import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.API_URL,
  headers: { "Content-Type": "application/json" },
});

// Anexa o JWT automaticamente
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("sigecon_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default http;
