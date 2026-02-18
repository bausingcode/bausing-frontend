"use client";

import PageHeader from "@/components/PageHeader";
import Loader from "@/components/Loader";
import { Wallet, Bell, Mail, Shield, Save, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { 
  getAppSettings, 
  updateWalletSettings, 
  updateMessageTemplates, 
  updateNotificationSettings,
  updateGeneralSettings
} from "@/lib/api";

export default function Configuracion() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [walletConfig, setWalletConfig] = useState({
    montoFijo: "",
    montoMinimo: "",
    porcentajeMaximo: "",
    vencimiento: "",
    permitirAcumulacion: false,
  });

  const [notificaciones, setNotificaciones] = useState({
    nuevosPedidos: false,
    erroresPagos: false,
    stockBajo: false,
    movimientosInusuales: false,
    reclamosClientes: false,
  });

  const [mensajes, setMensajes] = useState({
    acreditacion: "",
    confirmacion: "",
    enCamino: "",
  });

  const [seguridad, setSeguridad] = useState({
    montoMaximoCarga: "",
    registrarCambios: false,
    comentarioObligatorio: false,
  });

  const [general, setGeneral] = useState({
    telefono: "",
    diasEstimadosEnvio: "",
    email: "",
    direccion: "",
    instagramUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
    precioPorKm: "",
  });

  // Estados originales para comparar cambios
  const [originalWalletConfig, setOriginalWalletConfig] = useState(walletConfig);
  const [originalNotificaciones, setOriginalNotificaciones] = useState(notificaciones);
  const [originalMensajes, setOriginalMensajes] = useState(mensajes);
  const [originalSeguridad, setOriginalSeguridad] = useState(seguridad);
  const [originalGeneral, setOriginalGeneral] = useState(general);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await getAppSettings();
      
      // Crear objetos con los valores cargados
      const newWalletConfig = {
        montoFijo: settings.wallet.montoFijo !== undefined ? String(settings.wallet.montoFijo) : "",
        montoMinimo: settings.wallet.montoMinimo !== undefined ? String(settings.wallet.montoMinimo) : "",
        porcentajeMaximo: settings.wallet.porcentajeMaximo !== undefined ? String(settings.wallet.porcentajeMaximo) : "",
        vencimiento: settings.wallet.vencimiento !== undefined ? String(settings.wallet.vencimiento) : "",
        permitirAcumulacion: settings.wallet.permitirAcumulacion ?? false,
      };
      const newNotificaciones = {
        nuevosPedidos: settings.notifications.nuevosPedidos ?? false,
        erroresPagos: settings.notifications.erroresPagos ?? false,
        stockBajo: settings.notifications.stockBajo ?? false,
        movimientosInusuales: settings.notifications.movimientosInusuales ?? false,
        reclamosClientes: settings.notifications.reclamosClientes ?? false,
      };
      const newMensajes = {
        acreditacion: settings.messages.acreditacion || "",
        confirmacion: settings.messages.confirmacion || "",
        enCamino: settings.messages.enCamino || "",
      };
      const newSeguridad = {
        montoMaximoCarga: settings.security.montoMaximoCarga !== undefined ? String(settings.security.montoMaximoCarga) : "",
        registrarCambios: settings.security.registrarCambios ?? false,
        comentarioObligatorio: settings.security.comentarioObligatorio ?? false,
      };
      const newGeneral = {
        telefono: settings.general?.telefono || "",
        diasEstimadosEnvio: settings.general?.diasEstimadosEnvio !== undefined ? String(settings.general.diasEstimadosEnvio) : "3",
        email: settings.general?.email || "",
        direccion: settings.general?.direccion || "",
        instagramUrl: settings.general?.instagramUrl || "",
        facebookUrl: settings.general?.facebookUrl || "",
        tiktokUrl: settings.general?.tiktokUrl || "",
        precioPorKm: settings.general?.precioPorKm !== undefined ? String(settings.general.precioPorKm) : "105",
      };

      // Establecer valores actuales y originales (son iguales al cargar)
      setWalletConfig(newWalletConfig);
      setNotificaciones(newNotificaciones);
      setMensajes(newMensajes);
      setSeguridad(newSeguridad);
      setGeneral(newGeneral);
      
      setOriginalWalletConfig(newWalletConfig);
      setOriginalNotificaciones(newNotificaciones);
      setOriginalMensajes(newMensajes);
      setOriginalSeguridad(newSeguridad);
      setOriginalGeneral(newGeneral);
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({ type: 'error', text: 'Error al cargar la configuración' });
    } finally {
      setLoading(false);
    }
  };

  // Función para detectar si hay cambios sin guardar
  const hasUnsavedChanges = () => {
    return (
      JSON.stringify(walletConfig) !== JSON.stringify(originalWalletConfig) ||
      JSON.stringify(notificaciones) !== JSON.stringify(originalNotificaciones) ||
      JSON.stringify(mensajes) !== JSON.stringify(originalMensajes) ||
      JSON.stringify(seguridad) !== JSON.stringify(originalSeguridad) ||
      JSON.stringify(general) !== JSON.stringify(originalGeneral)
    );
  };

  // Función para validar y actualizar valores numéricos
  const handleNumberChange = (value: string, min: number = 0, max?: number) => {
    // Permitir campo vacío mientras se escribe
    if (value === '') {
      return value;
    }
    
    // Convertir a número
    const numValue = parseFloat(value);
    
    // Si no es un número válido, retornar vacío
    if (isNaN(numValue)) {
      return '';
    }
    
    // Aplicar límites
    if (numValue < min) {
      return String(min);
    }
    if (max !== undefined && numValue > max) {
      return String(max);
    }
    
    return value;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Convertir valores a números donde sea necesario, solo si tienen valor
      const walletData: any = {};
      if (walletConfig.montoFijo && !isNaN(parseFloat(walletConfig.montoFijo))) {
        walletData.montoFijo = parseFloat(walletConfig.montoFijo);
      }
      if (walletConfig.montoMinimo && !isNaN(parseFloat(walletConfig.montoMinimo))) {
        walletData.montoMinimo = parseFloat(walletConfig.montoMinimo);
      }
      if (walletConfig.porcentajeMaximo && !isNaN(parseFloat(walletConfig.porcentajeMaximo))) {
        walletData.porcentajeMaximo = parseFloat(walletConfig.porcentajeMaximo);
      }
      if (walletConfig.vencimiento && !isNaN(parseFloat(walletConfig.vencimiento))) {
        walletData.vencimiento = parseFloat(walletConfig.vencimiento);
      }
      walletData.permitirAcumulacion = walletConfig.permitirAcumulacion;

      // Preparar datos de general con conversión numérica
      const generalData: any = {};
      generalData.telefono = general.telefono;
      generalData.email = general.email;
      generalData.direccion = general.direccion;
      generalData.instagramUrl = general.instagramUrl;
      generalData.facebookUrl = general.facebookUrl;
      generalData.tiktokUrl = general.tiktokUrl;
      if (general.diasEstimadosEnvio && !isNaN(parseFloat(general.diasEstimadosEnvio))) {
        generalData.diasEstimadosEnvio = parseFloat(general.diasEstimadosEnvio);
      }
      if (general.precioPorKm && !isNaN(parseFloat(general.precioPorKm))) {
        generalData.precioPorKm = parseFloat(general.precioPorKm);
      }

      // Guardar cada sección
      await updateWalletSettings(walletData);
      await updateMessageTemplates(mensajes);
      await updateNotificationSettings(notificaciones);
      await updateGeneralSettings(generalData);

      // Actualizar valores originales después de guardar
      setOriginalWalletConfig(walletConfig);
      setOriginalNotificaciones(notificaciones);
      setOriginalMensajes(mensajes);
      setOriginalSeguridad(seguridad);
      setOriginalGeneral(general);

      setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setMessage({ type: 'error', text: error.message || 'Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-8 pt-6 pb-8 min-h-screen">
        <Loader message="Cargando configuración..." fullScreen={false} />
      </div>
    );
  }

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen relative">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Configuración</h1>
        <p className="text-sm text-gray-600">Ajusta las preferencias de tu panel</p>
      </div>

      {/* Mensaje de éxito/error */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6 pb-4">
        {/* Configuración de Billetera */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
              <Wallet className="w-5 h-5 text-gray-700" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Configuración de Billetera</h2>
          </div>

          <div className="space-y-6">
            {/* Monto fijo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto fijo de Pesos Bausing por compra
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={walletConfig.montoFijo}
                  onChange={(e) => {
                    const validated = handleNumberChange(e.target.value, 0);
                    setWalletConfig({ ...walletConfig, montoFijo: validated });
                  }}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Los clientes recibirán este monto fijo en Pesos Bausing por cada compra
              </p>
            </div>

            {/* Monto mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto mínimo de compra para acreditar Pesos Bausing
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={walletConfig.montoMinimo}
                  onChange={(e) => {
                    const validated = handleNumberChange(e.target.value, 0);
                    setWalletConfig({ ...walletConfig, montoMinimo: validated });
                  }}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Solo se acreditan Pesos Bausing en compras superiores a este monto
              </p>
            </div>

            {/* Porcentaje máximo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Porcentaje máximo de uso de billetera por compra
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={walletConfig.porcentajeMaximo}
                  onChange={(e) => {
                    const validated = handleNumberChange(e.target.value, 0, 100);
                    setWalletConfig({ ...walletConfig, porcentajeMaximo: validated });
                  }}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
                <span className="text-gray-600">%</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Límite de Pesos Bausing que el cliente puede usar en una compra
              </p>
            </div>

            {/* Vencimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vencimiento de Pesos Bausing
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={walletConfig.vencimiento}
                  onChange={(e) => {
                    const validated = handleNumberChange(e.target.value, 0);
                    setWalletConfig({ ...walletConfig, vencimiento: validated });
                  }}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
                <span className="text-gray-600">días</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Los Pesos Bausing vencen después de este período sin uso
              </p>
            </div>

          </div>
        </div>

        {/* Configuración General */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
              <Phone className="w-5 h-5 text-gray-700" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Configuración General</h2>
          </div>

          <div className="space-y-6">
            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de teléfono de Bausing
              </label>
              <input
                type="tel"
                value={general.telefono}
                onChange={(e) => setGeneral({ ...general, telefono: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                placeholder="Ej: +54 11 1234-5678"
              />
              <p className="text-sm text-gray-500 mt-1">
                Número de teléfono que se mostrará a los clientes para contacto
              </p>
            </div>

            {/* Días estimados de envío */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Días estimados para envío de pedidos
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={general.diasEstimadosEnvio}
                  onChange={(e) => {
                    const validated = handleNumberChange(e.target.value, 1);
                    setGeneral({ ...general, diasEstimadosEnvio: validated });
                  }}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
                <span className="text-gray-600">días</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Cantidad de días estimados para la entrega de pedidos (usado en el panel de logística)
              </p>
            </div>

            {/* Precio por kilómetro */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio por kilómetro de envío
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={general.precioPorKm}
                  onChange={(e) => {
                    const validated = handleNumberChange(e.target.value, 0);
                    setGeneral({ ...general, precioPorKm: validated });
                  }}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Precio en pesos argentinos por cada kilómetro de distancia para calcular el costo de envío
              </p>
            </div>

            {/* Email de contacto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de contacto
              </label>
              <input
                type="email"
                value={general.email}
                onChange={(e) => setGeneral({ ...general, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                placeholder="Ej: hola@bausing.com"
              />
              <p className="text-sm text-gray-500 mt-1">
                Email que se mostrará en el footer del sitio
              </p>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección física
              </label>
              <input
                type="text"
                value={general.direccion}
                onChange={(e) => setGeneral({ ...general, direccion: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                placeholder="Ej: Av. Corrientes 1234, Córdoba, Argentina"
              />
              <p className="text-sm text-gray-500 mt-1">
                Dirección que se mostrará en el footer del sitio
              </p>
            </div>

            {/* Redes Sociales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Redes Sociales
              </label>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">
                    Instagram URL
                  </label>
                  <input
                    type="url"
                    value={general.instagramUrl}
                    onChange={(e) => setGeneral({ ...general, instagramUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    placeholder="https://instagram.com/bausing"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    value={general.facebookUrl}
                    onChange={(e) => setGeneral({ ...general, facebookUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    placeholder="https://facebook.com/bausing"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1.5">
                    TikTok URL
                  </label>
                  <input
                    type="url"
                    value={general.tiktokUrl}
                    onChange={(e) => setGeneral({ ...general, tiktokUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    placeholder="https://tiktok.com/@bausing"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                URLs de las redes sociales que se mostrarán en el footer
              </p>
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
              <Bell className="w-5 h-5 text-gray-700" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Notificaciones</h2>
          </div>

          <div className="space-y-4">
            {[
              { key: 'nuevosPedidos', label: 'Nuevos pedidos', description: 'Recibe notificación cuando hay un nuevo pedido' },
              { key: 'erroresPagos', label: 'Errores en pagos', description: 'Alerta cuando hay problemas con pagos' },
              { key: 'stockBajo', label: 'Stock bajo', description: 'Aviso cuando un producto tiene poco stock' },
              { key: 'movimientosInusuales', label: 'Movimientos inusuales en billetera', description: 'Detectar actividad sospechosa en Pesos Bausing' },
              { key: 'reclamosClientes', label: 'Reclamos de clientes', description: 'Notificar cuando un cliente abre un reclamo' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {item.label}
                  </label>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={notificaciones[item.key as keyof typeof notificaciones]}
                    onChange={(e) => setNotificaciones({ ...notificaciones, [item.key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Mensajes Automáticos */}
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
              <Mail className="w-5 h-5 text-gray-700" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Mensajes Automáticos</h2>
          </div>

          <div className="space-y-6">
            {/* Mensaje de acreditación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje de acreditación de Pesos Bausing
              </label>
              <textarea
                value={mensajes.acreditacion}
                onChange={(e) => setMensajes({ ...mensajes, acreditacion: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
                placeholder="Escribe tu mensaje aquí..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Variables disponibles: <span className="font-mono text-gray-700">(nombre)</span>, <span className="font-mono text-gray-700">(monto)</span>, <span className="font-mono text-gray-700">(pedido)</span>
              </p>
            </div>

            {/* Confirmación de pedido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmación de pedido
              </label>
              <textarea
                value={mensajes.confirmacion}
                onChange={(e) => setMensajes({ ...mensajes, confirmacion: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
                placeholder="Escribe tu mensaje aquí..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Variables disponibles: <span className="font-mono text-gray-700">(nombre)</span>, <span className="font-mono text-gray-700">(pedido)</span>, <span className="font-mono text-gray-700">(total)</span>
              </p>
            </div>

            {/* Pedido en reparto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pedido en reparto
              </label>
              <textarea
                value={mensajes.enCamino}
                onChange={(e) => setMensajes({ ...mensajes, enCamino: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
                placeholder="Escribe tu mensaje aquí..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Variables disponibles: <span className="font-mono text-gray-700">(nombre)</span>, <span className="font-mono text-gray-700">(pedido)</span>, <span className="font-mono text-gray-700">(tracking)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Seguridad
        <div className="bg-white rounded-[14px] border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
              <Shield className="w-5 h-5 text-gray-700" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Seguridad</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto máximo de carga manual de billetera sin aprobación
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={seguridad.montoMaximoCarga}
                  onChange={(e) => {
                    const validated = handleNumberChange(e.target.value, 0);
                    setSeguridad({ ...seguridad, montoMaximoCarga: validated });
                  }}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Cargas superiores requieren aprobación de un supervisor
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registrar todos los cambios en la base de datos
                </label>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={seguridad.registrarCambios}
                  onChange={(e) => setSeguridad({ ...seguridad, registrarCambios: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requerir comentario obligatorio en ajustes manuales
                </label>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={seguridad.comentarioObligatorio}
                  onChange={(e) => setSeguridad({ ...seguridad, comentarioObligatorio: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div> */}

      </div>

      {/* Barra flotante para cambios sin guardar */}
      {hasUnsavedChanges() && (
        <div className="sticky bottom-6 bg-white border border-gray-200 shadow-2xl rounded-lg px-6 py-4 z-50 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Tienes cambios sin guardar</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

