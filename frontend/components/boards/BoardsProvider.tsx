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

/** Body de `PATCH /boards/:boardId`. */
export type UpdateBoardInput = {
  name?: string;
  description?: string | null;
};

type BoardsContextValue = BoardsState & {
  refreshBoards: () => Promise<void>;
  createBoard: (name: string, description?: string) => Promise<Board>;
  /**
   * Actualiza nombre/descripción del tablero.
   * `PATCH /boards/:boardId` → reemplaza el board en state.
   */
  updateBoard: (boardId: string, input: UpdateBoardInput) => Promise<Board>;
  /**
   * Archiva el tablero.
   * `DELETE /boards/:boardId` → lo quita de `boards` en state.
   */
  deleteBoard: (boardId: string) => Promise<void>;
  clearError: () => void;
};

export const BoardsContext = createContext<BoardsContextValue | null>(null);

/**
 * Estado compartido de tableros del workspace (org) activo.
 *
 * - API: `GET/POST /organizations/:id/boards`, `PATCH`/`DELETE /boards/:boardId`
 * - Depende de `OrgProvider` (`useOrg`); montar debajo de él en el layout.
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
   * Actualiza nombre/descripción del tablero.
   *
   * `PATCH /boards/:boardId`
   * Body: `{ name?, description? }` → `{ board }`
   */
  const updateBoard = useCallback(
    async (boardId: string, input: UpdateBoardInput): Promise<Board> => {
      const data = await apiFetch<{ board: Board }>(`/boards/${boardId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });

      setBoardsState((prev) => ({
        ...prev,
        boards: prev.boards.map((board) =>
          board.id === data.board.id ? data.board : board
        ),
        error: null,
      }));

      return data.board;
    },
    []
  );

  /**
   * Archiva el tablero.
   *
   * `DELETE /boards/:boardId` → `{ board }`
   * Tras éxito, lo elimina de la lista local.
   */
  const deleteBoard = useCallback(async (boardId: string) => {
    await apiFetch<{ board: Board }>(`/boards/${boardId}`, {
      method: 'DELETE',
    });

    setBoardsState((prev) => ({
      ...prev,
      boards: prev.boards.filter((board) => board.id !== boardId),
      error: null,
    }));
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
