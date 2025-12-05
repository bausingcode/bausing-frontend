/**
 * Helper function to get admin token from cookies
 */
export function getAdminToken(): string | null {
  if (typeof document === "undefined") return null;
  
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "admin_token") {
      return value;
    }
  }
  return null;
}

/**
 * Helper function to get admin token from cookies (server-side)
 */
export function getAdminTokenServer(cookieHeader?: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "admin_token") {
      return value;
    }
  }
  return null;
}

/**
 * Helper function to create headers with admin token
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAdminToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Helper function to create headers with admin token (server-side)
 */
export function getAuthHeadersServer(cookieHeader?: string | null): HeadersInit {
  const token = getAdminTokenServer(cookieHeader);
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

const API_BASE_URL = '/api'
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050'
// Categories API
export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  parent_name?: string;
  created_at?: string;
  options?: CategoryOption[];
}

export interface CategoryOption {
  id: string;
  category_id: string;
  value: string;
  position: number;
  created_at?: string;
}

/**
 * Fetch all categories from the backend
 */
export async function fetchCategories(includeOptions = false, cookieHeader?: string | null): Promise<Category[]> {
  // En el servidor, usar la URL completa del backend
  // En el cliente, usar la ruta relativa que será manejada por el rewrite de Next.js
  const url = typeof window === "undefined"
    ? `${BACKEND_URL}/categories?include_options=${includeOptions}`
    : `/api/categories?include_options=${includeOptions}`;
  
  const headers = typeof window === "undefined" 
    ? getAuthHeadersServer(cookieHeader)
    : getAuthHeaders();
  
  const response = await fetch(url, { headers, cache: "no-store" });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.success ? data.data : [];
}

/**
 * Create a new category
 */
export async function createCategory(categoryData: {
  name: string;
  description?: string;
  parent_id?: string;
}): Promise<Category> {
  const url = `/api/categories`;
  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(categoryData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to create category: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data.success || !data.data) {
    throw new Error("Failed to create category: Invalid response");
  }
  return data.data;
}

/**
 * Create a category option
 */
export async function createCategoryOption(
  categoryId: string,
  optionData: {
    value: string;
    position?: number;
  }
): Promise<CategoryOption> {
  const url = `${API_BASE_URL}/categories/${categoryId}/options`;
  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(optionData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to create category option: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data.success || !data.data) {
    throw new Error("Failed to create category option: Invalid response");
  }
  return data.data;
}

// Admin User API
export interface AdminUser {
  id: string;
  email: string;
  role_id: string;
  created_at?: string;
  role?: {
    id: string;
    name: string;
  };
}

/**
 * Get current authenticated admin user
 */
export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  try {
    const url = `${API_BASE_URL}/admin/auth/me`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Error fetching current admin user:", error);
    return null;
  }
}

/**
 * Fetch all admin users
 */
export async function fetchAdminUsers(cookieHeader?: string | null): Promise<AdminUser[]> {
  // En el servidor, llamar directamente al backend (el rewrite no funciona desde SSR)
  // En el cliente, usar la ruta relativa que pasa por el rewrite de Next.js
  const url = typeof window === "undefined"
    ? `${BACKEND_URL}/admin/users`
    : `/api/admin/users`;
  
  const headers = typeof window === "undefined" 
    ? getAuthHeadersServer(cookieHeader)
    : getAuthHeaders();
  
  const response = await fetch(url, { headers, cache: "no-store" });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch admin users: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.success ? data.data : [];
}

/**
 * Delete an admin user
 */
export async function deleteAdminUser(userId: string): Promise<void> {
  const url = `/api/admin/users/${userId}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to delete admin user: ${response.statusText}`);
  }
}

/**
 * Admin Role interface
 */
export interface AdminRole {
  id: string;
  name: string;
}

/**
 * Fetch all admin roles
 */
export async function fetchAdminRoles(): Promise<AdminRole[]> {
  const url = `/api/admin/auth/roles`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch admin roles: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.success ? data.data : [];
}

/**
 * Create a new admin user
 */
export async function createAdminUser(userData: {
  email: string;
  password: string;
  role_id: string;
}): Promise<AdminUser> {
  const url = `/api/admin/auth/register`;
  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to create admin user: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data.success || !data.data || !data.data.admin_user) {
    throw new Error("Failed to create admin user: Invalid response");
  }
  return data.data.admin_user;
}

// Settings API
export interface WalletConfig {
  porcentajeEstandar?: number;
  montoMinimo?: number;
  porcentajeMaximo?: number;
  vencimiento?: number;
  permitirAcumulacion?: boolean;
}

export interface MessageTemplates {
  acreditacion: string;
  confirmacion: string;
  enCamino: string;
}

export interface NotificationSettings {
  nuevosPedidos?: boolean;
  erroresPagos?: boolean;
  stockBajo?: boolean;
  movimientosInusuales?: boolean;
  reclamosClientes?: boolean;
}

export interface SecuritySettings {
  montoMaximoCarga?: number;
  registrarCambios?: boolean;
  comentarioObligatorio?: boolean;
}

export interface AppSettings {
  wallet: WalletConfig;
  messages: MessageTemplates;
  notifications: NotificationSettings;
  security: SecuritySettings;
}

/**
 * Get all app settings
 */
export async function getAppSettings(): Promise<AppSettings> {
  const url = `/api/admin/settings`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch settings: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data.success || !data.data) {
    throw new Error("Failed to fetch settings: Invalid response");
  }
  
  // Normalizar los datos para que coincidan con la estructura del frontend
  const settings = data.data;
  return {
    wallet: {
      porcentajeEstandar: settings.wallet?.standard_percentage,
      montoMinimo: settings.wallet?.min_amount,
      porcentajeMaximo: settings.wallet?.max_usage_percentage,
      vencimiento: settings.wallet?.expiration_days,
      permitirAcumulacion: settings.wallet?.allow_accumulation,
    },
    messages: {
      acreditacion: settings.messages?.wallet_accreditation?.body || "",
      confirmacion: settings.messages?.order_confirmation?.body || "",
      enCamino: settings.messages?.order_shipping?.body || "",
    },
    notifications: {
      nuevosPedidos: settings.notifications?.new_orders,
      erroresPagos: settings.notifications?.payment_errors,
      stockBajo: settings.notifications?.low_stock,
      movimientosInusuales: settings.notifications?.unusual_movements,
      reclamosClientes: settings.notifications?.customer_complaints,
    },
    security: {
      montoMaximoCarga: settings.security?.max_manual_wallet_load,
      registrarCambios: settings.security?.require_audit_log,
      comentarioObligatorio: settings.security?.require_comment_on_adjustments,
    },
  };
}

/**
 * Update wallet settings
 */
export async function updateWalletSettings(walletConfig: WalletConfig): Promise<void> {
  const url = `/api/admin/settings/wallet`;
  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(walletConfig),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to update wallet settings: ${response.statusText}`);
  }
}

/**
 * Update message templates
 */
export async function updateMessageTemplates(messages: MessageTemplates): Promise<void> {
  const url = `/api/admin/settings/messages`;
  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(messages),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to update message templates: ${response.statusText}`);
  }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(notifications: NotificationSettings): Promise<void> {
  const url = `/api/admin/settings/notifications`;
  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(notifications),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to update notification settings: ${response.statusText}`);
  }
}

/**
 * Update security settings
 */
export async function updateSecuritySettings(security: SecuritySettings): Promise<void> {
  const url = `/api/admin/settings/security`;
  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(security),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to update security settings: ${response.statusText}`);
  }
}

