import mongoose from 'mongoose';
import {
  getUserNotificationsService,
  getUnreadNotificationsCountService,
  getNotificationByIdService,
  createNotificationService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  deleteNotificationService,
  deleteAllReadNotificationsService,
} from '../../services/notification.service';
import { User } from '../../models';
import { hashPassword } from '../../utils/hasher';

describe('Notification Service', () => {
  let userId: string;

  beforeEach(async () => {
    const hashedPassword = await hashPassword('password123');
    const user = await User.create({
      username: 'notifuser',
      email: 'notif@example.com',
      password: hashedPassword,
    });
    userId = user._id.toString();
  });

  describe('createNotificationService', () => {
    it('should create notification', async () => {
      const result = await createNotificationService({
        title: 'Budget Alert',
        content: 'You exceeded budget',
        user: userId,
        type: 'warning',
      });
      expect(result.title).toBe('Budget Alert');
      expect(result.isRead).toBe(false);
    });
  });

  describe('getUserNotificationsService', () => {
    it('should return paginated notifications', async () => {
      await createNotificationService({ title: 'N1', content: 'C1', user: userId });
      const result = await getUserNotificationsService({ user: userId }, 1, 10);
      expect(result.data).toHaveLength(1);
    });

    it('should filter by isRead', async () => {
      await createNotificationService({ title: 'N1', content: 'C1', user: userId });
      const result = await getUserNotificationsService({ user: userId, isRead: false }, 1, 10);
      expect(result.data.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getUnreadNotificationsCountService', () => {
    it('should return unread count', async () => {
      await createNotificationService({ title: 'N1', content: 'C1', user: userId });
      const count = await getUnreadNotificationsCountService(userId);
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getNotificationByIdService', () => {
    it('should return notification by id', async () => {
      const created = await createNotificationService({ title: 'GetMe', content: 'C', user: userId });
      const result = await getNotificationByIdService(created.id);
      expect(result.title).toBe('GetMe');
    });

    it('should throw when not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(getNotificationByIdService(fakeId)).rejects.toThrow('Notification not found');
    });
  });

  describe('markNotificationAsReadService', () => {
    it('should mark as read', async () => {
      const created = await createNotificationService({ title: 'Read', content: 'C', user: userId });
      const result = await markNotificationAsReadService(created.id);
      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllNotificationsAsReadService', () => {
    it('should mark all unread as read and return count', async () => {
      await createNotificationService({ title: 'N1', content: 'C1', user: userId });
      await createNotificationService({ title: 'N2', content: 'C2', user: userId });
      const result = await markAllNotificationsAsReadService(userId);
      expect(result.count).toBeGreaterThanOrEqual(2);
      expect(result.message).toContain('marked as read');
    });
  });

  describe('deleteNotificationService', () => {
    it('should delete notification and return message', async () => {
      const created = await createNotificationService({ title: 'Del', content: 'C', user: userId });
      const result = await deleteNotificationService(created.id);
      expect(result.message).toContain('deleted');
      await expect(getNotificationByIdService(created.id)).rejects.toThrow('Notification not found');
    });

    it('should throw when notification not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(deleteNotificationService(fakeId)).rejects.toThrow('Notification not found');
    });
  });

  describe('deleteAllReadNotificationsService', () => {
    it('should delete all read notifications and return count', async () => {
      const n = await createNotificationService({ title: 'R1', content: 'C', user: userId });
      await markNotificationAsReadService(n.id);
      const result = await deleteAllReadNotificationsService(userId);
      expect(result.count).toBeGreaterThanOrEqual(1);
      expect(result.message).toContain('deleted');
    });
  });
});
