import { User } from "../models";
import { hashPassword, isMatch } from "../utils/hasher";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { sendOtpService, verifyOtpService, checkOtpVerifiedService, deleteOtpService } from "./otp.service";
import { verifyGoogleToken } from "../config/googleLogin";
import { RegisterData, LoginData, TokenResponse, ForgotPasswordData, ResetPasswordData, GoogleLoginData } from "../types/auth.type";
import mongoose from "mongoose";

//Register Service
async function registerService(data: RegisterData): Promise<TokenResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { username, email, password, otp } = data;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        }).session(session);

        if (existingUser) {
            throw new Error(
                existingUser.email === email 
                    ? 'Email already registered' 
                    : 'Username already taken'
            );
        }

        // Check verification: if otp provided, verify inline; else ensure an already-verified OTP exists
        if (otp) {
            // verify inline and mark record as verified
            await verifyOtpService(email, otp, 'register');
        } else {
            const isVerified = await checkOtpVerifiedService(email, 'register');
            if (!isVerified) {
                throw new Error('Email not verified');
            }
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            theme: 'light',
            language: 'en',
            currency: 'USD',
            avatarUrl: '',
        });

        await newUser.save({ session });

        await session.commitTransaction();

        // Optional: cleanup OTP record for this email+type (after transaction commit)
        // This is safe to do outside transaction as it's just cleanup
        try {
            await deleteOtpService(email, 'register');
        } catch (error) {
            // Ignore OTP cleanup errors as user is already created
            console.warn('Failed to cleanup OTP after registration:', error);
        }

        // Generate tokens (outside transaction as they don't need DB consistency)
        const accessToken = generateAccessToken({
            id: newUser._id.toString(),
            isGuest: false,
        });
        const refreshToken = generateRefreshToken({
            id: newUser._id.toString(),
            isGuest: false,
        });

        return {
            accessToken,
            refreshToken,
            user: {
                id: newUser._id.toString(),
                username: newUser.username,
                email: newUser.email,
                theme: newUser.theme,
                language: newUser.language,
                currency: newUser.currency,
                avatarUrl: newUser.avatarUrl,
            },
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

//Login Service
async function loginService(data: LoginData): Promise<TokenResponse> {
    try {
        const { email, password } = data;

        // Find user by email
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            throw new Error('Invalid email or password');
        }
        
        // If user is authenticated via Google, password should not be set
        if (user.googleId || !user.password) {
            throw new Error('Password is required for non-Google users');
        }

        // Compare password
        const isPasswordValid = await isMatch(password, user.password!);

        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        // Generate tokens
        const accessToken = generateAccessToken({
            id: user._id.toString(),
            isGuest: false,
        });
        const refreshToken = generateRefreshToken({
            id: user._id.toString(),
            isGuest: false,
        });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                theme: user.theme,
                language: user.language,
                currency: user.currency,
                avatarUrl: user.avatarUrl,
            },
        };
    } catch (error) {
        throw error;
    }
}

//Logout Service
async function logoutService(): Promise<{ message: string }> {
    try {
        // Logout logic can be implemented as:
        // 1. Invalidate refresh token in Redis/database
        // 2. Clear session data
        // 3. Return success message
        
        return {
            message: 'Logged out successfully',
        };
    } catch (error) {
        throw error;
    }
}

//Refresh Token Service
async function refreshTokenService(refreshToken: string): Promise<{ accessToken: string }> {
    try {
        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Find user
        const user = await User.findById(decoded.id);

        if (!user) {
            throw new Error('User not found');
        }

        // Generate new access token
        const newAccessToken = generateAccessToken({
            id: user._id.toString(),
            isGuest: false,
        });

        return {
            accessToken: newAccessToken,
        };
    } catch (error) {
        throw error;
    }
}

// Forgot Password Service - Send OTP
async function forgotPasswordService(data: ForgotPasswordData): Promise<{ message: string }> {
    try {
        const { email } = data;
        
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if user exists for security
            return { message: 'If the email exists, a password reset code has been sent' };
        }
        
        // Check if user has Google authentication (can't reset password)
        if (user.googleId) {
            throw new Error('Password reset not available for Google authenticated accounts');
        }
        
        // Send OTP for password reset
        await sendOtpService(email, 'forgot-password');
        
        return { message: 'Password reset code sent to your email' };
    } catch (error) {
        throw error;
    }
}

