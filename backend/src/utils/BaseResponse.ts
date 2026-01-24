/**
 * Base Response Class
 * @description Base class for all API responses
 */
export class BaseResponse<T = any> {
  code: number;
  message: string;
  result: T | null;
  error?: any;

  constructor(
    code: number,
    message: string,
    result: T | null = null,
    error?: any
  ) {
    this.code = code ?? 500;
    this.message = message ?? "";
    this.result = result ?? null;
    this.error = error ?? undefined;
  }
}

export default BaseResponse;

