import app from '../app';
import { createTestUser, loginAndGetToken, authRequest } from './helpers/testHelpers';

describe('Goals API', () => {
  let token: string;

  beforeEach(async () => {
    await createTestUser();
    const loginRes = await loginAndGetToken(app);
    token = loginRes.token;
  });

  describe('GET /api/goals', () => {
    it('should return 401/403 without valid auth', async () => {
      const res = await authRequest(app, 'invalid').get('/api/goals');
      expect([401, 403]).toContain(res.status);
    });

    it('should return empty list initially', async () => {
      const res = await authRequest(app, token).get('/api/goals').expect(200);
      expect(res.body.result.data).toEqual([]);
    });
  });

  describe('POST /api/goals', () => {
    it('should create goal', async () => {
      const dueDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const res = await authRequest(app, token)
        .post('/api/goals')
        .send({
          title: 'Vacation Fund',
          targetAmount: 5000,
          dueDate,
        })
        .expect(201);
      expect(res.body.result.title).toBe('Vacation Fund');
      expect(res.body.result.targetAmount).toBe(5000);
    });
  });
});
