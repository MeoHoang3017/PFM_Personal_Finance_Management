import type { Request, Response, NextFunction } from "express";
import { ErrorResponse, sendResponse } from "../utils/response";
import { SYSTEM_MESSAGES } from "../constants/messages";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Error Handling Middleware
 * @description Centralized error handling for consistent error responses
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || SYSTEM_MESSAGES.INTERNAL_SERVER_ERROR;

  // Log error for debugging
  console.error("Error:", {
    message,
    statusCode,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  const response = ErrorResponse.CUSTOM(statusCode, message, err);
  sendResponse(res, response);
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const response = ErrorResponse.NOT_FOUND(`Route ${req.originalUrl}`);
  sendResponse(res, response);
};

/**
 * Create custom error
 */
export const createError = (
  message: string,
  statusCode: number = 500
): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

