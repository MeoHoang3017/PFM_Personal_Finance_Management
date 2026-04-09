jest.mock('../../services/goal.service', () => ({
  getUserGoalsService: jest.fn(),
  getGoalByIdService: jest.fn(),
  createGoalService: jest.fn(),
  updateGoalService: jest.fn(),
  deleteGoalService: jest.fn(),
}));

import {
  getUserGoalsService,
  getGoalByIdService,
  createGoalService,
  updateGoalService,
  deleteGoalService,
} from '../../services/goal.service';
import {
  getUserGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
} from '../../controllers/goal.controller';

describe('Goal Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserGoals', () => {
    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined, query: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getUserGoals(req, res, next);
      expect(getUserGoalsService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls getUserGoalsService with userId, page, pageSize', async () => {
      const mockResult = { data: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 } };
      (getUserGoalsService as jest.Mock).mockResolvedValue(mockResult);
      const req: any = { user: { id: 'user123' }, query: { page: '1', pageSize: '10' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getUserGoals(req, res, next);
      expect(getUserGoalsService).toHaveBeenCalledWith('user123', 1, 10);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('createGoal', () => {
    it('sends 400 when title, targetAmount or dueDate missing', async () => {
      const req: any = { user: { id: 'u1' }, body: { title: 'Goal' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await createGoal(req, res, next);
      expect(createGoalService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('calls createGoalService with payload', async () => {
      const dueDate = new Date();
      const mockGoal = { id: 'g1', title: 'Vacation', targetAmount: 5000, currentAmount: 0, dueDate, user: 'u1', createdAt: new Date(), updatedAt: new Date() };
      (createGoalService as jest.Mock).mockResolvedValue(mockGoal);
      const req: any = { user: { id: 'user123' }, body: { title: 'Vacation', targetAmount: 5000, dueDate: dueDate.toISOString() } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await createGoal(req, res, next);
      expect(createGoalService).toHaveBeenCalledWith(expect.objectContaining({ title: 'Vacation', targetAmount: 5000, user: 'user123' }));
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getGoalById', () => {
    it('forwards error to next when service throws', async () => {
      (getGoalByIdService as jest.Mock).mockRejectedValue(new Error('Goal not found'));
      const req: any = { params: { id: 'fake-id' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getGoalById(req, res, next);
      expect(getGoalByIdService).toHaveBeenCalledWith('fake-id');
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateGoal', () => {
    it('calls updateGoalService with id and update data', async () => {
      const mockGoal = { id: 'g1', title: 'Updated', targetAmount: 6000, currentAmount: 1000, dueDate: new Date(), user: 'u1', createdAt: new Date(), updatedAt: new Date() };
      (updateGoalService as jest.Mock).mockResolvedValue(mockGoal);
      const req: any = { params: { id: 'g1' }, body: { title: 'Updated' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await updateGoal(req, res, next);
      expect(updateGoalService).toHaveBeenCalledWith('g1', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteGoal', () => {
    it('calls deleteGoalService and returns 200', async () => {
      (deleteGoalService as jest.Mock).mockResolvedValue({ message: 'Goal deleted successfully' });
      const req: any = { params: { id: 'g1' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await deleteGoal(req, res, next);
      expect(deleteGoalService).toHaveBeenCalledWith('g1');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
