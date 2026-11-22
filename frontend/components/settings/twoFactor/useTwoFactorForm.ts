'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  confirm2fa,
  disable2fa,
  parseTotpSecretFromUri,
  regenerateRecoveryCodes,
  setup2fa,
} from '@/lib/securityApi';

/**
 * Estado y handlers de la sección 2FA (setup, confirm, regenerar, desactivar).
 *
 * `twoFactorEnabled` es estado de sesión de UI hasta que `GET /me` exponga el flag.
 * Tras confirm/regenerate se abren los recovery codes en un modal.
 */
export function useTwoFactorForm() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [provisioningUri, setProvisioningUri] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isDisableOpen, setIsDisableOpen] = useState(false);
  const [isRecoveryCodesOpen, setIsRecoveryCodesOpen] = useState(false);

  /** Secreto TOTP extraído del `otpauth://` para copiar a mano. */
  const manualSecret = useMemo(
    () => (provisioningUri ? parseTotpSecretFromUri(provisioningUri) : null),
    [provisioningUri]
  );

  const isSetupPending = Boolean(provisioningUri) && !twoFactorEnabled;

  /** Envuelve una acción async: limpia feedback, marca busy y captura errores. */
  const runAction = useCallback(async (action: () => Promise<void>) => {
    setError(null);
    setInfo(null);
    setIsBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Acción de 2FA fallida');
    } finally {
      setIsBusy(false);
    }
  }, []);

  /** `POST /two-factor/begin` → guarda el provisioning URI. */
  const handleSetup = () =>
    runAction(async () => {
      const data = await setup2fa();
      setProvisioningUri(data.provisioningUri);
      setInfo('Escanea o copia el URI y confirma con un código TOTP.');
    });

  /** Valida TOTP de 6 dígitos y llama `POST /two-factor/confirm`. */
  const handleConfirm = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = confirmCode.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setError('Introduce un código TOTP de 6 dígitos');
      return;
    }
    void runAction(async () => {
      const data = await confirm2fa({ code: trimmed });
      setRecoveryCodes(data.recoveryCodes);
      setTwoFactorEnabled(true);
      setConfirmCode('');
      setProvisioningUri('');
      setIsRecoveryCodesOpen(true);
      setInfo('2FA activado. Guarda los códigos de recuperación.');
    });
  };

  /** `POST /two-factor/regenerate`. */
  const handleRegenerate = () =>
    runAction(async () => {
      const data = await regenerateRecoveryCodes();
      setRecoveryCodes(data.recoveryCodes);
      setTwoFactorEnabled(true);
      setIsRecoveryCodesOpen(true);
      setInfo('Nuevos códigos de recuperación generados. Guárdalos ahora.');
    });

  /** Cierra el dialog y ejecuta `DELETE /two-factor`. */
  const handleDisableConfirm = () => {
    setIsDisableOpen(false);
    void runAction(async () => {
      await disable2fa();
      setTwoFactorEnabled(false);
      setProvisioningUri('');
      setRecoveryCodes([]);
      setConfirmCode('');
      setIsRecoveryCodesOpen(false);
      setInfo('2FA desactivado.');
    });
  };

  /** Cierra el modal de codes; no se vuelven a mostrar en esta sesión. */
  const closeRecoveryCodes = useCallback(() => {
    setIsRecoveryCodesOpen(false);
    setRecoveryCodes([]);
  }, []);

  return {
    twoFactorEnabled,
    isSetupPending,
    provisioningUri,
    confirmCode,
    setConfirmCode,
    recoveryCodes,
    isBusy,
    error,
    info,
    isDisableOpen,
    setIsDisableOpen,
    isRecoveryCodesOpen,
    closeRecoveryCodes,
    manualSecret,
    handleSetup,
    handleConfirm,
    handleRegenerate,
    handleDisableConfirm,
  };
}
