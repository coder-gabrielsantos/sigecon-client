import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  loginRequest,
  saveSession,
  loadSession,
  clearSession,
  getMe,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [{ user, token }, setAuth] = useState(() => loadSession());
  const [loading, setLoading] = useState(false);

  // (Opcional) valida token buscando /usuarios/me no primeiro load
  useEffect(() => {
    const bootstrap = async () => {
      if (!token) return;
      try {
        const me = await getMe();
        setAuth((prev) => ({ ...prev, user: me }));
      } catch {
        // token inválido/expirado
        clearSession();
        setAuth({ user: null, token: null });
      }
    };
    bootstrap();
  }, [token]);

  async function login(cnpj, senha) {
    setLoading(true);
    try {
      const data = await loginRequest({ cnpj, senha });
      saveSession(data);
      setAuth({ user: data.user, token: data.token });
      return { ok: true, user: data.user };
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "CNPJ ou senha inválidos.";
      return { ok: false, message: msg };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearSession();
    setAuth({ user: null, token: null });
  }

  const value = useMemo(
    () => ({ user, token, loading, login, logout, isAuthenticated: !!token }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
