import { cx, uiStyles } from '@/components/ui';
import { QRCodeSVG } from 'qrcode.react';

interface TwoFactorSetupFieldsProps {
  /** Secreto parseado del URI (o null si aún no hay setup). */
  manualSecret: string | null;
  /** URI `otpauth://…` devuelto por setup. */
  provisioningUri: string;
}

/**
 * Paso visual tras `begin`: QR para la app autenticadora, más secreto y URI
 * por si el escaneo no es posible.
 */
export function TwoFactorSetupFields({
  manualSecret,
  provisioningUri,
}: TwoFactorSetupFieldsProps) {
  return (
    <div className="space-y-4">
      {provisioningUri ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 md:p-5">
          <p className={uiStyles.formLabel}>Código QR</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Escanea este código con tu aplicación de autenticación (Google
            Authenticator, 1Password, Authy…).
          </p>
          <div className="mt-4 flex justify-center">
            <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
              <QRCodeSVG
                value={provisioningUri}
                size={184}
                title="Código QR para configurar 2FA"
                className="block"
              />
            </div>
          </div>
        </div>
      ) : null}

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
    </div>
  );
}
