export interface RegisterData {
    username: string;
    email: string;
    password: string;
    // Optional OTP when registering inline
    otp?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        username: string;
        email: string;
        theme: string;
        language: string;
        currency: string;
        avatarUrl: string;
    };
}

export interface ForgotPasswordData {
    email: string;
}

export interface ResetPasswordData {
    email: string;
    otp: string;
    newPassword: string;
}

export interface GoogleLoginData {
    idToken: string;
}