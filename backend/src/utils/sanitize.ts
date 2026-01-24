import validator from "validator";

/**
 * Sanitize utilities
 * @description Functions to sanitize user input to prevent XSS and injection attacks
 */

/**
 * Sanitize string input
 * @param input - String to sanitize
 * @param options - Sanitization options
 * @returns Sanitized string
 */
export function sanitizeString(
  input: string,
  options: {
    trim?: boolean;
    escape?: boolean;
    removeHtml?: boolean;
  } = {}
): string {
  if (typeof input !== "string") {
    return "";
  }

  let sanitized = input;

  // Trim whitespace
  if (options.trim !== false) {
    sanitized = sanitized.trim();
  }

  // Remove HTML tags
  if (options.removeHtml !== false) {
    sanitized = validator.stripLow(sanitized);
    sanitized = validator.escape(sanitized);
  }

  // Escape special characters
  if (options.escape !== false) {
    sanitized = validator.escape(sanitized);
  }

  return sanitized;
}

/**
 * Sanitize email
 * @param email - Email to sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== "string") {
    return "";
  }

  return validator.normalizeEmail(email.trim().toLowerCase()) || email.trim().toLowerCase();
}

/**
 * Sanitize username
 * @param username - Username to sanitize
 * @returns Sanitized username
 */
export function sanitizeUsername(username: string): string {
  if (typeof username !== "string") {
    return "";
  }

  // Remove HTML, escape, and trim
  let sanitized = validator.stripLow(username);
  sanitized = validator.escape(sanitized);
  sanitized = sanitized.trim();

  // Only allow alphanumeric, underscore, and hyphen
  sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, "");

  return sanitized;
}

/**
 * Sanitize object recursively
 * @param obj - Object to sanitize
 * @param options - Sanitization options
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    deep?: boolean;
    fields?: {
      [key: string]: "string" | "email" | "username";
    };
  } = {}
): T {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const sanitized = { ...obj };
  const { deep = true, fields = {} } = options;

  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      const value = sanitized[key];
      const fieldType = fields[key];

      if (typeof value === "string") {
        if (fieldType === "email") {
          sanitized[key] = sanitizeEmail(value) as any;
        } else if (fieldType === "username") {
          sanitized[key] = sanitizeUsername(value) as any;
        } else {
          sanitized[key] = sanitizeString(value) as any;
        }
      } else if (deep && typeof value === "object" && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizeObject(value, options) as any;
      } else if (deep && Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === "string"
            ? sanitizeString(item)
            : typeof item === "object" && item !== null
            ? sanitizeObject(item, options)
            : item
        ) as any;
      }
    }
  }

  return sanitized;
}

