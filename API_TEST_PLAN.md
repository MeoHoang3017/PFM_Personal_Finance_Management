# PFM Personal Finance Management – API Test Plan

## Overview

This document provides a manual test plan for all REST APIs in the PFM backend. Use it with tools like **Postman**, **Thunder Client**, **curl**, or the built-in **Swagger UI**.

| Item | Value |
|------|-------|
| **Base URL** | `http://localhost:5000` |
| **API Prefix** | `/api` |
| **Swagger UI** | `http://localhost:5000/api-docs` |
| **Auth** | Cookie `accessToken` or `Authorization: Bearer <JWT>` |

---

## Prerequisites

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Ensure services are running** (as per `.env.example`):
   - MongoDB
   - Redis (if used)
   - SMTP (for OTP emails)
   - Exchange rate service (optional)

3. **Environment variables**  
   Copy `.env.example` to `.env` and configure values.

---

## Authentication Flow for Manual Testing

Most endpoints require a valid JWT. Use this flow:

1. **Register** → `POST /api/auth/register` (or use existing account)
2. **Login** → `POST /api/auth/login`
3. Use the returned `accessToken`:
   - As Bearer token: `Authorization: Bearer <accessToken>`
   - Or rely on `Set-Cookie` if testing in browser/Swagger

---

## 1. Auth API (`/api/auth`)

### 1.1 POST `/api/auth/register`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid registration | `{ "username": "testuser", "email": "test@example.com", "password": "password123" }` | 200/201, TokenResponse | May require OTP first |
| Missing required field | `{ "username": "test", "email": "test@example.com" }` | 400 | No password |
| Invalid email format | `{ "username": "test", "email": "invalid", "password": "pass123" }` | 400 | Validation error |
| Password too short | `{ "username": "test", "email": "t@x.com", "password": "123" }` | 400 | minLength: 6 |
| Duplicate email | Same email as existing user | 400/409 | User already exists |

### 1.2 POST `/api/auth/login`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid login | `{ "email": "test@example.com", "password": "password123" }` | 200, TokenResponse, Set-Cookie | Use returned token |
| Wrong password | `{ "email": "test@example.com", "password": "wrongpass" }` | 401 | Invalid credentials |
| Non-existent email | `{ "email": "nonexistent@example.com", "password": "pass123" }` | 401 | User not found |
| Missing fields | `{ "email": "test@example.com" }` | 400 | Validation error |

### 1.3 POST `/api/auth/google`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid idToken | `{ "idToken": "<valid-google-id-token>" }` | 200, TokenResponse | Needs real Google OAuth flow |
| Invalid idToken | `{ "idToken": "invalid" }` | 401 | Invalid token |
| Missing idToken | `{}` | 400 | Validation error |

### 1.4 POST `/api/auth/logout`

| Test Case | Auth | Expected | Notes |
|-----------|------|----------|-------|
| With valid JWT | Bearer token or cookie | 200, BaseResponse | Logs out |
| Without JWT | None | 401 | Unauthorized |

### 1.5 POST `/api/auth/refresh-token`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid refresh token | `{ "refreshToken": "<valid-refresh-token>" }` | 200, `{ accessToken }` | From login response |
| Invalid refresh token | `{ "refreshToken": "invalid" }` | 401 | Token invalid |

### 1.6 POST `/api/auth/forgot-password`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid email | `{ "email": "test@example.com" }` | 200, BaseResponse | OTP sent to email |
| Invalid email | `{ "email": "invalid" }` | 400 | Validation error |
| Non-existent email | `{ "email": "notfound@example.com" }` | 200 or 404 | Behavior may vary |

### 1.7 POST `/api/auth/reset-password`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid OTP and new password | `{ "email": "test@example.com", "otp": "123456", "newPassword": "newpass123" }` | 200, BaseResponse | Must use OTP from forgot-password |
| Invalid OTP | `{ "email": "t@x.com", "otp": "000000", "newPassword": "newpass123" }` | 400/401 | OTP mismatch |
| Password too short | `{ "email": "t@x.com", "otp": "123456", "newPassword": "123" }` | 400 | minLength: 6 |

