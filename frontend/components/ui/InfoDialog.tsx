'use client';

import React from 'react';
import Dialog from './Dialog';
import Button from './Button';

interface InfoDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  buttonLabel?: string;
  onClose: () => void;
}

/**
 * Diálogo informativo con un solo CTA (cierra al confirmar).
 *
 * Ejemplo: aviso “Nueva tarea desde dashboard”.
 */
export default function InfoDialog({
  isOpen,
  title,
  description,
  buttonLabel = 'Entendido',
  onClose,
}: InfoDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      title={title}
      description={description}
      onClose={onClose}
      footer={(
        <Button variant="primary" onClick={onClose}>
          {buttonLabel}
        </Button>
      )}
    />
  );
}
