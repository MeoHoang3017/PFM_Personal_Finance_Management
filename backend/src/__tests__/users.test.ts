import app from '../app';
import { createTestUser, loginAndGetToken, authRequest } from './helpers/testHelpers';

describe('Users API', () => {
  let token: string;

  beforeEach(async () => {
    await createTestUser();
    const loginRes = await loginAndGetToken(app);
    token = loginRes.token;
  });

  describe('GET /api/users/profile', () => {
    it('should return 401/403 without valid auth', async () => {
      const res = await authRequest(app, 'invalid').get('/api/users/profile');
      expect([401, 403]).toContain(res.status);
    });

    it('should return user profile with valid token', async () => {
      const res = await authRequest(app, token).get('/api/users/profile').expect(200);
      expect(res.body.result.email).toBe('testuser@example.com');
      expect(res.body.result.username).toBe('testuser');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update profile', async () => {
      const res = await authRequest(app, token)
        .put('/api/users/profile')
        .send({ username: 'updatedname' })
        .expect(200);
      expect(res.body.result.username).toBe('updatedname');
    });
  });
});
