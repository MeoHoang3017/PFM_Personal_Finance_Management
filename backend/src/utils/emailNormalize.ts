/** Chuẩn hóa email để khớp với User (schema lowercase) và bản ghi OTP. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
