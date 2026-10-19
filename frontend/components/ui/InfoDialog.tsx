'use client';

import React from 'react';
import Dialog from './Dialog';

interface InfoDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  buttonLabel?: string;
  onClose: () => void;
}

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
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-container"
        >
          {buttonLabel}
        </button>
      )}
    />
  );
}