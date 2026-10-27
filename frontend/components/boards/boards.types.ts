import type { Board } from './board.types';

/**
 * Estado compartido de tableros del workspace (org) activo.
 */
export type BoardsState = {
  boards: Board[];
  isLoading: boolean;
  error: string | null;
};
