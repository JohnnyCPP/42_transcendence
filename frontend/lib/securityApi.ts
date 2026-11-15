import { apiFetch } from '@/lib/apiClient';

/**
 * Cliente tipado de seguridad de cuenta: reauth, cambio de contraseña y 2FA.
 *
 * Usa `apiFetch` (cookies de sesión, JSON, `ApiError` en fallos HTTP).
 * Los errores se propagan sin capturarlos aquí; los hooks de settings
 * (`useReauthForm`, `usePasswordForm`, `useTwoFactorForm`) los muestran en UI.
 *
 * Mutaciones sensibles (todo excepto `reauthenticate`) exigen un
 * `POST /auth/reauthenticate` reciente en la misma sesión. Si no, el
 * backend responde con `REAUTHENTICATION_REQUIRED`.
 */

/** Segundo factor admitido en reauth / login. */
export type SecondFactorMethod = 'totp' | 'recovery_code';

/** Body de `POST /auth/reauthenticate`. */
export type ReauthenticateInput = {
  password: string;
  secondFactorCode?: string;
  secondFactorMethod?: SecondFactorMethod;
};

/** Body de `POST /auth/password/change` (mín. 12 caracteres). */
export type ChangePasswordInput = {
  newPassword: string;
};

/** Body de `POST /2fa/confirm`. */
export type Confirm2faInput = {
  /** Código TOTP de 6 dígitos. */
  code: string;
};

/** Respuesta de `POST /2fa/setup`. */
export type Setup2faResult = {
  /** URI `otpauth://…` para escanear o copiar el secreto. */
  provisioningUri: string;
};

/** Respuesta al confirmar o regenerar códigos de recuperación. */
export type RecoveryCodesResult = {
  recoveryCodes: string[];
};

/**
 * Extrae el secreto TOTP de un `otpauth://…` si está presente.
 * Útil para mostrar el secreto manual cuando no hay QR.
 */
export function parseTotpSecretFromUri(
  provisioningUri: string
): string | null {
  try {
    const url = new URL(provisioningUri);
    return url.searchParams.get('secret');
  } catch {
    const match = /[?&]secret=([^&]+)/i.exec(provisioningUri);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
}

/**
 * Confirma la identidad del usuario en la sesión actual.
 *
 * `POST /auth/reauthenticate`
 * Body: `{ password, secondFactorCode?, secondFactorMethod? }`
 * Response: `{ ok: true }`
 *
 * Si el usuario ya tiene 2FA activo, conviene enviar también el segundo factor.
 */
export async function reauthenticate(
  input: ReauthenticateInput
): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>('/auth/reauthenticate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Cambia la contraseña del usuario autenticado.
 *
 * `POST /auth/password/change`
 * Body: `{ newPassword }` (min 12)
 * Response: `{ ok: true }`
 *
 * Requiere reauth reciente. Otras sesiones se revocan en backend.
 */
export async function changePassword(
  input: ChangePasswordInput
): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>('/auth/password/change', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Inicia el alta de TOTP y devuelve el URI de aprovisionamiento.
 *
 * `POST /2fa/setup` → `{ provisioningUri }`
 *
 * Requiere reauth reciente. El 2FA no queda activo hasta `confirm2fa`.
 */
export async function setup2fa(): Promise<Setup2faResult> {
  return apiFetch<Setup2faResult>('/2fa/setup', { method: 'POST' });
}

/**
 * Confirma el setup TOTP con un código de 6 dígitos.
 *
 * `POST /2fa/confirm` → `{ recoveryCodes }`
 *
 * Requiere reauth reciente. Guarda los códigos: se muestran una sola vez.
 */
export async function confirm2fa(
  input: Confirm2faInput
): Promise<RecoveryCodesResult> {
  return apiFetch<RecoveryCodesResult>('/2fa/confirm', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Invalida los códigos de recuperación actuales y genera unos nuevos.
 *
 * `POST /2fa/recovery-codes/regenerate` → `{ recoveryCodes }`
 *
 * Requiere reauth reciente y 2FA ya activado.
 */
export async function regenerateRecoveryCodes(): Promise<RecoveryCodesResult> {
  return apiFetch<RecoveryCodesResult>('/2fa/recovery-codes/regenerate', {
    method: 'POST',
  });
}

/**
 * Desactiva el 2FA del usuario.
 *
 * `DELETE /2fa` → `{ ok: true }`
 *
 * Requiere reauth reciente. Otras sesiones se revocan en backend.
 */
export async function disable2fa(): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>('/2fa', { method: 'DELETE' });
}
