import {
  getTutorialByUserService,
  upsertTutorialService,
  completeTutorialStepService,
  completeTutorialService,
  resetTutorialService,
} from '../../services/tutorial.service';
import { User } from '../../models';
import { hashPassword } from '../../utils/hasher';

describe('Tutorial Service', () => {
  let userId: string;

  beforeEach(async () => {
    const hashedPassword = await hashPassword('password123');
    const user = await User.create({
      username: 'tutorialuser',
      email: 'tutorial@example.com',
      password: hashedPassword,
    });
    userId = user._id.toString();
  });

  describe('getTutorialByUserService', () => {
    it('should return null when no tutorial exists', async () => {
      const result = await getTutorialByUserService(userId);
      expect(result).toBeNull();
    });
  });

  describe('upsertTutorialService', () => {
    it('should create tutorial via upsert', async () => {
      const result = await upsertTutorialService(userId, {});
      expect(result).toBeDefined();
      expect(result.user).toBe(userId);
    });
  });

  describe('completeTutorialStepService', () => {
    it('should create tutorial and add step when none exists', async () => {
      const result = await completeTutorialStepService(userId, 'welcome');
      expect(result.completedSteps).toHaveLength(1);
      expect(result.completedSteps[0].stepId).toBe('welcome');
    });
  });

  describe('completeTutorialService', () => {
    it('should set isCompleted true', async () => {
      const result = await completeTutorialService(userId);
      expect(result.isCompleted).toBe(true);
    });
  });

  describe('resetTutorialService', () => {
    it('should reset completed steps and isCompleted', async () => {
      await completeTutorialStepService(userId, 'step1');
      const result = await resetTutorialService(userId);
      expect(result.isCompleted).toBe(false);
      expect(result.completedSteps).toHaveLength(0);
    });
  });
});
