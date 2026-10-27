/**
 * Barrel del dominio boards (tableros por organización / workspace).
 *
 * - `Board` → tipo del API
 * - `BoardsProvider` / `useBoards` → estado compartido + createBoard
 * - `mapBoardToCard` → adaptador hacia `BoardCard`
 */
export type { Board } from './board.types';
export type { BoardsState } from './boards.types';
export { BoardsProvider } from './BoardsProvider';
export { useBoards } from './useBoards';
export { mapBoardToCard } from './mapBoardToCard';
