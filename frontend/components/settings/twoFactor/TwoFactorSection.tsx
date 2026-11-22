'use client';

import {
  Button,
  ConfirmDialog,
  Dialog,
  FormErrorBanner,
  uiStyles,
} from '@/components/ui';
import { SettingsSectionCard } from '../SettingsSectionCard';
import {
  useTwoFactorForm,
  TwoFactorStatusBadge,
  TwoFactorActionButtons,
  TwoFactorSetupFields,
  TwoFactorConfirmForm,
  RecoveryCodes,
} from './';

/**
 * Paso 3 de seguridad: configurar, confirmar, regenerar o desactivar 2FA.
 *
 * Orquesta subcomponentes presentacionales + `useTwoFactorForm`.
 * Los recovery codes se muestran en un modal tras setup/regenerate.
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
            twoFactorEnabled={form.twoFactorEnabled}
            onSetup={form.handleSetup}
            onOpenDisable={() => form.setIsDisableOpen(true)}
            onRegenerate={form.handleRegenerate}
          />

          {form.isSetupPending && (
            <>
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
            </>
          )}

          <FormErrorBanner error={form.error} />

          {form.info && <p className={uiStyles.infoCallout}>{form.info}</p>}
        </div>
      </SettingsSectionCard>

      <Dialog
        isOpen={form.isRecoveryCodesOpen}
        title="Códigos de recuperación"
        description="Guárdalos ahora — no se volverán a mostrar."
        onClose={form.closeRecoveryCodes}
        footer={
          <Button variant="primary" onClick={form.closeRecoveryCodes}>
            Listo
          </Button>
        }
      >
        <RecoveryCodes recoveryCodes={form.recoveryCodes} embedded />
      </Dialog>

      <ConfirmDialog
        isOpen={form.isDisableOpen}
        title="Desactivar 2FA"
        description="¿Seguro que quieres desactivar el segundo factor? Necesitas una reautenticación reciente."
        confirmLabel="Desactivar"
        tone="danger"
        onConfirm={form.handleDisableConfirm}
        onClose={() => form.setIsDisableOpen(false)}
      />
    </>
  );
}
