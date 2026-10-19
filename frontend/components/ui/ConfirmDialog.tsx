'use client';

import React from 'react';
import Dialog from './Dialog';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onClose: () => void;
}

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
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 font-semibold text-white transition-colors ${
              tone === 'danger'
                ? 'bg-error hover:bg-error/90'
                : 'bg-primary hover:bg-primary-container'
            }`}
          >
            {confirmLabel}
          </button>
        </>
      )}
    />
  );
}