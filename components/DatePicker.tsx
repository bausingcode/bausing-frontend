"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (fecha: string) => void;
  placeholder?: string;
  label?: string;
}

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const diasSemana = ["L", "M", "X", "J", "V", "S", "D"];

export default function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  label,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [vista, setVista] = useState<"dias" | "meses" | "años">("dias");
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hoy = new Date();
  const [mesActual, setMesActual] = useState(() =>
    value ? new Date(value + "T12:00:00") : new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  );
  const [añoVista, setAñoVista] = useState(value ? new Date(value).getFullYear() : hoy.getFullYear());

  const fechaSeleccionada = value ? new Date(value + "T12:00:00") : null;

  useEffect(() => {
    if (isOpen) {
      setVista("dias");
      if (value) {
        const d = new Date(value + "T12:00:00");
        setMesActual(new Date(d.getFullYear(), d.getMonth(), 1));
        setAñoVista(d.getFullYear());
      } else {
        setMesActual(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
        setAñoVista(hoy.getFullYear());
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsClosing(true);
        setTimeout(() => {
          setIsOpen(false);
          setIsClosing(false);
        }, 300);
      }
    };
    if (isOpen && !isClosing) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isClosing]);

  const formatearFecha = (fechaStr: string): string => {
    if (!fechaStr) return "";
    const fecha = new Date(fechaStr + "T12:00:00");
    return fecha.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const obtenerDiasDelMes = (fecha: Date) => {
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    const primerDia = new Date(año, mes, 1);
    const diaInicioSemana = (primerDia.getDay() + 6) % 7;
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const dias: (number | null)[] = [];
    for (let i = 0; i < diaInicioSemana; i++) dias.push(null);
    for (let i = 1; i <= diasEnMes; i++) dias.push(i);
    return dias;
  };

  const navegarMes = (dir: "anterior" | "siguiente") => {
    const d = new Date(mesActual);
    d.setMonth(d.getMonth() + (dir === "anterior" ? -1 : 1));
    setMesActual(d);
  };

  const navegarAño = (dir: "anterior" | "siguiente") => {
    setAñoVista((prev) => prev + (dir === "anterior" ? -1 : 1));
  };

  const seleccionarMes = (mes: number, año: number) => {
    setMesActual(new Date(año, mes, 1));
    setVista("dias");
  };

  const manejarClickFecha = (dia: number, mes: Date) => {
    const fecha = new Date(mes.getFullYear(), mes.getMonth(), dia);
    const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
    onChange(fechaStr);
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const irAHoy = () => {
    const hoy = new Date();
    const fechaStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    onChange(fechaStr);
    setMesActual(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    setAñoVista(hoy.getFullYear());
    setVista("dias");
  };

  const limpiar = () => {
    onChange("");
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const esSeleccionada = (fecha: Date) => {
    if (!fechaSeleccionada) return false;
    return (
      fecha.getDate() === fechaSeleccionada.getDate() &&
      fecha.getMonth() === fechaSeleccionada.getMonth() &&
      fecha.getFullYear() === fechaSeleccionada.getFullYear()
    );
  };

  const renderCalendario = (mes: Date) => {
    const dias = obtenerDiasDelMes(mes);
    const hoyNorm = new Date();
    hoyNorm.setHours(0, 0, 0, 0);

    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => (vista === "dias" ? navegarMes("anterior") : navegarAño("anterior"))}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-900"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (vista === "dias") {
                setVista("meses");
                setAñoVista(mes.getFullYear());
              } else if (vista === "meses") setVista("años");
            }}
            className="flex-1 text-xs font-semibold text-gray-900 px-1 text-center hover:text-gray-700 transition-colors"
          >
            {vista === "dias" && `${meses[mes.getMonth()]} ${mes.getFullYear()}`}
            {vista === "meses" && `${añoVista}`}
            {vista === "años" && `${Math.floor(añoVista / 12) * 12 - 1} – ${Math.floor(añoVista / 12) * 12 + 12}`}
          </button>
          <button
            type="button"
            onClick={() => (vista === "dias" ? navegarMes("siguiente") : navegarAño("siguiente"))}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-900"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0 mb-1">
          {diasSemana.map((dia) => (
            <div key={dia} className="text-center text-[10px] font-medium text-gray-500 py-0.5">
              {dia}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {dias.map((dia, index) => {
            if (dia === null) {
              return <div key={`empty-${index}`} className="h-7" />;
            }
            const fecha = new Date(mes.getFullYear(), mes.getMonth(), dia);
            fecha.setHours(0, 0, 0, 0);
            const seleccionada = esSeleccionada(fecha);
            const esHoy = fecha.getTime() === hoyNorm.getTime();

            return (
              <button
                key={`${mes.getMonth()}-${dia}`}
                type="button"
                onClick={() => manejarClickFecha(dia, mes)}
                className={`
                  relative h-7 w-full min-w-0 flex items-center justify-center text-xs transition-all duration-150 rounded-full
                  text-gray-900 cursor-pointer
                  ${!seleccionada ? "hover:bg-gray-100" : ""}
                  ${seleccionada ? "bg-gray-900 text-white hover:bg-gray-800 font-semibold z-20" : ""}
                  ${esHoy && !seleccionada ? "font-semibold text-gray-900 ring-1 ring-gray-900 ring-inset" : ""}
                `}
              >
                {dia}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderVistaMeses = () => (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => navegarAño("anterior")} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="flex-1 text-xs font-semibold text-gray-900 text-center">{añoVista}</span>
        <button type="button" onClick={() => navegarAño("siguiente")} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {meses.map((mes, index) => (
          <button
            key={index}
            type="button"
            onClick={() => seleccionarMes(index, añoVista)}
            className="px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-md font-medium"
          >
            {mes}
          </button>
        ))}
      </div>
    </div>
  );

  const renderVistaAños = () => {
    const añoBase = Math.floor(añoVista / 12) * 12;
    const años = Array.from({ length: 15 }, (_, i) => añoBase - 1 + i);
    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <button type="button" onClick={() => setAñoVista((p) => p - 12)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="flex-1 text-xs font-semibold text-gray-900 text-center">
            {añoBase - 1} – {añoBase + 13}
          </span>
          <button type="button" onClick={() => setAñoVista((p) => p + 12)} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {años.map((año) => (
            <button
              key={año}
              type="button"
              onClick={() => {
                setAñoVista(año);
                setVista("meses");
              }}
              className={`px-2 py-1.5 text-xs rounded-md font-medium ${
                año === añoVista ? "bg-gray-900 text-white hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {año}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 text-gray-800 bg-white hover:bg-gray-50/80 transition-colors flex items-center justify-between gap-2"
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className={value ? "text-gray-900 font-medium" : "text-gray-500"}>
            {value ? formatearFecha(value) : placeholder}
          </span>
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>

      <div
        className={`absolute left-0 top-full z-20 mt-1.5 transition-all duration-300 ease-out ${
          isOpen && !isClosing ? "max-h-[380px] opacity-100" : "max-h-0 opacity-0 overflow-hidden pointer-events-none"
        }`}
      >
        {(isOpen || isClosing) && (
          <div
            ref={popoverRef}
            className={`bg-white rounded-xl border border-gray-200 p-3 w-[280px] flex-shrink-0 ${
              isClosing ? "animate-slideUp" : "animate-slideDown"
            }`}
          >
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-900">Seleccionar fecha</h3>
              <button
                type="button"
                onClick={() => {
                  setIsClosing(true);
                  setTimeout(() => {
                    setIsOpen(false);
                    setIsClosing(false);
                  }, 300);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700"
                aria-label="Cerrar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {vista === "dias" && renderCalendario(mesActual)}
            {vista === "meses" && renderVistaMeses()}
            {vista === "años" && renderVistaAños()}
            {vista === "dias" && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <button type="button" onClick={limpiar} className="text-xs font-medium text-gray-900 hover:underline">
                  Limpiar
                </button>
                <button type="button" onClick={irAHoy} className="text-xs font-medium text-gray-900 hover:underline">
                  Hoy
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
