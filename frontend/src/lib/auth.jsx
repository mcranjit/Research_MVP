import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./api";

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rm_user") || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("rm_token");
    if (!token) { setLoading(false); return; }
    auth.me().then((r) => {
      setUser(r.user);
      localStorage.setItem("rm_user", JSON.stringify(r.user));
    }).catch(() => {
      localStorage.removeItem("rm_token");
      localStorage.removeItem("rm_user");
      setUser(null);
    }).finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await auth.login({ email, password });
    localStorage.setItem("rm_token", r.token);
    localStorage.setItem("rm_user", JSON.stringify(r.user));
    setUser(r.user);
    return r.user;
  };

  const register = async (email, password, name) => {
    const r = await auth.register({ email, password, name });
    localStorage.setItem("rm_token", r.token);
    localStorage.setItem("rm_user", JSON.stringify(r.user));
    setUser(r.user);
    return r.user;
  };

  const logout = () => {
    localStorage.removeItem("rm_token");
    localStorage.removeItem("rm_user");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
