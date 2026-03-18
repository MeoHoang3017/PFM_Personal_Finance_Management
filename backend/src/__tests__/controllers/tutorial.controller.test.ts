jest.mock('../../services/tutorial.service', () => ({
  getTutorialByUserService: jest.fn(),
  upsertTutorialService: jest.fn(),
  completeTutorialStepService: jest.fn(),
  completeTutorialService: jest.fn(),
  resetTutorialService: jest.fn(),
}));

import {
  getTutorialByUserService,
  upsertTutorialService,
  completeTutorialStepService,
  completeTutorialService,
  resetTutorialService,
} from '../../services/tutorial.service';
import {
  getTutorialByUser,
  upsertTutorial,
  completeTutorialStep,
  completeTutorial,
  resetTutorial,
} from '../../controllers/tutorial.controller';

describe('Tutorial Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTutorialByUser', () => {
    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getTutorialByUser(req, res, next);
      expect(getTutorialByUserService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('sends 404 when tutorial not found', async () => {
      (getTutorialByUserService as jest.Mock).mockResolvedValue(null);
      const req: any = { user: { id: 'user123' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getTutorialByUser(req, res, next);
      expect(getTutorialByUserService).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 200 with tutorial when found', async () => {
      const mockTutorial = { id: 't1', user: 'user123', isCompleted: false, completedSteps: [], lastViewedAt: new Date(), createdAt: new Date(), updatedAt: new Date() };
      (getTutorialByUserService as jest.Mock).mockResolvedValue(mockTutorial);
      const req: any = { user: { id: 'user123' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await getTutorialByUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('upsertTutorial', () => {
    it('sends 401 when user not present', async () => {
      const req: any = { user: undefined, body: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await upsertTutorial(req, res, next);
      expect(upsertTutorialService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('calls upsertTutorialService with userId and body', async () => {
      const mockTutorial = { id: 't1', user: 'user123', isCompleted: false, completedSteps: [], lastViewedAt: new Date(), createdAt: new Date(), updatedAt: new Date() };
      (upsertTutorialService as jest.Mock).mockResolvedValue(mockTutorial);
      const req: any = { user: { id: 'user123' }, body: { isCompleted: false } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await upsertTutorial(req, res, next);
      expect(upsertTutorialService).toHaveBeenCalledWith('user123', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('completeTutorialStep', () => {
    it('sends 400 when stepId missing', async () => {
      const req: any = { user: { id: 'u1' }, body: {} };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await completeTutorialStep(req, res, next);
      expect(completeTutorialStepService).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('calls completeTutorialStepService with userId and stepId', async () => {
      const mockTutorial = { id: 't1', user: 'user123', isCompleted: false, completedSteps: [{ stepId: 'welcome', completedAt: new Date() }], lastViewedAt: new Date(), createdAt: new Date(), updatedAt: new Date() };
      (completeTutorialStepService as jest.Mock).mockResolvedValue(mockTutorial);
      const req: any = { user: { id: 'user123' }, body: { stepId: 'welcome' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await completeTutorialStep(req, res, next);
      expect(completeTutorialStepService).toHaveBeenCalledWith('user123', 'welcome');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('completeTutorial', () => {
    it('calls completeTutorialService', async () => {
      const mockTutorial = { id: 't1', user: 'user123', isCompleted: true, completedSteps: [], lastViewedAt: new Date(), createdAt: new Date(), updatedAt: new Date() };
      (completeTutorialService as jest.Mock).mockResolvedValue(mockTutorial);
      const req: any = { user: { id: 'user123' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await completeTutorial(req, res, next);
      expect(completeTutorialService).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('resetTutorial', () => {
    it('calls resetTutorialService', async () => {
      const mockTutorial = { id: 't1', user: 'user123', isCompleted: false, completedSteps: [], lastViewedAt: new Date(), createdAt: new Date(), updatedAt: new Date() };
      (resetTutorialService as jest.Mock).mockResolvedValue(mockTutorial);
      const req: any = { user: { id: 'user123' } };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();
      await resetTutorial(req, res, next);
      expect(resetTutorialService).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
