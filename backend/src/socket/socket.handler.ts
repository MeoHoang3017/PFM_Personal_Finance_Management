/**
 * Socket.io Event Handlers
 * @description Handles all socket.io events for real-time game communication
 */

import { Server as SocketIOServer } from "socket.io";
import type { AuthenticatedSocket } from "./socket.middleware";
import { roomService } from "../services/room.service";
import { matchService } from "../services/match.service";
import { CLIENT_EVENTS, SERVER_EVENTS } from "../constants/socket.events";
import { validateRoomCode, validateMatchId, validateCoordinates, validateRoomCreateData } from "../utils/socket-validator";

export class SocketHandler {
  private io: SocketIOServer;
  private roomSockets: Map<string, Set<string>> = new Map(); // roomCode -> Set of socketIds
  private matchSockets: Map<string, Set<string>> = new Map(); // matchId -> Set of socketIds
  private socketRooms: Map<string, string> = new Map(); // socketId -> roomCode
  private socketMatches: Map<string, string> = new Map(); // socketId -> matchId

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Room events
      socket.on(CLIENT_EVENTS.ROOM_CREATE, async (data) => {
        await this.handleRoomCreate(socket, data);
      });

      socket.on(CLIENT_EVENTS.ROOM_JOIN, async (data) => {
        await this.handleRoomJoin(socket, data);
      });

      socket.on(CLIENT_EVENTS.ROOM_LEAVE, async () => {
        await this.handleRoomLeave(socket);
      });

      socket.on(CLIENT_EVENTS.ROOM_START, async (data) => {
        await this.handleRoomStart(socket, data);
      });

      // Match events
      socket.on(CLIENT_EVENTS.MATCH_JOIN, async (data) => {
        await this.handleMatchJoin(socket, data);
      });

      socket.on(CLIENT_EVENTS.MATCH_LEAVE, async () => {
        await this.handleMatchLeave(socket);
      });

      socket.on(CLIENT_EVENTS.MATCH_MOVE, async (data) => {
        await this.handleMatchMove(socket, data);
      });

      socket.on(CLIENT_EVENTS.MATCH_END, async (data) => {
        await this.handleMatchEnd(socket, data);
      });

