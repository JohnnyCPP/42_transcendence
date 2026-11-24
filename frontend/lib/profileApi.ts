import { apiFetch } from '@/lib/apiClient';

/**
 * Cliente tipado del perfil del usuario autenticado.
 *
 * Contrato esperado (BE pendiente de confirmar):
 * `PATCH /me` → `{ user }` con displayName / email actualizados.
 * Hoy solo existe `PATCH /users/:id` (admin); si `/me` no está, el form
 * mostrará el AppError del backend.
 */

export type UpdateMyProfileInput = {
  displayName?: string | null;
  email?: string | null;
};

export type ProfileUser = {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  role?: string;
};

/**
 * Actualiza el perfil del usuario de la sesión actual.
 *
 * `PATCH /me`
 * Body: `{ displayName?, email? }`
 * Response: `{ user }`
 */
export async function updateMyProfile(
  input: UpdateMyProfileInput
): Promise<{ user: ProfileUser }> {
  return apiFetch<{ user: ProfileUser }>('/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
