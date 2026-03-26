import { createContext, useContext, useMemo, useState } from "react";
import { apiRequest } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem("apthive_auth");
    return raw ? JSON.parse(raw) : { token: "", user: null };
  });

  async function login(payload) {
    const data = await apiRequest("/auth/login", { method: "POST", body: payload });
    const next = { token: data.token, user: data.user };
    setAuth(next);
    localStorage.setItem("apthive_auth", JSON.stringify(next));
  }

  async function register(payload) {
    const data = await apiRequest("/auth/register", { method: "POST", body: payload });
    const next = { token: data.token, user: data.user };
    setAuth(next);
    localStorage.setItem("apthive_auth", JSON.stringify(next));
  }

  function logout() {
    setAuth({ token: "", user: null });
    localStorage.removeItem("apthive_auth");
  }

  const value = useMemo(
    () => ({
      token: auth.token,
      user: auth.user,
      isLoggedIn: Boolean(auth.token),
      login,
      register,
      logout
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
