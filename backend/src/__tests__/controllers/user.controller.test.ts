jest.mock('../../services/user.service', () => ({
  getUserListService: jest.fn(),
  getUserByIdService: jest.fn(),
  getProfileService: jest.fn(),
  updateUserSettingsService: jest.fn(),
  updateProfileService: jest.fn(),
  deleteUserService: jest.fn(),
  searchUsersService: jest.fn(),
  changePasswordService: jest.fn(),
}));

import {
  getUserListService,
  getUserByIdService,
  getProfileService,
  updateUserSettingsService,
  updateProfileService,
  deleteUserService,
  searchUsersService,
  changePasswordService,
} from '../../services/user.service';
import {
  getUserList,
  getUserById,
  getProfile,
  updateUserSettings,
  updateProfile,
  deleteUser,
  searchUsers,
  changePassword,
} from '../../controllers/user.controller';

describe('User Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserList', () => {
    it('calls getUserListService with default pagination', async () => {
      const mockResult = { data: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } };
      (getUserListService as jest.Mock).mockResolvedValue(mockResult);
      const req: any = { query: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getUserList(req, res, next);
      expect(getUserListService).toHaveBeenCalledWith(1, 10);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('uses query page and pageSize when provided', async () => {
      const mockResult = { data: [], pagination: { page: 2, pageSize: 5, totalItems: 0, totalPages: 0 } };
      (getUserListService as jest.Mock).mockResolvedValue(mockResult);
      const req: any = { query: { page: '2', pageSize: '5' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getUserList(req, res, next);
      expect(getUserListService).toHaveBeenCalledWith(2, 5);
    });
  });

  describe('getUserById', () => {
    it('calls getUserByIdService with id from params', async () => {
      const mockUser = { id: 'u1', username: 'john', email: 'j@x.com', theme: 'light', language: 'en', currency: 'USD', avatarUrl: '' };
      (getUserByIdService as jest.Mock).mockResolvedValue(mockUser);
      const req: any = { params: { id: 'user123' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getUserById(req, res, next);
      expect(getUserByIdService).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getProfile', () => {
    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getProfile(req, res, next);
      expect(getProfileService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls getProfileService with userId', async () => {
      const mockUser = { id: 'u1', username: 'john', email: 'j@x.com', theme: 'light', language: 'en', currency: 'USD', avatarUrl: '' };
      (getProfileService as jest.Mock).mockResolvedValue(mockUser);
      const req: any = { user: { id: 'user123' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getProfile(req, res, next);
      expect(getProfileService).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateProfile', () => {
    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined, body: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await updateProfile(req, res, next);
      expect(updateProfileService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls updateProfileService with userId and body', async () => {
      const mockUser = { id: 'u1', username: 'newname', email: 'j@x.com', theme: 'light', language: 'en', currency: 'USD', avatarUrl: '' };
      (updateProfileService as jest.Mock).mockResolvedValue(mockUser);
      const req: any = { user: { id: 'user123' }, body: { username: 'newname' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await updateProfile(req, res, next);
      expect(updateProfileService).toHaveBeenCalledWith('user123', { username: 'newname' });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateUserSettings', () => {
    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined, body: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await updateUserSettings(req, res, next);
      expect(updateUserSettingsService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls updateUserSettingsService with userId and body', async () => {
      const mockUser = { id: 'u1', username: 'j', email: 'j@x.com', theme: 'dark', language: 'en', currency: 'EUR', avatarUrl: '' };
      (updateUserSettingsService as jest.Mock).mockResolvedValue(mockUser);
      const req: any = { user: { id: 'user123' }, body: { theme: 'dark', currency: 'EUR' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await updateUserSettings(req, res, next);
      expect(updateUserSettingsService).toHaveBeenCalledWith('user123', { theme: 'dark', currency: 'EUR' });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteUser', () => {
    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await deleteUser(req, res, next);
      expect(deleteUserService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls deleteUserService and returns 200', async () => {
      (deleteUserService as jest.Mock).mockResolvedValue(undefined);
      const req: any = { user: { id: 'user123' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await deleteUser(req, res, next);
      expect(deleteUserService).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('searchUsers', () => {
    it('sends 400 when q is missing', async () => {
      const req: any = { query: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await searchUsers(req, res, next);
      expect(searchUsersService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('calls searchUsersService with query, page, pageSize', async () => {
      const mockResult = { data: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } };
      (searchUsersService as jest.Mock).mockResolvedValue(mockResult);
      const req: any = { query: { q: 'john', page: '1', pageSize: '10' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await searchUsers(req, res, next);
      expect(searchUsersService).toHaveBeenCalledWith('john', 1, 10);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('changePassword', () => {
    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined, body: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await changePassword(req, res, next);
      expect(changePasswordService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('sends 400 when currentPassword or newPassword missing', async () => {
      const req: any = { user: { id: 'user123' }, body: { currentPassword: 'old' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await changePassword(req, res, next);
      expect(changePasswordService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('calls changePasswordService and returns 200', async () => {
      (changePasswordService as jest.Mock).mockResolvedValue({ message: 'Password changed successfully' });
      const req: any = { user: { id: 'user123' }, body: { currentPassword: 'old', newPassword: 'new' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await changePassword(req, res, next);
      expect(changePasswordService).toHaveBeenCalledWith('user123', 'old', 'new');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
