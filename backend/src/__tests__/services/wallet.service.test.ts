import mongoose from 'mongoose';
import {
  getUserWalletsService,
  createWalletService,
  getWalletByIdService,
  updateWalletService,
  deleteWalletService,
} from '../../services/wallet.service';
import { User } from '../../models';
import { hashPassword } from '../../utils/hasher';

describe('Wallet Service', () => {
  let userId: string;

  beforeEach(async () => {
    const hashedPassword = await hashPassword('password123');
    const user = await User.create({
      username: 'walletuser',
      email: 'wallet@example.com',
      password: hashedPassword,
    });
    userId = user._id.toString();
  });

  describe('createWalletService', () => {
    it('should create wallet with name and balance', async () => {
      const result = await createWalletService({
        name: 'Main Wallet',
        balance: 1000,
        user: userId,
      });
      expect(result.name).toBe('Main Wallet');
      expect(result.balance).toBe(1000);
      expect(result.user).toBe(userId);
      expect(result.id).toBeDefined();
    });

    it('should create wallet with default balance 0 when not provided', async () => {
      const result = await createWalletService({
        name: 'Savings',
        user: userId,
      });
      expect(result.balance).toBe(0);
    });

    it('should throw when user has 10 wallets (limit)', async () => {
      for (let i = 0; i < 10; i++) {
        await createWalletService({ name: `Wallet ${i}`, user: userId });
      }
      await expect(
        createWalletService({ name: '11th Wallet', user: userId })
      ).rejects.toThrow('Maximum number of wallets reached');
    });
  });

  describe('getUserWalletsService', () => {
    it('should return paginated wallets', async () => {
      await createWalletService({ name: 'W1', user: userId });
      await createWalletService({ name: 'W2', user: userId });

      const result = await getUserWalletsService(userId, 1, 10);
      expect(result.data).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('should return empty list when no wallets', async () => {
      const result = await getUserWalletsService(userId, 1, 10);
      expect(result.data).toEqual([]);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  describe('getWalletByIdService', () => {
    it('should return wallet by id when userId matches owner', async () => {
      const created = await createWalletService({ name: 'Test', user: userId });
      const result = await getWalletByIdService(created.id, userId);
      expect(result.name).toBe('Test');
    });

    it('should throw when userId does not match owner', async () => {
      const created = await createWalletService({ name: 'Test', user: userId });
      const otherUserId = new mongoose.Types.ObjectId().toString();
      await expect(getWalletByIdService(created.id, otherUserId)).rejects.toThrow('Wallet not found');
    });

    it('should throw when wallet not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(getWalletByIdService(fakeId, userId)).rejects.toThrow('Wallet not found');
    });
  });

  describe('updateWalletService', () => {
    it('should update wallet name and balance when userId matches', async () => {
      const created = await createWalletService({ name: 'Old', balance: 100, user: userId });
      const result = await updateWalletService(created.id, { name: 'New', balance: 200 }, userId);
      expect(result.name).toBe('New');
      expect(result.balance).toBe(200);
    });

    it('should throw when userId does not match owner', async () => {
      const created = await createWalletService({ name: 'Old', user: userId });
      const otherUserId = new mongoose.Types.ObjectId().toString();
      await expect(
        updateWalletService(created.id, { name: 'Hacked' }, otherUserId)
      ).rejects.toThrow('Wallet not found');
    });
  });

  describe('deleteWalletService', () => {
    it('should delete wallet and return message when userId matches', async () => {
      const created = await createWalletService({ name: 'ToDelete', user: userId });
      const result = await deleteWalletService(created.id, userId);
      expect(result.message).toBe('Wallet deleted successfully');

      await expect(getWalletByIdService(created.id, userId)).rejects.toThrow('Wallet not found');
    });

    it('should throw when userId does not match owner', async () => {
      const created = await createWalletService({ name: 'Other', user: userId });
      const otherUserId = new mongoose.Types.ObjectId().toString();
      await expect(deleteWalletService(created.id, otherUserId)).rejects.toThrow('Wallet not found');
      const stillThere = await getWalletByIdService(created.id, userId);
      expect(stillThere.name).toBe('Other');
    });
  });
});
