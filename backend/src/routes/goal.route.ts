import { Router } from "express";
import {
    getUserGoals,
    getGoalById,
    createGoal,
    updateGoal,
    deleteGoal
} from "../controllers/goal.controller";
import { authenticateJWT } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

router.get('/', getUserGoals);
router.get('/:id', getGoalById);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;

