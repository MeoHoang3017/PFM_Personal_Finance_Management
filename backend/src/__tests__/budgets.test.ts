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
    it('should create monthly budget without custom dates', async () => {
      const res = await authRequest(app, token)
        .post('/api/budgets')
        .send({
          amount: 1000,
          category: categoryId,
          period: 'monthly',
        })
        .expect(201);
      expect(res.body.result.amount).toBe(1000);
      expect(res.body.result.period).toBe('monthly');
    });
  });
});
