import { Button, TextInput } from '@/components/ui';

interface TwoFactorConfirmFormProps {
  isBusy: boolean;
  confirmCode: string;
  onConfirmCodeChange: (code: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

/**
 * Formulario para confirmar el setup con un código TOTP de 6 dígitos.
 */
export function TwoFactorConfirmForm({
  isBusy,
  confirmCode,
  onConfirmCodeChange,
  onSubmit,
}: TwoFactorConfirmFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="min-w-0 flex-1">
        <TextInput
          id="confirm-totp"
          name="code"
          label="Código TOTP"
          value={confirmCode}
          disabled={isBusy}
          onChange={onConfirmCodeChange}
          placeholder="123456"
        />
      </div>
      <Button
        type="submit"
        variant="primary"
        disabled={isBusy}
        className="shrink-0"
      >
        Confirmar 2FA
      </Button>
    </form>
  );
}
