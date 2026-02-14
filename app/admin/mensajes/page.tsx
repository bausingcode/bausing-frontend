"use client";

import { useState, useRef } from "react";
import PageHeader from "@/components/PageHeader";
import { Mail, Send, Wallet, Loader2, Image as ImageIcon, X } from "lucide-react";
import { sendPromotionalEmails, sendWalletReminders, uploadEmailImageFile } from "@/lib/api";

export default function Mensajes() {
  const [loadingPromo, setLoadingPromo] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletSuccess, setWalletSuccess] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const predefinedTemplates = [
    {
      id: "promo1",
      name: "Oferta especial",
      subject: "¡Oferta especial para ti!",
      content: "Hola {{nombre}},\n\nTenemos una oferta especial que no te puedes perder. ¡Aprovecha ahora!\n\nSaludos,\nEl equipo de Bausing"
    },
    {
      id: "promo2",
      name: "Nuevos productos",
      subject: "Descubre nuestros nuevos productos",
      content: "Hola {{nombre}},\n\nTenemos nuevos productos que estamos seguros te van a encantar. ¡Échales un vistazo!\n\nSaludos,\nEl equipo de Bausing"
    },
    {
      id: "promo3",
      name: "Descuento exclusivo",
      subject: "Descuento exclusivo para ti",
      content: "Hola {{nombre}},\n\nComo cliente especial, queremos ofrecerte un descuento exclusivo. ¡No te lo pierdas!\n\nSaludos,\nEl equipo de Bausing"
    }
  ];

  const handleTemplateSelect = (template: typeof predefinedTemplates[0]) => {
    setSelectedTemplate(template.id);
    setMessage(template.content);
    setSubject(template.subject);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setPromoError("Por favor, selecciona un archivo de imagen válido");
        return;
      }
      
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendPromotional = async () => {
    if (!message.trim()) {
      setPromoError("Por favor, ingresa un mensaje");
      return;
    }

    if (!subject.trim()) {
      setPromoError("Por favor, ingresa un título para el email");
      return;
    }

    setLoadingPromo(true);
    setPromoError(null);
    setPromoSuccess(null);

    try {
      // Upload image if one is selected
      let finalImageUrl: string | undefined = undefined;
      if (selectedImage) {
        try {
          finalImageUrl = await uploadEmailImageFile(selectedImage);
        } catch (err: any) {
          setPromoError(err.message || "Error al subir la imagen");
          setLoadingPromo(false);
          return;
        }
      }

      const result = await sendPromotionalEmails({
        subject: subject.trim(),
        message: message.trim(),
        user_filter: userFilter,
        image_url: finalImageUrl
      });

      if (result.success) {
        setPromoSuccess(`Mensaje enviado exitosamente a ${result.sent_count} usuarios`);
        setMessage("");
        setSubject("");
        setSelectedTemplate("");
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setPromoError(result.error || "Error al enviar los mensajes");
      }
    } catch (err: any) {
      setPromoError(err.message || "Error al enviar los mensajes");
    } finally {
      setLoadingPromo(false);
    }
  };

  const handleSendWalletReminders = async () => {
    if (!confirm("¿Estás seguro de que deseas enviar recordatorios de billetera a todos los usuarios con saldo próximo a vencer?")) {
      return;
    }

    setLoadingWallet(true);
    setWalletError(null);
    setWalletSuccess(null);

    try {
      const result = await sendWalletReminders();

      if (result.success) {
        setWalletSuccess(`Recordatorios enviados exitosamente a ${result.sent_count} usuarios`);
      } else {
        setWalletError(result.error || "Error al enviar los recordatorios");
      }
    } catch (err: any) {
      setWalletError(err.message || "Error al enviar los recordatorios");
    } finally {
      setLoadingWallet(false);
    }
  };

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader 
        title="Mensajes" 
        description="Envía mensajes promocionales y recordatorios a los usuarios" 
      />

      <div className="space-y-6">
        {/* Sección de mensajes promocionales */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Mensajes Promocionales</h2>
          </div>

          <div className="space-y-4">
            {/* Plantillas predefinidas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plantillas predefinidas
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {predefinedTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      selectedTemplate === template.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium text-gray-900 mb-1">{template.name}</div>
                    <div className="text-xs text-gray-500 line-clamp-2">{template.subject}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Título del email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título del email (Asunto) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej: ¡Oferta especial para ti!"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            </div>

            {/* Filtro de usuarios */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enviar a
              </label>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              >
                <option value="all">Todos los usuarios</option>
                <option value="with_orders">Solo usuarios con compras</option>
                <option value="without_orders">Solo usuarios sin compras</option>
                <option value="with_wallet">Solo usuarios con saldo en billetera</option>
                <option value="with_wallet_balance">Solo usuarios con saldo mayor a $0</option>
                <option value="verified">Solo usuarios con email verificado</option>
                <option value="recent">Usuarios registrados en los últimos 30 días</option>
              </select>
            </div>

            {/* Editor de mensaje */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí. Puedes usar {{nombre}} para personalizar el saludo."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white min-h-[200px] resize-y"
                rows={8}
              />
              <div className="mt-2 text-xs text-gray-500">
                <p>• Usa <code className="bg-gray-100 px-1 rounded">{'{{nombre}}'}</code> para personalizar con el nombre del usuario</p>
                <p>• Puedes incluir tu propio saludo personalizado en el mensaje</p>
                <p>• El mensaje se enviará según el filtro seleccionado</p>
              </div>
            </div>

            {/* Imagen del email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen del email (opcional)
              </label>
              <div className="space-y-3">
                {!selectedImage && (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP hasta 10MB</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelect}
                      />
                    </label>
                  </div>
                )}

                {selectedImage && (
                  <div className="relative">
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      {imagePreview && (
                        <div className="mb-3">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-w-full h-auto max-h-64 rounded-lg mx-auto"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {selectedImage.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">La imagen se subirá al enviar el email</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="ml-3 p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <p>• La imagen se comprimirá y subirá automáticamente al enviar el email</p>
                <p>• La imagen aparecerá en el email antes del mensaje</p>
              </div>
            </div>

            {promoError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {promoError}
              </div>
            )}

            {promoSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {promoSuccess}
              </div>
            )}

            <button
              onClick={handleSendPromotional}
              disabled={loadingPromo || !message.trim() || !subject.trim()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
            >
              {loadingPromo ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Enviar a todos los usuarios</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sección de recordatorios de billetera */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recordatorios de Billetera</h2>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Envía recordatorios automáticos a todos los usuarios que tienen saldo en su billetera que vence próximamente.
            El mensaje les recordará que utilicen su saldo antes de que expire.
          </p>

          {walletError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {walletError}
            </div>
          )}

          {walletSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
              {walletSuccess}
            </div>
          )}

          <button
            onClick={handleSendWalletReminders}
            disabled={loadingWallet}
            className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
          >
            {loadingWallet ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Enviando recordatorios...</span>
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                <span>Enviar recordatorios de billetera</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
