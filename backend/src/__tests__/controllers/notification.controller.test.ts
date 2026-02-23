jest.mock('../../services/notification.service', () => ({
  getUserNotificationsService: jest.fn(),
  getUnreadNotificationsCountService: jest.fn(),
  getNotificationByIdService: jest.fn(),
  createNotificationService: jest.fn(),
  markNotificationAsReadService: jest.fn(),
  markAllNotificationsAsReadService: jest.fn(),
  deleteNotificationService: jest.fn(),
  deleteAllReadNotificationsService: jest.fn(),
}));

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
import {
  getUserNotifications,
  getUnreadNotificationsCount,
  getNotificationById,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
} from '../../controllers/notification.controller';

describe('Notification Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserNotifications', () => {
    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined, query: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getUserNotifications(req, res, next);
      expect(getUserNotificationsService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls getUserNotificationsService with filter and pagination', async () => {
      const mockResult = { data: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } };
      (getUserNotificationsService as jest.Mock).mockResolvedValue(mockResult);
      const req: any = { user: { id: 'user123' }, query: { page: '1', pageSize: '10' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getUserNotifications(req, res, next);
      expect(getUserNotificationsService).toHaveBeenCalledWith(expect.objectContaining({ user: 'user123' }), 1, 10);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getUnreadNotificationsCount', () => {
    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getUnreadNotificationsCount(req, res, next);
      expect(getUnreadNotificationsCountService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls getUnreadNotificationsCountService and returns count', async () => {
      (getUnreadNotificationsCountService as jest.Mock).mockResolvedValue(5);
      const req: any = { user: { id: 'user123' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getUnreadNotificationsCount(req, res, next);
      expect(getUnreadNotificationsCountService).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ result: expect.objectContaining({ count: 5 }) }));
    });
  });

  describe('createNotification', () => {
    it('sends 400 when title or content missing', async () => {
      const req: any = { user: { id: 'u1' }, body: { title: 'Only title' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await createNotification(req, res, next);
      expect(createNotificationService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('calls createNotificationService with payload', async () => {
      const mockNotif = { id: 'n1', title: 'Alert', content: 'Message', type: 'info', user: 'u1', isRead: false, readAt: null, redirectType: 'none', redirectId: null, createdAt: new Date(), updatedAt: new Date() };
      (createNotificationService as jest.Mock).mockResolvedValue(mockNotif);
      const req: any = { user: { id: 'user123' }, body: { title: 'Alert', content: 'Message', type: 'warning' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await createNotification(req, res, next);
      expect(createNotificationService).toHaveBeenCalledWith(expect.objectContaining({ title: 'Alert', content: 'Message', user: 'user123' }));
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getNotificationById', () => {
    it('calls getNotificationByIdService and returns 200', async () => {
      const mockNotif = { id: 'n1', title: 'T', content: 'C', type: 'info', user: 'u1', isRead: false, readAt: null, redirectType: 'none', redirectId: null, createdAt: new Date(), updatedAt: new Date() };
      (getNotificationByIdService as jest.Mock).mockResolvedValue(mockNotif);
      const req: any = { params: { id: 'n1' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getNotificationById(req, res, next);
      expect(getNotificationByIdService).toHaveBeenCalledWith('n1');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('markNotificationAsRead', () => {
    it('calls markNotificationAsReadService and returns 200', async () => {
      const mockNotif = { id: 'n1', title: 'T', content: 'C', isRead: true, readAt: new Date(), user: 'u1', redirectType: 'none', redirectId: null, createdAt: new Date(), updatedAt: new Date() };
      (markNotificationAsReadService as jest.Mock).mockResolvedValue(mockNotif);
      const req: any = { params: { id: 'n1' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await markNotificationAsRead(req, res, next);
      expect(markNotificationAsReadService).toHaveBeenCalledWith('n1');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await markAllNotificationsAsRead(req, res, next);
      expect(markAllNotificationsAsReadService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls markAllNotificationsAsReadService and returns 200 with count', async () => {
      (markAllNotificationsAsReadService as jest.Mock).mockResolvedValue({ message: 'All notifications marked as read', count: 3 });
      const req: any = { user: { id: 'user123' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await markAllNotificationsAsRead(req, res, next);
      expect(markAllNotificationsAsReadService).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteNotification', () => {
    it('calls deleteNotificationService and returns 200', async () => {
      (deleteNotificationService as jest.Mock).mockResolvedValue({ message: 'Notification deleted successfully' });
      const req: any = { params: { id: 'n1' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await deleteNotification(req, res, next);
      expect(deleteNotificationService).toHaveBeenCalledWith('n1');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteAllReadNotifications', () => {
    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await deleteAllReadNotifications(req, res, next);
      expect(deleteAllReadNotificationsService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls deleteAllReadNotificationsService and returns 200 with count', async () => {
      (deleteAllReadNotificationsService as jest.Mock).mockResolvedValue({ message: 'All read notifications deleted', count: 2 });
      const req: any = { user: { id: 'user123' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await deleteAllReadNotifications(req, res, next);
      expect(deleteAllReadNotificationsService).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
