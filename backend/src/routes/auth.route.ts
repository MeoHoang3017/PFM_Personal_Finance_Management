import { Router } from "express";
import { register, login, logout, refreshToken, forgotPassword, resetPassword, loginWithGoogle } from "../controllers/auth.controller";
import { authenticateJWT } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', loginWithGoogle);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);

// Protected routes
router.post('/logout', authenticateJWT, logout);

export default router;
