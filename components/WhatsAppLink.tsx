"use client";

import { useState, useEffect, ReactNode } from "react";

interface WhatsAppLinkProps {
  message: string;
  className?: string;
  children: ReactNode;
}

export default function WhatsAppLink({ message, className, children }: WhatsAppLinkProps) {
  const [whatsappUrl, setWhatsappUrl] = useState<string>("#");

  useEffect(() => {
    // Obtener el número de teléfono desde la API pública
    const fetchPhoneNumber = async () => {
      try {
        const response = await fetch("/api/settings/public/phone");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.phone) {
            // Limpiar el número de teléfono para WhatsApp (solo números)
            const cleanPhone = data.phone.replace(/\D/g, "");
            // Crear el enlace de WhatsApp con el mensaje codificado
            const encodedMessage = encodeURIComponent(message);
            setWhatsappUrl(`https://wa.me/${cleanPhone}?text=${encodedMessage}`);
          }
        }
      } catch (error) {
        console.error("Error fetching phone number:", error);
      }
    };

    fetchPhoneNumber();
  }, [message]);

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