---

## 2. OTP API (`/api/otp`)

### 2.1 POST `/api/otp/send-register-otp`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid email | `{ "email": "newuser@example.com" }` | 200 | OTP sent (check email/logs) |
| Invalid email | `{ "email": "invalid" }` | 400 | Validation error |

### 2.2 POST `/api/otp/send-forgot-password-otp`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid email | `{ "email": "test@example.com" }` | 200 | OTP sent |
| Invalid email | `{ "email": "invalid" }` | 400 | Validation error |

### 2.3 POST `/api/otp/verify`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid OTP | `{ "email": "test@example.com", "otp": "123456", "purpose": "register" }` | 200, `{ verified: true }` | Purpose: register | forgot-password |
| Invalid OTP | `{ "email": "t@x.com", "otp": "000000", "purpose": "register" }` | 200, `{ verified: false }` | - |

---

## 3. Users API (`/api/users`) – **JWT required**

### 3.1 GET `/api/users/profile`

| Test Case | Auth | Expected | Notes |
|-----------|------|----------|-------|
| With valid JWT | Bearer token | 200, User object | Current user profile |
| Without JWT | None | 401 | Unauthorized |
| Invalid/expired JWT | Invalid token | 401/403 | - |

### 3.2 PUT `/api/users/profile`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Update username | `{ "username": "newname" }` | 200, User | Partial update |
| Update avatar | `{ "avatarUrl": "https://..." }` | 200, User | - |
| Empty body | `{}` | 200 | No changes |

### 3.3 DELETE `/api/users/profile`

| Test Case | Auth | Expected | Notes |
|-----------|------|----------|-------|
| With valid JWT | Bearer token | 200, BaseResponse | Account deleted |

### 3.4 PUT `/api/users/settings`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid settings | `{ "currency": "USD", "language": "en", ... }` | 200, User | Check schema for full structure |

### 3.5 PUT `/api/users/change-password`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid change | `{ "currentPassword": "oldpass", "newPassword": "newpass123" }` | 200 | - |
| Wrong current password | `{ "currentPassword": "wrong", "newPassword": "newpass123" }` | 401 | - |
| New password too short | `{ "currentPassword": "oldpass", "newPassword": "123" }` | 400 | - |

### 3.6 GET `/api/users/list`

| Test Case | Query Params | Expected | Notes |
|-----------|--------------|----------|-------|
| Default pagination | - | 200, User[], pagination | - |
| Custom page | `?page=2&pageSize=20` | 200, User[], pagination | - |

### 3.7 GET `/api/users/search`

| Test Case | Query Params | Expected | Notes |
|-----------|--------------|----------|-------|
| With query | `?query=john` | 200, User[], pagination | - |
| Missing query | - | 400 | `query` required |
| Pagination | `?query=john&page=1&pageSize=10` | 200 | - |

### 3.8 GET `/api/users/:id`

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| Valid user ID | `/api/users/507f1f77bcf86cd799439011` | 200, User | - |
| Invalid ID format | `/api/users/invalid` | 400/404 | - |
| Non-existent ID | `/api/users/507f1f77bcf86cd799439999` | 404 | - |

---

## 4. Wallets API (`/api/wallets`) – **JWT required**

### 4.1 GET `/api/wallets`

| Test Case | Query Params | Expected | Notes |
|-----------|--------------|----------|-------|
| Default | - | 200, Wallet[], pagination | - |
| Pagination | `?page=1&pageSize=5` | 200 | - |
| Without JWT | - | 401 | - |

### 4.2 POST `/api/wallets`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid create | `{ "name": "Main Wallet", "balance": 1000.50 }` | 201, Wallet | - |
| Minimal | `{ "name": "Savings" }` | 201, Wallet | balance defaults to 0 |
| Missing name | `{ "balance": 100 }` | 400 | name required |

