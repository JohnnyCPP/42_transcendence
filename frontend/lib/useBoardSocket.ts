'use client';

import { useEffect, useRef, useState } from 'react';
import type { ApiCard, ApiList } from '@/components/board/boardApi.types';

/**
 * Conexión WebSocket en tiempo real a un tablero (Épica 5).
 *
 * - Abre `wss://<host>/ws` (la cookie de sesión viaja sola).
 * - Al conectar se suscribe a `boardId`, mantiene la lista de usuarios que
 *   están viendo el tablero y entrega cada cambio de listas o tarjetas a
 *   `onEvent`.
 * - Si la conexión se cae, reconecta con backoff exponencial (1s, 2s, 4s...
 *   máximo 30s). Al reconectar, cuando la suscripción ya está confirmada,
 *   llama a `onReconnect` para que la página recargue el tablero por REST.
 * - No reconecta si el servidor cierra con 4401 (sesión no válida).
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

export type SocketStatus = 'connecting' | 'open' | 'reconnecting' | 'unauthorized';

interface BoardSocketHandlers {
  onEvent: (event: BoardEvent) => void;
  onReconnect: () => void;
}

const MAX_DELAY_MS = 30_000;

/**
 * Espera antes del reintento número `attempt` (empieza en 0): 1s, 2s, 4s...
 * hasta 30s. Se multiplica por un valor al azar entre 0.5 y 1 (jitter) para
 * que, si el backend se reinicia, no reconecten todos los clientes a la vez.
 */
export function reconnectDelay(attempt: number): number {
  const base = Math.min(MAX_DELAY_MS, 1000 * 2 ** attempt);
  return Math.round(base * (0.5 + Math.random() / 2));
}

export function useBoardSocket(boardId: string, handlers: BoardSocketHandlers) {
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const [presentUsers, setPresentUsers] = useState<PresenceUser[]>([]);
  // Siempre los últimos handlers, sin tener que reabrir el socket en cada render.
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    // Variables del efecto, no estado de React: no deben provocar renders.
    let socket: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let hasConnectedBefore = false;
    let needsResync = false;
    let stopped = false;

    function handleMessage(message: ServerMessage) {
      switch (message.type) {
        case 'ready':
          socket?.send(JSON.stringify({ type: 'subscribe:board', boardId }));
          return;
        case 'presence:state':
          setStatus('open');
          setPresentUsers(message.users);
          // Ya estamos en la sala: lo que pase a partir de aquí llega por
          // WebSocket, y lo que pasó mientras estábamos fuera, por REST.
          if (needsResync) {
            needsResync = false;
            handlersRef.current.onReconnect();
          }
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
    }

    function connect() {
      const ws = new WebSocket(`wss://${window.location.host}/ws`);

      socket = ws;
      ws.onopen = () => {
        attempt = 0;
        needsResync = hasConnectedBefore;
        hasConnectedBefore = true;
      };
      ws.onmessage = (event) => {
        try {
          handleMessage(JSON.parse(event.data) as ServerMessage);
        } catch {
          console.warn('[ws] invalid message', event.data);
        }
      };
      ws.onclose = (event) => {
        setPresentUsers([]);
        // Cerrado por la limpieza del efecto (salir del tablero): no se reintenta.
        if (stopped) return;
        // Sin sesión válida reintentar no sirve: no va a volver sola.
        if (event.code === 4401) {
          setStatus('unauthorized');
          return;
        }
        setStatus('reconnecting');
        timer = setTimeout(connect, reconnectDelay(attempt));
        attempt += 1;
      };
    }

    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      socket?.close(1000, 'Leaving board');
    };
  }, [boardId]);

  return { status, presentUsers };
}
