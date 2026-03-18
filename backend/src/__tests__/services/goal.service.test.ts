import mongoose from 'mongoose';
import {
  getUserGoalsService,
  getGoalByIdService,
  createGoalService,
  updateGoalService,
  deleteGoalService,
} from '../../services/goal.service';
import { User } from '../../models';
import { hashPassword } from '../../utils/hasher';

describe('Goal Service', () => {
  let userId: string;

  beforeEach(async () => {
    const hashedPassword = await hashPassword('password123');
    const user = await User.create({
      username: 'goaluser',
      email: 'goal@example.com',
      password: hashedPassword,
    });
    userId = user._id.toString();
  });

  describe('createGoalService', () => {
    it('should create goal with required fields', async () => {
      const dueDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const result = await createGoalService({
        title: 'Vacation Fund',
        targetAmount: 5000,
        dueDate,
        user: userId,
      });
      expect(result.title).toBe('Vacation Fund');
      expect(result.targetAmount).toBe(5000);
      expect(result.currentAmount).toBe(0);
    });

    it('should create goal with currentAmount', async () => {
      const dueDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const result = await createGoalService({
        title: 'Car',
        targetAmount: 10000,
        currentAmount: 2000,
        dueDate,
        user: userId,
      });
      expect(result.currentAmount).toBe(2000);
    });
  });

  describe('getUserGoalsService', () => {
    it('should return paginated goals', async () => {
      const dueDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      await createGoalService({ title: 'G1', targetAmount: 1000, dueDate, user: userId });
      await createGoalService({ title: 'G2', targetAmount: 2000, dueDate, user: userId });

      const result = await getUserGoalsService(userId, 1, 10);
      expect(result.data).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(2);
    });
  });

  describe('getGoalByIdService', () => {
    it('should return goal by id', async () => {
      const dueDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const created = await createGoalService({ title: 'GetMe', targetAmount: 1000, dueDate, user: userId });
      const result = await getGoalByIdService(created.id);
      expect(result.title).toBe('GetMe');
    });

    it('should throw when goal not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(getGoalByIdService(fakeId)).rejects.toThrow('Goal not found');
    });
  });

  describe('updateGoalService', () => {
    it('should update goal', async () => {
      const dueDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const created = await createGoalService({ title: 'Old', targetAmount: 1000, dueDate, user: userId });
      const result = await updateGoalService(created.id, { title: 'Updated', currentAmount: 500 });
      expect(result.title).toBe('Updated');
      expect(result.currentAmount).toBe(500);
    });
  });

  describe('deleteGoalService', () => {
    it('should delete goal', async () => {
      const dueDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      const created = await createGoalService({ title: 'Del', targetAmount: 1000, dueDate, user: userId });
      const result = await deleteGoalService(created.id);
      expect(result.message).toBe('Goal deleted successfully');
      await expect(getGoalByIdService(created.id)).rejects.toThrow('Goal not found');
    });
  });
});
