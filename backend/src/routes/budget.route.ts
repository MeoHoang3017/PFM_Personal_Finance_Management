import { Router } from "express";
import {
    getUserBudgets,
    getBudgetById,
    createBudget,
    updateBudget,
    deleteBudget
} from "../controllers/budget.controller";
import { authenticateJWT } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

router.get('/', getUserBudgets);
router.get('/:id', getBudgetById);
router.post('/', createBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

export default router;

