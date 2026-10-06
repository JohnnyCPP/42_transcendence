'use client';

import React from 'react';

interface DialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
}

export default function Dialog({
  isOpen,
  title,
  description,
  children,
  footer,
  onClose,
}: DialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-outline-variant bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {children && <div className="px-6 py-5">{children}</div>}

        {footer && <div className="flex items-center justify-end gap-3 border-t border-outline-variant px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}