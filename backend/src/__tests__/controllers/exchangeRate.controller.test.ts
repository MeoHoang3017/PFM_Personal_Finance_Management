jest.mock('../../services/exchangeRate.service', () => ({
  updateExchangeRates: jest.fn(),
  getExchangeRate: jest.fn(),
  convertCurrency: jest.fn(),
}));

import { updateExchangeRates, getExchangeRate, convertCurrency } from '../../services/exchangeRate.service';
import { updateRates, getRate, convert } from '../../controllers/exchangeRate.controller';

describe('Exchange Rate Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateRates', () => {
    it('sends 200 with savedCount when success', async () => {
      (updateExchangeRates as jest.Mock).mockResolvedValue({ success: true, message: 'Updated', savedCount: 5 });
      const req: any = { query: {}, body: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await updateRates(req, res, next);
      expect(updateExchangeRates).toHaveBeenCalledWith('USD');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ result: expect.objectContaining({ savedCount: 5 }) }));
    });

    it('sends 400 when success is false', async () => {
      (updateExchangeRates as jest.Mock).mockResolvedValue({ success: false, message: 'Rate fetch failed' });
      const req: any = { query: {}, body: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await updateRates(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getRate', () => {
    it('sends 400 when baseCurrency or targetCurrency missing', async () => {
      const req: any = { query: { baseCurrency: 'USD' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getRate(req, res, next);
      expect(getExchangeRate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('sends 404 when rate not found', async () => {
      (getExchangeRate as jest.Mock).mockResolvedValue(null);
      const req: any = { query: { baseCurrency: 'USD', targetCurrency: 'XYZ' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getRate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with rate when found', async () => {
      (getExchangeRate as jest.Mock).mockResolvedValue(1.1);
      const req: any = { query: { baseCurrency: 'USD', targetCurrency: 'EUR' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getRate(req, res, next);
      expect(getExchangeRate).toHaveBeenCalledWith('USD', 'EUR', undefined);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('convert', () => {
    it('sends 400 when amount, fromCurrency or toCurrency missing', async () => {
      const req: any = { body: { amount: 100 } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await convert(req, res, next);
      expect(convertCurrency).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('sends 404 when conversion rate not found', async () => {
      (convertCurrency as jest.Mock).mockResolvedValue(null);
      const req: any = { body: { amount: 100, fromCurrency: 'USD', toCurrency: 'EUR' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await convert(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with converted amount', async () => {
      (convertCurrency as jest.Mock).mockResolvedValue(110);
      const req: any = { body: { amount: 100, fromCurrency: 'USD', toCurrency: 'EUR' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await convert(req, res, next);
      expect(convertCurrency).toHaveBeenCalledWith(100, 'USD', 'EUR', undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ result: expect.objectContaining({ convertedAmount: 110 }) }));
    });
  });
});
