"use client";

import type { InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

interface CheckoutChoiceProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  type?: "checkbox" | "radio";
  /** Clases del contenedor (márgenes, etc.) */
  className?: string;
}

/** Checkbox / radio con la marca de selección en blanco (el nativo la dibuja según el contraste del navegador). */
export default function CheckoutChoice({ type = "checkbox", className = "", ...props }: CheckoutChoiceProps) {
  const isRadio = type === "radio";

  return (
    <span className={`relative inline-flex w-4 h-4 shrink-0 ${className}`}>
      <input
        type={type}
        {...props}
        className={`peer appearance-none w-4 h-4 border border-gray-300 bg-white cursor-pointer transition-colors checked:bg-[#00C1A7] checked:border-[#00C1A7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C1A7] focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
          isRadio ? "rounded-full" : "rounded"
        }`}
      />
      {isRadio ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100"
        />
      ) : (
        <Check
          aria-hidden
          strokeWidth={3}
          className="pointer-events-none absolute inset-0 m-auto w-3 h-3 text-white opacity-0 peer-checked:opacity-100"
        />
      )}
    </span>
  );
}
