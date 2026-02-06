"use client";

import { useState, useEffect } from "react";

/**
 * Primera barra superior del sitio (la más arriba).
 * Muestra la hora actual en formato 24h.
 */
function formatTime24(date: Date) {
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  const s = date.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function TopbarUpper() {
  const [time, setTime] = useState(() => formatTime24(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime24(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden md:block bg-gray-900 py-1">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-4 text-xs md:text-sm text-gray-300">
          <span className="font-normal tabular-nums">{time}</span>
        </div>
      </div>
    </div>
  );
}
