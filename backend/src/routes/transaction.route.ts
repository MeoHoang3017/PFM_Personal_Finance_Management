import { Router } from "express";
import {
    getUserTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    duplicateTransaction
} from "../controllers/transaction.controller";
import { authenticateJWT } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

router.get('/', getUserTransactions);
router.get('/:id', getTransactionById);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);
router.post('/:id/duplicate', duplicateTransaction);

export default router;

