'use client';

import React from 'react';
import Dialog from './Dialog';
import Button from './Button';
import TextInput from './TextInput';

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

/**
 * Diálogo con un campo de texto + cancelar / guardar.
 *
 * Usa `TextInput` y `Button`. Ejemplo: añadir / renombrar columna del kanban.
 */
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
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      )}
    >
      <TextInput
        id="text-input-dialog-field"
        name="text-input-dialog-field"
        label={label}
        value={value}
        placeholder={placeholder}
        error={error}
        autoFocus
        onChange={onChange}
      />
    </Dialog>
  );
}
