import Otp from "../models/otp.model";
import { sendMail } from "../utils/mailer";
import { normalizeEmail } from "../utils/emailNormalize";

// Helper to generate 6-digit OTP
function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOtpService(
    email: string,
    type: 'register' | 'forgot-password' = 'register'
): Promise<{ message: string }> {
    try {
        email = normalizeEmail(email);
        const otpCode = generateOtp();
        const expiresAt = new Date(
            Date.now() + (parseInt(process.env.OTP_EXPIRES_MINUTES || '10') * 60 * 1000)
        );

        // Upsert OTP record
        await Otp.findOneAndUpdate(
            { email, type },
            { otp: otpCode, expiresAt, isVerified: false },
            { upsert: true, new: true }
        );

        // Send email
        const subject = type === 'forgot-password' 
            ? 'Password Reset Verification Code'
            : 'Your verification code';
        
        const html = type === 'forgot-password'
            ? `<p>Your password reset verification code is <strong>${otpCode}</strong>. It expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.</p>
               <p>If you did not request this, please ignore this email.</p>`
            : `<p>Your verification code is <strong>${otpCode}</strong>. It expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.</p>`;

        await sendMail(email, subject, html);

        return { message: 'OTP sent successfully' };
    } catch (error) {
        throw error;
    }
}

// Verify OTP
async function verifyOtpService(
    email: string,
    otp: string,
    type: 'register' | 'forgot-password' = 'register'
): Promise<{ message: string; verified: boolean }> {
    try {
        email = normalizeEmail(email);
        const record = await Otp.findOne({ email, type });

        if (!record) {
            throw new Error('OTP not found');
        }

        if (record.expiresAt < new Date()) {
            throw new Error('OTP expired');
        }

        if (record.otp !== otp) {
            throw new Error('Invalid OTP');
        }

        record.isVerified = true;
        await record.save();

        return { message: 'OTP verified successfully', verified: true };
    } catch (error) {
        throw error;
    }
}

// Check if OTP is verified (without marking as verified)
async function checkOtpVerifiedService(
    email: string,
    type: 'register' | 'forgot-password' = 'register'
): Promise<boolean> {
    try {
        email = normalizeEmail(email);
        const record = await Otp.findOne({ email, type });
        
        if (!record) {
            return false;
        }

        if (record.expiresAt < new Date()) {
            return false;
        }

        return record.isVerified;
    } catch (error) {
        throw error;
    }
}

// Delete OTP record (cleanup after use)
async function deleteOtpService(
    email: string,
    type: 'register' | 'forgot-password' = 'register'
): Promise<{ message: string }> {
    try {
        email = normalizeEmail(email);
        await Otp.deleteMany({ email, type });
        return { message: 'OTP deleted successfully' };
    } catch (error) {
        throw error;
    }
}

export {
    sendOtpService,
    verifyOtpService,
    checkOtpVerifiedService,
    deleteOtpService
};

