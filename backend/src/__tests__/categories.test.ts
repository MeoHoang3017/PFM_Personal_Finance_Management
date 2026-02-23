import request from 'supertest';
import app from '../app';
import { createTestUser, loginAndGetToken, authRequest } from './helpers/testHelpers';

describe('Categories API', () => {
  let token: string;

  beforeEach(async () => {
    await createTestUser();
    const loginRes = await loginAndGetToken(app);
    token = loginRes.token;
  });

  describe('GET /api/categories', () => {
    it('should return categories without auth (optional auth)', async () => {
      const res = await request(app).get('/api/categories').expect(200);
      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.result.data)).toBe(true);
    });
  });

  describe('POST /api/categories', () => {
    it('should create category with auth', async () => {
      const res = await authRequest(app, token)
        .post('/api/categories')
        .send({ name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#FF5733' })
        .expect(201);
      expect(res.body.result.name).toBe('Food & Dining');
      expect(res.body.result.type).toBe('expense');
    });

    it('should fail without required fields', async () => {
      await authRequest(app, token)
        .post('/api/categories')
        .send({ name: 'Test' })
        .expect(400);
    });
  });

  describe('GET /api/categories/user/list', () => {
    it('should return user categories', async () => {
      await authRequest(app, token)
        .post('/api/categories')
        .send({ name: 'Income', type: 'income' });
      const res = await authRequest(app, token).get('/api/categories/user/list').expect(200);
      expect(res.body.result.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
