import { Button, Icon } from '@/components/ui';

interface TwoFactorActionButtonsProps {
  isBusy: boolean;
  twoFactorEnabled: boolean;
  /** Inicia `POST /2fa/setup`. */
  onSetup: () => void;
  /** Abre el diálogo de confirmación de desactivado. */
  onOpenDisable: () => void;
  /** Regenera recovery codes. */
  onRegenerate: () => void;
}

/**
 * Acciones según estado:
 * - disabled → Enable 2FA
 * - enabled → Disable + Regenerate
 */
export function TwoFactorActionButtons({
  isBusy,
  twoFactorEnabled,
  onSetup,
  onOpenDisable,
  onRegenerate,
}: TwoFactorActionButtonsProps) {
  if (!twoFactorEnabled) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          disabled={isBusy}
          onClick={onSetup}
          className="gap-2"
        >
          {isBusy ? (
            <Icon name="hourglass_empty" size="md" className="animate-spin" />
          ) : (
            <Icon name="qr_code_2" size="md" />
          )}
          Activar 2FA
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="danger"
        disabled={isBusy}
        onClick={onOpenDisable}
      >
        Desactivar 2FA
      </Button>
      <Button
        type="button"
        variant="secondary"
        disabled={isBusy}
        onClick={onRegenerate}
      >
        Regenerar códigos
      </Button>
    </div>
  );
}
