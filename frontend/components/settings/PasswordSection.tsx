'use client';

import { Button, FormErrorBanner, Icon, TextInput, uiStyles } from '@/components/ui';
import { SettingsSectionCard } from './SettingsSectionCard';
import { usePasswordForm } from './usePasswordForm';

/**
 * Paso 2: cambiar contraseña (requiere reauth reciente cuando esté cableado).
 */
export function PasswordSection() {
  const form = usePasswordForm();

  return (
    <SettingsSectionCard
      step="2"
      title="Cambiar contraseña"
      description="Requiere haber reautenticado la sesión recientemente."
    >
      <form onSubmit={form.handleSubmit} className="space-y-4">
        <TextInput
          id="new-password"
          name="newPassword"
          type="password"
          label="Nueva contraseña"
          value={form.newPassword}
          disabled={form.isLoading}
          onChange={form.setNewPassword}
          placeholder="Mínimo 12 caracteres"
        />
        <TextInput
          id="confirm-password"
          name="confirmPassword"
          type="password"
          label="Confirmar contraseña"
          value={form.confirmPassword}
          disabled={form.isLoading}
          onChange={form.setConfirmPassword}
          placeholder="Repite la nueva contraseña"
        />

        <FormErrorBanner error={form.error} />

        {form.success && <p className={uiStyles.infoCallout}>{form.success}</p>}

        <Button
          type="submit"
          variant="primary"
          disabled={form.isLoading}
          className="gap-2"
        >
          {form.isLoading && (
            <Icon name="hourglass_empty" size="md" className="animate-spin" />
          )}
          {form.isLoading ? 'Guardando…' : 'Cambiar contraseña'}
        </Button>
      </form>
    </SettingsSectionCard>
  );
}
