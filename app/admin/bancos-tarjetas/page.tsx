"use client";

import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Save, X, RefreshCw, CreditCard, Building2 } from "lucide-react";
import {
  CardType,
  Bank,
  CardBankInstallment,
  fetchCardTypes,
  fetchBanks,
  fetchInstallments,
  createCardType,
  updateCardType,
  deleteCardType,
  createBank,
  updateBank,
  deleteBank,
  createInstallment,
  updateInstallment,
  deleteInstallment,
} from "@/lib/api";

type Tab = "card-types" | "banks" | "installments";

export default function BancosTarjetasPage() {
  const [activeTab, setActiveTab] = useState<Tab>("card-types");
  const [cardTypes, setCardTypes] = useState<CardType[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [installments, setInstallments] = useState<CardBankInstallment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Estados para edición
  const [editingCardType, setEditingCardType] = useState<string | null>(null);
  const [editingBank, setEditingBank] = useState<string | null>(null);
  const [editingInstallment, setEditingInstallment] = useState<string | null>(null);
  
  // Estados para formularios
  const [cardTypeForm, setCardTypeForm] = useState({ code: "", name: "", is_active: true, display_order: 0 });
  const [bankForm, setBankForm] = useState({ name: "", is_active: true, display_order: 0 });
  const [installmentForm, setInstallmentForm] = useState({
    card_type_id: "",
    bank_id: "",
    installments: 1,
    surcharge_percentage: 0,
    is_active: true,
    display_order: 0,
  });
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Agrupar installments por tarjeta y banco para mejor visualización
  const groupedInstallments = useMemo(() => {
    const grouped: Record<string, Record<string, CardBankInstallment[]>> = {};
    
    installments.forEach(inst => {
      const cardTypeId = inst.card_type_id;
      const bankId = inst.bank_id;
      
      if (!grouped[cardTypeId]) {
        grouped[cardTypeId] = {};
      }
      if (!grouped[cardTypeId][bankId]) {
        grouped[cardTypeId][bankId] = [];
      }
      
      grouped[cardTypeId][bankId].push(inst);
    });
    
    // Ordenar las cuotas dentro de cada grupo
    Object.keys(grouped).forEach(cardTypeId => {
      Object.keys(grouped[cardTypeId]).forEach(bankId => {
        grouped[cardTypeId][bankId].sort((a, b) => a.installments - b.installments);
      });
    });
    
    return grouped;
  }, [installments]);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const [cardTypesData, banksData, installmentsData] = await Promise.all([
        fetchCardTypes(false),
        fetchBanks(false),
        fetchInstallments(),
      ]);
      setCardTypes(cardTypesData);
      setBanks(banksData);
      setInstallments(installmentsData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert(error instanceof Error ? error.message : "Error al cargar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Card Types handlers
  const startEditCardType = (cardType: CardType) => {
    setEditingCardType(cardType.id);
    setCardTypeForm({
      code: cardType.code,
      name: cardType.name,
      is_active: cardType.is_active,
      display_order: cardType.display_order,
    });
  };

  const cancelEditCardType = () => {
    setEditingCardType(null);
    setCardTypeForm({ code: "", name: "", is_active: true, display_order: 0 });
  };

  const saveCardType = async (cardTypeId: string) => {
    try {
      setIsSaving(true);
      await updateCardType(cardTypeId, cardTypeForm);
      await refreshData();
      cancelEditCardType();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCardType = async () => {
    try {
      setIsSaving(true);
      await createCardType(cardTypeForm);
      await refreshData();
      setShowCreateModal(false);
      setCardTypeForm({ code: "", name: "", is_active: true, display_order: 0 });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al crear");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCardType = async (cardTypeId: string) => {
    if (!confirm("¿Estás seguro de eliminar este tipo de tarjeta?")) return;
    try {
      await deleteCardType(cardTypeId);
      await refreshData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  // Banks handlers
  const startEditBank = (bank: Bank) => {
    setEditingBank(bank.id);
    setBankForm({
      name: bank.name,
      is_active: bank.is_active,
      display_order: bank.display_order,
    });
  };

  const cancelEditBank = () => {
    setEditingBank(null);
    setBankForm({ name: "", is_active: true, display_order: 0 });
  };

  const saveBank = async (bankId: string) => {
    try {
      setIsSaving(true);
      await updateBank(bankId, bankForm);
      await refreshData();
      cancelEditBank();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateBank = async () => {
    try {
      setIsSaving(true);
      await createBank(bankForm);
      await refreshData();
      setShowCreateModal(false);
      setBankForm({ name: "", is_active: true, display_order: 0 });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al crear");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBank = async (bankId: string) => {
    if (!confirm("¿Estás seguro de eliminar este banco?")) return;
    try {
      await deleteBank(bankId);
      await refreshData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  // Installments handlers
  const startEditInstallment = (installment: CardBankInstallment) => {
    setEditingInstallment(installment.id);
    setInstallmentForm({
      card_type_id: installment.card_type_id,
      bank_id: installment.bank_id,
      installments: installment.installments,
      surcharge_percentage: installment.surcharge_percentage,
      is_active: installment.is_active,
      display_order: installment.display_order,
    });
  };

  const cancelEditInstallment = () => {
    setEditingInstallment(null);
    setInstallmentForm({
      card_type_id: "",
      bank_id: "",
      installments: 1,
      surcharge_percentage: 0,
      is_active: true,
      display_order: 0,
    });
  };

  const saveInstallment = async (installmentId: string) => {
    try {
      setIsSaving(true);
      await updateInstallment(installmentId, installmentForm);
      await refreshData();
      cancelEditInstallment();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateInstallment = async () => {
    try {
      setIsSaving(true);
      await createInstallment(installmentForm);
      await refreshData();
      setShowCreateModal(false);
      setInstallmentForm({
        card_type_id: "",
        bank_id: "",
        installments: 1,
        surcharge_percentage: 0,
        is_active: true,
        display_order: 0,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al crear");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteInstallment = async (installmentId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta cuota?")) return;
    try {
      await deleteInstallment(installmentId);
      await refreshData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  const getCardTypeName = (cardTypeId: string) => {
    return cardTypes.find(ct => ct.id === cardTypeId)?.name || cardTypeId;
  };

  const getBankName = (bankId: string) => {
    return banks.find(b => b.id === bankId)?.name || bankId;
  };

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader
        title="Bancos y Tarjetas"
        description="Gestiona los tipos de tarjeta, bancos y cuotas disponibles"
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-normal" style={{ color: '#484848' }}>
          {activeTab === "card-types" ? "Tipos de Tarjeta" : activeTab === "banks" ? "Bancos" : "Cuotas"}
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("card-types")}
              className={`px-4 py-2 rounded-[6px] text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === "card-types"
                  ? "text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              style={activeTab === "card-types" ? { backgroundColor: '#155DFC' } : {}}
            >
              <CreditCard className="w-4 h-4" />
              Tipos de Tarjeta
            </button>
            <button
              onClick={() => setActiveTab("banks")}
              className={`px-4 py-2 rounded-[6px] text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === "banks"
                  ? "text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              style={activeTab === "banks" ? { backgroundColor: '#155DFC' } : {}}
            >
              <Building2 className="w-4 h-4" />
              Bancos
            </button>
            <button
              onClick={() => setActiveTab("installments")}
              className={`px-4 py-2 rounded-[6px] text-sm font-medium transition-colors ${
                activeTab === "installments"
                  ? "text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              style={activeTab === "installments" ? { backgroundColor: '#155DFC' } : {}}
            >
              Cuotas
            </button>
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#155DFC' }}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refrescar
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 cursor-pointer"
            style={{ backgroundColor: '#155DFC' }}
          >
            <Plus className="w-4 h-4" />
            {activeTab === "card-types" ? "Nuevo Tipo" : activeTab === "banks" ? "Nuevo Banco" : "Nueva Cuota"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 blur-2xl animate-pulse"></div>
              <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin relative"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando...</h3>
          </div>
        ) : (
          <>
            {/* Card Types Tab */}
            {activeTab === "card-types" && (
              <div className="divide-y divide-gray-200">
                {cardTypes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay tipos de tarjeta</h3>
                    <p className="text-gray-500 mb-4">Crea tu primer tipo de tarjeta para comenzar</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 cursor-pointer"
                      style={{ backgroundColor: '#155DFC' }}
                    >
                      <Plus className="w-4 h-4" />
                      Crear Tipo de Tarjeta
                    </button>
                  </div>
                ) : (
                  cardTypes.map((cardType) => (
                    <div key={cardType.id} className="p-6 hover:bg-gray-50 transition-colors">
                      {editingCardType === cardType.id ? (
                        <div className="space-y-4">
                          <div className="pb-3 border-b border-gray-200">
                            <h4 className="text-base font-semibold text-gray-900">Editar Tipo de Tarjeta</h4>
                            <p className="text-sm text-gray-500 mt-1">Modifica los datos del tipo de tarjeta</p>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                              <input
                                type="text"
                                value={cardTypeForm.code}
                                onChange={(e) => setCardTypeForm({ ...cardTypeForm, code: e.target.value })}
                                className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                                placeholder="visa, mastercard, amex"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                              <input
                                type="text"
                                value={cardTypeForm.name}
                                onChange={(e) => setCardTypeForm({ ...cardTypeForm, name: e.target.value })}
                                className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                                placeholder="Visa, Mastercard, etc."
                              />
                            </div>
                            <div className="flex items-center gap-6">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={cardTypeForm.is_active}
                                  onChange={(e) => setCardTypeForm({ ...cardTypeForm, is_active: e.target.checked })}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Activo</span>
                              </label>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Orden de visualización</label>
                                <input
                                  type="number"
                                  value={cardTypeForm.display_order}
                                  onChange={(e) => setCardTypeForm({ ...cardTypeForm, display_order: parseInt(e.target.value) || 0 })}
                                  className="w-20 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                            <button
                              onClick={() => saveCardType(cardType.id)}
                              disabled={isSaving}
                              className="px-4 py-2 text-sm font-medium text-white rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2 disabled:opacity-50"
                              style={{ backgroundColor: '#10b981' }}
                            >
                              <Save className="w-4 h-4" />
                              Guardar cambios
                            </button>
                            <button
                              onClick={cancelEditCardType}
                              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-[6px] hover:bg-gray-200 transition-colors cursor-pointer flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{cardType.name}</h3>
                              <p className="text-sm text-gray-500 mt-1">Código: {cardType.code}</p>
                            </div>
                            <span className={`px-3 py-1 text-sm rounded-full ${cardType.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                              {cardType.is_active ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditCardType(cardType)}
                              className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                              title="Editar tipo de tarjeta"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCardType(cardType.id)}
                              className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                              title="Eliminar tipo de tarjeta"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Banks Tab */}
            {activeTab === "banks" && (
              <div className="divide-y divide-gray-200">
                {banks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay bancos</h3>
                    <p className="text-gray-500 mb-4">Crea tu primer banco para comenzar</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 cursor-pointer"
                      style={{ backgroundColor: '#155DFC' }}
                    >
                      <Plus className="w-4 h-4" />
                      Crear Banco
                    </button>
                  </div>
                ) : (
                  banks.map((bank) => (
                    <div key={bank.id} className="p-6 hover:bg-gray-50 transition-colors">
                      {editingBank === bank.id ? (
                        <div className="space-y-4">
                          <div className="pb-3 border-b border-gray-200">
                            <h4 className="text-base font-semibold text-gray-900">Editar Banco</h4>
                            <p className="text-sm text-gray-500 mt-1">Modifica los datos del banco</p>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del banco</label>
                              <input
                                type="text"
                                value={bankForm.name}
                                onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
                                className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                                placeholder="Banco Nación, Banco Galicia, etc."
                              />
                            </div>
                            <div className="flex items-center gap-6">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={bankForm.is_active}
                                  onChange={(e) => setBankForm({ ...bankForm, is_active: e.target.checked })}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">Activo</span>
                              </label>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Orden de visualización</label>
                                <input
                                  type="number"
                                  value={bankForm.display_order}
                                  onChange={(e) => setBankForm({ ...bankForm, display_order: parseInt(e.target.value) || 0 })}
                                  className="w-20 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                            <button
                              onClick={() => saveBank(bank.id)}
                              disabled={isSaving}
                              className="px-4 py-2 text-sm font-medium text-white rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2 disabled:opacity-50"
                              style={{ backgroundColor: '#10b981' }}
                            >
                              <Save className="w-4 h-4" />
                              Guardar cambios
                            </button>
                            <button
                              onClick={cancelEditBank}
                              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-[6px] hover:bg-gray-200 transition-colors cursor-pointer flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{bank.name}</h3>
                            </div>
                            <span className={`px-3 py-1 text-sm rounded-full ${bank.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                              {bank.is_active ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditBank(bank)}
                              className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                              title="Editar banco"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBank(bank.id)}
                              className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                              title="Eliminar banco"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Installments Tab - Con selects agrupados */}
            {activeTab === "installments" && (
              <div className="divide-y divide-gray-200">
                {Object.keys(groupedInstallments).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay cuotas configuradas</h3>
                    <p className="text-gray-500 mb-4">Crea tu primera cuota para comenzar</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 cursor-pointer"
                      style={{ backgroundColor: '#155DFC' }}
                    >
                      <Plus className="w-4 h-4" />
                      Crear Cuota
                    </button>
                  </div>
                ) : (
                  cardTypes
                    .filter(ct => groupedInstallments[ct.id])
                    .map((cardType) => {
                      const cardTypeInstallments = groupedInstallments[cardType.id];
                      const isExpanded = expandedItems.has(cardType.id);
                      
                      return (
                        <div key={cardType.id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <button
                                onClick={() => toggleItem(cardType.id)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-5 h-5 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-gray-600" />
                                )}
                              </button>
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">{cardType.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {Object.keys(cardTypeInstallments).length} banco{Object.keys(cardTypeInstallments).length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="mt-4 ml-8 space-y-4">
                              {Object.keys(cardTypeInstallments).map((bankId) => {
                                const bankInstallments = cardTypeInstallments[bankId];
                                const bank = banks.find(b => b.id === bankId);
                                const bankKey = `${cardType.id}-${bankId}`;
                                const isBankExpanded = expandedItems.has(bankKey);
                                
                                return (
                                  <div key={bankId} className="border border-gray-200 rounded-[6px] p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={() => toggleItem(bankKey)}
                                          className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                                        >
                                          {isBankExpanded ? (
                                            <ChevronDown className="w-4 h-4 text-gray-600" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4 text-gray-600" />
                                          )}
                                        </button>
                                        <h4 className="text-base font-medium text-gray-900">
                                          {bank?.name || bankId}
                                        </h4>
                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                          {bankInstallments.length} cuota{bankInstallments.length !== 1 ? 's' : ''}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {isBankExpanded && (
                                      <div className="ml-8 space-y-2">
                                        {bankInstallments.map((installment) => (
                                          <div key={installment.id} className="border border-gray-200 rounded-[6px] p-3 bg-gray-50">
                                            {editingInstallment === installment.id ? (
                                              <div className="space-y-4">
                                                <div className="pb-2 border-b border-gray-200">
                                                  <h5 className="text-sm font-semibold text-gray-900">Editar Cuota</h5>
                                                  <p className="text-xs text-gray-500 mt-0.5">Modifica los datos de la cuota</p>
                                                </div>
                                                <div className="space-y-3">
                                                  <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                      <label className="block text-sm font-medium text-gray-700 mb-1">Número de cuotas</label>
                                                      <input
                                                        type="number"
                                                        value={installmentForm.installments}
                                                        onChange={(e) => setInstallmentForm({ ...installmentForm, installments: parseInt(e.target.value) || 1 })}
                                                        className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                                                        min="1"
                                                        placeholder="1"
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-sm font-medium text-gray-700 mb-1">Recargo porcentual (%)</label>
                                                      <input
                                                        type="number"
                                                        step="0.01"
                                                        value={installmentForm.surcharge_percentage}
                                                        onChange={(e) => setInstallmentForm({ ...installmentForm, surcharge_percentage: parseFloat(e.target.value) || 0 })}
                                                        className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                                                        min="0"
                                                        placeholder="0.00"
                                                      />
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-6">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                      <input
                                                        type="checkbox"
                                                        checked={installmentForm.is_active}
                                                        onChange={(e) => setInstallmentForm({ ...installmentForm, is_active: e.target.checked })}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                      />
                                                      <span className="text-sm text-gray-700">Activo</span>
                                                    </label>
                                                    <div>
                                                      <label className="block text-sm font-medium text-gray-700 mb-1">Orden de visualización</label>
                                                      <input
                                                        type="number"
                                                        value={installmentForm.display_order}
                                                        onChange={(e) => setInstallmentForm({ ...installmentForm, display_order: parseInt(e.target.value) || 0 })}
                                                        className="w-20 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                                                        placeholder="0"
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                                  <button
                                                    onClick={() => saveInstallment(installment.id)}
                                                    disabled={isSaving}
                                                    className="px-3 py-1.5 text-sm font-medium text-white rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                                    style={{ backgroundColor: '#10b981' }}
                                                  >
                                                    <Save className="w-3.5 h-3.5" />
                                                    Guardar cambios
                                                  </button>
                                                  <button
                                                    onClick={cancelEditInstallment}
                                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 rounded-[6px] hover:bg-gray-200 transition-colors cursor-pointer flex items-center gap-1.5"
                                                  >
                                                    <X className="w-3.5 h-3.5" />
                                                    Cancelar
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                  <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                      {installment.installments} cuota{installment.installments !== 1 ? 's' : ''}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                      {installment.surcharge_percentage === 0 
                                                        ? "Sin recargo" 
                                                        : `${installment.surcharge_percentage}% recargo`}
                                                    </p>
                                                  </div>
                                                  <span className={`px-2 py-1 text-xs rounded-full ${installment.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                    {installment.is_active ? "Activo" : "Inactivo"}
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    onClick={() => startEditInstallment(installment)}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                                                    title="Editar cuota"
                                                  >
                                                    <Edit className="w-4 h-4" />
                                                  </button>
                                                  <button
                                                    onClick={() => handleDeleteInstallment(installment.id)}
                                                    className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                                                    title="Eliminar cuota"
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-[14px] p-6 max-w-md w-full mx-4 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Crear {activeTab === "card-types" ? "Tipo de Tarjeta" : activeTab === "banks" ? "Banco" : "Cuota"}
            </h2>
            
            {activeTab === "card-types" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input
                    type="text"
                    value={cardTypeForm.code}
                    onChange={(e) => setCardTypeForm({ ...cardTypeForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                    placeholder="visa, mastercard, amex"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={cardTypeForm.name}
                    onChange={(e) => setCardTypeForm({ ...cardTypeForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                    placeholder="Visa, Mastercard, etc."
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cardTypeForm.is_active}
                      onChange={(e) => setCardTypeForm({ ...cardTypeForm, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Activo</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                    <input
                      type="number"
                      value={cardTypeForm.display_order}
                      onChange={(e) => setCardTypeForm({ ...cardTypeForm, display_order: parseInt(e.target.value) || 0 })}
                      className="w-20 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "banks" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={bankForm.name}
                    onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                    placeholder="Banco Nación, Banco Galicia, etc."
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bankForm.is_active}
                      onChange={(e) => setBankForm({ ...bankForm, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Activo</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                    <input
                      type="number"
                      value={bankForm.display_order}
                      onChange={(e) => setBankForm({ ...bankForm, display_order: parseInt(e.target.value) || 0 })}
                      className="w-20 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "installments" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Tarjeta</label>
                    <select
                      value={installmentForm.card_type_id}
                      onChange={(e) => setInstallmentForm({ ...installmentForm, card_type_id: e.target.value })}
                      className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Seleccionar...</option>
                      {cardTypes.map((ct) => (
                        <option key={ct.id} value={ct.id}>{ct.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                    <select
                      value={installmentForm.bank_id}
                      onChange={(e) => setInstallmentForm({ ...installmentForm, bank_id: e.target.value })}
                      className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Seleccionar...</option>
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cuotas</label>
                    <input
                      type="number"
                      value={installmentForm.installments}
                      onChange={(e) => setInstallmentForm({ ...installmentForm, installments: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                      min="1"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recargo (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={installmentForm.surcharge_percentage}
                      onChange={(e) => setInstallmentForm({ ...installmentForm, surcharge_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={installmentForm.is_active}
                      onChange={(e) => setInstallmentForm({ ...installmentForm, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Activo</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                    <input
                      type="number"
                      value={installmentForm.display_order}
                      onChange={(e) => setInstallmentForm({ ...installmentForm, display_order: parseInt(e.target.value) || 0 })}
                      className="w-20 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  if (activeTab === "card-types") handleCreateCardType();
                  else if (activeTab === "banks") handleCreateBank();
                  else handleCreateInstallment();
                }}
                disabled={isSaving}
                className="flex-1 px-4 py-2 text-sm font-medium text-white rounded-[6px] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: '#155DFC' }}
              >
                {isSaving ? "Guardando..." : "Crear"}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 rounded-[6px] hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
