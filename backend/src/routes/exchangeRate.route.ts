import { Router } from "express";
import {
    updateRates,
    getRate,
    convert
} from "../controllers/exchangeRate.controller";
import { authenticateJWT } from "../middleware/auth.middleware";
import { exchangeRateUpdateLimiter } from "../config/security";

const router = Router();

// Public routes (can view rates)
router.get('/rate', getRate);
router.post('/convert', convert);

// Protected routes: rate-limited (1 req / 5 min) to avoid API abuse
router.post('/update', exchangeRateUpdateLimiter, authenticateJWT, updateRates);

export default router;

