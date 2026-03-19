import { User, Wallet } from "../models";
import { hashPassword, isMatch } from "../utils/hasher";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { sendOtpService, verifyOtpService, checkOtpVerifiedService, deleteOtpService } from "./otp.service";
import { verifyGoogleToken } from "../config/googleLogin";
import { RegisterData, LoginData, TokenResponse, ForgotPasswordData, ResetPasswordData, GoogleLoginData } from "../types/auth.type";

//Register Service (no transaction - compatible with standalone MongoDB)
async function registerService(data: RegisterData): Promise<TokenResponse> {
    const { username, email, password, otp } = data;

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        throw new Error(
            existingUser.email === email
                ? 'Email already registered'
                : 'Username already taken'
        );
    }

    // Check verification: if otp provided, verify inline; else ensure an already-verified OTP exists
    if (otp) {
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

    await newUser.save();

    // Tạo ví mặc định cho tài khoản mới
    const defaultWallet = new Wallet({
        name: 'Ví mặc định',
        balance: 0,
        user: newUser._id,
    });
    await defaultWallet.save();

    // Cleanup OTP record for this email+type
    try {
        await deleteOtpService(email, 'register');
    } catch (error) {
        console.warn('Failed to cleanup OTP after registration:', error);
    }

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

// Reset Password Service - Verify OTP and reset password (no transaction - standalone MongoDB)
async function resetPasswordService(data: ResetPasswordData): Promise<{ message: string }> {
    const { email, otp, newPassword } = data;

    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('User not found');
    }

    if (user.googleId) {
        throw new Error('Password reset not available for Google authenticated accounts');
    }

    await verifyOtpService(email, otp, 'forgot-password');

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    try {
        await deleteOtpService(email, 'forgot-password');
    } catch (error) {
        console.warn('Failed to cleanup OTP after password reset:', error);
    }
    return { message: 'Password reset successfully' };
}

// Login with Google Service (no transaction - standalone MongoDB)
async function loginWithGoogleService(data: GoogleLoginData): Promise<TokenResponse> {
    const { idToken } = data;

    if (!idToken) {
        console.error('[Google Login Service] Missing idToken in request body');
        throw new Error('Google ID token is required');
    }

    let googleUser;
    try {
        googleUser = await verifyGoogleToken(idToken);
    } catch (err: any) {
        console.error('[Google Login Service] verifyGoogleToken failed:', err?.message ?? err);
        throw err;
    }

    if (!googleUser.email) {
        console.error('[Google Login Service] Google account has no email. sub=', googleUser?.sub);
        throw new Error('Email not found in Google account');
    }

    const userEmail: string = googleUser.email!;

    let user = await User.findOne({
        $or: [
            { email: userEmail },
            { googleId: googleUser.sub }
        ]
    });

    if (user) {
        if (!user.googleId) {
            user.googleId = googleUser.sub;
        }
        if (googleUser.picture && !user.avatarUrl) {
            user.avatarUrl = googleUser.picture;
        }
        if (!user.username && googleUser.name) {
            const baseUsername = googleUser.name.toLowerCase().replace(/\s+/g, '_');
            let username: string = baseUsername;
            let counter = 1;
            let existingUserWithUsername = await User.findOne({ username, _id: { $ne: user._id } });
            while (existingUserWithUsername) {
                username = `${baseUsername}${counter}`;
                counter++;
                existingUserWithUsername = await User.findOne({ username, _id: { $ne: user._id } });
            }
            user.username = username;
        }
        await user.save();
    } else {
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
        let existingUser = await User.findOne({ username });
        while (existingUser) {
            username = `${baseUsername}${counter}`;
            counter++;
            existingUser = await User.findOne({ username });
        }

        user = new User({
            username,
            email: userEmail,
            googleId: googleUser.sub,
            password: undefined,
            theme: 'light',
            language: 'en',
            currency: 'USD',
            avatarUrl: googleUser.picture || '',
        });

        await user.save();

        // Tạo ví mặc định cho user đăng ký qua Google
        const defaultWallet = new Wallet({
            name: 'Ví mặc định',
            balance: 0,
            user: user._id,
        });
        await defaultWallet.save();
    }

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