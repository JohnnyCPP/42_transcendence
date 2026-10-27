
/**
 * Valida los datos mínimos del formulario de registro.
 *
 * Devuelve:
 * - `string` con mensaje de error cuando alguna regla falla
 * - `null` cuando el formulario es válido
 */
export function validateSignupForm(username: string, password: string, email: string | null): string | null {
    // Username y contraseña son obligatorios para continuar.
    if (!username || !password.trim()) {
      return 'Debes completar username y contraseña para continuar.';
    }

    // Regla de longitud mínima del username.
    if (username.length < 3) {
      return 'El username debe tener al menos 3 caracteres.';
    }

    // Regla de seguridad mínima en contraseña.
    if (password.length < 12) {
      return 'La contraseña debe tener al menos 12 caracteres.';
    }

    // Si se informa email, validamos formato básico.
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'El email no tiene un formato válido.';
    }

    // Sin errores de validación.
    return null;
}