import app from '../app';
import { createTestUser, loginAndGetToken, authRequest } from './helpers/testHelpers';

describe('Notifications API', () => {
  let token: string;

  beforeEach(async () => {
    await createTestUser();
    const loginRes = await loginAndGetToken(app);
    token = loginRes.token;
  });

  describe('GET /api/notifications', () => {
    it('should return 401/403 without valid auth', async () => {
      const res = await authRequest(app, 'invalid').get('/api/notifications');
      expect([401, 403]).toContain(res.status);
    });

    it('should return list with auth', async () => {
      const res = await authRequest(app, token).get('/api/notifications').expect(200);
      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.result.data)).toBe(true);
    });
  });

  describe('POST /api/notifications', () => {
    it('should create notification', async () => {
      const res = await authRequest(app, token)
        .post('/api/notifications')
        .send({
          title: 'Budget Alert',
          content: 'You exceeded your monthly budget',
          type: 'warning',
        })
        .expect(201);
      expect(res.body.result.title).toBe('Budget Alert');
    });
  });

  describe('GET /api/notifications/unread/count', () => {
    it('should return unread count', async () => {
      const res = await authRequest(app, token).get('/api/notifications/unread/count').expect(200);
      expect(res.body.result).toHaveProperty('count');
    });
  });
});
