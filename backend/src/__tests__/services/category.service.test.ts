import mongoose from 'mongoose';
import {
  listCategories,
  listCategoriesByUser,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../../services/category.service';
import { User } from '../../models';
import { hashPassword } from '../../utils/hasher';

describe('Category Service', () => {
  let userId: string;

  beforeEach(async () => {
    const hashedPassword = await hashPassword('password123');
    const user = await User.create({
      username: 'catuser',
      email: 'cat@example.com',
      password: hashedPassword,
    });
    userId = user._id.toString();
  });

  describe('createCategory', () => {
    it('should create category with required fields', async () => {
      const result = await createCategory({
        name: 'Food & Dining',
        type: 'expense',
        user: userId,
        icon: '🍔',
        color: '#FF5733',
      });
      expect(result.name).toBe('Food & Dining');
      expect(result.type).toBe('expense');
      expect(result.icon).toBe('🍔');
      expect(result.color).toBe('#FF5733');
    });

    it('should create income category', async () => {
      const result = await createCategory({
        name: 'Salary',
        type: 'income',
        user: userId,
      });
      expect(result.type).toBe('income');
    });
  });

  describe('listCategories', () => {
    it('should filter by user', async () => {
      await createCategory({ name: 'C1', type: 'expense', user: userId });
      const result = await listCategories({ user: userId }, 1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('C1');
    });

    it('should filter by type', async () => {
      await createCategory({ name: 'E1', type: 'expense', user: userId });
      await createCategory({ name: 'I1', type: 'income', user: userId });
      const result = await listCategories({ user: userId, type: 'expense' }, 1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe('expense');
    });
  });

  describe('listCategoriesByUser', () => {
    it('should return only user categories', async () => {
      await createCategory({ name: 'UserCat', type: 'expense', user: userId });
      const result = await listCategoriesByUser(userId, 1, 10);
      expect(result.data.some((c) => c.name === 'UserCat')).toBe(true);
    });
  });

  describe('getCategoryById', () => {
    it('should return category by id', async () => {
      const created = await createCategory({ name: 'GetMe', type: 'expense', user: userId });
      const result = await getCategoryById(created.id);
      expect(result).not.toBeNull();
      expect(result!.name).toBe('GetMe');
    });

    it('should return null for non-existent id', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const result = await getCategoryById(fakeId);
      expect(result).toBeNull();
    });
  });

  describe('updateCategory', () => {
    it('should update category fields', async () => {
      const created = await createCategory({ name: 'Old', type: 'expense', user: userId });
      const result = await updateCategory(created.id, { name: 'Updated', color: '#000' });
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Updated');
      expect(result!.color).toBe('#000');
    });
  });

  describe('deleteCategory', () => {
    it('should delete and return { deleted: true }', async () => {
      const created = await createCategory({ name: 'Del', type: 'expense', user: userId });
      const result = await deleteCategory(created.id);
      expect(result.deleted).toBe(true);
      expect(await getCategoryById(created.id)).toBeNull();
    });
  });
});
