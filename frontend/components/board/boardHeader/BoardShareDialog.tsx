import { useMemo, useState } from 'react';
import { Button, Dialog, uiStyles } from '@/components/ui';

type BoardShareDialogProps = {
  isOpen: boolean;
  boardId: string;
  onClose: () => void;
};

/**
 * Dialog para copiar el enlace del board (sin flujo de invitaciones aún).
 */
export function BoardShareDialog({
  isOpen,
  boardId,
  onClose,
}: BoardShareDialogProps) {
  const [isCopied, setIsCopied] = useState(false);

  const boardLink = useMemo(() => {
    const path = `/boards/${boardId}`;
    if (typeof window === 'undefined') return path;
    return `${window.location.origin}${path}`;
  }, [boardId]);

  const handleClose = () => {
    setIsCopied(false);
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(boardLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1800);
    } catch {
      setIsCopied(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      title="Compartir board"
      description="Comparte este board con el resto del equipo mediante un enlace de referencia."
      onClose={handleClose}
      footer={(
        <Button variant="primary" onClick={handleClose}>
          Cerrar
        </Button>
      )}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className={uiStyles.formLabel}>Enlace del board</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={boardLink}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-xl border border-primary px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              Copiar
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
          {isCopied
            ? 'Enlace copiado al portapapeles.'
            : 'Usa este enlace como referencia mientras no exista un flujo completo de invitaciones.'}
        </div>
      </div>
    </Dialog>
  );
}
