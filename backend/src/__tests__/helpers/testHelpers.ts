import request from 'supertest';
import type { Express } from 'express';
import { User } from '../../models';
import { hashPassword } from '../../utils/hasher';
import { generateAccessToken } from '../../utils/jwt';

const TEST_USER = {
  email: 'testuser@example.com',
  username: 'testuser',
  password: 'password123',
};

/**
 * Create a test user directly in DB (bypasses OTP/registration)
 */
export async function createTestUser(overrides?: Partial<typeof TEST_USER>) {
  const data = { ...TEST_USER, ...overrides };
  const hashedPassword = await hashPassword(data.password);
  const user = await User.create({
    username: data.username,
    email: data.email,
    password: hashedPassword,
    theme: 'light',
    language: 'en',
    currency: 'USD',
  });
  return { user, ...data };
}

/**
 * Get auth token for a user ID (for Bearer header)
 */
export function getAuthToken(userId: string): string {
  return generateAccessToken({ id: userId, isGuest: false });
}

/**
 * Login via API and return token + user (uses cookie or Bearer)
 */
export async function loginAndGetToken(app: Express, email = TEST_USER.email, password = TEST_USER.password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);
  const token = res.body?.result?.accessToken;
  const user = res.body?.result?.user;
  if (!token) throw new Error('Login failed: no accessToken in response');
  return { token, user, cookies: res.headers['set-cookie'] };
}

/**
 * Create authenticated request helpers (Bearer token)
 * Usage: authRequest(app, token).get('/api/wallets') etc.
 */
export function authRequest(app: Express, token: string) {
  const auth = { Authorization: `Bearer ${token}` };
  return {
    get: (url: string) => request(app).get(url).set(auth),
    post: (url: string) => request(app).post(url).set(auth),
    put: (url: string) => request(app).put(url).set(auth),
    delete: (url: string) => request(app).delete(url).set(auth),
  };
}
