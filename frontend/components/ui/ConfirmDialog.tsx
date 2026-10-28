'use client';

import React from 'react';
import Dialog from './Dialog';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` pinta el botón de confirmar en rojo (eliminaciones). */
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Diálogo de confirmación (cancelar + confirmar).
 *
 * Usa `Button` ghost + primary/danger. Típico en eliminar tarea/columna.
 */
export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      title={title}
      description={description}
      onClose={onClose}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      )}
    />
  );
}
