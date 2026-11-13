/**
 * Cliente tipado de seguridad de cuenta (reauth, password, 2FA).
 *
 * Los cuerpos están stubbeados a propósito: sustituye cada `throw` por
 * `apiFetch` (import desde `@/lib/apiClient`) cuando cables el backend.
 *
 * Todas las mutaciones sensibles (salvo reauthenticate) exigen
 * `POST /auth/reauthenticate` reciente en la sesión.
 */

export type SecondFactorMethod = 'totp' | 'recovery_code';

export type ReauthenticateInput = {
  password: string;
  secondFactorCode?: string;
  secondFactorMethod?: SecondFactorMethod;
};

export type ChangePasswordInput = {
  newPassword: string;
};

export type Confirm2faInput = {
  /** Código TOTP de 6 dígitos. */
  code: string;
};

export type Setup2faResult = {
  provisioningUri: string;
};

export type RecoveryCodesResult = {
  recoveryCodes: string[];
};

/**
 * Extrae el secreto TOTP de un `otpauth://…` si está presente.
 */
export function parseTotpSecretFromUri(provisioningUri: string): string | null {
  try {
    const url = new URL(provisioningUri);
    return url.searchParams.get('secret');
  } catch {
    const match = /[?&]secret=([^&]+)/i.exec(provisioningUri);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
}

/**
 * `POST /auth/reauthenticate`
 * Body: `{ password, secondFactorCode?, secondFactorMethod? }`
 * Response: `{ ok: true }`
 */
export async function reauthenticate(
  _input: ReauthenticateInput
): Promise<{ ok: true }> {
  // TODO: wire apiFetch
  // return apiFetch<{ ok: true }>('/auth/reauthenticate', {
  //   method: 'POST',
  //   body: JSON.stringify(_input),
  // });
  void _input;
  throw new Error(
    'TODO: cablea reauthenticate con apiFetch (POST /auth/reauthenticate)'
  );
}

/**
 * `POST /auth/password/change`
 * Body: `{ newPassword }` (min 12)
 * Response: `{ ok: true }`
 * Requiere reauth reciente.
 */
export async function changePassword(
  _input: ChangePasswordInput
): Promise<{ ok: true }> {
  // TODO: wire apiFetch
  // return apiFetch<{ ok: true }>('/auth/password/change', {
  //   method: 'POST',
  //   body: JSON.stringify(_input),
  // });
  void _input;
  throw new Error(
    'TODO: cablea changePassword con apiFetch (POST /auth/password/change)'
  );
}

/**
 * `POST /2fa/setup`
 * Response: `{ provisioningUri }`
 * Requiere reauth reciente.
 */
export async function setup2fa(): Promise<Setup2faResult> {
  // TODO: wire apiFetch
  // return apiFetch<Setup2faResult>('/2fa/setup', { method: 'POST' });
  throw new Error('TODO: cablea setup2fa con apiFetch (POST /2fa/setup)');
}

/**
 * `POST /2fa/confirm`
 * Body: `{ code }` (6 dígitos)
 * Response: `{ recoveryCodes: string[] }`
 * Requiere reauth reciente.
 */
export async function confirm2fa(
  _input: Confirm2faInput
): Promise<RecoveryCodesResult> {
  // TODO: wire apiFetch
  // return apiFetch<RecoveryCodesResult>('/2fa/confirm', {
  //   method: 'POST',
  //   body: JSON.stringify(_input),
  // });
  void _input;
  throw new Error('TODO: cablea confirm2fa con apiFetch (POST /2fa/confirm)');
}

/**
 * `POST /2fa/recovery-codes/regenerate`
 * Response: `{ recoveryCodes: string[] }`
 * Requiere reauth reciente.
 */
export async function regenerateRecoveryCodes(): Promise<RecoveryCodesResult> {
  // TODO: wire apiFetch
  // return apiFetch<RecoveryCodesResult>('/2fa/recovery-codes/regenerate', {
  //   method: 'POST',
  // });
  throw new Error(
    'TODO: cablea regenerateRecoveryCodes con apiFetch (POST /2fa/recovery-codes/regenerate)'
  );
}

/**
 * `DELETE /2fa`
 * Response: `{ ok: true }`
 * Requiere reauth reciente.
 */
export async function disable2fa(): Promise<{ ok: true }> {
  // TODO: wire apiFetch
  // return apiFetch<{ ok: true }>('/2fa', { method: 'DELETE' });
  throw new Error('TODO: cablea disable2fa con apiFetch (DELETE /2fa)');
}
