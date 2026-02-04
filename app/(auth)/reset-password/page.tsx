"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Validar el token al cargar la página
  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setTokenValid(false);
      return;
    }

    // Verificar que el token tenga el formato correcto (JWT tiene 3 partes separadas por puntos)
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      setTokenValid(false);
      return;
    }

    // El token parece válido, se validará completamente en el backend al enviar
    setTokenValid(true);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    const token = searchParams.get("token");
    if (!token) {
      setError("Token de restablecimiento no válido");
      setTokenValid(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al restablecer la contraseña");
      }

      setSuccess(true);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Error al restablecer la contraseña");
      // Si el error es de token inválido o expirado, marcar como inválido
      if (err.message && (err.message.includes("expirado") || err.message.includes("inválido"))) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-8 px-4">
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-8">
              <div className="flex justify-center mb-8">
                <img
                  src="/images/logo/logobausing1.svg"
                  alt="Bausing Logo"
                  className="h-10 w-auto"
                />
              </div>
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Lock className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Enlace inválido
                </h3>
                <p className="text-sm text-gray-600">
                  Este enlace de restablecimiento de contraseña no es válido o ha expirado.
                </p>
                <Link
                  href="/forgot-password"
                  className="block w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium text-[#00C1A7] bg-[#00C1A7]/10 hover:bg-[#00C1A7]/20 border border-[#00C1A7]/20 transition-all mt-4"
                >
                  Solicitar nuevo enlace
                </Link>
                <Link
                  href="/login"
                  className="block w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all"
                >
                  Volver al login
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-8 px-4">
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-8">
              <div className="flex justify-center mb-8">
                <img
                  src="/images/logo/logobausing1.svg"
                  alt="Bausing Logo"
                  className="h-10 w-auto"
                />
              </div>
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Contraseña restablecida
                </h3>
                <p className="text-sm text-gray-600">
                  Tu contraseña ha sido restablecida exitosamente.
                </p>
                <p className="text-xs text-gray-500">
                  Serás redirigido al login en unos segundos...
                </p>
                <Link
                  href="/login"
                  className="block w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium bg-[#00C1A7] text-white hover:bg-[#00a892] transition-all mt-4"
                >
                  Ir al login
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img
                src="/images/logo/logobausing1.svg"
                alt="Bausing Logo"
                className="h-10 w-auto"
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center mb-2">
                <p className="text-sm text-gray-600">
                  Ingresa tu nueva contraseña
                </p>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00C1A7]/20 focus:border-[#00C1A7] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00C1A7]/20 focus:border-[#00C1A7] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#00C1A7] text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-[#00a892] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Restableciendo...</span>
                  </>
                ) : (
                  <>
                    <span>Restablecer contraseña</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400">o</span>
              </div>
            </div>

            {/* Back to Login Link */}
            <Link
              href="/login"
              className="block w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all"
            >
              Volver al login
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
