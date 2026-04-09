import request from 'supertest';
import app from '../app';
import ExchangeRate from '../models/exchangeRate.model';

describe('Exchange Rates API', () => {
  beforeEach(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await ExchangeRate.create({
      baseCurrency: 'USD',
      targetCurrency: 'EUR',
      rate: 0.92,
      date: today,
    });
  });

  describe('GET /api/exchange-rates/rate', () => {
    it('should return rate when rate exists in DB', async () => {
      const res = await request(app)
        .get('/api/exchange-rates/rate')
        .query({ baseCurrency: 'USD', targetCurrency: 'EUR' })
        .expect(200);
      expect(res.body.code).toBe(200);
      expect(res.body.result.rate).toBe(0.92);
    });

    it('should return 400 when params missing', async () => {
      await request(app).get('/api/exchange-rates/rate').expect(400);
    });
  });

  describe('POST /api/exchange-rates/convert', () => {
    it('should convert amount', async () => {
      const res = await request(app)
        .post('/api/exchange-rates/convert')
        .send({ amount: 100, fromCurrency: 'USD', toCurrency: 'EUR' })
        .expect(200);
      expect(res.body.result.convertedAmount).toBe(92);
    });
  });
});
