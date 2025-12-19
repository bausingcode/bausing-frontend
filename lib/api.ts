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

// Products API
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  category_id?: string;
  category_name?: string;
  is_active: boolean;
  min_price?: number;
  max_price?: number;
  price_range?: string;
  main_image?: string;
  images?: Array<{
    id: string;
    image_url: string;
    alt_text?: string;
    position: number;
  }>;
  variants?: Array<{
    id: string;
    name: string;
    sku?: string;
    stock: number;
    attributes?: Record<string, string>;
    prices?: Array<{
      id: string;
      price: number;
      locality_id: string;
      locality_name?: string;
    }>;
  }>;
  promos?: Array<{
    id: string;
    name: string;
    discount_percentage?: number;
    discount_amount?: number;
  }>;
}

/**
 * Fetch products with filters
 */
export async function fetchProducts(params?: {
  search?: string;
  category_id?: string;
  category_ids?: string;
  is_active?: boolean;
  min_price?: number;
  max_price?: number;
  locality_id?: string;
  in_stock?: boolean;
  sort?: string;
  page?: number;
  per_page?: number;
  include_variants?: boolean;
  include_images?: boolean;
  include_promos?: boolean;
}): Promise<{ products: Product[]; total: number; page: number; per_page: number; total_pages: number }> {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category_id) queryParams.append('category_id', params.category_id);
    if (params?.category_ids) queryParams.append('category_ids', params.category_ids);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params?.min_price !== undefined) queryParams.append('min_price', params.min_price.toString());
    if (params?.max_price !== undefined) queryParams.append('max_price', params.max_price.toString());
    if (params?.locality_id) queryParams.append('locality_id', params.locality_id);
    if (params?.in_stock !== undefined) queryParams.append('in_stock', params.in_stock.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.include_variants !== undefined) queryParams.append('include_variants', params.include_variants.toString());
    if (params?.include_images !== undefined) queryParams.append('include_images', params.include_images.toString());
    if (params?.include_promos !== undefined) queryParams.append('include_promos', params.include_promos.toString());

    const url = `/api/products?${queryParams.toString()}`;
    const response = await fetch(url, {
      cache: "no-store",
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch products");
    }
    
    return {
      products: data.data.items || [],
      total: data.data.total || 0,
      page: data.data.page || 1,
      per_page: data.data.per_page || 20,
      total_pages: data.data.total_pages || 1,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      products: [],
      total: 0,
      page: 1,
      per_page: 20,
      total_pages: 0,
    };
  }
}

/**
 * Fetch a single product by ID
 */
