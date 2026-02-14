"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Edit, Trash2, X, Plus, Power, PowerOff } from "lucide-react";
import { fetchEvents, createEvent, updateEvent, deleteEvent, toggleEvent, type Event } from "@/lib/api";

// Helper function to get animation style
function getAnimationStyle(animationType: string): string {
  switch (animationType) {
    case "slide-vertical":
      return "slide-vertical 3s ease-in-out infinite";
    case "bounce":
      return "bounce 2s ease-in-out infinite";
    case "pulse":
      return "pulse 2s ease-in-out infinite";
    case "shake":
      return "shake 0.5s ease-in-out infinite";
    case "marquee":
      return "marquee 12s linear infinite";
    default:
      return "";
  }
}

export default function Eventos() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await fetchEvents();
      setEvents(eventsData);
      setError(null);
    } catch (err) {
      console.error("Error loading events:", err);
      setError("Error al cargar los eventos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowCreateModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowCreateModal(true);
  };

  const handleDeleteEvent = async (event: Event) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar este evento?`)) {
      return;
    }

    try {
      await deleteEvent(event.id);
      await loadEvents();
    } catch (err: any) {
      alert(`Error al eliminar el evento: ${err.message}`);
    }
  };

  const handleToggleEvent = async (event: Event) => {
    try {
      await toggleEvent(event.id);
      await loadEvents();
    } catch (err: any) {
      alert(`Error al cambiar el estado del evento: ${err.message}`);
    }
  };

  if (error) {
    return (
      <div className="px-8 pt-6 pb-8 min-h-screen">
        <PageHeader title="Eventos" description="Gestiona los eventos de la barra superior" />
        <div className="flex items-center justify-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <style jsx>{`
        @keyframes slide-vertical {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
      <PageHeader 
        title="Eventos" 
        description="Gestiona los eventos de la barra superior" 
      />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Eventos</h2>
        <button
          onClick={handleCreateEvent}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Evento</span>
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <>
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-[14px] border border-gray-200 p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-[14px] border border-gray-200 p-6 text-center">
            <p className="text-gray-600">No hay eventos disponibles</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-white rounded-[14px] border border-gray-200 p-6 relative">
              {/* Edit and Delete Icons */}
              <div className="absolute top-6 right-6 flex items-center gap-3">
                <button 
                  onClick={() => handleEditEvent(event)}
                  className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDeleteEvent(event)}
                  className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Preview */}
              <div className="mb-4 pr-20">
                <div 
                  className="rounded-lg p-3 mb-3 overflow-hidden"
                  style={{ 
                    backgroundColor: event.background_color,
                    color: event.text_color
                  }}
                >
                  <div 
                    className="text-sm font-medium text-center"
                    style={{
                      fontFamily: event.font_family || undefined,
                      animation: event.animation_type ? getAnimationStyle(event.animation_type) : undefined,
                    }}
                  >
                    {event.display_type === 'countdown' && event.countdown_end_date ? (
                      <span>Vista previa: {event.text} - Countdown hasta {new Date(event.countdown_end_date).toLocaleString('es-AR')}</span>
                    ) : (
                      <span>{event.text}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-gray-900">Evento</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    event.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {event.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Texto:</span> {event.text}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Tipo:</span> {event.display_type === 'countdown' ? 'Cuenta regresiva' : 'Texto fijo'}
                </div>
                {event.display_type === 'countdown' && event.countdown_end_date && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Fecha fin:</span> {new Date(event.countdown_end_date).toLocaleString('es-AR')}
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Color fondo:</span>
                    <div 
                      className="inline-block w-6 h-6 rounded border border-gray-300 ml-2 align-middle"
                      style={{ backgroundColor: event.background_color }}
                    ></div>
                    <span className="ml-2">{event.background_color}</span>
                  </div>
                  <div>
                    <span className="font-medium">Color texto:</span>
                    <div 
                      className="inline-block w-6 h-6 rounded border border-gray-300 ml-2 align-middle"
                      style={{ backgroundColor: event.text_color }}
                    ></div>
                    <span className="ml-2">{event.text_color}</span>
                  </div>
                </div>
                {(event.font_family || event.animation_type) && (
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                    {event.font_family && (
                      <div>
                        <span className="font-medium">Tipografía:</span>
                        <span className="ml-2" style={{ fontFamily: event.font_family }}>{event.font_family}</span>
                      </div>
                    )}
                    {event.animation_type && (
                      <div>
                        <span className="font-medium">Animación:</span>
                        <span className="ml-2 capitalize">{event.animation_type.replace('-', ' ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Toggle Button - Bottom Right */}
              <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => handleToggleEvent(event)}
                  className={`px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2 font-medium ${
                    event.is_active 
                      ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                  title={event.is_active ? "Desactivar evento" : "Activar evento"}
                >
                  {event.is_active ? (
                    <>
                      <Power className="w-4 h-4" />
                      <span>Desactivar</span>
                    </>
                  ) : (
                    <>
                      <PowerOff className="w-4 h-4" />
                      <span>Activar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Crear/Editar Evento */}
      {showCreateModal && (
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingEvent(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingEvent(null);
            loadEvents();
          }}
          event={editingEvent}
        />
      )}
    </div>
  );
}

// Componente Modal para crear/editar eventos
function CreateEventModal({ isOpen, onClose, onSuccess, event }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void; 
  event?: Event | null 
}) {
  const [formData, setFormData] = useState({
    text: "",
    background_color: "#111827",
    text_color: "#FFFFFF",
    is_active: false,
    display_type: "fixed" as "fixed" | "countdown",
    countdown_end_date: "",
    font_family: "",
    animation_type: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (event) {
        setFormData({
          text: event.text,
          background_color: event.background_color,
          text_color: event.text_color,
          is_active: event.is_active,
          display_type: event.display_type,
          countdown_end_date: event.countdown_end_date 
            ? new Date(event.countdown_end_date).toISOString().slice(0, 16)
            : "",
          font_family: event.font_family || "",
          animation_type: event.animation_type || "",
        });
      } else {
        setFormData({
          text: "",
          background_color: "#111827",
          text_color: "#FFFFFF",
          is_active: false,
          display_type: "fixed",
          countdown_end_date: "",
          font_family: "",
          animation_type: "",
        });
      }
    }
  }, [isOpen, event]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.text.trim()) {
      setError("El texto es requerido");
      return;
    }

    if (formData.display_type === "countdown" && !formData.countdown_end_date) {
      setError("La fecha de fin es requerida para cuenta regresiva");
      return;
    }

    try {
      setIsLoading(true);
      
      const eventData: any = {
        text: formData.text.trim(),
        background_color: formData.background_color,
        text_color: formData.text_color,
        is_active: formData.is_active,
        display_type: formData.display_type,
        font_family: formData.font_family || null,
        animation_type: formData.animation_type || null,
      };

      if (formData.display_type === "countdown" && formData.countdown_end_date) {
        eventData.countdown_end_date = new Date(formData.countdown_end_date).toISOString();
      } else {
        eventData.countdown_end_date = null;
      }

      if (event) {
        await updateEvent(event.id, eventData);
      } else {
        await createEvent(eventData);
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al guardar el evento");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[14px] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10 rounded-t-[14px]">
          <h2 className="text-xl font-semibold text-gray-900">
            {event ? "Editar Evento" : "Crear Evento"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-6 overflow-y-auto">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Preview */}
            <div>
              <label className={labelClass}>Vista Previa</label>
              <div 
                className="rounded-lg p-4 border border-gray-200 overflow-hidden"
                style={{ 
                  backgroundColor: formData.background_color,
                  color: formData.text_color
                }}
              >
                <div 
                  className="text-sm font-medium text-center"
                  style={{
                    fontFamily: formData.font_family || undefined,
                    animation: formData.animation_type ? getAnimationStyle(formData.animation_type) : undefined,
                  }}
                >
                  {formData.display_type === 'countdown' && formData.countdown_end_date ? (
                    <span>{formData.text || "Texto del evento"} - Countdown</span>
                  ) : (
                    <span>{formData.text || "Texto del evento"}</span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Texto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className={inputClass}
                placeholder="Ej: Black Friday 2025 - 25% de descuento"
                required
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Color de fondo <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className={inputClass + " flex-1"}
                    placeholder="#111827"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Color de texto <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.text_color}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className={inputClass + " flex-1"}
                    placeholder="#FFFFFF"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Tipo de visualización <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.display_type}
                onChange={(e) => setFormData({ ...formData, display_type: e.target.value as "fixed" | "countdown" })}
                className={inputClass}
                required
              >
                <option value="fixed">Texto fijo</option>
                <option value="countdown">Cuenta regresiva</option>
              </select>
            </div>

            {formData.display_type === "countdown" && (
              <div>
                <label className={labelClass}>
                  Fecha y hora de fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.countdown_end_date}
                  onChange={(e) => setFormData({ ...formData, countdown_end_date: e.target.value })}
                  className={inputClass}
                  required={formData.display_type === "countdown"}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Tipografía
                </label>
                <select
                  value={formData.font_family}
                  onChange={(e) => setFormData({ ...formData, font_family: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Default (Sistema)</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Times New Roman', Times, serif">Times New Roman</option>
                  <option value="'Courier New', Courier, monospace">Courier New</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                  <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                  <option value="Impact, sans-serif">Impact</option>
                  <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                  <option value="'Lucida Console', monospace">Lucida Console</option>
                  <option value="'Palatino Linotype', 'Book Antiqua', Palatino, serif">Palatino</option>
                  <option value="Tahoma, sans-serif">Tahoma</option>
                  <option value="'Arial Black', sans-serif">Arial Black</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Animación
                </label>
                <select
                  value={formData.animation_type}
                  onChange={(e) => setFormData({ ...formData, animation_type: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Sin animación</option>
                  <option value="slide-vertical">Deslizamiento vertical</option>
                  <option value="bounce">Rebote</option>
                  <option value="pulse">Pulso</option>
                  <option value="shake">Sacudida</option>
                  <option value="marquee">Desplazamiento continuo</option>
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Estado</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Activar evento</span>
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Al activar este evento, se desactivarán automáticamente los demás eventos.
              </p>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-end gap-3 z-10 rounded-b-[14px]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer font-medium"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (event ? "Guardando..." : "Creando...") : (event ? "Actualizar Evento" : "Crear Evento")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
