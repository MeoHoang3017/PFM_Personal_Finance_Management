# Backend – Frontend Connection Report (PFM)

## 1. Base URL & API prefix

| | Backend | Frontend |
|---|--------|----------|
| **Base URL** | `http://localhost:5000` (from `server.ts`, `PORT`) | `AppConstants.defaultApiBaseUrl = 'http://localhost:5000'` |
| **API prefix** | Routes mounted at `/api` (`app.use("/api", apiRoutes)`) | `AppConstants.apiPrefix = '/api'` → Dio `baseUrl = base + '/api'` |
| **Full base** | `http://localhost:5000/api` | `http://localhost:5000/api` |

Kết nối: **Đúng** – Frontend gọi đúng host và prefix `/api`.

---

## 2. Response format

| | Backend | Frontend |
|---|--------|----------|
| **Structure** | `sendResponse(res, BaseResponse)` → `res.status(code).json({ code, message, result?, error? })` | `ApiResponse.fromJson(data)` expects `code`, `message`, `result`, `error` |
| **Success** | `code` 200/201, `result` = data | `isSuccess = code >= 200 && code < 300` |

Kết nối: **Đúng** – Cùng chuẩn `{ code, message, result?, error? }`.

---

## 3. Authentication

| | Backend | Frontend |
|---|--------|----------|
| **Header** | `Authorization: Bearer <accessToken>` (auth middleware) | Dio interceptor: đọc `access_token` từ FlutterSecureStorage, gửi `Authorization: Bearer $token` |
| **Refresh** | `POST /api/auth/refresh-token` body `{ refreshToken }` | On 401: gọi `auth.refreshToken()`, retry request; skip refresh cho login/register/refresh |
| **Token storage** | N/A (stateless JWT) | `access_token`, `refresh_token`, `user` trong FlutterSecureStorage |

Kết nối: **Đúng** – Header và refresh flow khớp backend.

---

## 4. Endpoint mapping

### 4.1 Health

| Frontend | Backend | Status |
|----------|---------|--------|
| `GET /health` | `GET /api/health` → `{ ok: true, message: "API is running" }` | ✅ |

---

### 4.2 Auth

| Frontend | Backend | Status |
|----------|---------|--------|
| `POST /auth/login` body `{ email, password }` | `POST /api/auth/login` | ✅ |
| `POST /auth/register` body `{ username, email, password, otp? }` | `POST /api/auth/register` | ✅ |
| `POST /auth/logout` | `POST /api/auth/logout` (protected) | ✅ |
| `POST /auth/refresh-token` body `{ refreshToken }` | `POST /api/auth/refresh-token` | ✅ |
| `POST /auth/reset-password` body `{ email, otp, newPassword }` | `POST /api/auth/reset-password` | ✅ |

Login/Register response: backend trả `result: { accessToken, refreshToken, user: { id, username, email, theme, language, currency, avatarUrl } }`. Frontend `TokenResponse` / `UserInfo` parse đúng.

---

### 4.3 OTP (used by Auth flow)

| Frontend | Backend | Status |
|----------|---------|--------|
| `POST /otp/send-forgot-password-otp` body `{ email }` | `POST /api/otp/send-forgot-password-otp` | ✅ |

Ghi chú: Backend còn `POST /auth/forgot-password`; frontend dùng đúng endpoint OTP như design.

---

### 4.4 Users

| Frontend | Backend | Status |
|----------|---------|--------|
| `GET /users/profile` | `GET /api/users/profile` | ✅ |
| `PUT /users/profile` | `PUT /api/users/profile` | ✅ |
| `PUT /users/settings` | `PUT /api/users/settings` | ✅ |
| `PUT /users/change-password` | `PUT /api/users/change-password` | ✅ |
| `DELETE /users/profile` | `DELETE /api/users/profile` | ✅ |

---

### 4.5 Wallets

| Frontend | Backend | Status |
|----------|---------|--------|
| `GET /wallets?page&pageSize` | `GET /api/wallets` | ✅ |
| `GET /wallets/:id` | `GET /api/wallets/:id` | ✅ |
| `POST /wallets` | `POST /api/wallets` | ✅ |
| `PUT /wallets/:id` | `PUT /api/wallets/:id` | ✅ |
| `DELETE /wallets/:id` | `DELETE /api/wallets/:id` | ✅ |

