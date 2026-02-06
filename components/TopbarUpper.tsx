"use client";

import { useState, useEffect } from "react";
import { fetchActiveEvent, type Event } from "@/lib/api";

/**
 * Primera barra superior del sitio (la más arriba).
 * Muestra el evento activo si existe.
 */
function formatCountdown(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) {
    return "Finalizado";
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

interface TopbarUpperProps {
  initialEvent?: Event | null;
}

export default function TopbarUpper({ initialEvent }: TopbarUpperProps = {}) {
  const [event, setEvent] = useState<Event | null>(initialEvent ?? null);
  const [countdown, setCountdown] = useState<string>("");
  // Si initialEvent está definido (incluso si es null), no cargar
  const [loading, setLoading] = useState(initialEvent === undefined);

  // Solo hacer fetch si no se pasó initialEvent (undefined)
  useEffect(() => {
    // Si initialEvent fue pasado (incluso si es null), no hacer fetch
    if (initialEvent !== undefined) {
      setLoading(false);
      return;
    }

    const loadEvent = async () => {
      try {
        const activeEvent = await fetchActiveEvent();
        setEvent(activeEvent);
      } catch (error) {
        console.error("Error loading active event:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [initialEvent]);

  useEffect(() => {
    if (!event || event.display_type !== 'countdown' || !event.countdown_end_date) {
      return;
    }

    const endDate = new Date(event.countdown_end_date);
    setCountdown(formatCountdown(endDate));

    const interval = setInterval(() => {
      setCountdown(formatCountdown(endDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  // No mostrar nada si no hay evento activo o está cargando
  if (loading || !event) {
    return null;
  }

  const displayText = event.display_type === 'countdown' && event.countdown_end_date
    ? `${event.text} - ${countdown}`
    : event.text;

  return (
    <div 
      className="hidden md:block py-1"
      style={{ backgroundColor: event.background_color }}
    >
      <div className="container mx-auto px-4">
        <div 
          className="flex items-center justify-center gap-4 text-xs md:text-sm font-normal"
          style={{ color: event.text_color }}
        >
          <span>{displayText}</span>
        </div>
      </div>
    </div>
  );
}
