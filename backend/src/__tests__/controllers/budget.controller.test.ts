jest.mock('../../services/budget.service', () => ({
  getUserBudgetsService: jest.fn(),
  getBudgetByIdService: jest.fn(),
  createBudgetService: jest.fn(),
  updateBudgetService: jest.fn(),
  deleteBudgetService: jest.fn(),
}));

import {
  getUserBudgetsService,
  getBudgetByIdService,
  createBudgetService,
  updateBudgetService,
  deleteBudgetService,
} from '../../services/budget.service';
import {
  getUserBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../../controllers/budget.controller';

describe('Budget Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserBudgets', () => {
    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined, query: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getUserBudgets(req, res, next);
      expect(getUserBudgetsService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls getUserBudgetsService with filter and pagination', async () => {
      const mockResult = { data: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } };
      (getUserBudgetsService as jest.Mock).mockResolvedValue(mockResult);
      const req: any = { user: { id: 'user123' }, query: { page: '1', pageSize: '10', period: 'monthly' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getUserBudgets(req, res, next);
      expect(getUserBudgetsService).toHaveBeenCalledWith(
        expect.objectContaining({ user: 'user123', period: 'monthly' }),
        1,
        10
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('createBudget', () => {
    it('sends 400 when required fields missing', async () => {
      const req: any = { user: { id: 'u1' }, body: { amount: 1000 } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await createBudget(req, res, next);
      expect(createBudgetService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('calls createBudgetService with payload', async () => {
      const start = new Date();
      const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const mockBudget = { id: 'b1', amount: 1000, category: 'c1', period: 'monthly', startDate: start, endDate: end, user: 'u1', isActive: true, createdAt: new Date(), updatedAt: new Date() };
      (createBudgetService as jest.Mock).mockResolvedValue(mockBudget);
      const req: any = {
        user: { id: 'user123' },
        body: { amount: 1000, category: 'c1', period: 'monthly', startDate: start.toISOString(), endDate: end.toISOString() },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await createBudget(req, res, next);
      expect(createBudgetService).toHaveBeenCalledWith(expect.objectContaining({ amount: 1000, category: 'c1', user: 'user123' }));
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getBudgetById', () => {
    it('forwards error to next when service throws', async () => {
      (getBudgetByIdService as jest.Mock).mockRejectedValue(new Error('Budget not found'));
      const req: any = { params: { id: 'fake-id' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getBudgetById(req, res, next);
      expect(getBudgetByIdService).toHaveBeenCalledWith('fake-id');
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateBudget', () => {
    it('calls updateBudgetService with id and update data', async () => {
      const mockBudget = { id: 'b1', amount: 1500, category: 'c1', period: 'monthly', startDate: new Date(), endDate: new Date(), user: 'u1', isActive: true, createdAt: new Date(), updatedAt: new Date() };
      (updateBudgetService as jest.Mock).mockResolvedValue(mockBudget);
      const req: any = { params: { id: 'b1' }, body: { amount: 1500 } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await updateBudget(req, res, next);
      expect(updateBudgetService).toHaveBeenCalledWith('b1', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteBudget', () => {
    it('sends 400 when id missing', async () => {
      const req: any = { params: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await deleteBudget(req, res, next);
      expect(deleteBudgetService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('calls deleteBudgetService and returns 200', async () => {
      (deleteBudgetService as jest.Mock).mockResolvedValue(undefined);
      const req: any = { params: { id: 'b1' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await deleteBudget(req, res, next);
      expect(deleteBudgetService).toHaveBeenCalledWith('b1');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
