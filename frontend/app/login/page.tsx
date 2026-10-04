import React from 'react';
import { LoginPage } from '@/components/auth';

/**
 * Ruta pública de autenticación.
 *
 * Esta página solo delega en el componente reutilizable de login.
 * El flujo actual está reducido a email y contraseña, y sirve como punto
 * de entrada antes de conectar con el backend real.
 */
export default function LoginRoute() {
  return <LoginPage />;
}
