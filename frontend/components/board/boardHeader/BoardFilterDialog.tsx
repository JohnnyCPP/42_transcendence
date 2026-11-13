import { BoardFilters, TaskPriority } from '@/types/board';
import { Button, Dialog } from '@/components/ui';
import { priorityLabels, priorityOptions } from './boardConst';

type BoardFilterDialogProps = {
  isOpen: boolean;
  filters: BoardFilters;
  onTogglePriority: (priority: TaskPriority) => void;
  onToggleCompletedOnly: () => void;
  onClearFilters: () => void;
  onClose: () => void;
};

/**
 * Dialog de filtros del board: prioridades + solo completadas.
 */
export function BoardFilterDialog({
  isOpen,
  filters,
  onTogglePriority,
  onToggleCompletedOnly,
  onClearFilters,
  onClose,
}: BoardFilterDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      title="Filtrar tareas del board"
      description="Combina prioridades y estado para centrarte solo en las tareas que necesitas ver."
      onClose={onClose}
      footer={(
        <>
          <Button variant="ghost" onClick={onClearFilters}>
            Limpiar
          </Button>
          <Button variant="primary" onClick={onClose}>
            Cerrar
          </Button>
        </>
      )}
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-on-surface">
            Prioridades
          </p>
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
                  {priorityLabels[priority]}
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
  );
}