### 4.3 GET `/api/wallets/:id`

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| Valid ID | `/api/wallets/<wallet-id>` | 200, Wallet | Use ID from POST |
| Invalid ID | `/api/wallets/invalid` | 400/404 | - |
| Other user's wallet | `/api/wallets/<other-user-wallet-id>` | 403/404 | Authorization |

### 4.4 PUT `/api/wallets/:id`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Update name | `{ "name": "Updated Wallet" }` | 200, Wallet | - |
| Update balance | `{ "balance": 2000 }` | 200, Wallet | - |
| Partial update | `{ "name": "New Name" }` | 200 | - |

### 4.5 DELETE `/api/wallets/:id`

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| Valid ID | `/api/wallets/<wallet-id>` | 200, BaseResponse | - |
| Non-existent | `/api/wallets/<non-existent-id>` | 404 | - |

---

## 5. Transactions API (`/api/transactions`) – **JWT required**

### 5.1 GET `/api/transactions`

| Test Case | Query Params | Expected | Notes |
|-----------|--------------|----------|-------|
| Default | - | 200, Transaction[], pagination | - |
| Filter by type | `?type=expense` | 200 | income | expense | transfer |
| Filter by category | `?category=<category-id>` | 200 | - |
| Filter by wallet | `?wallet=<wallet-id>` | 200 | - |
| Date range | `?startDate=2024-01-01&endDate=2024-01-31` | 200 | - |
| Search | `?search=groceries` | 200 | - |
| Pagination | `?page=1&pageSize=10` | 200 | - |
| Without JWT | - | 401 | - |

### 5.2 POST `/api/transactions`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid expense | `{ "amount": 50, "type": "expense", "category": "<cat-id>", "date": "2024-01-15T10:00:00Z", "wallet": "<wallet-id>", "description": "Lunch" }` | 201, Transaction | - |
| Valid income | `{ "amount": 500, "type": "income", "category": "<cat-id>", "date": "2024-01-15T10:00:00Z", "wallet": "<wallet-id>" }` | 201 | - |
| Valid transfer | `{ "amount": 100, "type": "transfer", "category": "<cat-id>", "date": "2024-01-15T10:00:00Z", "wallet": "<wallet-id>" }` | 201 | - |
| Missing required | Omit `amount` or `type` | 400 | - |
| Invalid type | `{ "type": "invalid", ... }` | 400 | Must be income/expense/transfer |
| Negative amount | `{ "amount": -10, ... }` | 400 | minimum: 0 |

### 5.3 GET `/api/transactions/:id`

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| Valid ID | `/api/transactions/<transaction-id>` | 200, Transaction | - |
| Invalid ID | `/api/transactions/invalid` | 400/404 | - |

### 5.4 PUT `/api/transactions/:id`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Update amount | `{ "amount": 75 }` | 200, Transaction | - |
| Update all | `{ "amount": 100, "type": "expense", "description": "Updated" }` | 200 | - |

### 5.5 DELETE `/api/transactions/:id`

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| Valid ID | `/api/transactions/<transaction-id>` | 200 | - |
| Non-existent | `/api/transactions/<non-existent-id>` | 404 | - |

### 5.6 POST `/api/transactions/:id/duplicate`

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| Valid ID | `/api/transactions/<transaction-id>` | 201, Transaction | Creates copy |

---

## 6. Categories API (`/api/categories`)

### 6.1 GET `/api/categories` – Optional auth

| Test Case | Query Params | Auth | Expected | Notes |
|-----------|--------------|------|----------|-------|
| List default categories | - | None | 200, Category[], pagination | System + user categories |
| Filter by type | `?type=expense` | Optional | 200 | income | expense |
| Pagination | `?page=1&pageSize=10` | Optional | 200 | - |

### 6.2 GET `/api/categories/:id`

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| Valid ID | `/api/categories/<category-id>` | 200, Category | - |
| Invalid ID | `/api/categories/invalid` | 400/404 | - |

### 6.3 GET `/api/categories/user/list` – **JWT required**

