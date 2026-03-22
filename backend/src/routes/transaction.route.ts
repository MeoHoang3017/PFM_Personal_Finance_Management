import { Router } from "express";
import {
    getUserTransactions,
    getTransactionById,
    createTransaction,
    createWalletExchange,
    updateTransaction,
    deleteTransaction,
    duplicateTransaction,
} from "../controllers/transaction.controller";
import { authenticateJWT } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

router.get('/', getUserTransactions);
router.post('/exchange', createWalletExchange);
router.post('/', createTransaction);
router.get('/:id', getTransactionById);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);
router.post('/:id/duplicate', duplicateTransaction);

export default router;

