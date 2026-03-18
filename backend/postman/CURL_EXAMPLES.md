# CURL Examples - PFM API

Base URL mặc định: `http://localhost:5000`. Thay `YOUR_ACCESS_TOKEN` bằng token sau khi login.

**Import vào Postman:** Postman → Import → Raw text → dán từng lệnh curl bên dưới.

---

## 1. Auth

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Password123!","otp":"123456"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'
```

### Login with Google
```bash
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"<google_id_token>"}'
```

### Refresh Token
```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

### Forgot Password
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Reset Password
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456","newPassword":"NewPassword123!"}'
```

### Logout (cần token)
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 2. OTP

### Send Register OTP
```bash
curl -X POST http://localhost:5000/api/otp/send-register-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Send Forgot Password OTP
```bash
curl -X POST http://localhost:5000/api/otp/send-forgot-password-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Verify OTP
```bash
curl -X POST http://localhost:5000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456","type":"register"}'
```

---

## 3. Users (cần token)

### Get Profile
```bash
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Profile
```bash
curl -X PUT http://localhost:5000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"username":"newname","avatar":"https://example.com/avatar.png"}'
```

### Update Settings
```bash
curl -X PUT http://localhost:5000/api/users/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"language":"vi","currency":"VND","theme":"dark"}'
```

### Change Password
```bash
curl -X PUT http://localhost:5000/api/users/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"currentPassword":"oldpass","newPassword":"NewPassword123!"}'
```

### Delete Profile
```bash
curl -X DELETE http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get User List
```bash
curl -X GET "http://localhost:5000/api/users/list?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Search Users
```bash
curl -X GET "http://localhost:5000/api/users/search?q=test" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get User By ID
```bash
curl -X GET http://localhost:5000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 4. Wallets (cần token)

### Get Wallets
```bash
curl -X GET "http://localhost:5000/api/wallets?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Wallet By ID
```bash
curl -X GET http://localhost:5000/api/wallets/WALLET_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Wallet
```bash
curl -X POST http://localhost:5000/api/wallets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"Ví chính","balance":0}'
```

### Update Wallet
```bash
curl -X PUT http://localhost:5000/api/wallets/WALLET_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"Ví tiết kiệm","balance":1000000}'
```

### Delete Wallet
```bash
curl -X DELETE http://localhost:5000/api/wallets/WALLET_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 5. Transactions (cần token)

### Get Transactions
```bash
curl -X GET "http://localhost:5000/api/transactions?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Transaction By ID
```bash
curl -X GET http://localhost:5000/api/transactions/TRANSACTION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Transaction
```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"amount":100000,"type":"expense","category":"CATEGORY_ID","date":"2025-03-10","description":"Ăn sáng","notes":"","wallet":"WALLET_ID","user":"USER_ID"}'
```

### Update Transaction
```bash
curl -X PUT http://localhost:5000/api/transactions/TRANSACTION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"amount":150000,"description":"Ăn trưa"}'
```

### Delete Transaction
```bash
curl -X DELETE http://localhost:5000/api/transactions/TRANSACTION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Duplicate Transaction
```bash
curl -X POST http://localhost:5000/api/transactions/TRANSACTION_ID/duplicate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 6. Categories

### List Categories (public, không cần token)
```bash
curl -X GET "http://localhost:5000/api/categories?page=1&pageSize=10"
```

### Get Category By ID
```bash
curl -X GET http://localhost:5000/api/categories/CATEGORY_ID
```

### List Categories By User (cần token)
```bash
curl -X GET "http://localhost:5000/api/categories/user/list?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Category (cần token)
```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"Ăn uống","type":"expense","icon":"food"}'
```

### Update Category (cần token)
```bash
curl -X PUT http://localhost:5000/api/categories/CATEGORY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"Ăn uống (sửa)","icon":"restaurant"}'
```

