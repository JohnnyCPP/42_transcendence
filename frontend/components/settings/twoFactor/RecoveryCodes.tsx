'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Icon, uiStyles } from '@/components/ui';

type RecoveryCodesProps = {
  recoveryCodes: string[];
  /**
   * En modal: omite el título/aviso duplicados (los aporta el Dialog).
   * En panel: muestra cabecera + warning inline.
   */
  embedded?: boolean;
};

function HeaderRecoveryCodes({ hasCodes }: { hasCodes: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Códigos de recuperación
      </p>
      {hasCodes ? (
        <p className="max-w-md text-sm font-medium text-error">
          Guárdalos ahora — no se volverán a mostrar.
        </p>
      ) : (
        <p className="text-sm text-on-surface-variant">
          Se mostrarán una sola vez después de confirmar o regenerar.
        </p>
      )}
    </div>
  );
}

function RecoveryCodesList({
  recoveryCodes,
  copied,
}: {
  recoveryCodes: string[];
  copied: boolean;
}) {
  if (recoveryCodes.length === 0) return null;

  return (
    <>
      <ul
        className="grid gap-2 sm:grid-cols-2"
        aria-label="Lista de códigos de recuperación"
      >
        {recoveryCodes.map((code) => (
          <li
            key={code}
            className="rounded-lg border border-outline-variant bg-surface-bright px-3 py-2 font-mono text-sm tracking-wide text-on-surface"
          >
            {code}
          </li>
        ))}
      </ul>

      {copied && (
        <p className={uiStyles.infoCallout} role="status" aria-live="polite">
          Códigos copiados al portapapeles.
        </p>
      )}
    </>
  );
}

/**
 * Muestra los códigos de recuperación tras confirm/regenerate,
 * o un placeholder si aún no hay ninguno.
 *
 * Cuando hay códigos: aviso de un solo uso + botón Copiar (todos juntos).
 */
export function RecoveryCodes({
  recoveryCodes,
  embedded = false,
}: RecoveryCodesProps) {
  const [copied, setCopied] = useState(false);
  const hasCodes = recoveryCodes.length > 0;
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (!hasCodes) return;
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      setCopied(true);
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [hasCodes, recoveryCodes]);

  return (
    <div
      className={
        embedded
          ? 'space-y-3'
          : 'space-y-3 rounded-xl border border-outline-variant bg-surface-container-low p-4'
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        {!embedded && <HeaderRecoveryCodes hasCodes={hasCodes} />}
        {embedded && hasCodes && (
          <p className="text-sm text-on-surface-variant">
            Copia todos los códigos y guárdalos en un sitio seguro.
          </p>
        )}

        {hasCodes && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              void handleCopy();
            }}
            className="gap-2 shrink-0"
            aria-label="Copiar todos los códigos de recuperación"
          >
            <Icon name={copied ? 'check' : 'content_copy'} size="md" />
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
        )}
      </div>

      <RecoveryCodesList recoveryCodes={recoveryCodes} copied={copied} />
    </div>
  );
}
