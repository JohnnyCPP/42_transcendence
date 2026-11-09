import type { BoardCardProps } from '@/components/dashboard/dashboard.types';
import type { Board } from './board.types';

/**
 * Imagen de relleno: el API de boards aún no envía cover/avatares/progreso.
 * `BoardCard` exige `imageUrl`, así que usamos un SVG en data-URI.
 */
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#c5cae9"/>
          <stop offset="100%" stop-color="#9fa8da"/>
        </linearGradient>
      </defs>
      <rect width="640" height="320" fill="url(#g)"/>
    </svg>`
  );

/** Texto relativo a partir de `updatedAt` del board. */
function formatUpdatedText(updatedAt: string): string {
  const updated = new Date(updatedAt);
  if (Number.isNaN(updated.getTime())) {
    return 'Actualizado recientemente';
  }

  const diffMs = Date.now() - updated.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return 'Actualizado ahora';
  if (diffMinutes < 60) return `Actualizado hace ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Actualizado hace ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Actualizado hace 1 día';
  return `Actualizado hace ${diffDays} días`;
}

/**
 * Adaptador API → UI.
 *
 * Convierte un `Board` del backend en las props que espera `BoardCard`.
 */
export function mapBoardToCard(board: Board): BoardCardProps {
  return {
    title: board.name,
    updatedText: formatUpdatedText(board.updatedAt),
    label: board.description?.trim() ? 'Activo' : 'Tablero',
    href: `/boards/${board.id}`,
    imageUrl: PLACEHOLDER_IMAGE,
    avatars: [],
    progressPercent: 0,
    labelClassName: 'bg-primary text-white',
    progressClassName: 'bg-primary-container',
  };
}
