'use client';

import { useState, useCallback, useEffect } from 'react';
import { AuthState, AuthUser, LoginResponse } from './auth.types';

/**
 * Hook de autenticación de la UI.
 *
 * De momento persiste estado en localStorage para simular sesión en frontend;
 * más adelante debería depender de la sesión real del backend.
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
  });

  /**
   * Recupera una sesión simulada al montar el componente.
   *
   * Esto solo sirve mientras no exista integración real con cookies/sesión.
   */
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        const userStr = localStorage.getItem('authUser');

        if (token && userStr) {
          const user = JSON.parse(userStr) as AuthUser;
          setAuthState({
            user,
            isLoading: false,
            error: null,
            isAuthenticated: true,
          });
        }
      } catch (err) {
        console.error('Error recovering auth state:', err);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    };

    checkAuth();
  }, []);

  /**
   * Login de frontend.
   *
   * El flujo real está comentado como guía de integración con la API.
   */
  const login = useCallback(async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Reemplazar con llamada real al backend
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password }),
      // });
      //
      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(error.message);
      // }
      //
      // const data: LoginResponse = await response.json();
      // localStorage.setItem('authToken', data.token);
      // localStorage.setItem('authUser', JSON.stringify(data.user));
      //
      // setAuthState({
      //   user: data.user,
      //   isLoading: false,
      //   error: null,
      //   isAuthenticated: true,
      // });

      const simulatedUser: AuthUser = {
        id: 'frontend-session-user',
        email,
        name: email.split('@')[0] || 'Workspace User',
        role: 'member',
      };

      const simulatedResponse: LoginResponse = {
        user: simulatedUser,
        token: 'frontend-session-token',
      };

      localStorage.setItem('authToken', simulatedResponse.token);
      localStorage.setItem('authUser', JSON.stringify(simulatedResponse.user));

      setAuthState({
        user: simulatedResponse.user,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  /**
   * Logout de frontend.
   * Limpia el estado simulado y deja el hook listo para una sesión real.
   */
  const logout = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      // TODO: Llamar a backend para invalidar sesión
      // await fetch('/api/auth/logout', {
      //   method: 'POST',
      //   headers: { Authorization: `Bearer ${authState.user?.id}` },
      // });

      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');

      setAuthState({
        user: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  /**
   * Registro de frontend.
   *
   * Está preparado para cuando exista la ruta real de creación de cuentas.
   */
  const signup = useCallback(async (email: string, password: string, name: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Implementar signup en backend
      // const response = await fetch('/api/auth/signup', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password, name }),
      // });
      //
      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(error.message);
      // }
      //
      // const data: LoginResponse = await response.json();
      // localStorage.setItem('authToken', data.token);
      // localStorage.setItem('authUser', JSON.stringify(data.user));
      //
      // setAuthState({
      //   user: data.user,
      //   isLoading: false,
      //   error: null,
      //   isAuthenticated: true,
      // });

      const simulatedUser: AuthUser = {
        id: 'frontend-signup-user',
        email,
        name,
        role: 'member',
      };

      const simulatedResponse: LoginResponse = {
        user: simulatedUser,
        token: 'frontend-signup-token',
      };

      localStorage.setItem('authToken', simulatedResponse.token);
      localStorage.setItem('authUser', JSON.stringify(simulatedResponse.user));

      setAuthState({
        user: simulatedResponse.user,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  /**
   * Refresco de sesión simulado.
   * Si falla, limpia la sesión local para evitar estados inconsistentes.
   */
  const refreshToken = useCallback(async () => {
    try {
      // TODO: Llamar a backend para refrescar token
      // const response = await fetch('/api/auth/refresh', {
      //   method: 'POST',
      //   headers: {
      //     Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      //   },
      // });
      //
      // if (!response.ok) {
      //   throw new Error('Token refresh failed');
      // }
      //
      // const data: LoginResponse = await response.json();
      // localStorage.setItem('authToken', data.token);
    } catch (err) {
      await logout();
      throw err;
    }
  }, [logout]);

  /**
   * Limpia el mensaje de error mostrado en pantalla.
   */
  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    // Estado
    ...authState,

    // Acciones
    login,
    logout,
    signup,
    refreshToken,
    clearError,
  };
}
