import React, { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("rbi_token");
    const saved = localStorage.getItem("rbi_user");
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (_) {
        localStorage.removeItem("rbi_token");
        localStorage.removeItem("rbi_user");
      }
    }
    setLoading(false);
  }, []);

  const getError = (err) =>
    err?.friendlyMessage || err?.response?.data?.message || err?.message || "Request failed";

  const login = async (email, password) => {
    try {
      const { data } = await client.post("/auth/login", {
        email,
        password,
      });
      localStorage.setItem("rbi_token", data.token);
      localStorage.setItem("rbi_user", JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (err) {
      throw new Error(getError(err));
    }
  };

  const register = async (payload) => {
    try {
      const { data } = await client.post("/auth/register", payload);
      localStorage.setItem("rbi_token", data.token);
      localStorage.setItem("rbi_user", JSON.stringify(data.user));
      setUser(data.user);
      return data;
    } catch (err) {
      throw new Error(getError(err));
    }
  };

  const logout = () => {
    localStorage.removeItem("rbi_token");
    localStorage.removeItem("rbi_user");
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { data } = await client.get("/auth/me");
      localStorage.setItem("rbi_user", JSON.stringify(data));
      setUser(data);
      return data;
    } catch (err) {
      localStorage.removeItem("rbi_token");
      localStorage.removeItem("rbi_user");
      setUser(null);
      throw new Error(getError(err));
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
