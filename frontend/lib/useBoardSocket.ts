'use client';

import { useEffect, useRef, useState } from 'react';
import type { ApiCard, ApiList } from '@/components/board/boardApi.types';

/**
 * Conexión WebSocket en tiempo real a un tablero (Épica 5).
 *
 * Abre `wss://<host>/ws` (la cookie de sesión viaja sola), se suscribe a
 * `boardId` cuando el servidor dice `ready`, mantiene la lista de usuarios
 * que están viendo el tablero y entrega cada cambio de listas o tarjetas
 * a `onEvent`.
 */
export type PresenceUser = { id: string; username: string; displayName: string | null };

export type BoardEvent =
  | { type: 'card:created'; boardId: string; card: ApiCard }
  | { type: 'card:updated'; boardId: string; card: ApiCard }
  | { type: 'card:moved'; boardId: string; card: ApiCard; fromListId: string }
  | { type: 'card:deleted'; boardId: string; cardId: string; listId: string }
  | { type: 'list:created'; boardId: string; list: ApiList }
  | { type: 'list:updated'; boardId: string; list: ApiList }
  | { type: 'list:deleted'; boardId: string; listId: string };

type ServerMessage =
  | BoardEvent
  | { type: 'ready'; user: PresenceUser }
  | { type: 'presence:state'; boardId: string; users: PresenceUser[] }
  | { type: 'presence:joined' | 'presence:left'; boardId: string; user: PresenceUser }
  | { type: 'error'; code: string; message: string; boardId?: string };

export type SocketStatus = 'connecting' | 'open' | 'closed' | 'unauthorized';

interface BoardSocketHandlers {
  onEvent: (event: BoardEvent) => void;
}

export function useBoardSocket(boardId: string, handlers: BoardSocketHandlers) {
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const [presentUsers, setPresentUsers] = useState<PresenceUser[]>([]);
  // Siempre el último onEvent, sin tener que reabrir el socket en cada render.
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

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
          return;
        default:
          // Eventos de listas y tarjetas; se ignoran los de otro tablero.
          if (message.boardId === boardId) handlersRef.current.onEvent(message);
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
