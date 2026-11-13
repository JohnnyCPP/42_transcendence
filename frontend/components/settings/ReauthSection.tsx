'use client';

import {
  Button,
  FormErrorBanner,
  Icon,
  TextInput,
  uiStyles,
} from '@/components/ui';
import { SecondFactorSelector } from './SecondFactorSelector';
import { SettingsSectionCard } from './SettingsSectionCard';
import { useReauthForm } from './useReauthForm';

type ReauthSectionProps = {
  onSuccess?: () => void;
};

/**
 * Paso 1 de seguridad: reautenticar la sesión para acciones sensibles.
 */
export function ReauthSection({ onSuccess }: ReauthSectionProps) {
  const form = useReauthForm(onSuccess);

  return (
    <SettingsSectionCard
      step="1"
      title="Reautenticar"
      description="Confirma tu identidad para habilitar acciones sensibles durante unos minutos."
    >
      <form onSubmit={form.handleSubmit} className="space-y-4">
        <TextInput
          id="reauth-password"
          name="password"
          type="password"
          label="Contraseña actual"
          value={form.password}
          disabled={form.isLoading}
          onChange={form.setPassword}
          placeholder="Tu contraseña"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SecondFactorSelector
            value={form.method}
            disabled={form.isLoading}
            onChange={form.setMethod}
          />

          <TextInput
            id="reauth-code"
            name="secondFactorCode"
            label="Código 2FA"
            value={form.secondFactorCode}
            disabled={form.isLoading || !form.method}
            onChange={form.setSecondFactorCode}
            placeholder={form.method === 'totp' ? '123456' : 'xxxxxxxxxxxx'}
          />
        </div>

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
          {form.isLoading ? 'Confirmando…' : 'Confirmar identidad'}
        </Button>
      </form>
    </SettingsSectionCard>
  );
}
