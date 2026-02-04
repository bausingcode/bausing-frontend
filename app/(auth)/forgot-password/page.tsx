"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al enviar el email de recuperación");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Error al enviar el email de recuperación");
    } finally {
      setLoading(false);
    }
  };

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

            {success ? (
              <div className="space-y-5">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Mail className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Email enviado
                  </h3>
                  <p className="text-sm text-gray-600">
                    Te hemos enviado un enlace para restablecer tu contraseña a <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    Revisa tu bandeja de entrada y sigue las instrucciones.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="block w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all"
                >
                  Volver al login
                </Link>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="text-center mb-2">
                    <p className="text-sm text-gray-600">
                      Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
                    </p>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#00C1A7]/20 focus:border-[#00C1A7] transition-all"
                        placeholder="tu@email.com"
                      />
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
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar enlace</span>
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
                  <div className="flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver al login</span>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