export async function fetchProductById(productId: string): Promise<Product | null> {
  try {
    const url = `/api/products/${productId}?include_variants=true&include_images=true&include_promos=true`;
    const response = await fetch(url, {
      cache: "no-store",
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
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
  montoFijo?: number;
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

export interface GeneralSettings {
  telefono?: string;
}

export interface AppSettings {
  wallet: WalletConfig;
  messages: MessageTemplates;
  notifications: NotificationSettings;
  security: SecuritySettings;
  general: GeneralSettings;
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
      montoFijo: settings.wallet?.fixed_amount,
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
    general: {
      telefono: settings.general?.phone || "",
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
 * Update general settings
 */
export async function updateGeneralSettings(general: GeneralSettings): Promise<void> {
  const url = `/api/admin/settings/general`;
  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(general),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to update general settings: ${response.statusText}`);
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

// Hero Images API
export interface HeroImage {
  id: string;
  image_url: string;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
  position: number;
  is_active: boolean;
  created_at?: string;
}


// Hero Images API
export interface HeroImage {
  id: string;
  image_url: string;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
  position: number;
  is_active: boolean;
  created_at?: string;
}

/**
 * Fetch hero images from the backend (server-side compatible)
 * @param position - Optional position filter (1, 2, or 3)
 * @param activeOnly - Only fetch active images
 * @param cookieHeader - Cookie header for server-side requests
 */
export async function fetchHeroImages(
  position?: number,
  activeOnly = false,
  cookieHeader?: string | null
): Promise<HeroImage[]> {
  const params = new URLSearchParams();
  if (position !== undefined) {
    params.append('position', position.toString());
  }
  if (activeOnly) {
    params.append('active', 'true');
  }

  const url = typeof window === "undefined"
    ? `${BACKEND_URL}/hero-images?${params.toString()}`
    : `/api/hero-images?${params.toString()}`;

  const headers = typeof window === "undefined"
    ? getAuthHeadersServer(cookieHeader)
    : getAuthHeaders();

  const response = await fetch(url, { headers, cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to fetch hero images: ${response.statusText}`);
  }

  const data = await response.json();
  return data.success ? data.data : [];
}

/**
 * Upload a hero image file directly to Supabase and save to database
 */
export async function uploadHeroImageFile(file: File, position: number): Promise<HeroImage> {
  // Import compression function
  const { compressToWebp } = await import("@/lib/image");
  
  // Compress image
  const compressedFile = await compressToWebp(file, {
    maxSide: 2048,
    quality: 0.86,
  });

  // Upload to Supabase Storage using client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase configuration is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  // Generate unique filename
  const fileExt = compressedFile.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const folder = `position-${position}`;
  const filePath = `${folder}/${fileName}`;

  // Upload to Supabase Storage using REST API
  const uploadResponse = await fetch(
    `${supabaseUrl}/storage/v1/object/hero-images/${filePath}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": compressedFile.type,
        "x-upsert": "true",
      },
      body: compressedFile,
    }
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    let errorMessage = `Failed to upload to Supabase: ${uploadResponse.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // Get public URL
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/hero-images/${filePath}`;

  // Save to database via backend
  const url = `/api/hero-images`;
  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      image_url: publicUrl,
      position: position,
      is_active: true,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to save hero image: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data.success || !data.data) {
    throw new Error("Failed to save hero image: Invalid response");
  }
  return data.data;
}

/**
 * Update a hero image
 */
export async function updateHeroImage(
  imageId: string,
  imageData: Partial<{
    image_url: string;
    title: string;
    subtitle: string;
    cta_text: string;
    cta_link: string;
    position: number;
    is_active: boolean;
  }>
): Promise<HeroImage> {
  const url = `/api/hero-images/${imageId}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(imageData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to update hero image: ${response.statusText}`);
  }
  
  const data = await response.json();
  if (!data.success || !data.data) {
    throw new Error("Failed to update hero image: Invalid response");
  }
  return data.data;
}

/**
 * Delete a hero image
 */
export async function deleteHeroImage(imageId: string): Promise<void> {
  const url = `/api/hero-images/${imageId}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to delete hero image: ${response.statusText}`);
  }
}

// ============================================
// USER AUTHENTICATION API
// ============================================

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  dni?: string;
  email_verified: boolean;
  is_suspended?: boolean;
  created_at?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    email_verified: boolean;
  };
  error?: string;
}

export interface RegisterResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    message?: string;
  };
  error?: string;
}

/**
 * Get user token from localStorage
 */
export function getUserToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("user_token");
}

/**
 * Create headers with user token
 */
export function getUserAuthHeaders(): HeadersInit {
  const token = getUserToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Login user
 */
export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const url = typeof window === "undefined"
    ? `${BACKEND_URL}/auth/login`
    : `/api/auth/login`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Error al iniciar sesión");
  }
  
  return data;
}

/**
 * Register user
 */
export async function registerUser(userData: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  dni?: string;
}): Promise<RegisterResponse> {
  const url = typeof window === "undefined"
    ? `${BACKEND_URL}/auth/register`
    : `/api/auth/register`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Error al registrarse");
  }
  
  return data;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const url = typeof window === "undefined"
      ? `${BACKEND_URL}/auth/me`
      : `/api/auth/me`;
    
    const response = await fetch(url, {
      headers: getUserAuthHeaders(),
      cache: "no-store",
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

/**
 * Fetch all regular users (customers) - Admin only
 */
export async function fetchCustomers(cookieHeader?: string | null): Promise<User[]> {
  const url = typeof window === "undefined"
    ? `${BACKEND_URL}/admin/customers`
    : `/api/admin/customers`;
  
  const headers = typeof window === "undefined" 
    ? getAuthHeadersServer(cookieHeader)
    : getAuthHeaders();
  
  const response = await fetch(url, { headers, cache: "no-store" });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch customers: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.success ? data.data : [];
}

/**
 * Create a new customer
 */
export async function createCustomer(customerData: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  dni?: string;
  email_verified?: boolean;
  is_suspended?: boolean;
}): Promise<User> {
  const url = `/api/admin/customers`;
  const response = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(customerData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to create customer: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
}

/**
 * Toggle suspend status of a customer
 */
export async function toggleSuspendCustomer(userId: string, isSuspended: boolean): Promise<User> {
  const url = `/api/admin/customers/${userId}/suspend`;
  const response = await fetch(url, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ is_suspended: isSuspended }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to update customer: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
}

// ============================================
// USER PROFILE API
// ============================================

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  street: string;
  number: string;
  additional_info?: string;
  postal_code: string;
  city: string;
  province: string;
  is_default: boolean;
  created_at?: string;
}

/**
 * Update user profile
 */
export async function updateUserProfile(profileData: {
  first_name?: string;
  last_name?: string;
  phone?: string;
  dni?: string;
  gender?: string;
  birth_date?: string;
}): Promise<User> {
  const url = typeof window === "undefined"
    ? `${BACKEND_URL}/auth/profile`
    : `/api/auth/profile`;
  
  const response = await fetch(url, {
    method: "PUT",
    headers: getUserAuthHeaders(),
    body: JSON.stringify(profileData),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Error al actualizar perfil");
  }
  
  return data.data;
}

/**
 * Change user password
 */
export async function changePassword(passwordData: {
  current_password: string;
  new_password: string;
}): Promise<void> {
  const url = typeof window === "undefined"
    ? `${BACKEND_URL}/auth/password`
    : `/api/auth/password`;
  
  const response = await fetch(url, {
    method: "PUT",
    headers: getUserAuthHeaders(),
    body: JSON.stringify(passwordData),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Error al cambiar contraseña");
  }
}

/**
 * Get user addresses
 */
export async function getUserAddresses(): Promise<Address[]> {
  const url = typeof window === "undefined"
    ? `${BACKEND_URL}/auth/addresses`
    : `/api/auth/addresses`;
  
  const response = await fetch(url, {
    headers: getUserAuthHeaders(),
    cache: "no-store",
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Error al obtener direcciones");
  }
  
  return data.data || [];
}

/**
 * Create user address
 */
export async function createUserAddress(addressData: {
  full_name: string;
  phone: string;
  street: string;
  number: string;
  additional_info?: string;
  postal_code: string;
  city: string;
  province: string;
  is_default?: boolean;
}): Promise<Address> {
  const url = typeof window === "undefined"
    ? `${BACKEND_URL}/auth/addresses`
    : `/api/auth/addresses`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: getUserAuthHeaders(),
    body: JSON.stringify(addressData),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Error al crear dirección");
  }
  
  return data.data;
}

/**
 * Update user address
 */
export async function updateUserAddress(addressId: string, addressData: {
  full_name?: string;
  phone?: string;
  street?: string;
  number?: string;
  additional_info?: string;
  postal_code?: string;
  city?: string;
  province?: string;
  is_default?: boolean;
}): Promise<Address> {
  const url = typeof window === "undefined"
    ? `${BACKEND_URL}/auth/addresses/${addressId}`
    : `/api/auth/addresses/${addressId}`;
  
  const response = await fetch(url, {
    method: "PUT",
    headers: getUserAuthHeaders(),
    body: JSON.stringify(addressData),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Error al actualizar dirección");
  }
  
  return data.data;
}

/**
 * Delete user address
 */
export async function deleteUserAddress(addressId: string): Promise<void> {
  const url = typeof window === "undefined"
    ? `${BACKEND_URL}/auth/addresses/${addressId}`
    : `/api/auth/addresses/${addressId}`;
  
  const response = await fetch(url, {
    method: "DELETE",
    headers: getUserAuthHeaders(),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Error al eliminar dirección");
  }
}

