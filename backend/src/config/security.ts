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
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CLIENT_URL 
      ? process.env.CLIENT_URL.split(',').map(url => url.trim())
      : ['http://localhost:3000', 'http://localhost:5173']; // Fallback cho development

    // Cho phép requests không có origin (mobile apps, Postman, etc.) trong development
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
 * Helmet Configuration
 * Security headers cho Express app
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Cho phép inline styles cho Swagger UI
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Cho phép Swagger UI scripts
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Tắt để tương thích với Swagger UI
});

