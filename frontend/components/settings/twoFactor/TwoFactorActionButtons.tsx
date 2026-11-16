import { Button, Icon } from '@/components/ui';

interface TwoFactorActionButtonsProps {
  isBusy: boolean;
  /** Inicia `POST /2fa/setup`. */
  onSetup: () => void;
  /** Abre el diálogo de confirmación de desactivado (no llama al API aún). */
  onOpenDisable: () => void;
  /** Regenera recovery codes. */
  onRegenerate: () => void;
}

/**
 * Acciones principales: iniciar setup, desactivar y regenerar códigos.
 */
export function TwoFactorActionButtons({
  isBusy,
  onSetup,
  onOpenDisable,
  onRegenerate,
}: TwoFactorActionButtonsProps) {
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
        Iniciar configuración
      </Button>
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
