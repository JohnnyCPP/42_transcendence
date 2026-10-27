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

type BoardsContextValue = BoardsState & {
  refreshBoards: () => Promise<void>;
  createBoard: (name: string, description?: string) => Promise<Board>;
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
    clearError,
  };

  return (
    <BoardsContext.Provider value={value}>{children}</BoardsContext.Provider>
  );
};
