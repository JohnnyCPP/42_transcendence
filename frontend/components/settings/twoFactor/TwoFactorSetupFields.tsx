import { cx, uiStyles } from '@/components/ui';

interface TwoFactorSetupFieldsProps {
  /** Secreto parseado del URI (o null si aún no hay setup). */
  manualSecret: string | null;
  /** URI `otpauth://…` devuelto por setup. */
  provisioningUri: string;
}

/**
 * Campos de solo lectura tras iniciar el setup: secreto manual y URI.
 */
export function TwoFactorSetupFields({
  manualSecret,
  provisioningUri,
}: TwoFactorSetupFieldsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1">
        <label htmlFor="manual-secret" className={uiStyles.formLabel}>
          Secreto manual
        </label>
        <input
          id="manual-secret"
          readOnly
          value={manualSecret ?? ''}
          placeholder="Aparecerá al iniciar la configuración"
          className={cx(uiStyles.input, 'bg-surface-container-low text-sm')}
        />
      </div>
      <div className="space-y-1 md:col-span-2">
        <label htmlFor="provisioning-uri" className={uiStyles.formLabel}>
          URI de aprovisionamiento
        </label>
        <textarea
          id="provisioning-uri"
          readOnly
          rows={3}
          value={provisioningUri}
          placeholder="otpauth://…"
          className={cx(
            uiStyles.input,
            'resize-y bg-surface-container-low font-mono text-xs'
          )}
        />
      </div>
    </div>
  );
}
