'use client';

import { useContext } from 'react';
import { BoardsContext } from './BoardsProvider';

/**
 * Hook consumidor del estado de boards (tableros).
 *
 * Debe usarse dentro de `BoardsProvider` (layout, bajo `OrgProvider`).
 */
export function useBoards() {
  const context = useContext(BoardsContext);

  if (!context) {
    throw new Error('useBoards debe usarse dentro de BoardsProvider');
  }

  return context;
}
