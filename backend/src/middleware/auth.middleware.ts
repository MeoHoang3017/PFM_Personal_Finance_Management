import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { securityLogger } from "../utils/security-logger";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        isGuest: boolean;
      };
    }
  }
}

/**
 * Authentication Middleware
 * @description Lấy JWT từ Cookie và xác thực người dùng
 */
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // 1. Lấy token trực tiếp từ req.cookies
    const token = req.cookies?.accessToken;

    if (!token) {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';
      securityLogger.logUnauthorizedAccess(undefined, req.path, ip, userAgent);
      
      res.status(401).json({
        success: false,
        message: "Access token missing in cookies",
      });
      return;
    }

    try {
      const user = verifyAccessToken(token);
      req.user = user;
      next();
    } catch (error: any) {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.get('user-agent') || 'unknown';
      
      if (error.name === "TokenExpiredError") {
        securityLogger.logUnauthorizedAccess(undefined, req.path, ip, userAgent);
        res.status(401).json({
          success: false,
          message: "Token expired",
        });
        return;
      } else {
        securityLogger.logUnauthorizedAccess(undefined, req.path, ip, userAgent);
        res.status(403).json({
          success: false,
          message: "Invalid token",
        });
        return;
      }
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Authentication error",
      error: error.message,
    });
  }
};

/**
 * Optional Authentication Middleware
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.cookies?.accessToken;

    if (token) {
      try {
        const user = verifyAccessToken(token);
        req.user = user;
      } catch (error) {
        // Bỏ qua lỗi với optional auth
      }
    }
    next();
  } catch (error) {
    next();
  }
};