'use client';

import { useMemo, useState } from 'react';
import { BoardFilters, TaskPriority } from '@/types/board';
import { Dialog } from '@/components/ui';

const priorityOptions: TaskPriority[] = ['Low', 'Medium', 'Urgent', 'Enhancement', 'Complete'];

interface BoardHeaderProps {
  filters: BoardFilters;
  onTogglePriority: (priority: TaskPriority) => void;
  onToggleCompletedOnly: () => void;
  onClearFilters: () => void;
}

// Título del board con opción de favorito.
function HeaderTitle(){
	const [isStarred, setIsStarred] = useState(false);

	return (
		<div className="flex items-center gap-3">
        <h2 className="text-[32px] font-bold text-on-surface tracking-tight leading-none">
          Website Redesign
        </h2>
        <button
          onClick={() => setIsStarred(!isStarred)}
          className={`transition-colors cursor-pointer ${
            isStarred ? 'text-amber-500' : 'text-outline-variant hover:text-primary'
          }`}
          title="Star board"
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontVariationSettings: isStarred ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            star
          </span>
        </button>
      </div>
	);
} 

// Botón reutilizable para acciones del encabezado.
function HeaderButton({icon, label, onClick, active = false}: {icon: string, label: string, onClick: () => void, active?: boolean}) {
	return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold text-[12px] transition-colors cursor-pointer ${active ? 'bg-primary/10 text-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'}`}>
    		<span className="material-symbols-outlined text-[18px]">
    			{icon}
    		</span>
    		{label}
    	</button>
	);
}

// Grupo de acciones rápidas del board.
function HeaderButtonsList({
  filters,
  onTogglePriority,
  onToggleCompletedOnly,
  onClearFilters,
}: {
  filters: BoardFilters;
  onTogglePriority: (priority: TaskPriority) => void;
  onToggleCompletedOnly: () => void;
  onClearFilters: () => void;
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const activeFilterCount = filters.priorities.length + (filters.showCompletedOnly ? 1 : 0);
  const boardLink = 'https://taskflow.local/boards/website-redesign';
  const shareDescription = useMemo(
    () => `Comparte este board con el resto del equipo mediante un enlace de referencia.`,
    []
  );

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
    <>
      <div className="flex items-center gap-3 flex-wrap">
      	    <HeaderButton
          icon="filter_list"
          label={activeFilterCount > 0 ? `Filter (${activeFilterCount})` : 'Filter'}
          onClick={() => setIsFilterOpen(true)}
          active={activeFilterCount > 0}
        />

        <HeaderButton icon="person_add" label="Share" onClick={() => setIsShareOpen(true)} />
      	</div>

      <Dialog
        isOpen={isFilterOpen}
        title="Filtrar tareas del board"
        description="Combina prioridades y estado para centrarte solo en las tareas que necesitas ver."
        onClose={() => setIsFilterOpen(false)}
        footer={(
          <>
            <button
              type="button"
              onClick={onClearFilters}
              className="rounded-xl px-4 py-2 font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => setIsFilterOpen(false)}
              className="rounded-xl bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-container"
            >
              Cerrar
            </button>
          </>
        )}
      >
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-on-surface">Prioridades</p>
            <div className="flex flex-wrap gap-2">
              {priorityOptions.map((priority) => {
                const isActive = filters.priorities.includes(priority);

                return (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => onTogglePriority(priority)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {priority}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface">
            <input
              type="checkbox"
              checked={filters.showCompletedOnly}
              onChange={onToggleCompletedOnly}
              className="h-4 w-4 accent-primary"
            />
            Mostrar solo tareas completadas
          </label>
        </div>
      </Dialog>

      <Dialog
        isOpen={isShareOpen}
        title="Compartir board"
        description={shareDescription}
        onClose={() => {
          setIsShareOpen(false);
          setIsCopied(false);
        }}
        footer={(
          <button
            type="button"
            onClick={() => setIsShareOpen(false)}
            className="rounded-xl bg-primary px-4 py-2 font-semibold text-white transition-colors hover:bg-primary-container"
          >
            Cerrar
          </button>
        )}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-on-surface">Enlace del board</label>
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
    </>
	);
}

// Encabezado principal del tablero.
export default function BoardHeader({
  filters,
  onTogglePriority,
  onToggleCompletedOnly,
  onClearFilters,
}: BoardHeaderProps) {
  return (
    <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 bg-surface-container-lowest border-b border-outline-variant">
		<HeaderTitle />

    <HeaderButtonsList
      filters={filters}
      onTogglePriority={onTogglePriority}
      onToggleCompletedOnly={onToggleCompletedOnly}
      onClearFilters={onClearFilters}
    />
    </div>
  );
}
