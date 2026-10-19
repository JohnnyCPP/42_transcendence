'use client';

import React from 'react';
import Dialog from './Dialog';

interface TextInputDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  label: string;
  value: string;
  error?: string | null;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function TextInputDialog({
  isOpen,
  title,
  description,
  label,
  value,
  error,
  placeholder,
  confirmLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  onChange,
  onConfirm,
  onClose,
}: TextInputDialogProps) {
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
            className="rounded-xl bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-container"
          >
            {confirmLabel}
          </button>
        </>
      )}
    >
      <div className="space-y-2">
        <label className="block text-sm font-medium text-on-surface">{label}</label>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border px-4 py-3 text-on-surface transition-all focus:outline-none focus:ring-2 ${
            error
              ? 'border-error focus:ring-error/30'
              : 'border-outline-variant focus:ring-primary/20'
          }`}
        />
        {error && <p className="text-sm font-medium text-error">{error}</p>}
      </div>
    </Dialog>
  );
}