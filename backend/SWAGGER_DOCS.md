# Swagger Documentation Guide

File này chứa hướng dẫn về Swagger documentation đã được tạo cho PFM API.

## Đã hoàn thành

1. ✅ Swagger config với đầy đủ schemas
2. ✅ Auth controllers với JSDoc comments

## Cần thêm JSDoc cho các controllers còn lại

Do số lượng controllers lớn, bạn có thể thêm JSDoc comments theo format sau:

```typescript
/**
 * @swagger
 * /api/{endpoint}:
 *   {method}:
 *     summary: Description
 *     tags: [TagName]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SchemaName'
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 result:
 *                   $ref: '#/components/schemas/ResponseSchema'
 */
```

## Các schemas đã được định nghĩa

Tất cả schemas đã được định nghĩa trong `swagger.ts`:
- BaseResponse, Pagination
- Auth: RegisterRequest, LoginRequest, GoogleLoginRequest, TokenResponse, etc.
- User, Wallet, Transaction, Category, Goal, Budget
- Currency, Notification, Tutorial, ExchangeRate
- OTP: SendOTPRequest, VerifyOTPRequest

## Truy cập Swagger UI

Sau khi server chạy, truy cập:
- Swagger UI: `http://localhost:5000/api-docs`
- Swagger JSON: `http://localhost:5000/api-docs.json`

