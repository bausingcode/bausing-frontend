"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isTokenExpired, safeRedirectPath } from "@/lib/authSession";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  dni?: string;
  gender?: string;
  birth_date?: string;
  email_verified: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (updates: Partial<User>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  dni?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Cargar sesión desde localStorage al iniciar
  useEffect(() => {
    const loadSession = () => {
      try {
        const storedToken = localStorage.getItem("user_token");
        const storedUser = localStorage.getItem("user_data");
        
        if (storedToken && isTokenExpired(storedToken)) {
          // Sesión vencida: limpiar para que no figure como logueado
          localStorage.removeItem("user_token");
          localStorage.removeItem("user_data");
          setToken(null);
          setUser(null);
        } else if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error loading session:", error);
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_data");
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // Escuchar cambios en localStorage para actualizar el estado automáticamente
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_token' || e.key === 'user_data') {
        loadSession();
      }
    };

    // Escuchar eventos personalizados para actualizar el estado inmediatamente
    const handleAuthStateChanged = (e: CustomEvent) => {
      if (e.detail?.user && e.detail?.token) {
        // Actualizar estado inmediatamente sin esperar
        setUser(e.detail.user);
        setToken(e.detail.token);
        // Asegurar que localStorage esté sincronizado
        localStorage.setItem("user_token", e.detail.token);
        localStorage.setItem("user_data", JSON.stringify(e.detail.user));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authStateChanged', handleAuthStateChanged as EventListener);

    // Si el backend rechaza el token del usuario (401), la sesión venció: cerrarla
    // y mandar al login volviendo a la página actual.
    const originalFetch = window.fetch;
    let handlingExpiry = false;
    window.fetch = async (input, init) => {
      const response = await originalFetch(input, init);
      if (response.status !== 401 || handlingExpiry) return response;

      const userToken = localStorage.getItem("user_token");
      const authHeader = new Headers(
        init?.headers ?? (input instanceof Request ? input.headers : undefined)
      ).get("Authorization");
      if (!userToken || authHeader !== `Bearer ${userToken}`) return response;

      handlingExpiry = true;
      localStorage.removeItem("user_token");
      localStorage.removeItem("user_data");
      setUser(null);
      setToken(null);
      const current = window.location.pathname + window.location.search;
      router.replace(`/login?expired=1&redirect=${encodeURIComponent(current)}`);
      window.setTimeout(() => { handlingExpiry = false; }, 1000);
      return response;
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChanged', handleAuthStateChanged as EventListener);
      window.fetch = originalFetch;
    };
  }, [router]);

  const login = async (email: string, password: string) => {
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5050';
      const url = `/api/auth/login`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      const { user: userData, token: userToken } = data.data;
      
      // Guardar en localStorage
      localStorage.setItem("user_token", userToken);
      localStorage.setItem("user_data", JSON.stringify(userData));
      
      setUser(userData);
      setToken(userToken);
      
      // Redirigir inmediatamente después de actualizar el estado
      router.replace(safeRedirectPath(new URLSearchParams(window.location.search).get("redirect")));
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const url = `/api/auth/register`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Error al registrarse");
      }

      const { user: userData, token: userToken } = result.data;
      
      // Guardar en localStorage
      localStorage.setItem("user_token", userToken);
      localStorage.setItem("user_data", JSON.stringify(userData));
      
      setUser(userData);
      setToken(userToken);
      
      // Redirigir inmediatamente después de actualizar el estado
      router.replace("/");
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_data");
    setUser(null);
    setToken(null);
    router.push("/");
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev, ...updates };
      // Persist the updated user locally so we can reflect changes immediately
      localStorage.setItem("user_data", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

