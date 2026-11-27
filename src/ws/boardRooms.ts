/**
 * Salas por tablero y presencia.
 *
 * Cada tablero tiene una sala con los sockets suscritos. Un usuario puede
 * tener varias pestañas (varios sockets) en la misma sala: solo se anuncia
 * presence:joined con su primer socket y presence:left cuando se va el último.
 *
 * Además guarda todos los sockets conectados (estén o no en una sala), que el
 * heartbeat de la Story 5.5 recorrerá para detectar conexiones muertas.
 *
 * Implementa BoardEventPublisher: los servicios publican aquí los cambios de
 * listas y tarjetas y llegan a todos los suscritos al tablero.
 */
import { toPublicProfile } from "./types.js";
import type { AuthenticatedSocket, PublicProfile } from "./types.js";
import type { BoardEvent, BoardEventPublisher } from "./boardEvents.js";

export	class	BoardRooms implements BoardEventPublisher
{
	readonly	sockets = new Set<AuthenticatedSocket>();
	private		rooms = new Map<string, Set<AuthenticatedSocket>>();

	add(socket: AuthenticatedSocket): void
	{
		this.sockets.add(socket);
	}

	join(boardId: string, socket: AuthenticatedSocket): void
	{
		let	room = this.rooms.get(boardId);

		if (!room)
		{
			room = new Set();
			this.rooms.set(boardId, room);
		}
		if (room.has(socket))
			return;
		const	wasPresent = this.isUserInRoom(room, socket.user.id);

		room.add(socket);
		socket.send(JSON.stringify({ type: "presence:state", boardId, users: this.presentUsers(room) }));
		if (!wasPresent)
			this.sendToRoom(boardId, { type: "presence:joined", boardId, user: toPublicProfile(socket.user) }, socket);
	}

	leave(boardId: string, socket: AuthenticatedSocket): void
	{
		const	room = this.rooms.get(boardId);

		if (!room || !room.delete(socket))
			return;
		if (room.size === 0)
			this.rooms.delete(boardId);
		else if (!this.isUserInRoom(room, socket.user.id))
			this.sendToRoom(boardId, { type: "presence:left", boardId, user: toPublicProfile(socket.user) });
	}

	remove(socket: AuthenticatedSocket): void
	{
		this.sockets.delete(socket);
		for (const boardId of [...this.rooms.keys()])
			this.leave(boardId, socket);
	}

	publish(boardId: string, event: BoardEvent): void
	{
		this.sendToRoom(boardId, { ...event, boardId });
	}

	private	sendToRoom(boardId: string, message: object, except?: AuthenticatedSocket): void
	{
		const	room = this.rooms.get(boardId);
		const	json = JSON.stringify(message);

		if (!room)
			return;
		for (const socket of room)
			if (socket !== except && socket.readyState === socket.OPEN)
				socket.send(json);
	}

	private	isUserInRoom(room: Set<AuthenticatedSocket>, userId: string): boolean
	{
		for (const socket of room)
			if (socket.user.id === userId)
				return true;
		return false;
	}

	private	presentUsers(room: Set<AuthenticatedSocket>): PublicProfile[]
	{
		const	users = new Map<string, PublicProfile>();

		for (const socket of room)
			users.set(socket.user.id, toPublicProfile(socket.user));
		return [...users.values()];
	}
}
