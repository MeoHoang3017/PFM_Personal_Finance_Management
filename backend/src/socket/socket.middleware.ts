/**
 * Socket.io Authentication Middleware
 * @description Authenticates socket connections using JWT
 */

import { Socket } from "socket.io";
import type { ExtendedError } from "socket.io/dist/namespace";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    isGuest: boolean;
  };
}

/**
 * Socket authentication middleware
 */
export const socketAuth = async (
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void
) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    try {
      const user = verifyAccessToken(token);
      socket.user = user;
      next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        return next(new Error("Token expired"));
      }
      return next(new Error("Invalid token"));
    }
  } catch (error: any) {
    return next(new Error("Authentication error"));
  }
};

