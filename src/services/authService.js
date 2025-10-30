import http from "./http";

export async function loginRequest({ cpf, senha }) {
  const { data } = await http.post("/auth/login", { cpf, senha });
  // esperado: { token, user: { id, nome, role } }
  return data;
}

export async function getMe() {
  const { data } = await http.get("/usuarios/me");
  return data;
}

export function saveSession({ token, user }) {
  localStorage.setItem("sigecon_token", token);
  localStorage.setItem("sigecon_user", JSON.stringify(user));
}

export function loadSession() {
  const token = localStorage.getItem("sigecon_token");
  const raw = localStorage.getItem("sigecon_user");
  return { token, user: raw ? JSON.parse(raw) : null };
}

export function clearSession() {
  localStorage.removeItem("sigecon_token");
  localStorage.removeItem("sigecon_user");
}
