import { Router } from "express";
import { register, login, logout, refreshToken, forgotPassword, resetPassword, loginWithGoogle } from "../controllers/auth.controller";
import { authenticateJWT } from "../middleware/auth.middleware";
import { authLimiter } from "../config/security";

const router = Router();

// Public routes - strict rate limit for login/register to prevent brute-force
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', loginWithGoogle);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);

// Protected routes
router.post('/logout', authenticateJWT, logout);

export default router;
