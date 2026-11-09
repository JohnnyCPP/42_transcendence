/**
 * Tipos e interfaces compartidos para autenticación.
 *
 * Este archivo define el contrato interno entre:
 * - Formularios de login/signup
 * - Hook de autenticación (`useAuth`)
 * - Componentes que consumen el estado de sesión
 */

// export interface LoginCredentials {
//   email: string;
//   password: string;
// }

export interface LoginCredentials {
  /** Identificador principal de acceso según contrato backend. */
  username: string;
  /** Contraseña en texto plano enviada al endpoint de autenticación. */
  password: string;
}

/**
 * Posibles respuestas del backend en el flujo de login/registro.
 *
 * - `authenticated`: sesión creada correctamente
 * - `requires_2fa`: requiere segundo factor para completar acceso
 */
export type LoginResponses =
  | { status: 'authenticated'; user: AuthUser; sessionExpiresAt?: string }
  | { status: 'requires_2fa'; challengeToken: string; expiresAt: string };

/**
 * Representación del usuario autenticado en frontend.
 *
 * Se mantiene separado del modelo de base de datos para poder
 * adaptar campos del backend sin acoplar toda la UI.
 */
export interface AuthUser {
  /** Identificador único del usuario. */
  id: string;
  /** Username mostrado y usado para iniciar sesión. */
  username: string;
  /** Email opcional (puede no existir en cuentas antiguas o internas). */
  email?: string | null;
  /** Nombre visible en la interfaz (display name). */
  name: string;
  /** URL opcional de avatar para UI. */
  avatar?: string;
  /** Rol de autorización (ej. `user`, `admin`). */
  role?: string;
}

/**
 * Estado de autenticación que maneja el hook `useAuth`.
 *
 * Permite a la UI saber:
 * - si hay usuario activo
 * - si aún se está validando sesión
 * - si existe error de auth
 */
export interface AuthState {
  /** Usuario autenticado actual o `null` si no hay sesión. */
  user: AuthUser | null;
  /** Bandera de carga para login/logout/signup/rehidratación de sesión. */
  isLoading: boolean;
  /** Mensaje de error para mostrar feedback en pantalla. */
  error: string | null;
  /** Estado derivado para guards y render condicional. */
  isAuthenticated: boolean;
}

/**
 * Respuesta de login genérica usada por algunos componentes.
 *
 * `token` y `refreshToken` se dejan opcionales porque el proyecto
 * usa sesión por cookie HttpOnly, no JWT obligatorio en localStorage.
 */
export interface LoginResponse {
  user: AuthUser;
  token?: string;
  refreshToken?: string;
}

/**
 * Forma estándar de errores de autenticación.
 *
 * `field` permite asociar el error a un input concreto del formulario.
 */
export interface AuthError {
  /** Código de error interno o devuelto por API (ej. `INVALID_CREDENTIALS`). */
  code: string;
  /** Mensaje legible para usuario o logs. */
  message: string;
  /** Campo opcional relacionado con el error (`username`, `password`, etc.). */
  field?: string;
}
