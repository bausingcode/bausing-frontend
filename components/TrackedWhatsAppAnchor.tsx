"use client";

import { ReactNode } from "react";
import { trackWhatsAppClick } from "@/lib/whatsappTrack";

interface TrackedWhatsAppAnchorProps {
  href: string;
  className?: string;
  children: ReactNode;
}

/** Ancla a WhatsApp con click-tracking, para usar dentro de Server Components. */
export default function TrackedWhatsAppAnchor({ href, className, children }: TrackedWhatsAppAnchorProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackWhatsAppClick("contact")}
      className={className}
    >
      {children}
    </a>
  );
}
