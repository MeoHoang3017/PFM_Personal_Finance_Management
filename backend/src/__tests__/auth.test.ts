import request from 'supertest';
import app from '../app';
import { createTestUser, loginAndGetToken, authRequest } from './helpers/testHelpers';
import { Otp } from '../models';

jest.mock('../utils/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
}));

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should fail when required fields are missing', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ username: 'test' })
        .expect(400);
    });

    it('should fail when password is too short', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: '123',
        })
        .expect(400);
    });

    it('should register with valid OTP', async () => {
      const email = 'register-test@example.com';
      await request(app).post('/api/otp/send-register-otp').send({ email }).expect(200);
      const otpRecord = await Otp.findOne({ email, type: 'register' });
      const otp = otpRecord?.otp;
      expect(otp).toBeDefined();

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'registeruser',
          email,
          password: 'password123',
          otp,
        })
        .expect(201);

      expect(res.body.code).toBe(201);
      expect(res.body.result.accessToken).toBeDefined();
      expect(res.body.result.user).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser();
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'testuser@example.com', password: 'password123' })
        .expect(200);

      expect(res.body.code).toBe(200);
      expect(res.body.result.accessToken).toBeDefined();
      expect(res.body.result.user.email).toBe('testuser@example.com');
    });

    it('should fail with wrong password', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'testuser@example.com', password: 'wrongpass' })
        .expect(400);
    });

    it('should fail with missing fields', async () => {
      await request(app).post('/api/auth/login').send({ email: 'test@example.com' }).expect(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 401 without token', async () => {
      await request(app).post('/api/auth/logout').expect(401);
    });

    it('should logout with valid token', async () => {
      const { user } = await createTestUser();
      const { token } = await loginAndGetToken(app);

      await authRequest(app, token).post('/api/auth/logout').expect(200);
    });
  });
});
