'use client';

import React, { useState } from 'react';
import { Icon, uiStyles } from '@/components/ui';

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
          <Icon name="more_horiz" size="md" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-10 z-20 min-w-40 rounded-xl border border-outline-variant bg-white p-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onRename();
              }}
              className={uiStyles.dropdownItem}
            >
              <Icon name="edit" size="md" />
              Editar nombre
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onDelete();
              }}
              className={uiStyles.dropdownItemDanger}
            >
              <Icon name="delete" size="md" />
              Eliminar columna
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
