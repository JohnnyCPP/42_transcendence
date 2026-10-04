'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

/**
 * Guardia de rutas para la UI.
 *
 * Comprueba si existe sesión simulada y, opcionalmente, si el rol coincide.
 * Se usa como envoltorio para páginas o bloques que no deben ser públicos.
 */
export default function ProtectedRoute({ 
  children, 
  requiredRole 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    // Mientras se recupera la sesión, no hacemos nada.
    if (isLoading) return;

    // Si no hay sesión, mandamos al login.
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Si la ruta exige un rol concreto, validamos acceso.
    if (requiredRole && user?.role !== requiredRole) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, isLoading, requiredRole, user?.role, router]);

  // Indicador visual mientras se comprueba el estado de acceso.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-on-surface-variant">Loading...</p>
        </div>
      </div>
    );
  }

  // Evita pintar contenido si la redirección ya está en marcha.
  if (!isAuthenticated) {
    return null;
  }

  // Misma idea para el caso de rol insuficiente.
  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  // Si pasa las validaciones, renderizamos la ruta protegida.
  return <>{children}</>;
}
