"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface CheckoutSelectOption {
  value: string;
  label: string;
}

interface CheckoutSelectProps {
  value: string;
  options: CheckoutSelectOption[];
  onChange: (value: string) => void;
  /** Se dispara cuando el foco sale del componente (trigger + lista) */
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  /** Clases del botón disparador (borde, padding, redondeo) */
  triggerClassName?: string;
  /** Clases del contenedor (ancho, flex) */
  className?: string;
}

export default function CheckoutSelect({
  value,
  options,
  onChange,
  onBlur,
  placeholder = "Seleccionar",
  disabled = false,
  ariaLabel,
  triggerClassName = "",
  className = "",
}: CheckoutSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const openList = () => {
    if (disabled) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const closeList = () => setOpen(false);

  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    closeList();
  };

  // Cerrar al hacer clic/tocar fuera
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        closeList();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  // Mantener visible la opción activa al navegar con teclado
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || options.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) openList();
        else setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) openList();
        else setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        if (open) {
          event.preventDefault();
          setActiveIndex(0);
        }
        break;
      case "End":
        if (open) {
          event.preventDefault();
          setActiveIndex(options.length - 1);
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!open) openList();
        else choose(activeIndex);
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          closeList();
        }
        break;
      case "Tab":
        if (open) closeList();
        break;
      default: {
        // Búsqueda por primera letra
        if (event.key.length === 1 && /\S/.test(event.key)) {
          const start = open ? activeIndex + 1 : selectedIndex + 1;
          const ordered = [...options.slice(start), ...options.slice(0, start)];
          const hit = ordered.findIndex((o) =>
            o.label.toLowerCase().startsWith(event.key.toLowerCase()),
          );
          if (hit >= 0) {
            const index = (start + hit) % options.length;
            if (open) setActiveIndex(index);
            else onChange(options[index].value);
          }
        }
      }
    }
  };

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
          closeList();
          onBlur?.();
        }
      }}
    >
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 bg-white text-left text-sm focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${triggerClassName}`}
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          className="absolute left-0 top-full z-30 mt-1 min-w-full w-max max-w-[min(20rem,calc(100vw-2rem))] max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {options.length === 0 ? (
            <li className="px-4 py-2 text-sm text-gray-500">Sin opciones</li>
          ) : (
            options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  // mousedown evita que el botón pierda el foco antes de elegir
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex items-center justify-between gap-3 px-4 py-2 text-sm cursor-pointer ${
                    isActive ? "bg-[#00C1A7]/10" : ""
                  } ${isSelected ? "font-medium text-gray-900" : "text-gray-700"}`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-[#00C1A7] shrink-0" aria-hidden />}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