### Delete Category (cần token)
```bash
curl -X DELETE http://localhost:5000/api/categories/CATEGORY_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 7. Goals (cần token)

### Get Goals
```bash
curl -X GET "http://localhost:5000/api/goals?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Goal By ID
```bash
curl -X GET http://localhost:5000/api/goals/GOAL_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Goal
```bash
curl -X POST http://localhost:5000/api/goals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"title":"Mua xe máy","targetAmount":30000000,"currentAmount":0,"dueDate":"2025-12-31","user":"USER_ID"}'
```

### Update Goal
```bash
curl -X PUT http://localhost:5000/api/goals/GOAL_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"currentAmount":5000000,"title":"Mua xe máy (cập nhật)"}'
```

### Delete Goal
```bash
curl -X DELETE http://localhost:5000/api/goals/GOAL_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 8. Budgets (cần token)

### Get Budgets
```bash
curl -X GET "http://localhost:5000/api/budgets?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Budget By ID
```bash
curl -X GET http://localhost:5000/api/budgets/BUDGET_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Budget
```bash
curl -X POST http://localhost:5000/api/budgets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"amount":5000000,"category":"CATEGORY_ID","period":"monthly","startDate":"2025-03-01","endDate":"2025-03-31","user":"USER_ID","isActive":true}'
```

### Update Budget
```bash
curl -X PUT http://localhost:5000/api/budgets/BUDGET_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"amount":6000000,"isActive":true}'
```

### Delete Budget
```bash
curl -X DELETE http://localhost:5000/api/budgets/BUDGET_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 9. Currencies (public)

### Get All Currencies
```bash
curl -X GET http://localhost:5000/api/currencies
```

### Get Currency By Code
```bash
curl -X GET http://localhost:5000/api/currencies/code/VND
```

### Get Currency By ID
```bash
curl -X GET http://localhost:5000/api/currencies/CURRENCY_ID
```

---

## 10. Notifications (cần token)

### Get Notifications
```bash
curl -X GET "http://localhost:5000/api/notifications?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Unread Count
```bash
curl -X GET http://localhost:5000/api/notifications/unread/count \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Notification By ID
```bash
curl -X GET http://localhost:5000/api/notifications/NOTIFICATION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Notification
```bash
curl -X POST http://localhost:5000/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"title":"Thông báo","message":"Nội dung","type":"info"}'
```

### Mark As Read
```bash
curl -X PUT http://localhost:5000/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Mark All As Read
```bash
curl -X PUT http://localhost:5000/api/notifications/read-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Delete Notification
```bash
curl -X DELETE http://localhost:5000/api/notifications/NOTIFICATION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Delete All Read
```bash
curl -X DELETE http://localhost:5000/api/notifications/read/all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 11. Tutorial (cần token)

### Get Tutorial
```bash
curl -X GET http://localhost:5000/api/tutorial \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Upsert Tutorial
```bash
curl -X PUT http://localhost:5000/api/tutorial \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"isCompleted":false,"completedSteps":["step1"],"lastViewedAt":"2025-03-10T00:00:00.000Z"}'
```

### Complete Step
```bash
curl -X POST http://localhost:5000/api/tutorial/step/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"stepId":"step1"}'
```

### Complete Tutorial
```bash
curl -X POST http://localhost:5000/api/tutorial/complete \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Reset Tutorial
```bash
curl -X POST http://localhost:5000/api/tutorial/reset \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 12. Exchange Rates

### Get Rate (public)
```bash
curl -X GET "http://localhost:5000/api/exchange-rates/rate?baseCurrency=USD&targetCurrency=VND"
```

### Convert (public)
```bash
curl -X POST http://localhost:5000/api/exchange-rates/convert \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"fromCurrency":"USD","toCurrency":"VND","date":"2025-03-10"}'
```

### Update Rates (cần token)
```bash
curl -X POST http://localhost:5000/api/exchange-rates/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"baseCurrency":"USD"}'
```

---

## 13. Health & Docs

### Hello World
```bash
curl -X GET http://localhost:5000/
```

### Swagger JSON
```bash
curl -X GET http://localhost:5000/api-docs.json
```

---

## Ghi chú

- **Port:** Mặc định `5000`. Đổi trong `.env` (PORT) nếu khác.
- **Token:** Sau khi gọi Login, copy `accessToken` từ response và thay `YOUR_ACCESS_TOKEN` trong các request cần auth.
- **IDs:** Thay `USER_ID`, `WALLET_ID`, `CATEGORY_ID`, `TRANSACTION_ID`, `GOAL_ID`, `BUDGET_ID`, `NOTIFICATION_ID` bằng ID thực từ response của API tương ứng.
