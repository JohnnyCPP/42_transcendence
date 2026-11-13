'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { apiFetch } from '@/lib/apiClient';
import { useOrg } from '@/components/org';
import type { Board } from './board.types';
import type { BoardsState } from './boards.types';

export type UpdateBoardInput = {
  name?: string;
  description?: string | null;
};

type BoardsContextValue = BoardsState & {
  refreshBoards: () => Promise<void>;
  createBoard: (name: string, description?: string) => Promise<Board>;
  /**
   * `PATCH /boards/:boardId`
   * Stub: cablea con `apiFetch` cuando quieras.
   */
  updateBoard: (boardId: string, input: UpdateBoardInput) => Promise<Board>;
  /**
   * Eliminar board — endpoint aún no existe en el BE.
   * Stub no-op para UI; el compañero publicará `DELETE` después.
   */
  deleteBoard: (boardId: string) => Promise<void>;
  clearError: () => void;
};

export const BoardsContext = createContext<BoardsContextValue | null>(null);

/**
 * Estado compartido de tableros del workspace (org) activo.
 *
 * Depende de `OrgProvider` (`useOrg`). Debe montarse debajo de él en el layout.
 */
export const BoardsProvider = ({ children }: { children: ReactNode }) => {
  const { activeOrganization, isLoading: isOrgLoading } = useOrg();
  const [boardsState, setBoardsState] = useState<BoardsState>({
    boards: [],
    isLoading: true,
    error: null,
  });

  const refreshBoards = useCallback(async () => {
    if (!activeOrganization) {
      setBoardsState({ boards: [], isLoading: false, error: null });
      return;
    }

    setBoardsState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await apiFetch<{ boards: Board[] }>(
        `/organizations/${activeOrganization.id}/boards`
      );
      setBoardsState({
        boards: data.boards,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar los tableros';
      setBoardsState({ boards: [], isLoading: false, error: message });
    }
  }, [activeOrganization]);

  const createBoard = useCallback(
    async (name: string, description?: string): Promise<Board> => {
      if (!activeOrganization) {
        throw new Error('Selecciona un workspace antes de crear un tablero.');
      }

      setBoardsState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await apiFetch<{ board: Board }>(
          `/organizations/${activeOrganization.id}/boards`,
          {
            method: 'POST',
            body: JSON.stringify({
              name,
              description: description ?? null,
            }),
          }
        );

        setBoardsState((prev) => ({
          boards: [...prev.boards, data.board],
          isLoading: false,
          error: null,
        }));

        return data.board;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Error al crear el tablero';
        setBoardsState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        throw err;
      }
    },
    [activeOrganization]
  );

  /**
   * `PATCH /boards/:boardId`
   * Body: `{ name?, description? }` → `{ board }`
   *
   * TODO: sustituir el throw por apiFetch y actualizar `boards` en state.
   */
  const updateBoard = useCallback(
    async (boardId: string, input: UpdateBoardInput): Promise<Board> => {
      void boardId;
      void input;
      // TODO: wire apiFetch
      // const data = await apiFetch<{ board: Board }>(`/boards/${boardId}`, {
      //   method: 'PATCH',
      //   body: JSON.stringify(input),
      // });
      // setBoardsState((prev) => ({
      //   ...prev,
      //   boards: prev.boards.map((board) =>
      //     board.id === data.board.id ? data.board : board
      //   ),
      //   error: null,
      // }));
      // return data.board;
      throw new Error(
        'TODO: cablea updateBoard con apiFetch (PATCH /boards/:boardId)'
      );
    },
    []
  );

  /**
   * Eliminar tablero — sin endpoint aún.
   * No llama a la red; la UI muestra feedback “pendiente de API”.
   *
   * TODO: cuando exista, p. ej. `DELETE /boards/:boardId`
   * y quitar el board de `boards` / redirigir a `/boards`.
   */
  const deleteBoard = useCallback(async (boardId: string) => {
    void boardId;
    // No-op a propósito (UI funcional, sin conectar).
    return;
  }, []);

  const clearError = useCallback(() => {
    setBoardsState((prev) => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    if (isOrgLoading) {
      setBoardsState((prev) => ({ ...prev, isLoading: true }));
      return;
    }
    void refreshBoards();
  }, [isOrgLoading, refreshBoards]);

  const value: BoardsContextValue = {
    ...boardsState,
    isLoading: isOrgLoading || boardsState.isLoading,
    refreshBoards,
    createBoard,
    updateBoard,
    deleteBoard,
    clearError,
  };

  return (
    <BoardsContext.Provider value={value}>{children}</BoardsContext.Provider>
  );
};
