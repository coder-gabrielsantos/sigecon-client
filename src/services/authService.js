import http from "./http";

export async function loginRequest({ cpf, senha }) {
  const { data } = await http.post("/auth/login", { cpf, senha });
  // esperado: { token, user: { id, nome, role, cpf? } }
  return data;
}

export async function getMe() {
  const { data } = await http.get("/usuarios/me");
  return data;
}

// ADMIN cria novo usuário (ADMIN ou OPERADOR)
export async function adminCreateUser({ nome, cpf, role }) {
  const { data } = await http.post("/usuarios", { nome, cpf, role });
  // se o backend devolver senha_inicial, usamos na tela
  return data;
}

// usuário autenticado troca a própria senha
export async function changeMyPassword({ senhaAtual, senhaNova }) {
  const { data } = await http.put("/usuarios/me/senha", {
    senhaAtual,
    senhaNova,
  });
  return data;
}

// usuário autenticado altera o próprio nome
export async function updateMyName({ nome }) {
  const { data } = await http.put("/usuarios/me/nome", { nome });
  return data; // perfil atualizado
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
