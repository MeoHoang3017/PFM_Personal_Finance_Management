/**
 * System Messages
 * @description Centralized messages for the entire system
 * All system messages should be defined here for easy maintenance
 */

// Helper functions for dynamic messages
export const SUCCESS_MESSAGE = {
  FETCHED_LIST: (entity: string) => `${entity} list retrieved successfully`,
  FETCHED: (entity: string) => `${entity} retrieved successfully`,
  CREATED: (entity: string) => `${entity} created successfully`,
  UPDATED: (entity: string) => `${entity} updated successfully`,
  DELETED: (entity: string) => `${entity} deleted successfully`,
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
};

export const ERROR_MESSAGE = {
  MISSING_FIELDS: (fields: string[]) => `Missing required fields: ${fields.join(", ")}`,
  NOT_FOUND: (entity: string) => `${entity} not found`,
  ALREADY_EXISTS: (entity: string) => `${entity} already exists`,
  WRONG_PASSWORD: "Wrong password",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  SERVER_ERROR: "Internal server error",
  CONFLICT: "Conflict",
};

export const SYSTEM_MESSAGES = {
  // General messages
  SUCCESS: "Success",
  ERROR: "An error occurred",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Resource not found",
  BAD_REQUEST: "Bad request",
  INTERNAL_SERVER_ERROR: "Internal server error",
  VALIDATION_ERROR: "Validation error",

  // Auth messages
  AUTH: {
    REGISTER_SUCCESS: "User registered successfully",
    REGISTER_FAILED: "Registration failed",
    LOGIN_SUCCESS: "Login successful",
    LOGIN_FAILED: "Login failed",
    INVALID_CREDENTIALS: "Invalid email or password",
    USER_ALREADY_EXISTS: "User already exists",
    USER_NOT_FOUND: "User not found",
    TOKEN_INVALID: "Invalid token",
    TOKEN_EXPIRED: "Token has expired",
    MISSING_TOKEN: "Authentication token is required",
    REQUIRED_FIELDS: "Username, email, and password are required",
    EMAIL_PASSWORD_REQUIRED: "Email and password are required",
  },

  // User messages
  USER: {
    NOT_FOUND: "User not found",
    UPDATE_SUCCESS: "User updated successfully",
    UPDATE_FAILED: "Failed to update user",
    DELETE_SUCCESS: "User deleted successfully",
    DELETE_FAILED: "Failed to delete user",
    PROFILE_UPDATED: "Profile updated successfully",
  },

  // Room messages
  ROOM: {
    CREATE_SUCCESS: "Room created successfully",
    CREATE_FAILED: "Failed to create room",
    JOIN_SUCCESS: "Joined room successfully",
    JOIN_FAILED: "Failed to join room",
    LEAVE_SUCCESS: "Left room successfully",
    LEAVE_FAILED: "Failed to leave room",
    NOT_FOUND: "Room not found",
    FULL: "Room is full",
    NOT_ACCEPTING: "Room is not accepting new players",
    ALREADY_JOINED: "Already in this room",
    NOT_READY: "Room is not ready to start",
    MATCH_ALREADY_STARTED: "Match already started",
    INVALID_ROOM_CODE: "Invalid room code",
  },

  // Match messages
  MATCH: {
    CREATE_SUCCESS: "Match created successfully",
    CREATE_FAILED: "Failed to create match",
    NOT_FOUND: "Match not found",
    ALREADY_ENDED: "Match has already ended",
    NOT_IN_MATCH: "Player not in this match",
    INVALID_MOVE: "Invalid move",
    NOT_YOUR_TURN: "Not your turn",
    MOVE_SUCCESS: "Move made successfully",
    MOVE_FAILED: "Failed to make move",
    END_SUCCESS: "Match ended successfully",
    END_FAILED: "Failed to end match",
    HISTORY_NOT_FOUND: "Match history not found",
    INVALID_PLAYERS: "Match must have exactly 2 players",
    INVALID_SYMBOLS: "Players must have different symbols (X and O)",
    INVALID_COORDINATES: "Invalid coordinates",
  },

  // Game messages
  GAME: {
    WIN: "You win!",
    LOSS: "You lose!",
    DRAW: "It's a draw!",
    GAME_OVER: "Game over",
    INVALID_BOARD_SIZE: "Invalid board size",
  },
} as const;

