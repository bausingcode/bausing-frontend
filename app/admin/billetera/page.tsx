"use client";

import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import {
  Search,
  CreditCard,
  Plus,
  Minus,
  Ban,
  Download,
  AlertTriangle,
  X,
  ChevronRight,
  Calendar,
  User,
  Filter,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  searchWalletCustomers,
  getWalletSummary,
  getCustomerWalletMovements,
  walletManualCredit,
  walletManualDebit,
  toggleWalletBlock,
  getAllWalletMovements,
  exportWalletMovements,
  getWalletAnomalies,
  WalletCustomer,
  WalletSummary,
  WalletMovement,
  WalletAnomalies,
} from "@/lib/api";

type View = "search" | "customer" | "control" | "anomalies";

export default function BilleteraAdmin() {
  const [view, setView] = useState<View>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WalletCustomer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<WalletCustomer | null>(null);
  const [customerSummary, setCustomerSummary] = useState<WalletSummary | null>(null);
  const [customerMovements, setCustomerMovements] = useState<WalletMovement[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);
  
  // Control view state
  const [allMovements, setAllMovements] = useState<WalletMovement[]>([]);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsTotal, setMovementsTotal] = useState(0);
  const [movementsPerPage] = useState(50);
  const [filters, setFilters] = useState({
    type: "",
    user_id: "",
    start_date: "",
    end_date: "",
  });
  const [isLoadingAllMovements, setIsLoadingAllMovements] = useState(false);
  
  // Anomalies state
  const [anomalies, setAnomalies] = useState<WalletAnomalies | null>(null);
  const [isLoadingAnomalies, setIsLoadingAnomalies] = useState(false);
  const [adjustmentsPage, setAdjustmentsPage] = useState(1);
  const [largeMovementsPage, setLargeMovementsPage] = useState(1);
  const [anomaliesPerPage] = useState(10);
  
  // Modal states
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showDebitModal, setShowDebitModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [modalData, setModalData] = useState({
    amount: "",
    reason: "",
    internal_comment: "",
  });

  // Notification states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search customers - removed auto-search, now requires button press or Enter

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Por favor ingresa un email o DNI para buscar");
      return;
    }

    try {
      console.log("DEBUG: handleSearch - query:", searchQuery);
      setIsSearching(true);
      setError("");
      const results = await searchWalletCustomers(searchQuery.trim());
      console.log("DEBUG: handleSearch - results:", results);
      setSearchResults(results);
    } catch (error: any) {
      console.error("DEBUG ERROR: Error searching customers:", error);
      console.error("DEBUG ERROR: Error details:", JSON.stringify(error, null, 2));
      setError(`Error al buscar clientes: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectCustomer = async (customer: WalletCustomer) => {
    console.log("DEBUG: handleSelectCustomer - customer:", customer);
    setSelectedCustomer(customer);
    setIsLoadingSummary(true);
    setIsLoadingMovements(true);
    
    try {
      console.log("DEBUG: Loading wallet summary for customer:", customer.id);
      const summary = await getWalletSummary(customer.id);
      console.log("DEBUG: Wallet summary loaded:", summary);
      setCustomerSummary(summary);
      
      console.log("DEBUG: Loading wallet movements for customer:", customer.id);
      const movementsResponse = await getCustomerWalletMovements(customer.id, 1, 50);
      console.log("DEBUG: Wallet movements loaded:", movementsResponse);
      setCustomerMovements(movementsResponse.movements);
      setError("");
    } catch (error: any) {
      console.error("DEBUG ERROR: Error loading customer data:", error);
      console.error("DEBUG ERROR: Error details:", JSON.stringify(error, null, 2));
      setError(`Error al cargar datos del cliente: ${error.message}`);
    } finally {
      setIsLoadingSummary(false);
      setIsLoadingMovements(false);
    }
    
    // No cambiar la vista, solo mostrar los detalles del cliente en la misma vista
  };

  const handleCredit = async () => {
    if (!selectedCustomer || !modalData.amount || !modalData.reason) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setError("");
      await walletManualCredit(selectedCustomer.id, {
        amount: parseFloat(modalData.amount),
        reason: modalData.reason,
        internal_comment: modalData.internal_comment || undefined,
      });
      
      setShowCreditModal(false);
      setModalData({ amount: "", reason: "", internal_comment: "" });
      
      // Reload customer data
      if (selectedCustomer) {
        await handleSelectCustomer(selectedCustomer);
      }
      
      setSuccess("Saldo cargado exitosamente");
    } catch (error: any) {
      setError(`Error al cargar saldo: ${error.message}`);
    }
  };

  const handleDebit = async () => {
    if (!selectedCustomer || !modalData.amount || !modalData.reason || !modalData.internal_comment) {
      setError("Por favor completa todos los campos requeridos (comentario interno es obligatorio)");
      return;
    }

    try {
      setError("");
      await walletManualDebit(selectedCustomer.id, {
        amount: parseFloat(modalData.amount),
        reason: modalData.reason,
        internal_comment: modalData.internal_comment,
      });
      
      setShowDebitModal(false);
      setModalData({ amount: "", reason: "", internal_comment: "" });
      
      // Reload customer data
      if (selectedCustomer) {
        await handleSelectCustomer(selectedCustomer);
      }
      
      setSuccess("Saldo descontado exitosamente");
    } catch (error: any) {
      setError(`Error al descontar saldo: ${error.message}`);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedCustomer || !customerSummary) return;

    try {
      setError("");
      await toggleWalletBlock(
        selectedCustomer.id,
        !customerSummary.wallet.is_blocked,
        modalData.reason || undefined
      );
      
      setShowBlockModal(false);
      setModalData({ amount: "", reason: "", internal_comment: "" });
      
      // Reload customer data
      if (selectedCustomer) {
        await handleSelectCustomer(selectedCustomer);
      }
      
      setSuccess(`Billetera ${!customerSummary.wallet.is_blocked ? "bloqueada" : "desbloqueada"} exitosamente`);
    } catch (error: any) {
      setError(`Error al actualizar estado de billetera: ${error.message}`);
    }
  };

  const loadAllMovements = async () => {
    setIsLoadingAllMovements(true);
    try {
      console.log("DEBUG: loadAllMovements - filters:", filters);
      console.log("DEBUG: loadAllMovements - page:", movementsPage);
      
      const response = await getAllWalletMovements({
        page: movementsPage,
        per_page: movementsPerPage,
        type: filters.type || undefined,
        user_id: filters.user_id || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      });
      
      console.log("DEBUG: loadAllMovements - response:", response);
      
      setAllMovements(response.movements);
      setMovementsTotal(response.pagination.total);
      setError("");
    } catch (error: any) {
      console.error("DEBUG ERROR: Error loading movements:", error);
      console.error("DEBUG ERROR: Error details:", JSON.stringify(error, null, 2));
      setError(`Error al cargar movimientos: ${error.message}`);
    } finally {
      setIsLoadingAllMovements(false);
    }
  };

  useEffect(() => {
    if (view === "control") {
      console.log("DEBUG: useEffect - view changed to control, loading movements");
      loadAllMovements();
    }
  }, [view, movementsPage, filters]);

  const handleExport = async () => {
    try {
      const blob = await exportWalletMovements({
        type: filters.type || undefined,
        user_id: filters.user_id || undefined,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `movimientos_billetera_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess("Movimientos exportados exitosamente");
      setError("");
    } catch (error: any) {
      setError(`Error al exportar: ${error.message}`);
    }
  };

  const loadAnomalies = async () => {
    setIsLoadingAnomalies(true);
    try {
      console.log("DEBUG: loadAnomalies - starting");
      const data = await getWalletAnomalies({
        min_manual_adjustments: 5,
        min_amount: 10000,
      });
      console.log("DEBUG: loadAnomalies - data:", data);
      setAnomalies(data);
      setError("");
    } catch (error: any) {
      console.error("DEBUG ERROR: Error loading anomalies:", error);
      console.error("DEBUG ERROR: Error details:", JSON.stringify(error, null, 2));
      setError(`Error al cargar anomalías: ${error.message}`);
    } finally {
      setIsLoadingAnomalies(false);
    }
  };

  useEffect(() => {
    if (view === "anomalies") {
      console.log("DEBUG: useEffect - view changed to anomalies, loading anomalies");
      loadAnomalies();
    }
  }, [view]);

  // Auto-hide success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Clear error messages when view changes
  useEffect(() => {
    setError("");
    setSuccess("");
    // Reset pagination when view changes
    if (view === "anomalies") {
      setAdjustmentsPage(1);
      setLargeMovementsPage(1);
    }
    if (view === "control") {
      setMovementsPage(1);
    }
  }, [view]);

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      manual_credit: "Carga Manual",
      manual_debit: "Descuento Manual",
      credit: "Crédito",
      debit: "Débito",
      payment: "Pago",
      cashback: "Cashback",
      refund: "Reembolso",
    };
    return labels[type] || type;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader
        title="Billetera Bausing"
        description="Gestiona las billeteras de tus clientes"
      />

      {/* Mensajes de éxito/error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <Check className="w-5 h-5" />
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="ml-auto cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setView("search")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            view === "search"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Buscar Cliente
        </button>
        <button
          onClick={() => setView("control")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            view === "control"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Control de Movimientos
        </button>
        <button
          onClick={() => setView("anomalies")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            view === "anomalies"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Anomalías
        </button>
      </div>

      {/* Search View */}
      {view === "search" && (
        <div>
          {!selectedCustomer ? (
            <>
              {/* Search Bar */}
              <div className="bg-white rounded-[14px] border border-gray-200 p-4 mb-6">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por email o DNI..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-6 py-3 text-white rounded-[6px] font-medium hover:opacity-90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#155DFC' }}
                  >
                    <Search className="w-5 h-5" />
                    Buscar
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {isSearching && (
                <div className="bg-white rounded-[14px] border border-gray-200 p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Buscando clientes...</p>
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
                  <div className="divide-y divide-gray-200">
                    {searchResults.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-medium text-gray-900">
                              {customer.first_name} {customer.last_name}
                            </h3>
                            {customer.wallet_blocked && (
                              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                Bloqueada
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 space-y-1">
                            <p>Email: {customer.email}</p>
                            {customer.phone && <p>Teléfono: {customer.phone}</p>}
                            {customer.dni && <p>DNI: {customer.dni}</p>}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(customer.wallet_balance)}
                          </div>
                          <div className="text-xs text-gray-500">Saldo</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isSearching && searchResults.length === 0 && searchQuery.length > 0 && (
                <div className="bg-white rounded-[14px] border border-gray-200 p-12 text-center">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium mb-2">No se encontraron clientes</p>
                  <p className="text-gray-400 text-sm">Intenta con otro email o DNI</p>
                </div>
              )}

              {!isSearching && searchQuery.length === 0 && (
                <div className="bg-white rounded-[14px] border border-gray-200 p-12 text-center">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium mb-2">Buscar Cliente</p>
                  <p className="text-gray-400 text-sm">Ingresa un email o DNI y presiona Buscar</p>
                </div>
              )}
            </>
          ) : (
            <div>
              {/* Back Button */}
              <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSummary(null);
                    setCustomerMovements([]);
                  }}
                className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Volver a búsqueda
              </button>

              {isLoadingSummary ? (
                <div className="bg-white rounded-[14px] border border-gray-200 p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando datos del cliente...</p>
                </div>
              ) : customerSummary ? (
                <>
                  {/* Customer Summary */}
                  <div className="bg-white rounded-[14px] border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">
                          {customerSummary.user.first_name} {customerSummary.user.last_name}
                        </h2>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Email: {customerSummary.user.email}</p>
                          {customerSummary.user.phone && (
                            <p>Teléfono: {customerSummary.user.phone}</p>
                          )}
                          {customerSummary.user.dni && (
                            <p>DNI: {customerSummary.user.dni}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          {formatCurrency(customerSummary.wallet.balance)}
                        </div>
                        <div className="text-sm text-gray-500">Saldo Actual</div>
                        {customerSummary.wallet.is_blocked && (
                          <span className="mt-2 inline-block px-3 py-1 text-xs bg-red-100 text-red-800 rounded">
                            Billetera Bloqueada
                          </span>
                        )}
                      </div>
                    </div>

                    {customerSummary.wallet.last_movement && (
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Último uso:</strong>{" "}
                          {getMovementTypeLabel(customerSummary.wallet.last_movement.type)} -{" "}
                          {formatCurrency(customerSummary.wallet.last_movement.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(customerSummary.wallet.last_movement.created_at)}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setModalData({ amount: "", reason: "", internal_comment: "" });
                          setShowCreditModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-[6px] hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Cargar Saldo
                      </button>
                      <button
                        onClick={() => {
                          setModalData({ amount: "", reason: "", internal_comment: "" });
                          setShowDebitModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-[6px] hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Minus className="w-4 h-4" />
                        Descontar Saldo
                      </button>
                      <button
                        onClick={() => {
                          setModalData({ amount: "", reason: "", internal_comment: "" });
                          setShowBlockModal(true);
                        }}
                        className={`flex-1 px-4 py-2 rounded-[6px] transition-colors flex items-center justify-center gap-2 ${
                          customerSummary.wallet.is_blocked
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-red-600 hover:bg-red-700 text-white"
                        }`}
                      >
                        <Ban className="w-4 h-4" />
                        {customerSummary.wallet.is_blocked ? "Desbloquear" : "Bloquear"}
                      </button>
                    </div>
                  </div>

                  {/* Movements History */}
                  <div className="bg-white rounded-[14px] border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Historial de Movimientos
                    </h3>
                    {isLoadingMovements ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Cargando movimientos...</p>
                      </div>
                    ) : customerMovements.length === 0 ? (
                      <div className="text-center py-12">
                        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg font-medium mb-2">
                          No hay movimientos registrados
                        </p>
                        <p className="text-gray-400 text-sm">
                          Los movimientos de este cliente aparecerán aquí
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                                Fecha
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                                Tipo
                              </th>
                              <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                                Monto
                              </th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                                Descripción
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {customerMovements.map((movement) => (
                              <tr key={movement.id} className="hover:bg-gray-50">
                                <td className="py-3 px-4 text-sm text-gray-600">
                                  {formatDate(movement.created_at)}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-900">
                                  {getMovementTypeLabel(movement.type)}
                                </td>
                                <td
                                  className={`py-3 px-4 text-sm text-right font-medium ${
                                    movement.type.includes("credit") ||
                                    movement.type === "cashback" ||
                                    movement.type === "refund"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {movement.type.includes("credit") ||
                                  movement.type === "cashback" ||
                                  movement.type === "refund"
                                    ? "+"
                                    : "-"}
                                  {formatCurrency(Math.abs(movement.amount))}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">
                                  {movement.description || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Control View */}
      {view === "control" && (
        <div>
          {/* Filters */}
          <div className="bg-white rounded-[14px] border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Movimiento
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Todos</option>
                  <option value="manual_credit">Carga Manual</option>
                  <option value="manual_debit">Descuento Manual</option>
                  <option value="payment">Pago</option>
                  <option value="cashback">Cashback</option>
                  <option value="refund">Reembolso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleExport}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-[6px] hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar Excel
                </button>
              </div>
            </div>
          </div>

          {/* Movements Table */}
          <div className="bg-white rounded-[14px] border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Movimientos</h3>
              <div className="text-sm text-gray-500">
                Total: {movementsTotal} movimientos
              </div>
            </div>
            {isLoadingAllMovements ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando movimientos...</p>
              </div>
            ) : allMovements.length === 0 ? (
              <div className="text-center py-12">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium mb-2">No hay movimientos</p>
                <p className="text-gray-400 text-sm">
                  No se encontraron movimientos con los filtros aplicados
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          Fecha
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          Cliente
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          Tipo
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                          Monto
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          Descripción
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                          Admin
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allMovements.map((movement) => (
                        <tr key={movement.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDate(movement.created_at)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {movement.user
                              ? `${movement.user.first_name} ${movement.user.last_name}`
                              : "-"}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {getMovementTypeLabel(movement.type)}
                          </td>
                          <td
                            className={`py-3 px-4 text-sm text-right font-medium ${
                              movement.type.includes("credit") ||
                              movement.type === "cashback" ||
                              movement.type === "refund"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {movement.type.includes("credit") ||
                            movement.type === "cashback" ||
                            movement.type === "refund"
                              ? "+"
                              : "-"}
                            {formatCurrency(Math.abs(movement.amount))}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {movement.description || "-"}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {movement.admin_user?.email || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {Math.ceil(movementsTotal / movementsPerPage) > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setMovementsPage((p) => Math.max(1, p - 1))}
                      disabled={movementsPage === 1}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                      Página {movementsPage} de {Math.ceil(movementsTotal / movementsPerPage)}
                    </span>
                    <button
                      onClick={() =>
                        setMovementsPage((p) =>
                          Math.min(Math.ceil(movementsTotal / movementsPerPage), p + 1)
                        )
                      }
                      disabled={movementsPage >= Math.ceil(movementsTotal / movementsPerPage)}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Anomalies View */}
      {view === "anomalies" && (
        <div>
          {isLoadingAnomalies ? (
            <div className="bg-white rounded-[14px] border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando anomalías...</p>
            </div>
          ) : anomalies ? (
            <div className="space-y-6">
              {/* Many Manual Adjustments */}
              <div className="bg-white rounded-[14px] border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Clientes con muchos ajustes manuales
                    </h3>
                  </div>
                  <div className="text-sm text-gray-500">
                    Total: {anomalies.many_manual_adjustments.length} clientes
                  </div>
                </div>
                {anomalies.many_manual_adjustments.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium mb-1">No hay anomalías</p>
                    <p className="text-gray-400 text-sm">No se encontraron clientes con muchos ajustes manuales</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                              Cliente
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                              Email
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                              Ajustes Manuales
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {anomalies.many_manual_adjustments
                            .slice((adjustmentsPage - 1) * anomaliesPerPage, adjustmentsPage * anomaliesPerPage)
                            .map((item) => (
                            <tr key={item.user_id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-900">
                                {item.first_name} {item.last_name}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">{item.email}</td>
                              <td className="py-3 px-4 text-sm text-right font-medium text-orange-600">
                                {item.adjustment_count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {Math.ceil(anomalies.many_manual_adjustments.length / anomaliesPerPage) > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setAdjustmentsPage((p) => Math.max(1, p - 1))}
                          disabled={adjustmentsPage === 1}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                        >
                          Anterior
                        </button>
                        <span className="text-sm text-gray-600">
                          Página {adjustmentsPage} de {Math.ceil(anomalies.many_manual_adjustments.length / anomaliesPerPage)}
                        </span>
                        <button
                          onClick={() =>
                            setAdjustmentsPage((p) =>
                              Math.min(Math.ceil(anomalies.many_manual_adjustments.length / anomaliesPerPage), p + 1)
                            )
                          }
                          disabled={adjustmentsPage >= Math.ceil(anomalies.many_manual_adjustments.length / anomaliesPerPage)}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Large Movements */}
              <div className="bg-white rounded-[14px] border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h3 className="text-lg font-semibold text-gray-900">Movimientos muy grandes</h3>
                  </div>
                  <div className="text-sm text-gray-500">
                    Total: {anomalies.large_movements.length} movimientos
                  </div>
                </div>
                {anomalies.large_movements.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium mb-1">No hay movimientos grandes</p>
                    <p className="text-gray-400 text-sm">No se encontraron movimientos que superen el monto mínimo</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                              Cliente
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                              Tipo
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                              Monto
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                              Fecha
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {anomalies.large_movements
                            .slice((largeMovementsPage - 1) * anomaliesPerPage, largeMovementsPage * anomaliesPerPage)
                            .map((movement) => (
                            <tr key={movement.movement_id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-900">
                                {movement.user
                                  ? `${movement.user.first_name} ${movement.user.last_name}`
                                  : "-"}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900">
                                {getMovementTypeLabel(movement.type)}
                              </td>
                              <td className="py-3 px-4 text-sm text-right font-medium text-red-600">
                                {formatCurrency(movement.amount)}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {formatDate(movement.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {Math.ceil(anomalies.large_movements.length / anomaliesPerPage) > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setLargeMovementsPage((p) => Math.max(1, p - 1))}
                          disabled={largeMovementsPage === 1}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                        >
                          Anterior
                        </button>
                        <span className="text-sm text-gray-600">
                          Página {largeMovementsPage} de {Math.ceil(anomalies.large_movements.length / anomaliesPerPage)}
                        </span>
                        <button
                          onClick={() =>
                            setLargeMovementsPage((p) =>
                              Math.min(Math.ceil(anomalies.large_movements.length / anomaliesPerPage), p + 1)
                            )
                          }
                          disabled={largeMovementsPage >= Math.ceil(anomalies.large_movements.length / anomaliesPerPage)}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Credit Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-[14px] p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Cargar Saldo</h3>
              <button
                onClick={() => setShowCreditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={modalData.amount}
                  onChange={(e) =>
                    setModalData({ ...modalData, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo *
                </label>
                <select
                  value={modalData.reason}
                  onChange={(e) =>
                    setModalData({ ...modalData, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Seleccionar motivo</option>
                  <option value="promoción">Promoción</option>
                  <option value="compensación">Compensación</option>
                  <option value="error anterior">Error anterior</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentario Interno
                </label>
                <textarea
                  value={modalData.internal_comment}
                  onChange={(e) =>
                    setModalData({ ...modalData, internal_comment: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  rows={3}
                  placeholder="Comentario interno (opcional)"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreditModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-[6px] hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCredit}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-[6px] hover:bg-green-700 transition-colors cursor-pointer"
              >
                Cargar Saldo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debit Modal */}
      {showDebitModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-[14px] p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Descontar Saldo</h3>
              <button
                onClick={() => setShowDebitModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={modalData.amount}
                  onChange={(e) =>
                    setModalData({ ...modalData, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo *
                </label>
                <select
                  value={modalData.reason}
                  onChange={(e) =>
                    setModalData({ ...modalData, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Seleccionar motivo</option>
                  <option value="fraude">Fraude</option>
                  <option value="error">Error</option>
                  <option value="ajuste">Ajuste</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentario Interno * (obligatorio)
                </label>
                <textarea
                  value={modalData.internal_comment}
                  onChange={(e) =>
                    setModalData({ ...modalData, internal_comment: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  rows={3}
                  placeholder="Comentario interno (obligatorio)"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDebitModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-[6px] hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDebit}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-[6px] hover:bg-orange-700 transition-colors cursor-pointer"
              >
                Descontar Saldo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && customerSummary && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-[14px] p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {customerSummary.wallet.is_blocked
                  ? "Desbloquear Billetera"
                  : "Bloquear Billetera"}
              </h3>
              <button
                onClick={() => setShowBlockModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                ¿Estás seguro de que deseas{" "}
                {customerSummary.wallet.is_blocked ? "desbloquear" : "bloquear"} la billetera de{" "}
                {customerSummary.user.first_name} {customerSummary.user.last_name}?
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo (opcional)
                </label>
                <textarea
                  value={modalData.reason}
                  onChange={(e) =>
                    setModalData({ ...modalData, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  rows={3}
                  placeholder="Motivo del bloqueo/desbloqueo"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-[6px] hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleToggleBlock}
                className={`flex-1 px-4 py-2 text-white rounded-[6px] transition-colors cursor-pointer ${
                  customerSummary.wallet.is_blocked
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {customerSummary.wallet.is_blocked ? "Desbloquear" : "Bloquear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

