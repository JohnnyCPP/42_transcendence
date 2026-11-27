'use client';

import type { PresenceUser, SocketStatus } from '@/lib/useBoardSocket';

interface BoardPresenceProps {
  users: PresenceUser[];
  status: SocketStatus;
}

/**
 * Quién está viendo el tablero ahora mismo, según la presencia que manda
 * el servidor por WebSocket. Mientras no hay conexión muestra el estado.
 */
export default function BoardPresence({ users, status }: BoardPresenceProps) {
  if (status === 'unauthorized') return null;
  if (status !== 'open') {
    return (
      <p className="mx-6 text-sm text-on-surface-variant">
        {status === 'connecting' ? 'Conectando en tiempo real…' : 'Sin conexión en tiempo real'}
      </p>
    );
  }
  return (
    <ul className="mx-6 flex flex-wrap items-center gap-2 text-sm" aria-label="Usuarios viendo el tablero">
      {users.map((user) => (
        <li key={user.id} className="rounded-full border border-outline-variant px-3 py-1 text-on-surface">
          {user.displayName ?? user.username}
        </li>
      ))}
    </ul>
  );
}