      // Disconnect
      socket.on(CLIENT_EVENTS.DISCONNECT, async () => {
        await this.handleDisconnect(socket);
      });
    });
  }

  // Room handlers
  private async handleRoomCreate(socket: AuthenticatedSocket, data: any) {
    try {
      if (!socket.user) {
        socket.emit(SERVER_EVENTS.ERROR, { message: "Unauthorized" });
        return;
      }

      // Validate input
      const validatedData = validateRoomCreateData(data);
      if (!validatedData) {
        socket.emit(SERVER_EVENTS.ERROR, { message: "Invalid room data" });
        return;
      }

      const room = await roomService.createRoom({
        hostId: socket.user.id,
        ...validatedData,
      });

      // Join socket room
      socket.join(room.roomCode);
      this.socketRooms.set(socket.id, room.roomCode);
      if (!this.roomSockets.has(room.roomCode)) {
        this.roomSockets.set(room.roomCode, new Set());
      }
      this.roomSockets.get(room.roomCode)!.add(socket.id);

      socket.emit(SERVER_EVENTS.ROOM_CREATED, { room });
    } catch (error: any) {
      socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
    }
  }

  private async handleRoomJoin(socket: AuthenticatedSocket, data: { roomCode: string }) {
    try {
      if (!socket.user) {
        socket.emit(SERVER_EVENTS.ERROR, { message: "Unauthorized" });
        return;
      }

      // Validate room code
      const roomCode = validateRoomCode(data?.roomCode);
      if (!roomCode) {
        socket.emit(SERVER_EVENTS.ERROR, { message: "Invalid room code" });
        return;
      }

      const room = await roomService.joinRoom({
        roomCode,
        userId: socket.user.id,
      });

      // Join socket room
      socket.join(roomCode);
      this.socketRooms.set(socket.id, roomCode);
      if (!this.roomSockets.has(roomCode)) {
        this.roomSockets.set(roomCode, new Set());
      }
      this.roomSockets.get(roomCode)!.add(socket.id);

      // Notify all in room
      this.io.to(roomCode).emit(SERVER_EVENTS.ROOM_UPDATED, { room });
      socket.emit(SERVER_EVENTS.ROOM_JOINED, { room });
    } catch (error: any) {
      socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
    }
  }

  private async handleRoomLeave(socket: AuthenticatedSocket) {
    try {
      if (!socket.user) {
        return;
      }

      const roomCode = this.socketRooms.get(socket.id);
      if (!roomCode) {
        return;
      }

      await roomService.leaveRoom({
        roomCode,
        userId: socket.user.id,
      });

      socket.leave(roomCode);
      this.roomSockets.get(roomCode)?.delete(socket.id);
      this.socketRooms.delete(socket.id);

      // Notify all in room
      const room = await roomService.getRoom(roomCode);
      if (room) {
        this.io.to(roomCode).emit(SERVER_EVENTS.ROOM_UPDATED, { room });
      }
      socket.emit(SERVER_EVENTS.ROOM_LEFT, { roomCode });
    } catch (error: any) {
      socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
    }
  }

  private async handleRoomStart(socket: AuthenticatedSocket, data: { roomCode: string }) {
    try {
      if (!socket.user) {
        socket.emit(SERVER_EVENTS.ERROR, { message: "Unauthorized" });
        return;
      }

      // Validate room code
      const roomCode = validateRoomCode(data?.roomCode);
      if (!roomCode) {
        socket.emit(SERVER_EVENTS.ERROR, { message: "Invalid room code" });
        return;
      }

      const result = await roomService.startMatch(roomCode, socket.user.id);

      // Notify all in room
      this.io.to(roomCode).emit(SERVER_EVENTS.ROOM_STARTED, result);
    } catch (error: any) {
      socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
    }
  }

  // Match handlers
  private async handleMatchJoin(socket: AuthenticatedSocket, data: { matchId: string }) {
    try {
      if (!socket.user) {
        socket.emit(SERVER_EVENTS.ERROR, { message: "Unauthorized" });
        return;
      }

      // Validate match ID
      const matchId = validateMatchId(data?.matchId);
      if (!matchId) {
        socket.emit(SERVER_EVENTS.ERROR, { message: "Invalid match ID" });
        return;
      }

      const match = await matchService.getMatch(matchId);
      if (!match) {
        socket.emit(SERVER_EVENTS.ERROR, { message: "Match not found" });
        return;
      }

      // Join socket room
      socket.join(matchId);
      this.socketMatches.set(socket.id, matchId);
      if (!this.matchSockets.has(matchId)) {
        this.matchSockets.set(matchId, new Set());
      }
      this.matchSockets.get(matchId)!.add(socket.id);

      socket.emit(SERVER_EVENTS.MATCH_JOINED, { match });
    } catch (error: any) {
      socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
    }
  }

  private async handleMatchLeave(socket: AuthenticatedSocket) {
    const matchId = this.socketMatches.get(socket.id);
    if (matchId) {
      socket.leave(matchId);
      this.matchSockets.get(matchId)?.delete(socket.id);
      this.socketMatches.delete(socket.id);
      socket.emit(SERVER_EVENTS.MATCH_LEFT, { matchId });
    }
  }

  private async handleMatchMove(socket: AuthenticatedSocket, data: { matchId: string; x: number; y: number }) {
    try {
      if (!socket.user) {
        socket.emit(SERVER_EVENTS.ERROR, { message: "Unauthorized" });
        return;
      }

      // Validate match ID
      const matchId = validateMatchId(data?.matchId);
      if (!matchId) {
        socket.emit(SERVER_EVENTS.ERROR, { message: "Invalid match ID" });
        return;
      }

      // Validate coordinates (max board size 20 = 0-19)
      const coords = validateCoordinates(data?.x, data?.y, 19);
      if (!coords) {
        socket.emit(SERVER_EVENTS.ERROR, { message: "Invalid coordinates" });
        return;
      }

      const result = await matchService.makeMove({
        matchId,
        x: coords.x,
        y: coords.y,
        playerId: socket.user.id,
      });

      // Broadcast to all in match
      this.io.to(matchId).emit(SERVER_EVENTS.MATCH_MOVE_MADE, {
        match: result.match,
        move: { x: coords.x, y: coords.y, playerId: socket.user.id },
      });

      if (result.isWin) {
        this.io.to(matchId).emit(SERVER_EVENTS.MATCH_WIN, {
          match: result.match,
          winner: result.match.winner,
        });
      } else if (result.isDraw) {
        this.io.to(matchId).emit(SERVER_EVENTS.MATCH_DRAW, {
          match: result.match,
        });
      }
    } catch (error: any) {
      socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
    }
  }

  private async handleMatchEnd(socket: AuthenticatedSocket, data: { matchId: string }) {
    try {
      if (!socket.user) {
        socket.emit(SERVER_EVENTS.ERROR, { message: "Unauthorized" });
        return;
      }

      // Validate match ID
      const matchId = validateMatchId(data?.matchId);
      if (!matchId) {
        socket.emit(SERVER_EVENTS.ERROR, { message: "Invalid match ID" });
        return;
      }

      const match = await matchService.endMatch(matchId, socket.user.id);

      // Broadcast to all in match
      this.io.to(matchId).emit(SERVER_EVENTS.MATCH_ENDED, { match });
    } catch (error: any) {
      socket.emit(SERVER_EVENTS.ERROR, { message: error.message });
    }
  }

  private async handleDisconnect(socket: AuthenticatedSocket) {
    console.log(`Socket disconnected: ${socket.id}`);

    // Clean up room
    const roomCode = this.socketRooms.get(socket.id);
    if (roomCode && socket.user) {
      try {
        await roomService.leaveRoom({
          roomCode,
          userId: socket.user.id,
        });
        this.roomSockets.get(roomCode)?.delete(socket.id);
        const room = await roomService.getRoom(roomCode);
        if (room) {
          this.io.to(roomCode).emit(SERVER_EVENTS.ROOM_UPDATED, { room });
        }
      } catch (error) {
        // Ignore errors on disconnect
      }
    }
    this.socketRooms.delete(socket.id);

    // Clean up match
    const matchId = this.socketMatches.get(socket.id);
    if (matchId) {
      this.matchSockets.get(matchId)?.delete(socket.id);
    }
    this.socketMatches.delete(socket.id);
  }
}

