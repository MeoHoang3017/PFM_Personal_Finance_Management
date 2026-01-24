/**
 * Response Constants
 * @description Pre-defined response objects for common scenarios
 */
import BaseResponse from "../utils/BaseResponse";
import { SUCCESS_MESSAGE, ERROR_MESSAGE, SYSTEM_MESSAGES } from "./messages";

export const ErrorResponse = {
  // Missing fields
  MISSING_FIELDS: (fields: string[]) =>
    new BaseResponse(400, ERROR_MESSAGE.MISSING_FIELDS(fields), null),

  // Not found
  NOT_FOUND: (entity: string) =>
    new BaseResponse(404, ERROR_MESSAGE.NOT_FOUND(entity), null),

  // Authentication & Authorization
  WRONG_PASSWORD: new BaseResponse(400, ERROR_MESSAGE.WRONG_PASSWORD, null),
  UNAUTHORIZED: new BaseResponse(401, ERROR_MESSAGE.UNAUTHORIZED, null),
  FORBIDDEN: new BaseResponse(403, ERROR_MESSAGE.FORBIDDEN, null),
  MISSING_TOKEN: new BaseResponse(401, SYSTEM_MESSAGES.AUTH.MISSING_TOKEN, null),
  TOKEN_INVALID: new BaseResponse(401, SYSTEM_MESSAGES.AUTH.TOKEN_INVALID, null),
  TOKEN_EXPIRED: new BaseResponse(401, SYSTEM_MESSAGES.AUTH.TOKEN_EXPIRED, null),

  // Server errors
  SERVER_ERROR: new BaseResponse(500, ERROR_MESSAGE.SERVER_ERROR, null),
  INTERNAL_ERROR: new BaseResponse(500, SYSTEM_MESSAGES.INTERNAL_SERVER_ERROR, null),

  // Validation & Business logic
  ALREADY_EXISTS: (entity: string) =>
    new BaseResponse(400, ERROR_MESSAGE.ALREADY_EXISTS(entity), null),
  CONFLICT: new BaseResponse(409, ERROR_MESSAGE.CONFLICT, null),
  BAD_REQUEST: new BaseResponse(400, SYSTEM_MESSAGES.BAD_REQUEST, null),
  VALIDATION_ERROR: new BaseResponse(400, SYSTEM_MESSAGES.VALIDATION_ERROR, null),

  // Generic bad request with custom message
  BAD_REQUEST_MSG: (msg: string) => new BaseResponse(400, msg, null),

  // Custom error response with arbitrary code/message
  CUSTOM: (code: number, msg: string, error?: any) =>
    new BaseResponse(code, msg, null, error),
};

export const SuccessResponse = {
  // List operations
  LIST: <T = any>(entity: string, result: T | null) =>
    new BaseResponse(200, SUCCESS_MESSAGE.FETCHED_LIST(entity), result),

  // Single item operations
  ITEM: <T = any>(entity: string, result: T | null) =>
    new BaseResponse(200, SUCCESS_MESSAGE.FETCHED(entity), result),

  // Create operations
  CREATED: <T = any>(entity: string, result: T | null) =>
    new BaseResponse(201, SUCCESS_MESSAGE.CREATED(entity), result),

  // Update operations
  UPDATED: <T = any>(entity: string, result: T) =>
    new BaseResponse(200, SUCCESS_MESSAGE.UPDATED(entity), result),

  // Delete operations
  DELETED: (entity: string) =>
    new BaseResponse(200, SUCCESS_MESSAGE.DELETED(entity), null),

  // Generic OK response
  OK: <T = any>(entity: string, result: T) =>
    new BaseResponse(200, SUCCESS_MESSAGE.FETCHED(entity), result),

  // Auth operations
  LOGIN_SUCCESS: <T = any>(result: T) =>
    new BaseResponse(200, SUCCESS_MESSAGE.LOGIN_SUCCESS, result),
  LOGOUT_SUCCESS: () =>
    new BaseResponse(200, SUCCESS_MESSAGE.LOGOUT_SUCCESS, null),
  REGISTER_SUCCESS: <T = any>(result: T) =>
    new BaseResponse(201, SYSTEM_MESSAGES.AUTH.REGISTER_SUCCESS, result),

  // Custom success response
  CUSTOM: <T = any>(code: number, msg: string, result: T | null) =>
    new BaseResponse(code, msg, result),
};

