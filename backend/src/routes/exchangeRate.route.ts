import { Router } from "express";
import {
    updateRates,
    getRate,
    convert
} from "../controllers/exchangeRate.controller";
import { authenticateJWT } from "../middleware/auth.middleware";

const router = Router();

// Public routes (can view rates)
router.get('/rate', getRate);
router.post('/convert', convert);

// Protected routes (admin only - can add role check later)
router.post('/update', authenticateJWT, updateRates);

export default router;

