import { Router } from "express";
import {
    getUserWallets,
    getWalletById,
    createWallet,
    updateWallet,
    deleteWallet
} from "../controllers/wallet.controller";
import { authenticateJWT } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticateJWT);

router.get('/', getUserWallets);
router.get('/:id', getWalletById);
router.post('/', createWallet);
router.put('/:id', updateWallet);
router.delete('/:id', deleteWallet);

export default router;