// Reset Password Service - Verify OTP and reset password
async function resetPasswordService(data: ResetPasswordData): Promise<{ message: string }> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { email, otp, newPassword } = data;
        
        // Check if user exists
        const user = await User.findOne({ email }).session(session);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Check if user has Google authentication
        if (user.googleId) {
            throw new Error('Password reset not available for Google authenticated accounts');
        }
        
        // Verify OTP
        await verifyOtpService(email, otp, 'forgot-password');
        
        // Hash new password
        const hashedPassword = await hashPassword(newPassword);
        
        // Update password
        user.password = hashedPassword;
        await user.save({ session });
        
        await session.commitTransaction();
        
        // Cleanup OTP (after transaction commit)
        // This is safe to do outside transaction as it's just cleanup
        try {
            await deleteOtpService(email, 'forgot-password');
        } catch (error) {
            // Ignore OTP cleanup errors as password is already reset
            console.warn('Failed to cleanup OTP after password reset:', error);
        }
        return { message: 'Password reset successfully' };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

// Login with Google Service
async function loginWithGoogleService(data: GoogleLoginData): Promise<TokenResponse> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { idToken } = data;

        if (!idToken) {
            throw new Error('Google ID token is required');
        }

        // Verify Google token
        const googleUser = await verifyGoogleToken(idToken);

        if (!googleUser.email) {
            throw new Error('Email not found in Google account');
        }

        // Type assertion: email is guaranteed to be string after check above
        const userEmail: string = googleUser.email!;

        // Check if user already exists by email or googleId
        let user = await User.findOne({
            $or: [
                { email: userEmail },
                { googleId: googleUser.sub }
            ]
        }).session(session);

        if (user) {
            // User exists - update googleId if not set
            if (!user.googleId) {
                user.googleId = googleUser.sub;
            }
            
            // Update avatar if available and not set
            if (googleUser.picture && !user.avatarUrl) {
                user.avatarUrl = googleUser.picture;
            }
            
            // Update username if not set (use name from Google)
            if (!user.username && googleUser.name) {
                // Generate username from email or name
                const baseUsername = googleUser.name.toLowerCase().replace(/\s+/g, '_');
                let username: string = baseUsername;
                let counter = 1;
                
                // Ensure username is unique
                let existingUserWithUsername = await User.findOne({ username, _id: { $ne: user._id } }).session(session);
                while (existingUserWithUsername) {
                    username = `${baseUsername}${counter}`;
                    counter++;
                    existingUserWithUsername = await User.findOne({ username, _id: { $ne: user._id } }).session(session);
                }
                
                user.username = username;
            }
            
            await user.save({ session });
        } else {
            // New user - create account
            // Generate unique username from email or name
            const nameValue: string | undefined = googleUser.name;
            let baseUsername: string;
            if (nameValue && typeof nameValue === 'string' && nameValue.trim().length > 0) {
                baseUsername = nameValue.toLowerCase().replace(/\s+/g, '_');
            } else {
                const emailParts = userEmail.split('@');
                baseUsername = emailParts[0] || userEmail;
            }
            
            let username: string = baseUsername;
            let counter = 1;
            
            // Ensure username is unique
            let existingUser = await User.findOne({ username }).session(session);
            while (existingUser) {
                username = `${baseUsername}${counter}`;
                counter++;
                existingUser = await User.findOne({ username }).session(session);
            }

            user = new User({
                username,
                email: userEmail,
                googleId: googleUser.sub,
                password: undefined, // No password for Google users
                theme: 'light',
                language: 'en',
                currency: 'USD',
                avatarUrl: googleUser.picture || '',
            });

            await user.save({ session });
        }

        await session.commitTransaction();

        // Generate tokens
        const accessToken = generateAccessToken({
            id: user._id.toString(),
            isGuest: false,
        });
        const refreshToken = generateRefreshToken({
            id: user._id.toString(),
            isGuest: false,
        });

        return {
            accessToken,
            refreshToken,
            user: {
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                theme: user.theme,
                language: user.language,
                currency: user.currency,
                avatarUrl: user.avatarUrl,
            },
        };
    } catch (error: any) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

export { 
    registerService, 
    loginService, 
    logoutService, 
    refreshTokenService,
    forgotPasswordService,
    resetPasswordService,
    loginWithGoogleService,
};