| Test Case | Query Params | Expected | Notes |
|-----------|--------------|----------|-------|
| User categories | - | 200, Category[], pagination | Only current user's custom categories |

### 6.4 POST `/api/categories` – **JWT required**

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid create | `{ "name": "Food & Dining", "type": "expense", "icon": "🍔", "color": "#FF5733" }` | 201, Category | - |
| Income category | `{ "name": "Salary", "type": "income" }` | 201 | - |
| Missing required | `{ "name": "Test" }` | 400 | type required |
| Invalid type | `{ "name": "Test", "type": "invalid" }` | 400 | income | expense |

### 6.5 PUT `/api/categories/:id` – **JWT required**

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Update name | `{ "name": "Updated Category" }` | 200, Category | - |
| Update all | `{ "name": "New", "type": "expense", "icon": "🔔", "color": "#000" }` | 200 | - |

### 6.6 DELETE `/api/categories/:id` – **JWT required**

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| User's category | `/api/categories/<user-category-id>` | 200 | - |
| System category | `/api/categories/<system-category-id>` | 403 | May not allow delete |
| Non-existent | `/api/categories/<non-existent-id>` | 404 | - |

---

## 7. Goals API (`/api/goals`) – **JWT required**

### 7.1 GET `/api/goals`

| Test Case | Query Params | Expected | Notes |
|-----------|--------------|----------|-------|
| Default | - | 200, Goal[], pagination | - |
| Pagination | `?page=1&pageSize=5` | 200 | - |
| Without JWT | - | 401 | - |

### 7.2 POST `/api/goals`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid create | `{ "title": "Vacation Fund", "targetAmount": 5000, "dueDate": "2024-12-31T23:59:59Z" }` | 201, Goal | - |
| With current amount | `{ "title": "Car", "targetAmount": 10000, "currentAmount": 2000, "dueDate": "2024-12-31T23:59:59Z" }` | 201 | - |
| Missing required | `{ "title": "Goal" }` | 400 | targetAmount, dueDate required |
| Negative amount | `{ "targetAmount": -100, ... }` | 400 | minimum: 0 |

### 7.3 GET `/api/goals/:id`

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| Valid ID | `/api/goals/<goal-id>` | 200, Goal | - |
| Invalid ID | `/api/goals/invalid` | 400/404 | - |

### 7.4 PUT `/api/goals/:id`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Update title | `{ "title": "Updated Goal" }` | 200, Goal | - |
| Update current amount | `{ "currentAmount": 3000 }` | 200 | - |

### 7.5 DELETE `/api/goals/:id`

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| Valid ID | `/api/goals/<goal-id>` | 200 | - |
| Non-existent | `/api/goals/<non-existent-id>` | 404 | - |

---

## 8. Budgets API (`/api/budgets`) – **JWT required**

### 8.1 GET `/api/budgets`

| Test Case | Query Params | Expected | Notes |
|-----------|--------------|----------|-------|
| Default | - | 200, Budget[], pagination | - |
| Filter category | `?category=<category-id>` | 200 | - |
| Filter period | `?period=monthly` | 200 | daily | weekly | monthly | yearly |
| Filter isActive | `?isActive=true` | 200 | - |
| Pagination | `?page=1&pageSize=10` | 200 | - |
| Without JWT | - | 401 | - |

### 8.2 POST `/api/budgets`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid create | `{ "amount": 1000, "category": "<cat-id>", "period": "monthly", "startDate": "2024-01-01T00:00:00Z", "endDate": "2024-01-31T23:59:59Z" }` | 201, Budget | - |
| With isActive | `{ ..., "isActive": true }` | 201 | - |
| Missing required | Omit category or period | 400 | - |
| Invalid period | `{ "period": "invalid", ... }` | 400 | daily | weekly | monthly | yearly |

### 8.3 GET `/api/budgets/:id`

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| Valid ID | `/api/budgets/<budget-id>` | 200, Budget | - |
| Invalid ID | `/api/budgets/invalid` | 400/404 | - |

