# Swagger JSDoc Template cho các Controllers còn lại

File này chứa template để thêm JSDoc comments cho các controllers còn lại.

## Template cho GET List với Pagination

```typescript
/**
 * @swagger
 * /api/{resource}:
 *   get:
 *     summary: Get list of {resource}
 *     tags: [{Tag}]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of {resource}
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
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/{Schema}'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
```

## Template cho GET by ID

```typescript
/**
 * @swagger
 * /api/{resource}/{id}:
 *   get:
 *     summary: Get {resource} by ID
 *     tags: [{Tag}]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: {Resource} details
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
 *                   $ref: '#/components/schemas/{Schema}'
 */
```

## Template cho POST (Create)

```typescript
/**
 * @swagger
 * /api/{resource}:
 *   post:
 *     summary: Create a new {resource}
 *     tags: [{Tag}]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Create{Schema}Request'
 *     responses:
 *       201:
 *         description: {Resource} created successfully
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
 *                   $ref: '#/components/schemas/{Schema}'
 */
```

## Template cho PUT (Update)

```typescript
/**
 * @swagger
 * /api/{resource}/{id}:
 *   put:
 *     summary: Update {resource}
 *     tags: [{Tag}]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Update{Schema}Request'
 *     responses:
 *       200:
 *         description: {Resource} updated successfully
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
 *                   $ref: '#/components/schemas/{Schema}'
 */
```

## Template cho DELETE

```typescript
/**
 * @swagger
 * /api/{resource}/{id}:
 *   delete:
 *     summary: Delete {resource}
 *     tags: [{Tag}]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: {Resource} deleted successfully
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
 *                   type: object
 *                   nullable: true
 */
```

## Các Controllers cần thêm JSDoc

1. ✅ Auth Controller - Đã hoàn thành
2. ✅ Wallet Controller - Đã hoàn thành
3. ⏳ Transaction Controller
4. ⏳ Category Controller
5. ⏳ Goal Controller
6. ⏳ Budget Controller
7. ⏳ Currency Controller
8. ⏳ Notification Controller
9. ⏳ Tutorial Controller
10. ⏳ Exchange Rate Controller
11. ⏳ OTP Controller
12. ⏳ User Controller

## Lưu ý

- Tất cả schemas đã được định nghĩa trong `swagger.ts`
- Sử dụng `$ref` để reference schemas đã định nghĩa
- Thêm `security` cho các protected routes
- Thêm `parameters` cho query params và path params

