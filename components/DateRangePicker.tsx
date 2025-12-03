"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";

interface DateRangePickerProps {
  fechaDesde: string;
  fechaHasta: string;
  onFechaDesdeChange: (fecha: string) => void;
  onFechaHastaChange: (fecha: string) => void;
  showTitle?: boolean;
}

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const diasSemana = ["L", "M", "X", "J", "V", "S", "D"];

export default function DateRangePicker({
  fechaDesde,
  fechaHasta,
  onFechaDesdeChange,
  onFechaHastaChange,
  showTitle = true,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [vista, setVista] = useState<"dias" | "meses" | "años">("dias");
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hoy = new Date();
  const [mesActual, setMesActual] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [añoVista, setAñoVista] = useState(hoy.getFullYear());

  // Resetear vista cuando se abre el selector
  useEffect(() => {
    if (isOpen) {
      setVista("dias");
      setAñoVista(mesActual.getFullYear());
    }
  }, [isOpen]);
  const [fechaInicioSeleccionada, setFechaInicioSeleccionada] = useState<Date | null>(
    fechaDesde ? new Date(fechaDesde) : null
  );
  const [fechaFinSeleccionada, setFechaFinSeleccionada] = useState<Date | null>(
    fechaHasta ? new Date(fechaHasta) : null
  );

  // Sincronizar estado interno con props cuando cambien desde fuera
  useEffect(() => {
    if (fechaDesde) {
      setFechaInicioSeleccionada(new Date(fechaDesde));
    } else {
      setFechaInicioSeleccionada(null);
    }
  }, [fechaDesde]);

  useEffect(() => {
    if (fechaHasta) {
      setFechaFinSeleccionada(new Date(fechaHasta));
    } else {
      setFechaFinSeleccionada(null);
    }
  }, [fechaHasta]);

  // Cerrar popover al hacer clic fuera
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
        }, 500);
      }
    };

    if (isOpen && !isClosing) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isClosing]);

  const formatearFecha = (fechaStr: string): string => {
    if (!fechaStr) return "";
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const obtenerTextoBoton = (): string => {
    if (fechaDesde && fechaHasta) {
      return `${formatearFecha(fechaDesde)} - ${formatearFecha(fechaHasta)}`;
    } else if (fechaDesde) {
      return `Desde ${formatearFecha(fechaDesde)}`;
    }
    return "Seleccionar fechas";
  };

  const obtenerDiasDelMes = (fecha: Date) => {
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = (primerDia.getDay() + 6) % 7; // Lunes = 0

    const dias: (number | null)[] = [];
    // Agregar días vacíos al inicio
    for (let i = 0; i < diaInicioSemana; i++) {
      dias.push(null);
    }
    // Agregar días del mes
    for (let i = 1; i <= diasEnMes; i++) {
      dias.push(i);
    }
    return dias;
  };

  const navegarMes = (direccion: "anterior" | "siguiente") => {
    const nuevoMes = new Date(mesActual);
    if (direccion === "anterior") {
      nuevoMes.setMonth(nuevoMes.getMonth() - 1);
    } else {
      nuevoMes.setMonth(nuevoMes.getMonth() + 1);
    }
    setMesActual(nuevoMes);
  };

  const navegarAño = (direccion: "anterior" | "siguiente") => {
    if (vista === "meses") {
      setAñoVista((prev) => (direccion === "anterior" ? prev - 1 : prev + 1));
    } else if (vista === "años") {
      setAñoVista((prev) => {
        const nuevoAño = direccion === "anterior" ? prev - 12 : prev + 12;
        return nuevoAño;
      });
    }
  };

  const renderVistaMeses = () => {
    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navegarAño("anterior")}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setVista("años")}
            className="flex-1 text-xs font-medium text-gray-900 hover:text-blue-600 transition-colors px-2 text-center"
          >
            {añoVista}
          </button>
          <button
            onClick={() => navegarAño("siguiente")}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {meses.map((mes, index) => (
            <button
              key={index}
              onClick={() => seleccionarMes(index, añoVista)}
              className="px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {mes}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderVistaAños = () => {
    const años: number[] = [];
    const añoBase = Math.floor(añoVista / 12) * 12;
    for (let i = añoBase - 1; i <= añoBase + 12; i++) {
      años.push(i);
    }

    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navegarAño("anterior")}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="flex-1 text-xs font-medium text-gray-900 px-2 text-center">
            {Math.floor(añoVista / 12) * 12 - 1} - {Math.floor(añoVista / 12) * 12 + 12}
          </span>
          <button
            onClick={() => navegarAño("siguiente")}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {años.map((año) => (
            <button
              key={año}
              onClick={() => {
                setAñoVista(año);
                setVista("meses");
              }}
              className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                año === añoVista
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {año}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const esFechaEnRango = (fecha: Date): boolean => {
    if (!fechaInicioSeleccionada || !fechaFinSeleccionada) return false;
    return fecha >= fechaInicioSeleccionada && fecha <= fechaFinSeleccionada;
  };

  const esFechaInicio = (fecha: Date): boolean => {
    if (!fechaInicioSeleccionada) return false;
    return (
      fecha.getDate() === fechaInicioSeleccionada.getDate() &&
      fecha.getMonth() === fechaInicioSeleccionada.getMonth() &&
      fecha.getFullYear() === fechaInicioSeleccionada.getFullYear()
    );
  };

  const esFechaFin = (fecha: Date): boolean => {
    if (!fechaFinSeleccionada) return false;
    return (
      fecha.getDate() === fechaFinSeleccionada.getDate() &&
      fecha.getMonth() === fechaFinSeleccionada.getMonth() &&
      fecha.getFullYear() === fechaFinSeleccionada.getFullYear()
    );
  };

  const seleccionarMes = (mes: number, año: number) => {
    setMesActual(new Date(año, mes, 1));
    setVista("dias");
  };


  const manejarClickFecha = (dia: number, mes: Date) => {
    const fecha = new Date(mes.getFullYear(), mes.getMonth(), dia);
    fecha.setHours(0, 0, 0, 0);

    if (!fechaInicioSeleccionada || (fechaInicioSeleccionada && fechaFinSeleccionada)) {
      // Seleccionar nueva fecha de inicio
      setFechaInicioSeleccionada(fecha);
      setFechaFinSeleccionada(null);
      const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
      onFechaDesdeChange(fechaStr);
      onFechaHastaChange("");
    } else if (fechaInicioSeleccionada && !fechaFinSeleccionada) {
      // Seleccionar fecha de fin
      if (fecha < fechaInicioSeleccionada) {
        // Si la fecha seleccionada es anterior a la de inicio, intercambiar
        setFechaFinSeleccionada(fechaInicioSeleccionada);
        setFechaInicioSeleccionada(fecha);
        const fechaInicioStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
        const fechaFinStr = `${fechaInicioSeleccionada.getFullYear()}-${String(fechaInicioSeleccionada.getMonth() + 1).padStart(2, "0")}-${String(fechaInicioSeleccionada.getDate()).padStart(2, "0")}`;
        onFechaDesdeChange(fechaInicioStr);
        onFechaHastaChange(fechaFinStr);
      } else {
        setFechaFinSeleccionada(fecha);
        const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
        onFechaHastaChange(fechaStr);
      }
    }
  };

  const esFechaEnRangoMedio = (fecha: Date): boolean => {
    if (!fechaInicioSeleccionada || !fechaFinSeleccionada) return false;
    return fecha > fechaInicioSeleccionada && fecha < fechaFinSeleccionada;
  };

  const renderCalendario = (mes: Date) => {
    const dias = obtenerDiasDelMes(mes);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => {
              if (vista === "dias") {
                navegarMes("anterior");
              } else {
                navegarAño("anterior");
              }
            }}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => {
              if (vista === "dias") {
                setVista("meses");
                setAñoVista(mes.getFullYear());
              } else if (vista === "meses") {
                setVista("años");
              }
            }}
            className="flex-1 text-xs font-medium text-gray-900 hover:text-blue-600 transition-colors px-2 text-center"
          >
            {vista === "dias" && `${meses[mes.getMonth()]} ${mes.getFullYear()}`}
            {vista === "meses" && `${añoVista}`}
            {vista === "años" && `${Math.floor(añoVista / 12) * 12 - 1} - ${Math.floor(añoVista / 12) * 12 + 12}`}
          </button>
          <button
            onClick={() => {
              if (vista === "dias") {
                navegarMes("siguiente");
              } else {
                navegarAño("siguiente");
              }
            }}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {diasSemana.map((dia) => (
            <div key={dia} className="text-center text-[10px] font-medium text-gray-500 py-1">
              {dia}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {dias.map((dia, index) => {
            if (dia === null) {
              return <div key={`empty-${index}`} className="h-8" />;
            }

            const fecha = new Date(mes.getFullYear(), mes.getMonth(), dia);
            fecha.setHours(0, 0, 0, 0);
            const esPasado = false; // Permitir seleccionar cualquier fecha
            const enRango = esFechaEnRango(fecha);
            const enRangoMedio = esFechaEnRangoMedio(fecha);
            const esInicio = esFechaInicio(fecha);
            const esFin = esFechaFin(fecha);
            const esHoy = fecha.getTime() === hoy.getTime();

            // Determinar posición en la semana para el estilo del rango
            const posicionSemana = index % 7;
            const esPrimerDiaSemana = posicionSemana === 0;
            const esUltimoDiaSemana = posicionSemana === 6;

            return (
              <button
                key={`${mes.getMonth()}-${dia}`}
                onClick={() => !esPasado && manejarClickFecha(dia, mes)}
                disabled={esPasado}
                className={`
                  relative h-8 w-8 flex items-center justify-center text-xs transition-colors z-10
                  ${esPasado ? "text-gray-300 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100 cursor-pointer"}
                  
                  ${enRangoMedio ? "bg-blue-50" : ""}
                  
                  ${esInicio ? "bg-blue-600 text-white hover:bg-blue-700 z-20" : ""}
                  ${esFin ? "bg-blue-600 text-white hover:bg-blue-700 z-20" : ""}
                  
                  ${esInicio && !esFin ? (esUltimoDiaSemana ? "rounded-lg" : "rounded-l-lg") : ""}
                  ${esFin && !esInicio ? (esPrimerDiaSemana ? "rounded-lg" : "rounded-r-lg") : ""}
                  ${esInicio && esFin ? "rounded-lg" : ""}
                  ${!esInicio && !esFin && enRangoMedio ? "rounded-none" : ""}
                  
                  ${esHoy && !esInicio && !esFin && !enRango ? "border-2 border-blue-500 rounded-lg" : ""}
                  
                  ${!esInicio && !esFin && !enRango && !esHoy && !esPasado && !enRangoMedio ? "rounded-lg" : ""}
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

  return (
    <div className="relative">
      {showTitle && !isOpen && (
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Rango de Fechas
        </label>
      )}
      {!isOpen && (
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(true)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className={fechaDesde || fechaHasta ? "text-gray-900" : "text-gray-500"}>
              {obtenerTextoBoton()}
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      )}

      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          isOpen && !isClosing ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {(isOpen || isClosing) && (
          <div
            ref={popoverRef}
            className={`bg-white rounded-lg border border-gray-200 shadow-xl p-4 w-full ${
              isClosing ? "animate-slideUp" : "animate-slideDown"
            }`}
            style={{ minWidth: "280px" }}
          >
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Rango de Fechas</h3>
            <button
              onClick={() => {
                setIsClosing(true);
                setTimeout(() => {
                  setIsOpen(false);
                  setIsClosing(false);
                }, 500);
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
            </div>
            {vista === "dias" && renderCalendario(mesActual)}
            {vista === "meses" && renderVistaMeses()}
            {vista === "años" && renderVistaAños()}
          </div>
        )}
      </div>
    </div>
  );
}

