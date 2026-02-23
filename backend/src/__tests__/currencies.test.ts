import request from 'supertest';
import app from '../app';

describe('Currencies API', () => {
  describe('GET /api/currencies', () => {
    it('should return currencies without auth', async () => {
      const res = await request(app).get('/api/currencies').expect(200);
      expect(res.body.code).toBe(200);
      expect(res.body.result.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.result.pagination).toBeDefined();
    });
  });

  describe('GET /api/currencies/code/:code', () => {
    it('should return currency by code', async () => {
      const res = await request(app).get('/api/currencies/code/USD').expect(200);
      expect(res.body.result.code).toBe('USD');
      expect(res.body.result.symbol).toBeDefined();
    });
  });

  describe('GET /api/currencies/:id', () => {
    it('should return currency by id', async () => {
      const listRes = await request(app).get('/api/currencies');
      const firstId = listRes.body.result.data[0].id;
      const res = await request(app).get(`/api/currencies/${firstId}`).expect(200);
      expect(res.body.result.id).toBe(firstId);
    });
  });
});
