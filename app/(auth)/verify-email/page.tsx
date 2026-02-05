"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, CheckCircle, XCircle, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Status = "pending" | "verifying" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, updateUser } = useAuth();
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [hasVerified, setHasVerified] = useState(false);

  const token = searchParams.get("token");

  // Verificar email automáticamente al cargar (solo una vez)
  useEffect(() => {
    // Evitar múltiples verificaciones
    if (hasVerified || status !== "pending") {
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage("No se encontró el token de verificación. Por favor, verifica el enlace del email.");
      return;
    }

    const verifyEmail = async () => {
      setHasVerified(true);
      setStatus("verifying");
      setMessage("Verificando tu email...");

      try {
        const response = await fetch(`/api/auth/verify-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Error al verificar el email");
        }

        setStatus("success");
        setMessage("¡Email verificado correctamente! Tu cuenta ha sido activada.");

        // Si el usuario está autenticado, actualizar su estado
        if (isAuthenticated && data.data?.user) {
          updateUser({ email_verified: true });
        }

        // Redirigir después de 3 segundos
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Error al verificar el email. El token puede haber expirado o ser inválido.");
      }
    };

    verifyEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = async () => {
    // Verificar si el usuario está autenticado
    const token = localStorage.getItem("user_token");
    if (!token || !isAuthenticated) {
      setResendMessage("Debes iniciar sesión para reenviar el email de verificación.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
      return;
    }

    setResendLoading(true);
    setResendMessage("");

    try {
      const response = await fetch(`/api/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al reenviar el email");
      }

      setResendMessage("Email de verificación reenviado. Revisa tu bandeja de entrada.");
    } catch (err: any) {
      setResendMessage(err.message || "Error al reenviar el email de verificación");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Card */}
          <div className="bg-white rounded-[10px] border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                {status === "verifying" && (
                  <Loader2 className="h-12 w-12 text-[#00C1A7] animate-spin" />
                )}
                {status === "success" && (
                  <CheckCircle className="h-12 w-12 text-green-500" />
                )}
                {status === "error" && (
                  <XCircle className="h-12 w-12 text-red-500" />
                )}
                {status === "pending" && (
                  <Mail className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {status === "verifying" && "Verificando Email"}
                {status === "success" && "Email Verificado"}
                {status === "error" && "Error de Verificación"}
                {status === "pending" && "Verificar Email"}
              </h2>
              <p className="text-gray-600">
                {status === "verifying" && "Por favor espera..."}
                {status === "success" && "Tu cuenta ha sido verificada correctamente"}
                {status === "error" && "No se pudo verificar tu email"}
                {status === "pending" && "Procesando..."}
              </p>
            </div>

            {/* Message */}
            <div className="mb-6">
              {status === "success" && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">{message}</p>
                  <p className="text-xs text-green-600 mt-2">
                    Serás redirigido al login en unos segundos...
                  </p>
                </div>
              )}

              {status === "error" && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <p className="text-sm text-red-800">{message}</p>
                </div>
              )}

              {status === "verifying" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">{message}</p>
                </div>
              )}
            </div>

            {/* Resend Email Section (solo si hay error) */}
            {status === "error" && (
              <div className="space-y-4">
                {!isAuthenticated && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    Para reenviar el email de verificación, necesitas iniciar sesión primero.
                  </div>
                )}

                <button
                  onClick={handleResend}
                  disabled={resendLoading || !isAuthenticated}
                  className="w-full flex items-center justify-center gap-2 bg-[#00C1A7] text-white py-3 px-4 rounded-[4px] font-semibold hover:bg-[#00a892] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Reenviando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Reenviar Email de Verificación
                    </>
                  )}
                </button>

                {resendMessage && (
                  <div
                    className={`p-3 rounded-lg text-sm ${
                      resendMessage.includes("reenviado")
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : resendMessage.includes("iniciar sesión")
                        ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                        : "bg-red-50 border border-red-200 text-red-800"
                    }`}
                  >
                    {resendMessage}
                  </div>
                )}
              </div>
            )}

            {/* Success Actions */}
            {status === "success" && (
              <div className="space-y-4">
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 bg-[#00C1A7] text-white py-3 px-4 rounded-[4px] font-semibold hover:bg-[#00a892] transition-colors"
                >
                  Ir al Login
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}

            {/* Error Actions */}
            {status === "error" && (
              <div className="mt-6 space-y-3">
                <Link
                  href="/login"
                  className="block w-full text-center text-sm text-[#00C1A7] hover:text-[#00a892] transition-colors font-semibold"
                >
                  Volver al Login
                </Link>
              </div>
            )}
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
              <div className="bg-white rounded-[10px] border border-gray-200 p-8">
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <Loader2 className="h-12 w-12 text-[#00C1A7] animate-spin" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Cargando...
                  </h2>
                  <p className="text-gray-600">
                    Por favor espera...
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
