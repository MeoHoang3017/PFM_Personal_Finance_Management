import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import dotenv from "dotenv";
import { securityLogger } from "../utils/security-logger";

dotenv.config();

/**
 * CORS Configuration
 * Lấy frontend URL từ environment variable
 */
export const corsOptions: cors.CorsOptions = {
  // origin: (origin, callback) => {
  //   const allowedOrigins = process.env.CLIENT_URL 
  //     ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  //     : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:57536']; // Fallback cho development

  //   // Cho phép requests không có origin (mobile apps, Postman, etc.) trong development
  //   if (!origin && process.env.NODE_ENV === 'development') {
  //     return callback(null, true);
  //   }

  //   if (!origin || allowedOrigins.includes(origin)) {
  //     callback(null, true);
  //   } else {
  //     callback(new Error('Not allowed by CORS'));
  //   }
  // },
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
};

/**
 * General Rate Limiter
 * Áp dụng cho tất cả API routes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 200, // Giới hạn 200 requests per IP trong 15 phút
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    securityLogger.logRateLimitExceeded(ip, req.path || 'unknown', 100);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});

/**
 * Auth Rate Limiter
 * Áp dụng cho authentication endpoints (login, register)
 * Stricter hơn general limiter
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Chỉ cho phép 5 requests per IP trong 15 phút
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Không đếm các requests thành công
  handler: (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    securityLogger.logRateLimitExceeded(ip, req.path || 'unknown', 5);
    securityLogger.logSuspiciousActivity(undefined, 'Rate limit exceeded on auth endpoint', { path: req.path }, ip);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again after 15 minutes.',
    });
  },
});

/**
 * User Lookup Rate Limiter
 * Áp dụng cho email/username lookup endpoints để tránh enumeration attacks
 */
export const userLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 200, // Giới hạn 200 requests per IP trong 15 phút
  message: {
    success: false,
    message: 'Too many lookup requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    securityLogger.logRateLimitExceeded(ip, req.path || 'unknown', 20);
    securityLogger.logSuspiciousActivity(undefined, 'Possible enumeration attack', { path: req.path }, ip);
    res.status(429).json({
      success: false,
      message: 'Too many lookup requests, please try again later.',
    });
  },
});

/**
 * Exchange Rate Update Rate Limiter
 * Giới hạn gọi API cập nhật tỷ giá để tránh lạm dụng và hạn chế gọi API ngoài
 */
export const exchangeRateUpdateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 1, // 1 request / 5 phút / IP
  message: {
    success: false,
    message: 'Exchange rate update is limited to once per 5 minutes. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    securityLogger.logRateLimitExceeded(ip, req.path || 'unknown', 1);
    res.status(429).json({
      success: false,
      message: 'Exchange rate update is limited to once per 5 minutes. Please try again later.',
    });
  },
});

/**
 * Helmet Configuration
 * Security headers cho Express app
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"], // + Google GIS stylesheet (trang /auth/google/desktop)
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com"], // + Google Identity Services (trang /auth/google/desktop)
      scriptSrcElem: ["'self'", "'unsafe-inline'", "https://accounts.google.com"], // inline script trang desktop + script GIS
      frameSrc: ["https://accounts.google.com"], // iframe Google Sign-In
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  // GIS có thể sử dụng popup/iframe và postMessage.
  // Một số cấu hình COOP/COEP mặc định của helmet có thể làm transform/popup layer bị null.
  // Nới các header này để tránh chặn luồng đăng nhập.
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

