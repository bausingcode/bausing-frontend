"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ConstructionGateClient() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const from = searchParams.get("from") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/construction-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, from }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        redirect?: string;
      };
      if (!res.ok) {
        setError(data.error || "No se pudo validar la clave");
        setLoading(false);
        return;
      }
      const next = data.redirect && data.redirect.startsWith("/") ? data.redirect : "/";
      router.replace(next);
      router.refresh();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div className="space-y-1.5">
        <label
          htmlFor="construction-key"
          className="block text-sm font-medium text-gray-700"
        >
          Clave de acceso
        </label>
        <input
          id="construction-key"
          name="key"
          type="password"
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00C1A7]/20 focus:border-[#00C1A7] transition-all"
          placeholder="Ingresá la clave"
          required
        />
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#00C1A7] hover:bg-[#00a88f] disabled:opacity-60 transition-colors"
      >
        {loading ? "Verificando…" : "Ingresar al sitio"}
      </button>
    </form>
  );
}
