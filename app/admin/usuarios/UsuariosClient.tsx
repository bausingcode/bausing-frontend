"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Plus, Trash2, User, UserX } from "lucide-react";
import { AdminUser, fetchAdminUsers, deleteAdminUser, getCurrentAdminUser } from "@/lib/api";

interface UsuariosClientProps {
  initialUsers?: AdminUser[];
}

export default function UsuariosClient({ initialUsers = [] }: UsuariosClientProps) {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // Función para refrescar usuarios desde el backend
  const refreshUsers = async () => {
    try {
      setIsLoading(true);
      const freshUsers = await fetchAdminUsers();
      setAdminUsers(freshUsers);
    } catch (error) {
      console.error("Error refreshing users:", error);
      setAdminUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch usuarios desde la DB al montar el componente
  useEffect(() => {
    refreshUsers();
    // Obtener el usuario actual
    getCurrentAdminUser().then(setCurrentUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función para manejar la eliminación de usuario
  const handleDeleteUser = async (user: AdminUser) => {
    // Prevenir eliminación del usuario actual
    if (currentUser && currentUser.id === user.id) {
      return;
    }
    
    try {
      setIsLoading(true);
      await deleteAdminUser(user.id);
      // Refrescar la lista de usuarios después de eliminar
      await refreshUsers();
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para formatear la fecha
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-AR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="px-8 pt-6 pb-8 min-h-screen">
      <PageHeader 
        title="Usuarios Admin" 
        description="Gestiona los usuarios administradores del sistema" 
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-normal" style={{ color: '#484848' }}>Usuarios</h2>
        <button
          onClick={() => {
            // TODO: Implementar modal de creación
            console.log("Crear nuevo usuario");
          }}
          className="px-4 py-2 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 cursor-pointer"
          style={{ backgroundColor: '#155DFC' }}
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 blur-2xl animate-pulse"></div>
              <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin relative"></div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Cargando usuarios...
            </h3>
            <p className="text-gray-500 text-center">
              Obteniendo datos desde la base de datos
            </p>
          </div>
        ) : adminUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 blur-2xl"></div>
              <UserX className="w-20 h-20 text-gray-400 relative" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay usuarios aún
            </h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Comienza agregando usuarios administradores al sistema. Cada usuario puede tener diferentes roles y permisos.
            </p>
            <button
              onClick={() => {
                // TODO: Implementar modal de creación
                console.log("Crear primer usuario");
              }}
              className="px-6 py-3 text-white rounded-[6px] text-sm font-medium hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              style={{ backgroundColor: '#155DFC' }}
            >
              <Plus className="w-5 h-5" />
              Crear primer usuario
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Fecha de Creación
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adminUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <User className="w-4 h-4 text-gray-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {user.role ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {user.role.name}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          Sin rol
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex items-center gap-3 justify-center">
                        {currentUser && currentUser.id === user.id ? (
                          <span className="text-gray-400 text-xs">Usuario actual</span>
                        ) : (
                          <button 
                            onClick={() => setUserToDelete(user)}
                            className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                            disabled={isLoading}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {userToDelete && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setUserToDelete(null)}>
          <div className="bg-white rounded-[14px] p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {currentUser && currentUser.id === userToDelete.id ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  No se puede borrar
                </h3>
                <p className="text-gray-600 mb-6">
                  No puedes eliminar tu propio usuario. Esta acción no está permitida.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setUserToDelete(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-[6px] text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Confirmar eliminación
                </h3>
                <p className="text-gray-600 mb-6">
                  ¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete.email}</strong>? Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setUserToDelete(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-[6px] text-sm font-medium hover:bg-gray-200 transition-colors"
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDeleteUser(userToDelete)}
                    className="px-4 py-2 text-white bg-red-600 rounded-[6px] text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || !!(currentUser && currentUser.id === userToDelete.id)}
                  >
                    {isLoading ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

