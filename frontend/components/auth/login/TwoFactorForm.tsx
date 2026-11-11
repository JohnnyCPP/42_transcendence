'use client';

import React, { useState, useCallback } from 'react';
import { Button, Icon, uiStyles, cx } from '@/components/ui';

export type TwoFactorMethod = 'totp' | 'recovery_code';

interface TwoFactorFormProps {
  isLoading?: boolean;
  error?: string | null;
  onSubmit: (code: string, method: TwoFactorMethod) => Promise<void>;
  onBack: () => void;
}

/**
 * Segundo paso del login cuando el backend responde `requires_2fa`.
 */
export default function TwoFactorForm({
  isLoading = false,
  error,
  onSubmit,
  onBack,
}: TwoFactorFormProps) {
  const [code, setCode] = useState('');
  const [method, setMethod] = useState<TwoFactorMethod>('totp');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLocalError(null);

      const trimmed = code.trim();
      if (method === 'totp' && !/^\d{6}$/.test(trimmed)) {
        setLocalError('Introduce el código de 6 dígitos de tu autenticador');
        return;
      }
      if (method === 'recovery_code' && !/^[A-Za-z0-9_-]{12}$/.test(trimmed)) {
        setLocalError('Introduce un código de recuperación válido');
        return;
      }

      try {
        await onSubmit(trimmed, method);
      } catch (err) {
        setLocalError(
          err instanceof Error ? err.message : 'No se pudo verificar el código'
        );
      }
    },
    [code, method, onSubmit]
  );

  const displayError = error || localError;
  const inputClassName = cx(
    uiStyles.input,
    'placeholder-on-surface-variant transition-all disabled:cursor-not-allowed disabled:opacity-50'
  );

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="flex gap-2 rounded-lg bg-surface-container p-1">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => setMethod('totp')}
          className={cx(
            'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            method === 'totp'
              ? 'bg-white text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          )}
        >
          Autenticador
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => setMethod('recovery_code')}
          className={cx(
            'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            method === 'recovery_code'
              ? 'bg-white text-on-surface shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          )}
        >
          Recuperación
        </button>
      </div>

      <div className="space-y-2">
        <label htmlFor="twoFactorCode" className={uiStyles.formLabel}>
          {method === 'totp' ? 'Código de 6 dígitos' : 'Código de recuperación'}
        </label>
        <input
          id="twoFactorCode"
          type="text"
          inputMode={method === 'totp' ? 'numeric' : 'text'}
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={method === 'totp' ? '123456' : 'xxxxxxxxxxxx'}
          disabled={isLoading}
          className={inputClassName}
        />
      </div>

      {displayError && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
          <div className="flex items-start gap-2">
            <Icon name="error" size="md" className="shrink-0 mt-0.5" />
            <span>{displayError}</span>
          </div>
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={isLoading}
        className="gap-2 disabled:opacity-50"
      >
        {isLoading && (
          <Icon name="hourglass_empty" size="lg" className="animate-spin" />
        )}
        <span>{isLoading ? 'Verificando…' : 'Continuar'}</span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="lg"
        fullWidth
        disabled={isLoading}
        onClick={onBack}
      >
        Volver
      </Button>
    </form>
  );
}
