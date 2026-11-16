'use client';

import { useEffect, useRef, useState } from 'react';
import { useBoards } from './useBoards';

export type UseBoardActionsOptions = {
  /** Tras un rename exitoso (p. ej. actualizar el título del kanban). */
  onRenamed?: (name: string) => void;
};

/**
 * Lógica compartida de renombrar / eliminar un board.
 *
 * La usan:
 * - `BoardCardMenu` (cards del dashboard / `/boards`)
 * - `BoardHeader` (kanban)
 *
 * Así no hay dos copias de PATCH/DELETE stub + dialogs state.
 */
export function useBoardActions(
  boardId: string,
  boardName: string,
  options: UseBoardActionsOptions = {}
) {
  const { onRenamed } = options;
  const { updateBoard, deleteBoard } = useBoards();

  const [isOpen, setIsOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(boardName);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRenameValue(boardName);
  }, [boardName]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  /** Abre el diálogo de renombrar y cierra el bocadillo. */
  const openRename = () => {
    setIsOpen(false);
    setRenameValue(boardName);
    setRenameError(null);
    setIsRenameOpen(true);
  };

  /** Abre el ConfirmDialog de borrar y cierra el bocadillo. */
  const openDelete = () => {
    setIsOpen(false);
    setIsDeleteOpen(true);
  };

  const handleRename = async () => {
    const trimmed = renameValue.trim();
    if (trimmed.length < 2) {
      setRenameError('El nombre debe tener al menos 2 caracteres');
      return;
    }
    setRenameError(null);
    try {
      const board = await updateBoard(boardId, { name: trimmed });
      setIsRenameOpen(false);
      setNotice('Tablero renombrado.');
      onRenamed?.(board.name);
    } catch (err) {
      setRenameError(
        err instanceof Error ? err.message : 'No se pudo renombrar'
      );
    }
  };

  const handleDelete = async () => {
    setIsDeleteOpen(false);
    try {
      await deleteBoard(boardId);
      setNotice(
        'Eliminación pendiente de API: UI lista, sin endpoint DELETE aún.'
      );
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : 'No se pudo eliminar el tablero'
      );
    }
  };

  return {
    isOpen,
    setIsOpen,
    isRenameOpen,
    setIsRenameOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    menuRef,
    renameValue,
    setRenameValue,
    renameError,
    notice,
    setNotice,
    openRename,
    openDelete,
    handleRename,
    handleDelete,
  };
}
