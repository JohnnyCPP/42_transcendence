'use client';

import { useEffect, useState } from 'react';

/**
 * Conexión WebSocket en tiempo real a un tablero (Épica 5).
 *
 * Abre `wss://<host>/ws` (la cookie de sesión viaja sola), se suscribe a
 * `boardId` cuando el servidor dice `ready` y mantiene la lista de
 * usuarios que están viendo el tablero.
 */
export type PresenceUser = { id: string; username: string; displayName: string | null };

type ServerMessage =
  | { type: 'ready'; user: PresenceUser }
  | { type: 'presence:state'; boardId: string; users: PresenceUser[] }
  | { type: 'presence:joined' | 'presence:left'; boardId: string; user: PresenceUser }
  | { type: 'error'; code: string; message: string; boardId?: string };

export type SocketStatus = 'connecting' | 'open' | 'closed' | 'unauthorized';

export function useBoardSocket(boardId: string) {
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const [presentUsers, setPresentUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const socket = new WebSocket(`wss://${window.location.host}/ws`);

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as ServerMessage;

      switch (message.type) {
        case 'ready':
          socket.send(JSON.stringify({ type: 'subscribe:board', boardId }));
          return;
        case 'presence:state':
          setStatus('open');
          setPresentUsers(message.users);
          return;
        case 'presence:joined':
          setPresentUsers((users) =>
            users.some((user) => user.id === message.user.id) ? users : [...users, message.user]
          );
          return;
        case 'presence:left':
          setPresentUsers((users) => users.filter((user) => user.id !== message.user.id));
          return;
        case 'error':
          console.warn('[ws]', message.code, message.message);
      }
    };
    socket.onclose = (event) => {
      setPresentUsers([]);
      setStatus(event.code === 4401 ? 'unauthorized' : 'closed');
    };
    return () => socket.close(1000, 'Leaving board');
  }, [boardId]);

  return { status, presentUsers };
}