### 8.4 PUT `/api/budgets/:id`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Update amount | `{ "amount": 1500 }` | 200, Budget | - |
| Deactivate | `{ "isActive": false }` | 200 | - |

### 8.5 DELETE `/api/budgets/:id`

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| Valid ID | `/api/budgets/<budget-id>` | 200 | - |
| Non-existent | `/api/budgets/<non-existent-id>` | 404 | - |

---

## 9. Currencies API (`/api/currencies`) – **Public, no auth**

### 9.1 GET `/api/currencies`

| Test Case | Query Params | Expected | Notes |
|-----------|--------------|----------|-------|
| Default | - | 200, Currency[], pagination | - |
| Pagination | `?page=1&pageSize=20` | 200 | - |
| No auth needed | - | 200 | Works without JWT |

### 9.2 GET `/api/currencies/code/:code`

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| Valid code | `/api/currencies/code/USD` | 200, Currency | - |
| Invalid code | `/api/currencies/code/XXX` | 404 | - |

### 9.3 GET `/api/currencies/:id`

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| Valid ID | `/api/currencies/<currency-id>` | 200, Currency | - |
| Invalid ID | `/api/currencies/invalid` | 400/404 | - |

---

## 10. Notifications API (`/api/notifications`) – **JWT required**

### 10.1 GET `/api/notifications`

| Test Case | Query Params | Expected | Notes |
|-----------|--------------|----------|-------|
| Default | - | 200, Notification[], pagination | - |
| Filter type | `?type=warning` | 200 | info | warning | success | error | reminder |
| Filter isRead | `?isRead=false` | 200 | - |
| Pagination | `?page=1&pageSize=10` | 200 | - |
| Without JWT | - | 401 | - |

### 10.2 POST `/api/notifications`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid create | `{ "title": "Budget Alert", "content": "You exceeded budget" }` | 201, Notification | - |
| With type | `{ "title": "Info", "content": "Note", "type": "info" }` | 201 | - |
| With redirect | `{ "title": "T", "content": "C", "redirectType": "budget", "redirectId": "<id>" }` | 201 | - |
| Missing required | `{ "title": "T" }` | 400 | content required |

### 10.3 GET `/api/notifications/unread/count`

| Test Case | Expected | Notes |
|-----------|----------|-------|
| With JWT | 200, `{ count: number }` | - |
| Without JWT | 401 | - |

### 10.4 GET `/api/notifications/:id`

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| Valid ID | `/api/notifications/<notification-id>` | 200, Notification | - |
| Invalid ID | `/api/notifications/invalid` | 400/404 | - |

### 10.5 PUT `/api/notifications/:id/read`

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| Valid ID | `/api/notifications/<notification-id>` | 200, Notification | isRead = true |

### 10.6 PUT `/api/notifications/read-all`

| Test Case | Expected | Notes |
|-----------|----------|-------|
| With JWT | 200, BaseResponse | Marks all as read |

### 10.7 DELETE `/api/notifications/:id`

| Test Case | Path | Expected | Notes |
|-----------|------|----------|-------|
| Valid ID | `/api/notifications/<notification-id>` | 200 | - |
| Non-existent | `/api/notifications/<non-existent-id>` | 404 | - |

### 10.8 DELETE `/api/notifications/read/all`

| Test Case | Expected | Notes |
|-----------|----------|-------|
| With JWT | 200 | Deletes all read notifications |

---

## 11. Tutorial API (`/api/tutorial`) – **JWT required**

### 11.1 GET `/api/tutorial`

| Test Case | Auth | Expected | Notes |
|-----------|------|----------|-------|
| With JWT | Bearer token | 200, Tutorial | User's tutorial progress |
| Without JWT | None | 401 | - |

### 11.2 PUT `/api/tutorial`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Update steps | `{ "completedSteps": ["step1", "step2"] }` | 200, Tutorial | Check schema for structure |

### 11.3 POST `/api/tutorial/step/complete`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Complete step | `{ "stepId": "welcome" }` | 200, Tutorial | - |

### 11.4 POST `/api/tutorial/complete`

