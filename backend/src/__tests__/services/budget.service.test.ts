import {
  getUserBudgetsService,
  getBudgetByIdService,
  createBudgetService,
  updateBudgetService,
  deleteBudgetService,
} from '../../services/budget.service';
import { User, Category } from '../../models';
import { hashPassword } from '../../utils/hasher';

describe('Budget Service', () => {
  let userId: string;
  let categoryId: string;

  beforeEach(async () => {
    const hashedPassword = await hashPassword('password123');
    const user = await User.create({
      username: 'budgetuser',
      email: 'budget@example.com',
      password: hashedPassword,
    });
    userId = user._id.toString();

    const category = await Category.create({
      name: 'Food',
      type: 'expense',
      user: user._id,
    });
    categoryId = category._id.toString();
  });

  describe('createBudgetService', () => {
    it('should create monthly budget without stored date range', async () => {
      const result = await createBudgetService({
        amount: 1000,
        category: categoryId,
        period: 'monthly',
        user: userId,
      });
      expect(result.amount).toBe(1000);
      expect(result.period).toBe('monthly');
      expect(result.currency).toBe('USD');
      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();
    });

    it('should create custom budget with dates', async () => {
      const start = new Date('2024-01-01T00:00:00.000Z');
      const end = new Date('2024-01-31T23:59:59.999Z');
      const result = await createBudgetService({
        amount: 500,
        category: categoryId,
        period: 'custom',
        startDate: start,
        endDate: end,
        user: userId,
      });
      expect(result.period).toBe('custom');
    });

    it('should reject duplicate category for same user', async () => {
      await createBudgetService({
        amount: 1000,
        category: categoryId,
        period: 'monthly',
        user: userId,
      });
      await expect(
        createBudgetService({
          amount: 2000,
          category: categoryId,
          period: 'weekly',
          user: userId,
        })
      ).rejects.toThrow('A budget already exists for this category');
    });

    it('should throw when custom period missing dates', async () => {
      await expect(
        createBudgetService({
          amount: 1000,
          category: categoryId,
          period: 'custom',
          user: userId,
        })
      ).rejects.toThrow('startDate and endDate are required');
    });

    it('should throw when startDate >= endDate for custom', async () => {
      const d = new Date();
      await expect(
        createBudgetService({
          amount: 1000,
          category: categoryId,
          period: 'custom',
          startDate: d,
          endDate: d,
          user: userId,
        })
      ).rejects.toThrow('Start date must be before end date');
    });
  });

  describe('getUserBudgetsService', () => {
    it('should return paginated budgets with filter', async () => {
      await createBudgetService({
        amount: 500,
        category: categoryId,
        period: 'monthly',
        user: userId,
      });

      const result = await getUserBudgetsService({ user: userId }, 1, 10);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getBudgetByIdService', () => {
    it('should return budget by id', async () => {
      const created = await createBudgetService({
        amount: 800,
        category: categoryId,
        period: 'weekly',
        user: userId,
      });
      const result = await getBudgetByIdService(created.id);
      expect(result.amount).toBe(800);
    });
  });

  describe('updateBudgetService', () => {
    it('should update budget', async () => {
      const created = await createBudgetService({
        amount: 500,
        category: categoryId,
        period: 'monthly',
        user: userId,
      });
      const result = await updateBudgetService(created.id, { amount: 1200 });
      expect(result.amount).toBe(1200);
    });
  });

  describe('deleteBudgetService', () => {
    it('should delete budget', async () => {
      const created = await createBudgetService({
        amount: 500,
        category: categoryId,
        period: 'monthly',
        user: userId,
      });
      const result = await deleteBudgetService(created.id);
      expect(result.message).toBe('Budget deleted successfully');
    });
  });
});
