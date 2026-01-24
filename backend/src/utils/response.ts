import type { Response } from "express";
import { SYSTEM_MESSAGES } from "../constants/messages";
import BaseResponse from "./BaseResponse";
import { ErrorResponse, SuccessResponse } from "../constants/Response";

/**
 * Base Response Structure (Interface for type checking)
 */
export interface IBaseResponse<T = any> {
  code: number;
  message: string;
  result?: T;
  error?: {
    message: string;
    details?: any;
    stack?: string;
  };
}

// Re-export for convenience
export { BaseResponse, ErrorResponse, SuccessResponse };

/**
 * Success Response Helper
 * @param res Express Response object
 * @param data Data to return (optional)
 * @param message Custom success message (optional)
 * @param code HTTP status code (default: 200)
 */
/**
 * Send a BaseResponse object as HTTP response
 */
export const sendResponse = <T = any>(
  res: Response,
  response: BaseResponse<T>
): void => {
  res.status(response.code).json(response);
};

/**
 * Success Response Helper (Legacy - use SuccessResponse instead)
 * @deprecated Use SuccessResponse.ITEM, SuccessResponse.LIST, etc. instead
 */
export const sendSuccess = <T = any>(
  res: Response,
  data?: T,
  message: string = SYSTEM_MESSAGES.SUCCESS,
  code: number = 200
): void => {
  const response = new BaseResponse<T>(code, message, data ?? null);
  sendResponse(res, response);
};

/**
 * Error Response Helper
 * @param res Express Response object
 * @param message Error message
 * @param code HTTP status code (default: 500)
 * @param errorDetails Additional error details (optional)
 */
/**
 * Error Response Helper (Legacy - use ErrorResponse instead)
 * @deprecated Use ErrorResponse.NOT_FOUND, ErrorResponse.UNAUTHORIZED, etc. instead
 */
export const sendError = (
  res: Response,
  message: string = SYSTEM_MESSAGES.ERROR,
  code: number = 500,
  errorDetails?: any
): void => {
  const response = new BaseResponse(code, message, null, {
    message,
    ...(errorDetails && { details: errorDetails }),
    ...(process.env.NODE_ENV === "development" && errorDetails?.stack && { stack: errorDetails.stack }),
  });
  sendResponse(res, response);
};

/**
 * Success Response with Created Status (201) (Legacy)
 * @deprecated Use SuccessResponse.CREATED instead
 */
export const sendCreated = <T = any>(
  res: Response,
  data?: T,
  message: string = SYSTEM_MESSAGES.SUCCESS
): void => {
  sendSuccess(res, data, message, 201);
};

/**
 * Bad Request Response (400) (Legacy)
 * @deprecated Use ErrorResponse.BAD_REQUEST or ErrorResponse.BAD_REQUEST_MSG instead
 */
export const sendBadRequest = (
  res: Response,
  message: string = SYSTEM_MESSAGES.BAD_REQUEST,
  errorDetails?: any
): void => {
  sendError(res, message, 400, errorDetails);
};

/**
 * Unauthorized Response (401) (Legacy)
 * @deprecated Use ErrorResponse.UNAUTHORIZED instead
 */
export const sendUnauthorized = (
  res: Response,
  message: string = SYSTEM_MESSAGES.UNAUTHORIZED,
  errorDetails?: any
): void => {
  sendError(res, message, 401, errorDetails);
};

/**
 * Forbidden Response (403) (Legacy)
 * @deprecated Use ErrorResponse.FORBIDDEN instead
 */
export const sendForbidden = (
  res: Response,
  message: string = SYSTEM_MESSAGES.FORBIDDEN,
  errorDetails?: any
): void => {
  sendError(res, message, 403, errorDetails);
};

/**
 * Not Found Response (404) (Legacy)
 * @deprecated Use ErrorResponse.NOT_FOUND instead
 */
export const sendNotFound = (
  res: Response,
  message: string = SYSTEM_MESSAGES.NOT_FOUND,
  errorDetails?: any
): void => {
  sendError(res, message, 404, errorDetails);
};

/**
 * Internal Server Error Response (500) (Legacy)
 * @deprecated Use ErrorResponse.SERVER_ERROR or ErrorResponse.INTERNAL_ERROR instead
 */
export const sendInternalError = (
  res: Response,
  message: string = SYSTEM_MESSAGES.INTERNAL_SERVER_ERROR,
  errorDetails?: any
): void => {
  sendError(res, message, 500, errorDetails);
};

/**
 * Validation Error Response (400) (Legacy)
 * @deprecated Use ErrorResponse.VALIDATION_ERROR instead
 */
export const sendValidationError = (
  res: Response,
  message: string = SYSTEM_MESSAGES.VALIDATION_ERROR,
  errorDetails?: any
): void => {
  sendError(res, message, 400, errorDetails);
};

