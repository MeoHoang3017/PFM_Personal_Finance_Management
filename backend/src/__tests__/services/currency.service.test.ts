import {
  getAllCurrenciesService,
  getCurrencyByCodeService,
  getCurrencyByIdService,
} from '../../services/currency.service';

describe('Currency Service', () => {
  describe('getAllCurrenciesService', () => {
    it('should return paginated currencies (seeded in setup)', async () => {
      const result = await getAllCurrenciesService(1, 10);
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(10);
    });
  });

  describe('getCurrencyByCodeService', () => {
    it('should return currency by code', async () => {
      const result = await getCurrencyByCodeService('USD');
      expect(result).not.toBeNull();
      expect(result!.code).toBe('USD');
    });

    it('should return null for invalid code', async () => {
      const result = await getCurrencyByCodeService('XXX');
      expect(result).toBeNull();
    });
  });

  describe('getCurrencyByIdService', () => {
    it('should return currency by id', async () => {
      const list = await getAllCurrenciesService(1, 1);
      const id = list.data[0].id;
      const result = await getCurrencyByIdService(id);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(id);
    });
  });
});
