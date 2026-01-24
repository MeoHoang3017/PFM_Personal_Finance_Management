/**
 * Socket Input Validator
 * @description Validates input from socket events
 */

/**
 * Validate room code
 */
export function validateRoomCode(roomCode: any): string | null {
  if (typeof roomCode !== 'string') {
    return null;
  }
  
  const trimmed = roomCode.trim().toUpperCase();
  
  // Room code should be 4-10 characters, alphanumeric
  if (trimmed.length < 4 || trimmed.length > 10) {
    return null;
  }
  
  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    return null;
  }
  
  return trimmed;
}

/**
 * Validate match ID (MongoDB ObjectId)
 */
export function validateMatchId(matchId: any): string | null {
  if (typeof matchId !== 'string') {
    return null;
  }
  
  // MongoDB ObjectId format: 24 hex characters
  if (!/^[0-9a-fA-F]{24}$/.test(matchId)) {
    return null;
  }
  
  return matchId;
}

/**
 * Validate coordinates
 */
export function validateCoordinates(x: any, y: any, maxBoardSize: number = 19): { x: number; y: number } | null {
  const xNum = typeof x === 'number' ? x : parseInt(x);
  const yNum = typeof y === 'number' ? y : parseInt(y);
  
  if (isNaN(xNum) || isNaN(yNum)) {
    return null;
  }
  
  if (xNum < 0 || xNum >= maxBoardSize || yNum < 0 || yNum >= maxBoardSize) {
    return null;
  }
  
  return { x: xNum, y: yNum };
}

/**
 * Validate room create data
 */
export function validateRoomCreateData(data: any): {
  boardSize?: number;
  maxPlayers?: number;
  isPrivate?: boolean;
  allowSpectators?: boolean;
} | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  
  const validated: any = {};
  
  if (data.boardSize !== undefined) {
    const boardSize = typeof data.boardSize === 'number' ? data.boardSize : parseInt(data.boardSize);
    if (isNaN(boardSize) || boardSize < 10 || boardSize > 20) {
      return null;
    }
    validated.boardSize = boardSize;
  }
  
  if (data.maxPlayers !== undefined) {
    const maxPlayers = typeof data.maxPlayers === 'number' ? data.maxPlayers : parseInt(data.maxPlayers);
    if (isNaN(maxPlayers) || maxPlayers !== 2) {
      return null;
    }
    validated.maxPlayers = maxPlayers;
  }
  
  if (data.isPrivate !== undefined) {
    if (typeof data.isPrivate !== 'boolean') {
      return null;
    }
    validated.isPrivate = data.isPrivate;
  }
  
  if (data.allowSpectators !== undefined) {
    if (typeof data.allowSpectators !== 'boolean') {
      return null;
    }
    validated.allowSpectators = data.allowSpectators;
  }
  
  return validated;
}

