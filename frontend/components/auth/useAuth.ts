'use client';

import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

/**
 * Hook consumidor del estado de autenticación.
 *
 * No guarda estado propio: lee el valor compartido que reparte
 * `AuthProvider` a través de `AuthContext`.
 *
 * Debe usarse siempre dentro de un árbol envuelto por `AuthProvider`
 * (normalmente en el layout raíz de la app).
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
