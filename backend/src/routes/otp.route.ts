import { Router } from "express";
import { sendRegisterOtp, sendForgotPasswordOtp, verifyOtp } from "../controllers/otp.controller";

const router = Router();

// Public routes
router.post('/send-register-otp', sendRegisterOtp);
router.post('/send-forgot-password-otp', sendForgotPasswordOtp);
router.post('/verify', verifyOtp);

export default router;
