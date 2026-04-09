import request from 'supertest';
import app from '../app';

jest.mock('../utils/mailer', () => ({
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
}));

describe('OTP API', () => {
  describe('POST /api/otp/send-register-otp', () => {
    it('should send OTP for valid email', async () => {
      const res = await request(app)
        .post('/api/otp/send-register-otp')
        .send({ email: 'otp-test@example.com' })
        .expect(200);
      expect(res.body.code).toBe(200);
    });

    it('should fail when email is missing', async () => {
      await request(app)
        .post('/api/otp/send-register-otp')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/otp/send-forgot-password-otp', () => {
    it('should send OTP for valid email', async () => {
      const res = await request(app)
        .post('/api/otp/send-forgot-password-otp')
        .send({ email: 'forgot@example.com' })
        .expect(200);
      expect(res.body.code).toBe(200);
    });
  });
});
