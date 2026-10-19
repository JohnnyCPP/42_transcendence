import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui';

interface TaskModalFooterProps {
  taskId: string;
  currentColumnId: string;
  onClose: () => void;
  onDelete: (taskId: string, columnId: string) => void;
}

export default function TaskModalFooter({
  taskId,
  currentColumnId,
  onClose,
  onDelete,
}: TaskModalFooterProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleConfirmDelete = () => {
    onDelete(taskId, currentColumnId);
    setIsDeleteDialogOpen(false);
    onClose();
  };

  return (
    <>
      <div className="flex items-center justify-between pt-4 border-t border-surface-container-highest">
        <button
          type="button"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="flex items-center gap-1 text-error hover:bg-error/10 px-3 py-2 rounded-md text-[13px] font-semibold transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
          Eliminar tarea
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-md text-[14px] font-medium transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-primary hover:bg-primary-container text-white rounded-md text-[14px] font-semibold transition-colors shadow-xs cursor-pointer"
          >
            Guardar cambios
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Eliminar tarea"
        description="Esta acción eliminará la tarea actual del tablero."
        confirmLabel="Eliminar"
        tone="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </>
  );
}