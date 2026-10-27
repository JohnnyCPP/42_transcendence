'use client';

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { AuthState, AuthUser } from './auth.types';
import { apiFetch } from '@/lib/apiClient';

/**
 * Forma del usuario tal y como llega desde el backend.
 *
 * Se mantiene separada de `AuthUser` para desacoplar la UI
 * de posibles cambios de naming en la API.
 */
type BackendUser = {
  id: string;
  username: string;
  email: string | null;
  displayName?: string | null;
  role?: string;
};

/**
 * Respuestas posibles de login/register:
 * - autenticado: sesión creada correctamente
 * - requires_2fa: hace falta un segundo factor para completar el acceso
 */
type LoginApiResponse =
  | { status: 'authenticated'; user: BackendUser; sessionExpiresAt?: string }
  | { status: 'requires_2fa'; challengeToken: string; expiresAt: string };

/**
 * Adaptador backend → frontend.
 *
 * Convierte la forma de la API (`BackendUser`) al modelo
 * que consumen los componentes (`AuthUser`).
 */
function mapBackendUser(user: BackendUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email ?? undefined,
    name: user.displayName ?? user.username,
    role: user.role,
  };
}

/**
 * Datos y acciones de autenticación que el provider reparte a la app.
 *
 * Combina el estado de sesión (`AuthState`) con los métodos
 * que la UI usa para login, registro y cierre de sesión.
 */
type AuthContextValue = AuthState & {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (username: string, password: string, email?: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
};

/**
 * Context de autenticación.
 *
 * Empieza en `null` para detectar usos fuera de `AuthProvider`.
 * Los consumidores deben pasar por el hook `useAuth`.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provider de autenticación.
 *
 * Guarda el estado de sesión una sola vez y lo comparte con
 * todos los hijos mediante `AuthContext`.
 *
 * La sesión real vive en cookies HttpOnly del backend;
 * aquí solo mantenemos el estado de UI sincronizado.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  /**
   * Estado central de autenticación.
   *
   * Arranca en loading porque al montar se valida la sesión con `/me`.
   */
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
    isAuthenticated: false,
  });

  /**
   * Rehidratación de sesión al montar.
   *
   * Si existe cookie válida en el backend, recupera el usuario
   * y marca la sesión como activa. Si falla, deja estado anónimo
   * sin romper la aplicación.
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await apiFetch<{ user: BackendUser }>('/me');
        if (data?.user) {
          setAuthState({
            user: mapBackendUser(data.user),
            isLoading: false,
            error: null,
            isAuthenticated: true,
          });
          return;
        }
      } catch (err) {
        console.debug('No hay sesión activa en el backend:', err);
      }

      setAuthState({
        user: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      });
    };

    void checkAuth();
  }, []);

  /**
   * Login principal por `username + password`.
   *
   * En éxito, el backend crea la cookie HttpOnly y devolvemos
   * el usuario mapeado al estado de la UI.
   */
  const login = useCallback(async (username: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await apiFetch<LoginApiResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (data.status === 'requires_2fa') {
        throw new Error(
          'Esta cuenta requiere 2FA. Completa el segundo factor para continuar.'
        );
      }

      setAuthState({
        user: mapBackendUser(data.user),
        isLoading: false,
        error: null,
        isAuthenticated: true,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'No se pudo iniciar sesión';
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  /**
   * Cierre de sesión.
   *
   * Invalida la sesión en el backend y limpia el estado local de auth.
   */
  const logout = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      await apiFetch<{ ok: boolean }>('/auth/logout', {
        method: 'POST',
      });

      setAuthState({
        user: null,
        isLoading: false,
        error: null,
        isAuthenticated: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'No se pudo cerrar sesión';
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  /**
   * Registro de usuario.
   *
   * Crea la cuenta y, si el backend lo permite, deja la sesión autenticada.
   */
  const signup = useCallback(
    async (username: string, password: string, email?: string) => {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await apiFetch<LoginApiResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            username,
            email: email || undefined,
            password,
          }),
        });

        if (data.status === 'requires_2fa') {
          throw new Error(
            'Esta cuenta requiere 2FA para completar el acceso.'
          );
        }

        setAuthState({
          user: mapBackendUser(data.user),
          isLoading: false,
          error: null,
          isAuthenticated: true,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'No se pudo registrar la cuenta';
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw err;
      }
    },
    []
  );

  /**
   * Refresco del estado de sesión.
   *
   * Revalida con `/me`; si falla, fuerza logout para evitar
   * estados inconsistentes en la UI.
   */
  const refreshToken = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: BackendUser }>('/me');
      setAuthState({
        user: mapBackendUser(data.user),
        isLoading: false,
        error: null,
        isAuthenticated: true,
      });
    } catch (err) {
      await logout();
      throw err;
    }
  }, [logout]);

  /** Limpia el mensaje de error actual sin tocar el resto del estado. */
  const clearError = useCallback(() => {
    setAuthState((prev) => ({ ...prev, error: null }));
  }, []);

  // Paquete que reciben los consumidores a través del context.
  const value: AuthContextValue = {
    ...authState,
    login,
    logout,
    signup,
    refreshToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
