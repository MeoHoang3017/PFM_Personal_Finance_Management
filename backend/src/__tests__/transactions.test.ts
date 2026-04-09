import app from '../app';
import { createTestUser, loginAndGetToken, authRequest } from './helpers/testHelpers';

describe('Transactions API', () => {
  let token: string;
  let walletId: string;
  let categoryId: string;

  beforeEach(async () => {
    await createTestUser();
    const loginRes = await loginAndGetToken(app);
    token = loginRes.token;

    const walletRes = await authRequest(app, token)
      .post('/api/wallets')
      .send({ name: 'Test Wallet', balance: 1000 });
    walletId = walletRes.body.result.id;

    const catRes = await authRequest(app, token)
      .post('/api/categories')
      .send({ name: 'Food', type: 'expense' });
    categoryId = catRes.body.result.id;
  });

  describe('GET /api/transactions', () => {
    it('should return 401/403 without valid auth', async () => {
      const res = await authRequest(app, 'invalid').get('/api/transactions');
      expect([401, 403]).toContain(res.status);
    });

    it('should return empty list initially', async () => {
      const res = await authRequest(app, token).get('/api/transactions').expect(200);
      expect(res.body.result.data).toEqual([]);
    });
  });

  describe('POST /api/transactions', () => {
    it('should create transaction', async () => {
      const res = await authRequest(app, token)
        .post('/api/transactions')
        .send({
          amount: 50,
          type: 'expense',
          category: categoryId,
          date: new Date().toISOString(),
          wallet: walletId,
          description: 'Lunch',
        })
        .expect(201);
      expect(res.body.result.amount).toBe(50);
      expect(res.body.result.type).toBe('expense');
    });

    it('should fail with missing required fields', async () => {
      await authRequest(app, token)
        .post('/api/transactions')
        .send({ amount: 50, type: 'expense' })
        .expect(400);
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('should get transaction by id', async () => {
      const createRes = await authRequest(app, token)
        .post('/api/transactions')
        .send({
          amount: 100,
          type: 'income',
          category: categoryId,
          date: new Date().toISOString(),
          wallet: walletId,
        });
      const txId = createRes.body.result.id;

      const res = await authRequest(app, token).get(`/api/transactions/${txId}`).expect(200);
      expect(res.body.result.amount).toBe(100);
    });
  });

  describe('POST /api/transactions/:id/duplicate', () => {
    it('should duplicate transaction', async () => {
      const createRes = await authRequest(app, token)
        .post('/api/transactions')
        .send({
          amount: 25,
          type: 'expense',
          category: categoryId,
          date: new Date().toISOString(),
          wallet: walletId,
          description: 'Coffee',
        });
      const txId = createRes.body.result.id;

      const res = await authRequest(app, token)
        .post(`/api/transactions/${txId}/duplicate`)
        .expect(201);
      expect(res.body.result.amount).toBe(25);
      expect(res.body.result.id).not.toBe(txId);
    });
  });
});
