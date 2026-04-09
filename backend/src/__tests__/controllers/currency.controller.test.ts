jest.mock('../../services/currency.service', () => ({
  getAllCurrenciesService: jest.fn(),
  getCurrencyByCodeService: jest.fn(),
  getCurrencyByIdService: jest.fn(),
}));

import {
  getAllCurrenciesService,
  getCurrencyByCodeService,
  getCurrencyByIdService,
} from '../../services/currency.service';
import {
  getAllCurrencies,
  getCurrencyByCode,
  getCurrencyById,
} from '../../controllers/currency.controller';

describe('Currency Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCurrencies', () => {
    it('calls getAllCurrenciesService with default pagination', async () => {
      const mockResult = { data: [{ code: 'USD', name: 'US Dollar' }], pagination: { page: 1, pageSize: 50, totalItems: 1, totalPages: 1 } };
      (getAllCurrenciesService as jest.Mock).mockResolvedValue(mockResult);
      const req: any = { query: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getAllCurrencies(req, res, next);
      expect(getAllCurrenciesService).toHaveBeenCalledWith(1, 50);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('uses query page and pageSize when provided', async () => {
      const mockResult = { data: [], pagination: { page: 2, pageSize: 10, totalItems: 0, totalPages: 0 } };
      (getAllCurrenciesService as jest.Mock).mockResolvedValue(mockResult);
      const req: any = { query: { page: '2', pageSize: '10' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getAllCurrencies(req, res, next);
      expect(getAllCurrenciesService).toHaveBeenCalledWith(2, 10);
    });
  });

  describe('getCurrencyByCode', () => {
    it('sends 404 when currency not found', async () => {
      (getCurrencyByCodeService as jest.Mock).mockResolvedValue(null);
      const req: any = { params: { code: 'XXX' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getCurrencyByCode(req, res, next);
      expect(getCurrencyByCodeService).toHaveBeenCalledWith('XXX');
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with currency when found', async () => {
      const mockCurrency = { id: 'c1', code: 'USD', name: 'US Dollar', symbol: '$' };
      (getCurrencyByCodeService as jest.Mock).mockResolvedValue(mockCurrency);
      const req: any = { params: { code: 'USD' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getCurrencyByCode(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getCurrencyById', () => {
    it('sends 404 when currency not found', async () => {
      (getCurrencyByIdService as jest.Mock).mockResolvedValue(null);
      const req: any = { params: { id: '507f1f77bcf86cd799439011' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getCurrencyById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with currency when found', async () => {
      const mockCurrency = { id: 'c1', code: 'EUR', name: 'Euro', symbol: '€' };
      (getCurrencyByIdService as jest.Mock).mockResolvedValue(mockCurrency);
      const req: any = { params: { id: 'c1' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getCurrencyById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
