jest.mock('../../services/wallet.service', () => ({
  getUserWalletsService: jest.fn(),
  getWalletByIdService: jest.fn(),
  createWalletService: jest.fn(),
  updateWalletService: jest.fn(),
  deleteWalletService: jest.fn(),
}));

import {
  getUserWalletsService,
  getWalletByIdService,
  createWalletService,
  updateWalletService,
  deleteWalletService,
} from '../../services/wallet.service';
import {
  getUserWallets,
  getWalletById,
  createWallet,
  updateWallet,
  deleteWallet,
} from '../../controllers/wallet.controller';

describe('Wallet Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // These tests hit the HTTP layer - auth middleware runs first.
  // So we need either: real auth (login first) or mock auth middleware.
  // Simpler approach: test controller functions directly with mock req/res.
  describe('getUserWallets (via service mock)', () => {
    it('calls getUserWalletsService with userId, page, pageSize when authenticated', async () => {
      const mockResult = { data: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } };
      (getUserWalletsService as jest.Mock).mockResolvedValue(mockResult);

      const req: any = {
        user: { id: 'user123' },
        query: { page: '2', pageSize: '20' },
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      await getUserWallets(req, res, next);

      expect(getUserWalletsService).toHaveBeenCalledWith('user123', 2, 20);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 200,
          result: mockResult,
        })
      );
    });

    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined, query: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await getUserWallets(req, res, next);

      expect(getUserWalletsService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('createWallet (via service mock)', () => {
    it('calls createWalletService with name, balance, user', async () => {
      const mockWallet = { id: 'w1', name: 'Main', balance: 1000, user: 'u1', createdAt: new Date(), updatedAt: new Date() };
      (createWalletService as jest.Mock).mockResolvedValue(mockWallet);

      const req: any = {
        user: { id: 'user123' },
        body: { name: 'Main', balance: 1000 },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await createWallet(req, res, next);

      expect(createWalletService).toHaveBeenCalledWith({ name: 'Main', balance: 1000, user: 'user123' });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('sends 400 when name is missing', async () => {
      const req: any = { user: { id: 'u1' }, body: { balance: 100 } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await createWallet(req, res, next);

      expect(createWalletService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getWalletById (via service mock)', () => {
    it('calls getWalletByIdService with id and userId and returns 200 when found', async () => {
      const mockWallet = { id: 'w1', name: 'Main', balance: 100, user: 'u1', createdAt: new Date(), updatedAt: new Date() };
      (getWalletByIdService as jest.Mock).mockResolvedValue(mockWallet);
      const req: any = { user: { id: 'user123' }, params: { id: 'w1' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getWalletById(req, res, next);
      expect(getWalletByIdService).toHaveBeenCalledWith('w1', 'user123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined, params: { id: 'w1' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getWalletById(req, res, next);
      expect(getWalletByIdService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('forwards error to next when service throws', async () => {
      (getWalletByIdService as jest.Mock).mockRejectedValue(new Error('Wallet not found'));
      const req: any = { user: { id: 'user123' }, params: { id: 'fake-id' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getWalletById(req, res, next);
      expect(getWalletByIdService).toHaveBeenCalledWith('fake-id', 'user123');
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateWallet (via service mock)', () => {
    it('calls updateWalletService with id, update data, and userId', async () => {
      const mockWallet = { id: 'w1', name: 'Updated', balance: 500, user: 'u1', createdAt: new Date(), updatedAt: new Date() };
      (updateWalletService as jest.Mock).mockResolvedValue(mockWallet);

      const req: any = {
        user: { id: 'user123' },
        params: { id: 'w1' },
        body: { name: 'Updated', balance: 500 },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await updateWallet(req, res, next);

      expect(updateWalletService).toHaveBeenCalledWith('w1', { name: 'Updated', balance: 500 }, 'user123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined, params: { id: 'w1' }, body: { name: 'X' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await updateWallet(req, res, next);
      expect(updateWalletService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('deleteWallet (via service mock)', () => {
    it('calls deleteWalletService with id and userId and returns 200', async () => {
      (deleteWalletService as jest.Mock).mockResolvedValue({ message: 'Wallet deleted successfully' });

      const req: any = { user: { id: 'user123' }, params: { id: 'w1' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await deleteWallet(req, res, next);

      expect(deleteWalletService).toHaveBeenCalledWith('w1', 'user123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined, params: { id: 'w1' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await deleteWallet(req, res, next);
      expect(deleteWalletService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
