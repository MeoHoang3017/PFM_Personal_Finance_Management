import request from 'supertest';
import app from '../app';
import { createTestUser, loginAndGetToken, authRequest } from './helpers/testHelpers';

describe('Wallets API', () => {
  let token: string;

  beforeEach(async () => {
    await createTestUser();
    const loginRes = await loginAndGetToken(app);
    token = loginRes.token;
  });

  describe('GET /api/wallets', () => {
    it('should return 401 without auth', async () => {
      await request(app).get('/api/wallets').expect(401);
    });

    it('should return empty list for new user', async () => {
      const res = await authRequest(app, token).get('/api/wallets').expect(200);
      expect(res.body.code).toBe(200);
      expect(res.body.result.data).toEqual([]);
      expect(res.body.result.pagination).toBeDefined();
    });
  });

  describe('POST /api/wallets', () => {
    it('should create wallet', async () => {
      const res = await authRequest(app, token)
        .post('/api/wallets')
        .send({ name: 'Main Wallet', balance: 1000 })
        .expect(201);

      expect(res.body.result.name).toBe('Main Wallet');
      expect(res.body.result.balance).toBe(1000);
      expect(res.body.result.id).toBeDefined();
    });

    it('should fail without name', async () => {
      await authRequest(app, token)
        .post('/api/wallets')
        .send({ balance: 100 })
        .expect(400);
    });
  });

  describe('GET /api/wallets/:id', () => {
    it('should get wallet by id', async () => {
      const createRes = await authRequest(app, token)
        .post('/api/wallets')
        .send({ name: 'Test Wallet', balance: 500 });
      const walletId = createRes.body.result.id;

      const res = await authRequest(app, token).get(`/api/wallets/${walletId}`).expect(200);
      expect(res.body.result.name).toBe('Test Wallet');
    });

    it('should return 404 for invalid id', async () => {
      await authRequest(app, token)
        .get('/api/wallets/507f1f77bcf86cd799439011')
        .expect(404);
    });
  });

  describe('PUT /api/wallets/:id', () => {
    it('should update wallet', async () => {
      const createRes = await authRequest(app, token)
        .post('/api/wallets')
        .send({ name: 'Original', balance: 100 });
      const walletId = createRes.body.result.id;

      const res = await authRequest(app, token)
        .put(`/api/wallets/${walletId}`)
        .send({ name: 'Updated Wallet' })
        .expect(200);
      expect(res.body.result.name).toBe('Updated Wallet');
    });
  });

  describe('DELETE /api/wallets/:id', () => {
    it('should delete wallet', async () => {
      const createRes = await authRequest(app, token)
        .post('/api/wallets')
        .send({ name: 'To Delete', balance: 0 });
      const walletId = createRes.body.result.id;

      await authRequest(app, token).delete(`/api/wallets/${walletId}`).expect(200);
      await authRequest(app, token).get(`/api/wallets/${walletId}`).expect(404);
    });
  });
});
