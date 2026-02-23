import app from '../app';
import { createTestUser, loginAndGetToken, authRequest } from './helpers/testHelpers';

describe('Budgets API', () => {
  let token: string;
  let categoryId: string;

  beforeEach(async () => {
    await createTestUser();
    const loginRes = await loginAndGetToken(app);
    token = loginRes.token;

    const catRes = await authRequest(app, token)
      .post('/api/categories')
      .send({ name: 'Food', type: 'expense' });
    categoryId = catRes.body.result.id;
  });

  describe('GET /api/budgets', () => {
    it('should return 401/403 without valid auth', async () => {
      const res = await authRequest(app, 'invalid').get('/api/budgets');
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('POST /api/budgets', () => {
    it('should create budget', async () => {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);

      const res = await authRequest(app, token)
        .post('/api/budgets')
        .send({
          amount: 1000,
          category: categoryId,
          period: 'monthly',
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        })
        .expect(201);
      expect(res.body.result.amount).toBe(1000);
      expect(res.body.result.period).toBe('monthly');
    });
  });
});