| Test Case | Expected | Notes |
|-----------|----------|-------|
| Complete tutorial | 200, Tutorial | Marks entire tutorial complete |

### 11.5 POST `/api/tutorial/reset`

| Test Case | Expected | Notes |
|-----------|----------|-------|
| Reset progress | 200, Tutorial | Resets to initial state |

---

## 12. Exchange Rates API (`/api/exchange-rates`)

### 12.1 GET `/api/exchange-rates/rate`

| Test Case | Query Params | Auth | Expected | Notes |
|-----------|--------------|------|----------|-------|
| Valid pair | `?baseCurrency=USD&targetCurrency=EUR` | None | 200, ExchangeRate | - |
| With date | `?baseCurrency=USD&targetCurrency=EUR&date=2024-01-15` | None | 200 | Historical rate |
| Missing params | Omit baseCurrency or targetCurrency | None | 400 | - |

### 12.2 POST `/api/exchange-rates/convert`

| Test Case | Payload | Expected | Notes |
|-----------|---------|----------|-------|
| Valid convert | `{ "amount": 100, "from": "USD", "to": "EUR" }` | 200, converted amount | - |
| Missing fields | `{ "amount": 100 }` | 400 | from, to required |

### 12.3 POST `/api/exchange-rates/update` – **JWT required**

| Test Case | Payload | Auth | Expected | Notes |
|-----------|---------|------|----------|-------|
| Update rates | `{}` or `{ "baseCurrency": "USD" }` | JWT | 200, `{ savedCount }` | Fetches and stores rates |
| Without JWT | - | None | 401 | - |

---

## 13. Cross-Cutting Tests

### 13.1 Authentication

| Test | Description | Expected |
|------|-------------|----------|
| 401 without token | Call any protected endpoint without auth | 401 Unauthorized |
| 401 invalid token | Call with `Authorization: Bearer invalid` | 401/403 |
| 401 expired token | Call with expired JWT | 401 |

### 13.2 Validation

| Test | Description | Expected |
|------|-------------|----------|
| Required fields | Omit required body fields | 400 Bad Request |
| Invalid types | Send string instead of number, etc. | 400 |
| Invalid enums | Send value not in enum | 400 |
| Invalid IDs | Non-MongoDB ObjectId format | 400/404 |

### 13.3 Pagination

| Test | Description | Expected |
|------|-------------|----------|
| Default | Omit page/pageSize | Reasonable defaults, totalPages, totalItems |
| page=0 or negative | `?page=0` | 400 or treat as 1 |
| pageSize too large | `?pageSize=10000` | Cap or 400 |
| Empty result | page beyond data | 200, empty array, pagination metadata |

---

## Suggested Test Order

1. **Auth** → Register/Login to obtain JWT
2. **OTP** (if registration requires OTP)
3. **Currencies** (public, no auth) – get valid currency IDs
4. **Categories** – create/get categories for transactions/budgets
5. **Wallets** – create wallets
6. **Transactions** – create transactions (need wallet + category)
7. **Goals**
8. **Budgets** (need category)
9. **Notifications**
10. **Users** (profile, settings)
11. **Tutorial**
12. **Exchange Rates**

---

## Quick Reference: IDs

When testing, capture and reuse these from responses:

- `accessToken` – from `/api/auth/login`
- `refreshToken` – from `/api/auth/login`
- `walletId` – from POST `/api/wallets`
- `categoryId` – from GET `/api/categories` or POST `/api/categories`
- `transactionId` – from POST `/api/transactions`
- `goalId` – from POST `/api/goals`
- `budgetId` – from POST `/api/budgets`
- `notificationId` – from POST `/api/notifications`
- `currencyId` – from GET `/api/currencies`

---

## Tools

- **Swagger UI**: `http://localhost:5000/api-docs` – interactive API docs
- **Postman/Thunder Client**: Import OpenAPI from `http://localhost:5000/api-docs.json`
- **curl**: Use `-H "Authorization: Bearer <token>"` for protected endpoints
