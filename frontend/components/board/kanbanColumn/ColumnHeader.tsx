'use client';

import React, { useState } from 'react';

interface ColumnHeaderProps {
  title: string;
  taskCount: number;
  onRename: () => void;
  onDelete: () => void;
}

/**
 * Encabezado de la columna Kanban
 * Muestra el título, la cantidad de tareas y acciones rápidas.
 */
export default function ColumnHeader({
  title,
  taskCount,
  onRename,
  onDelete,
}: ColumnHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="kanban-column-header relative">
      <div className="flex items-center gap-2">
        <span className="text-[16px] font-semibold text-on-surface">{title}</span>
        <span className="text-on-surface-variant text-xs font-semibold bg-surface-container-lowest px-2 py-0.5 rounded-full">
          {taskCount}
        </span>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="rounded-md p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          aria-label="Acciones de la columna"
        >
          <span className="material-symbols-outlined text-[18px]">more_horiz</span>
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-10 z-20 min-w-40 rounded-xl border border-outline-variant bg-white p-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onRename();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-on-surface transition-colors hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Editar nombre
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onDelete();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-error transition-colors hover:bg-error/10"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Eliminar columna
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
