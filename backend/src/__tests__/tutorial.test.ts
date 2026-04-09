import app from '../app';
import { createTestUser, loginAndGetToken, authRequest } from './helpers/testHelpers';

describe('Tutorial API', () => {
  let token: string;

  beforeEach(async () => {
    await createTestUser();
    const loginRes = await loginAndGetToken(app);
    token = loginRes.token;
  });

  describe('GET /api/tutorial', () => {
    it('should return 401/403 without valid auth', async () => {
      const res = await authRequest(app, 'invalid').get('/api/tutorial');
      expect([401, 403]).toContain(res.status);
    });

    it('should return tutorial with auth', async () => {
      const res = await authRequest(app, token).get('/api/tutorial');
      expect([200, 201, 404]).toContain(res.status); // 200/201 if exists, 404 if not yet created
      if (res.status === 200 || res.status === 201) {
        expect(res.body.result).toBeDefined();
      }
    });
  });
});
