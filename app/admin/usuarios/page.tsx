import { cookies } from "next/headers";
import { fetchAdminUsers, AdminUser } from "@/lib/api";
import UsuariosClient from "./UsuariosClient";

export default async function Usuarios() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("admin_token")?.value;
  
  // Construir cookie header para pasar a la función
  const cookieHeader = adminToken ? `admin_token=${adminToken}` : null;
  
  let adminUsers: AdminUser[] = [];
  
  try {
    // Fetch admin users from the backend using SSR
    adminUsers = await fetchAdminUsers(cookieHeader);
  } catch (error) {
    console.error("Error fetching admin users:", error);
    // Si falla, usar array vacío y el componente cliente manejará el error
  }

  return <UsuariosClient initialUsers={adminUsers} />;
}

