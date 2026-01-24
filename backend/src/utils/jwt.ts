import jwt from 'jsonwebtoken';
import { encryptJson, decryptJson } from './crypto';
import dotenv from 'dotenv';

// Load environment variables từ .env file
// Phải gọi trước khi đọc process.env
dotenv.config();

// Lấy secrets từ environment variables, không dùng fallback values không an toàn
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET_KEY;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET_KEY;
interface TokenPayload {
  id: string;
  isGuest: boolean;
}

interface EncryptedTokenPayload {
  enc: string;
}

// Validate required environment variables khi module được load
if (!ACCESS_SECRET || ACCESS_SECRET.trim() === '') {
  throw new Error(
    'ACCESS_TOKEN_SECRET_KEY is required but not defined in environment variables. ' +
    'Please set it in your .env file.'
  );
}

if (!REFRESH_SECRET || REFRESH_SECRET.trim() === '') {
  throw new Error(
    'REFRESH_TOKEN_SECRET_KEY is required but not defined in environment variables. ' +
    'Please set it in your .env file.'
  );
}

// Validate secret length (nên có ít nhất 32 ký tự)
if (ACCESS_SECRET.length < 32) {
  console.warn(
    'WARNING: ACCESS_TOKEN_SECRET_KEY should be at least 32 characters long for better security.'
  );
}

if (REFRESH_SECRET.length < 32) {
  console.warn(
    'WARNING: REFRESH_TOKEN_SECRET_KEY should be at least 32 characters long for better security.'
  );
}

/**
 * Encrypts the payload and generates an access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const encryptedPayload = encryptJson(payload);
  const jwtPayload: EncryptedTokenPayload = { enc: encryptedPayload };
  return jwt.sign(jwtPayload, ACCESS_SECRET, { expiresIn: '15m' });
};

/**
 * Encrypts the payload and generates a refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const encryptedPayload = encryptJson(payload);
  const jwtPayload: EncryptedTokenPayload = { enc: encryptedPayload };
  return jwt.sign(jwtPayload, REFRESH_SECRET, { expiresIn: '7d' });
};

/**
 * Verifies and decrypts an access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, ACCESS_SECRET) as EncryptedTokenPayload;
  if (!decoded.enc) {
    throw new Error('Invalid token format: missing encrypted payload');
  }
  return decryptJson(decoded.enc) as TokenPayload;
};

/**
 * Verifies and decrypts a refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, REFRESH_SECRET) as EncryptedTokenPayload;
  if (!decoded.enc) {
    throw new Error('Invalid token format: missing encrypted payload');
  }
  return decryptJson(decoded.enc) as TokenPayload;
};