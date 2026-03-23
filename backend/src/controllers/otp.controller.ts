import { Request, Response, NextFunction } from "express";
import { sendOtpService, verifyOtpService } from "../services/otp.service";
import { forgotPasswordService } from "../services/auth.service";
import { normalizeEmail } from "../utils/emailNormalize";
import { SuccessResponse, ErrorResponse } from "../constants/Response";
import { sendResponse } from "../utils/response";
import { createError } from "../middleware/error.middleware";

/**
 * Send OTP for Registration
 */
export const sendRegisterOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email: raw } = req.body;
        const email = typeof raw === "string" ? normalizeEmail(raw) : "";

        if (!email) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['email']));
            return;
        }

        const result = await sendOtpService(email, 'register');
        sendResponse(res, SuccessResponse.CUSTOM(200, result.message, null));
    } catch (error: any) {
        next(createError(error.message || 'Failed to send OTP', 400));
    }
};

/**
 * Send OTP for Password Reset — cùng logic POST /auth/forgot-password (chặn tài khoản chỉ Google, không lộ email).
 */
export const sendForgotPasswordOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email: raw } = req.body;
        const email = typeof raw === "string" ? normalizeEmail(raw) : "";

        if (!email) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['email']));
            return;
        }

        const result = await forgotPasswordService({ email });
        sendResponse(res, SuccessResponse.CUSTOM(200, result.message, null));
    } catch (error: any) {
        next(createError(error.message || 'Failed to send OTP', 400));
    }
};

/**
 * Verify OTP
 */
export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email: raw, otp, type = 'register' } = req.body;
        const email = typeof raw === "string" ? normalizeEmail(raw) : "";

        if (!email || !otp) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['email', 'otp']));
            return;
        }

        const result = await verifyOtpService(email, otp, type as 'register' | 'forgot-password');
        sendResponse(res, SuccessResponse.CUSTOM(200, result.message, { verified: result.verified }));
    } catch (error: any) {
        next(createError(error.message || 'OTP verification failed', 400));
    }
};

