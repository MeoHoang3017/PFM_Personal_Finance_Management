import mongoose from 'mongoose';
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

  const validDateRange = () => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  describe('createBudgetService', () => {
    it('should create budget', async () => {
      const { start, end } = validDateRange();
      const result = await createBudgetService({
        amount: 1000,
        category: categoryId,
        period: 'monthly',
        startDate: start,
        endDate: end,
        user: userId,
      });
      expect(result.amount).toBe(1000);
      expect(result.period).toBe('monthly');
    });

    it('should throw when startDate >= endDate', async () => {
      const d = new Date();
      await expect(
        createBudgetService({
          amount: 1000,
          category: categoryId,
          period: 'monthly',
          startDate: d,
          endDate: d,
          user: userId,
        })
      ).rejects.toThrow('Start date must be before end date');
    });
  });

  describe('getUserBudgetsService', () => {
    it('should return paginated budgets with filter', async () => {
      const { start, end } = validDateRange();
      await createBudgetService({
        amount: 500,
        category: categoryId,
        period: 'monthly',
        startDate: start,
        endDate: end,
        user: userId,
      });

      const result = await getUserBudgetsService({ user: userId }, 1, 10);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getBudgetByIdService', () => {
    it('should return budget by id', async () => {
      const { start, end } = validDateRange();
      const created = await createBudgetService({
        amount: 800,
        category: categoryId,
        period: 'weekly',
        startDate: start,
        endDate: end,
        user: userId,
      });
      const result = await getBudgetByIdService(created.id);
      expect(result.amount).toBe(800);
    });
  });

  describe('updateBudgetService', () => {
    it('should update budget', async () => {
      const { start, end } = validDateRange();
      const created = await createBudgetService({
        amount: 500,
        category: categoryId,
        period: 'monthly',
        startDate: start,
        endDate: end,
        user: userId,
      });
      const result = await updateBudgetService(created.id, { amount: 1200 });
      expect(result.amount).toBe(1200);
    });
  });

  describe('deleteBudgetService', () => {
    it('should delete budget', async () => {
      const { start, end } = validDateRange();
      const created = await createBudgetService({
        amount: 500,
        category: categoryId,
        period: 'monthly',
        startDate: start,
        endDate: end,
        user: userId,
      });
      const result = await deleteBudgetService(created.id);
      expect(result.message).toBe('Budget deleted successfully');
    });
  });
});
