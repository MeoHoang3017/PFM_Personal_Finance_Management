import { Request, Response, NextFunction } from "express";
import { registerService, loginService, logoutService, refreshTokenService, forgotPasswordService, resetPasswordService, loginWithGoogleService } from "../services/auth.service";
import { sendOtpService } from "../services/otp.service";
import { SuccessResponse, ErrorResponse } from "../constants/Response";
import { sendResponse } from "../utils/response";
import { createError } from "../middleware/error.middleware";

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Registration successful
 *                 result:
 *                   $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username, email, password, otp } = req.body;

        if (!username || !email || !password) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['username', 'email', 'password']));
            return;
        }

        const result = await registerService({ username, email, password, otp });
        sendResponse(res, SuccessResponse.REGISTER_SUCCESS(result));
    } catch (error: any) {
        next(createError(error.message || 'Registration failed', 400));
    }
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: Access and refresh tokens as httpOnly cookies
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 result:
 *                   $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['email', 'password']));
            return;
        }

        const result = await loginService({ email, password });
        
        // Set cookies for Flutter (if using cookie-based auth)
        res.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        sendResponse(res, SuccessResponse.LOGIN_SUCCESS(result));
    } catch (error: any) {
        next(createError(error.message || 'Login failed', 400));
    }
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *                 result:
 *                   type: object
 *                   nullable: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await logoutService();
        
        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        
        sendResponse(res, SuccessResponse.LOGOUT_SUCCESS());
    } catch (error: any) {
        next(createError(error.message || 'Logout failed', 500));
    }
};

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *                 result:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

        if (!refreshToken) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['refreshToken']));
            return;
        }

        const result = await refreshTokenService(refreshToken);
        
        // Update access token cookie
        res.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        sendResponse(res, SuccessResponse.CUSTOM(200, 'Token refreshed successfully', result));
    } catch (error: any) {
        next(createError(error.message || 'Token refresh failed', 401));
    }
};

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send password reset OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Password reset code sent to your email
 *                 result:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email } = req.body;

        if (!email) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['email']));
            return;
        }

        const result = await forgotPasswordService({ email });
        sendResponse(res, SuccessResponse.CUSTOM(200, result.message, null));
    } catch (error: any) {
        next(createError(error.message || 'Failed to send password reset code', 400));
    }
};

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Password reset successfully
 *                 result:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['email', 'otp', 'newPassword']));
            return;
        }

        const result = await resetPasswordService({ email, otp, newPassword });
        sendResponse(res, SuccessResponse.CUSTOM(200, result.message, null));
    } catch (error: any) {
        next(createError(error.message || 'Password reset failed', 400));
    }
};

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Login with Google
 *     tags: [Auth]
 *     description: Authenticate user using Google ID token from Flutter app
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleLoginRequest'
 *     responses:
 *       200:
 *         description: Google login successful
 *         headers:
 *           Set-Cookie:
 *             description: Access and refresh tokens as httpOnly cookies
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 result:
 *                   $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const loginWithGoogle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            sendResponse(res, ErrorResponse.MISSING_FIELDS(['idToken']));
            return;
        }

        const result = await loginWithGoogleService({ idToken });
        
        // Set cookies for Flutter (if using cookie-based auth)
        res.cookie('accessToken', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        sendResponse(res, SuccessResponse.LOGIN_SUCCESS(result));
    } catch (error: any) {
        console.error('[Google Login] Request failed:', error?.message ?? String(error));
        if (error?.stack) console.error('[Google Login] Stack:', error.stack);
        next(createError(error.message || 'Google login failed', 400));
    }
};

/**
 * GET /api/auth/google/desktop?redirect_uri=http://localhost:8765/callback
 * Trả về trang HTML dùng Google Identity Services (GIS) để đăng nhập.
 * Dùng cho app Windows/Linux: mở trình duyệt → đăng nhập Google → redirect về localhost với id_token.
 * Chỉ chấp nhận redirect_uri là http://localhost:* hoặc http://127.0.0.1:*
 */