---

### 4.6 Transactions

| Frontend | Backend | Status |
|----------|---------|--------|
| `GET /transactions?page&pageSize&type&wallet&category` | `GET /api/transactions` (query tương ứng) | ✅ |
| `GET /transactions/:id` | `GET /api/transactions/:id` | ✅ |
| `POST /transactions` | `POST /api/transactions` | ✅ |
| `PUT /transactions/:id` | `PUT /api/transactions/:id` | ✅ |
| `DELETE /transactions/:id` | `DELETE /api/transactions/:id` | ✅ |
| `POST /transactions/:id/duplicate` | `POST /api/transactions/:id/duplicate` | ✅ |

Paginated response: backend trả `result: { data: [...], pagination: { page, pageSize, totalItems, totalPages } }`. Frontend `PaginatedTransactionsResponse` khớp.

---

### 4.7 Categories

| Frontend | Backend | Status |
|----------|---------|--------|
| `GET /categories` | `GET /api/categories` (optional auth) | ✅ |
| `GET /categories/user/list` | `GET /api/categories/user/list` | ✅ |
| `POST /categories` | `POST /api/categories` | ✅ |
| `PUT /categories/:id` | `PUT /api/categories/:id` | ✅ |
| `DELETE /categories/:id` | `DELETE /api/categories/:id` | ✅ |

Frontend xử lý cả `result` là mảng và `result.data` là mảng.

---

### 4.8 Goals

| Frontend | Backend | Status |
|----------|---------|--------|
| `GET /goals?page&pageSize` | `GET /api/goals` | ✅ |
| `GET /goals/:id` | `GET /api/goals/:id` | ✅ |
| `POST /goals` | `POST /api/goals` | ✅ |
| `PUT /goals/:id` | `PUT /api/goals/:id` | ✅ |
| `DELETE /goals/:id` | `DELETE /api/goals/:id` | ✅ |

---

### 4.9 Budgets

| Frontend | Backend | Status |
|----------|---------|--------|
| `GET /budgets?page&pageSize&category&period&isActive` | `GET /api/budgets` | ✅ |
| `GET /budgets/:id` | `GET /api/budgets/:id` | ✅ |
| `POST /budgets` | `POST /api/budgets` | ✅ |
| `PUT /budgets/:id` | `PUT /api/budgets/:id` | ✅ |
| `DELETE /budgets/:id` | `DELETE /api/budgets/:id` | ✅ |

Paginated: backend `result: { data, pagination }`, frontend `PaginatedBudgetsResponse` khớp.

---

## 5. Backend có, Frontend chưa gọi

Các module sau có API trên backend nhưng **chưa có service tương ứng** trên frontend (Flutter):

- **Notifications**: `GET/POST/PUT/DELETE /api/notifications`, unread count, read-all, v.v.
- **Tutorial**: `GET/PUT /api/tutorial`, complete step, complete, reset.
- **Currencies**: `GET /api/currencies`, by id/code.
- **Exchange rates**: `GET /api/exchange-rates/rate`, `POST /api/exchange-rates/convert`, update.

Đây là tính năng chưa triển khai phía app, không phải lỗi kết nối.

---

## 6. Điểm cần lưu ý

1. **Register status code**: Backend trả `201` (REGISTER_SUCCESS). Frontend coi `code >= 200 && code < 300` là success → vẫn đúng.
2. **Category list**: Backend có thể trả `result` là mảng trực tiếp; frontend đã xử lý cả `result` là List và `result['data']`.
3. **Port**: Backend mặc định `5000` (`server.ts`), `AppConstants` cũng `5000`. Cần đảm bảo khi chạy thật (emulator/device) dùng đúng base URL (ví dụ `10.0.2.2:5000` cho Android emulator).

---

## 7. Kết luận

- **Base URL, prefix, format response, auth header và refresh**: Khớp giữa backend và frontend.
- **Các module đang dùng (auth, otp, users, wallets, transactions, categories, goals, budgets)**: Endpoint và cách parse response đều tương thích.
- **Notifications, Tutorial, Currencies, Exchange rates**: Chỉ có ở backend; frontend chưa gọi, có thể bổ sung sau.

Tổng thể **logic kết nối backend – frontend cho các tính năng hiện có là đúng và nhất quán**.
