jest.mock('../../services/transaction.service', () => ({
  getUserTransactionsService: jest.fn(),
  getTransactionByIdService: jest.fn(),
  createTransactionService: jest.fn(),
  updateTransactionService: jest.fn(),
  deleteTransactionService: jest.fn(),
  duplicateTransactionService: jest.fn(),
}));

import {
  getUserTransactionsService,
  getTransactionByIdService,
  createTransactionService,
  updateTransactionService,
  deleteTransactionService,
  duplicateTransactionService,
} from '../../services/transaction.service';
import {
  getUserTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  duplicateTransaction,
} from '../../controllers/transaction.controller';

describe('Transaction Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserTransactions', () => {
    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined, query: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getUserTransactions(req, res, next);
      expect(getUserTransactionsService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls getUserTransactionsService with filter and pagination', async () => {
      const mockResult = { data: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } };
      (getUserTransactionsService as jest.Mock).mockResolvedValue(mockResult);
      const req: any = { user: { id: 'user123' }, query: { page: '1', pageSize: '10', type: 'expense' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getUserTransactions(req, res, next);
      expect(getUserTransactionsService).toHaveBeenCalledWith(
        expect.objectContaining({ user: 'user123', type: 'expense' }),
        1,
        10
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('createTransaction', () => {
    it('sends 400 when amount, type, category or wallet missing', async () => {
      const req: any = { user: { id: 'u1' }, body: { amount: 50 } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await createTransaction(req, res, next);
      expect(createTransactionService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('calls createTransactionService with payload', async () => {
      const mockTx = { id: 'tx1', amount: 50, type: 'expense', category: 'c1', date: new Date(), description: '', notes: '', wallet: 'w1', user: 'u1', createdAt: new Date(), updatedAt: new Date() };
      (createTransactionService as jest.Mock).mockResolvedValue(mockTx);
      const req: any = {
        user: { id: 'user123' },
        body: { amount: 50, type: 'expense', category: 'c1', wallet: 'w1', description: 'Lunch' },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await createTransaction(req, res, next);
      expect(createTransactionService).toHaveBeenCalledWith(expect.objectContaining({ amount: 50, type: 'expense', category: 'c1', wallet: 'w1', user: 'user123' }));
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getTransactionById', () => {
    it('forwards error to next when service throws', async () => {
      (getTransactionByIdService as jest.Mock).mockRejectedValue(new Error('Transaction not found'));
      const req: any = { params: { id: 'fake-id' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getTransactionById(req, res, next);
      expect(getTransactionByIdService).toHaveBeenCalledWith('fake-id');
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateTransaction', () => {
    it('calls updateTransactionService with id and update data', async () => {
      const mockTx = { id: 'tx1', amount: 75, type: 'expense', category: 'c1', date: new Date(), description: '', notes: '', wallet: 'w1', user: 'u1', createdAt: new Date(), updatedAt: new Date() };
      (updateTransactionService as jest.Mock).mockResolvedValue(mockTx);
      const req: any = { params: { id: 'tx1' }, body: { amount: 75 } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await updateTransaction(req, res, next);
      expect(updateTransactionService).toHaveBeenCalledWith('tx1', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteTransaction', () => {
    it('calls deleteTransactionService and returns 200', async () => {
      (deleteTransactionService as jest.Mock).mockResolvedValue({ message: 'Deleted' });
      const req: any = { params: { id: 'tx1' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await deleteTransaction(req, res, next);
      expect(deleteTransactionService).toHaveBeenCalledWith('tx1');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('duplicateTransaction', () => {
    it('calls duplicateTransactionService and returns 201', async () => {
      const mockTx = { id: 'tx2', amount: 50, type: 'expense', category: 'c1', date: new Date(), description: '', notes: '', wallet: 'w1', user: 'u1', createdAt: new Date(), updatedAt: new Date() };
      (duplicateTransactionService as jest.Mock).mockResolvedValue(mockTx);
      const req: any = { params: { id: 'tx1' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await duplicateTransaction(req, res, next);
      expect(duplicateTransactionService).toHaveBeenCalledWith('tx1');
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
});