export const getGoogleDesktopPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const redirectUri = (req.query.redirect_uri as string)?.trim();
        if (!redirectUri) {
            res.status(400).send('Missing redirect_uri');
            return;
        }
        try {
            const u = new URL(redirectUri);
            const allowed = (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1'));
            if (!allowed) {
                res.status(400).send('redirect_uri must be http://localhost or http://127.0.0.1');
                return;
            }
        } catch {
            res.status(400).send('Invalid redirect_uri');
            return;
        }

        const clientId = process.env.GOOGLE_WEB_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            res.status(500).send('Google Client ID not configured');
            return;
        }

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Đăng nhập Google</title>
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    h1 { margin-bottom: 24px; }
    #button { margin: 16px 0; min-height: 50px; width: 240px; }
    .msg { margin-top: 16px; color: #666; font-size: 14px; max-width: 420px; text-align: center; }
    .hint { font-size: 12px; color: #888; margin-top: 8px; }
  </style>
</head>
<body>
  <h1>Đăng nhập Google</h1>
  <p class="msg">Dùng tài khoản Google để đăng nhập vào ứng dụng.</p>
  <p class="msg hint" id="originHint" style="background:#f5f5f5;padding:8px 12px;border-radius:8px;word-break:break-all;"></p>
  <div id="button"></div>
  <p class="msg" id="status">Đang tải Google Sign-In...</p>
  <p class="msg hint" id="hint"></p>
  <script>
    (function() {
      var origin = window.location.origin;
      var clientIdPrefix = ${JSON.stringify(clientId ? clientId.substring(0, 45) + '...' : '')};
      var el = document.getElementById('originHint');
      if (el) el.innerHTML = 'Origin: <strong>' + origin + '</strong><br>Client ID (backend): <strong>' + clientIdPrefix + '</strong><br>Trong Console, OAuth 2.0 Web client phải có Client ID trùng đầu này và Authorized JavaScript origins có đúng origin trên.';
    })();
    const redirectUri = ${JSON.stringify(redirectUri)};
    const clientId = ${JSON.stringify(clientId)};
    function handleCredentialResponse(response) {
      document.getElementById('status').textContent = 'Đang chuyển hướng...';
      const sep = redirectUri.indexOf('?') >= 0 ? '&' : '?';
      window.location.href = redirectUri + sep + 'id_token=' + encodeURIComponent(response.credential);
    }
    function initGoogleSignIn() {
      if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
        return false;
      }
      var btnEl = document.getElementById('button');
      if (!btnEl) return false;
      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false
        });
        requestAnimationFrame(function() {
          try {
            if (btnEl && btnEl.parentNode) {
              google.accounts.id.renderButton(btnEl, {
                type: 'standard',
                size: 'large',
                text: 'signin_with',
                theme: 'outline'
              });
              var st = document.getElementById('status');
              if (st) st.textContent = '';
            }
          } catch (e) {
            console.warn('renderButton:', e);
            if (document.getElementById('status')) document.getElementById('status').textContent = 'Không thể tải nút Google. Thử tải lại trang.';
          }
        });
        return true;
      } catch (e) {
        console.warn('initGoogleSignIn:', e);
        return false;
      }
    }
    var attempts = 0;
    var maxAttempts = 50;
    function waitForGoogle() {
      if (initGoogleSignIn()) return;
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(waitForGoogle, 200);
      } else {
        document.getElementById('status').textContent = 'Không tải được Google Sign-In. Kiểm tra kết nối.';
        document.getElementById('hint').innerHTML = 'Cấu hình Google Cloud Console: Credentials &rarr; OAuth 2.0 Web client &rarr; Authorized JavaScript origins, thêm <strong>http://localhost:5000</strong> (và cổng backend nếu khác).';
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { setTimeout(waitForGoogle, 100); });
    } else {
      setTimeout(waitForGoogle, 100);
    }
  </script>
</body>
</html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error: any) {
        next(createError(error.message || 'Failed to serve Google desktop page', 500));
    }
};

