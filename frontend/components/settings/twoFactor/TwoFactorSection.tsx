'use client';

import { ConfirmDialog, FormErrorBanner, uiStyles } from '@/components/ui';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { useTwoFactorForm, TwoFactorStatusBadge, TwoFactorActionButtons, 
		TwoFactorSetupFields, TwoFactorConfirmForm, RecoveryCodes } from './';


/**
 * Paso 3 de seguridad: configurar, confirmar, regenerar o desactivar 2FA.
 *
 * Orquesta subcomponentes presentacionales + `useTwoFactorForm`.
 * El estado enabled es solo de UI (`GET /me` no expone `twoFactorEnabled`).
 */
export function TwoFactorSection() {
  const form = useTwoFactorForm();

  return (
    <>
      <SettingsSectionCard
        step="3"
        title="Segundo factor (TOTP)"
        description="Configura, confirma o desactiva el autenticador. Guarda los códigos de recuperación."
        className="md:col-span-2"
      >
        <div className="space-y-5">
          <TwoFactorStatusBadge twoFactorEnabled={form.twoFactorEnabled} />

          <TwoFactorActionButtons
            isBusy={form.isBusy}
            onSetup={form.handleSetup}
            onOpenDisable={() => form.setIsDisableOpen(true)}
            onRegenerate={form.handleRegenerate}
          />

          <TwoFactorSetupFields
            manualSecret={form.manualSecret}
            provisioningUri={form.provisioningUri}
          />

          <TwoFactorConfirmForm
            isBusy={form.isBusy}
            confirmCode={form.confirmCode}
            onConfirmCodeChange={form.setConfirmCode}
            onSubmit={form.handleConfirm}
          />

          <RecoveryCodes recoveryCodes={form.recoveryCodes} />

          <FormErrorBanner error={form.error} />

          {form.info && <p className={uiStyles.infoCallout}>{form.info}</p>}
        </div>
      </SettingsSectionCard>

      <ConfirmDialog
        isOpen={form.isDisableOpen}
        title="Desactivar 2FA"
        description="¿Seguro que quieres desactivar el segundo factor? Necesitarás reautenticación reciente cuando el endpoint esté cableado."
        confirmLabel="Desactivar"
        tone="danger"
        onConfirm={form.handleDisableConfirm}
        onClose={() => form.setIsDisableOpen(false)}
      />
    </>
  );
}
