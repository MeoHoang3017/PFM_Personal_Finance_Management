# PFM Backend – Business Logic

This document describes all business rules implemented in the Personal Finance Management (PFM) backend. Logic lives in **services** (`src/services/`); controllers validate input and delegate to services.

---

## 1. Authentication & Authorization

### 1.1 Registration (`auth.service.ts`)
- **Email/username uniqueness**: No two users may share the same email or username.
- **Email verification**: Registration requires OTP verification for the email (inline OTP or pre-verified OTP record).
- **Password**: Stored only after hashing (no plain text).
- **Post-registration**: OTP record for that email + type is deleted; access + refresh tokens are returned.

### 1.2 Login (`auth.service.ts`)
- **Credentials**: Match email + password (hashed comparison).
- **Google users**: Users who signed up with Google have no password; login with password is rejected.
- **Response**: Access token, refresh token, and user payload (no password).

### 1.3 Logout (`auth.service.ts`)
- Stateless: returns success message. Token invalidation (e.g. blacklist) can be added later.

### 1.4 Refresh token (`auth.service.ts`)
- Refresh token is verified; if valid, a new access token is issued. User must still exist.

### 1.5 Forgot / Reset password (`auth.service.ts`)
- **Forgot**: User must exist; Google users cannot reset password. OTP is sent to email.
- **Reset**: OTP must be verified; new password is hashed and stored; OTP record is deleted after success.

### 1.6 Google login (`auth.service.ts`)
- **ID token** is verified with Google.
- **Existing user** (by email or `googleId`): `googleId` and optionally avatar/username are updated.
- **New user**: Created with unique username (derived from name/email), no password, `googleId` and optional avatar.
- **Username**: Must be unique; suffix (e.g. `_1`) is added if collision.

### 1.7 Change password (`user.service.ts`)
- **Google users**: Cannot change password (no password account).
- **Current password** must be provided and match before setting new password.
- New password is hashed before save.

---

## 2. OTP (`otp.service.ts`)

- **Generation**: 6-digit numeric OTP.
- **Expiry**: Configurable via `OTP_EXPIRES_MINUTES` (default 10).
- **Types**: `register` | `forgot-password`; one record per (email, type), upserted on send.
- **Verification**: OTP must exist, not expired, and code must match; then `isVerified` is set.
- **Check verified**: Used for registration when OTP was verified in a previous step.
- **Cleanup**: OTP records can be deleted after successful register/reset (done by auth flow).

---

## 3. Users (`user.service.ts`)

### 3.1 Profile & settings
- **Get profile**: Current user by ID; password never returned.
- **Update profile**: Username and email must be unique (excluding current user). Current password required to set new password. Theme: `light` | `dark`. Money format: `standard` | `compact` | `full`.
- **Update settings**: Same theme/money format validation; no password. Used for preferences only.

### 3.2 Admin/list
- **List users**: Paginated; soft-deleted users excluded.
- **Get by ID**: By user ID; soft-deleted excluded.
- **Search**: By username or email (case-insensitive); paginated; soft-deleted excluded.

### 3.3 Deletion
- **Soft delete**: `isDeleted = true`, `deletedAt` set. User is not physically removed.

---

## 4. Wallets (`wallet.service.ts`)

### 4.1 Listing & access
- **List**: Only wallets for the given user; sorted by `createdAt` desc; paginated.
- **Get by ID**: Returns wallet only if it belongs to the given user (ownership check).

### 4.2 Create
- **Limit**: Maximum **10 wallets** per user.
- **Fields**: `name` required; `balance` optional (default 0). `user` set from authenticated user.

### 4.3 Update
- **Ownership**: Only the owner can update (service checks `user`).
- **Fields**: `name` and/or `balance`; partial updates supported.

### 4.4 Delete
- **Ownership**: Only the owner can delete (service checks `user`).
- Physical delete; consider impact on transactions that reference the wallet (e.g. prevent delete if transactions exist, or handle in transaction service).

---

## 5. Transactions (`transaction.service.ts`)

### 5.1 Listing
- **Filter**: By user (required); optional: `type`, `category`, `wallet`, `startDate`, `endDate`, `search` (description/notes).
- **Sort**: `date` desc, then `createdAt` desc. Paginated.

### 5.2 Create
- **Wallet**: Must exist. Balance is updated in the same transaction (DB transaction):
  - **income**: `wallet.balance += amount`
  - **expense**: `wallet.balance -= amount`
  - **transfer**: Not yet applied to balance (needs from/to wallet handling).
- **Data**: amount (≥ 0), type (`income` | `expense` | `transfer`), category, date, description, notes, wallet, user.

### 5.3 Update
- **Balance correction**: If amount, type, or wallet changes, the previous effect on the old wallet is reverted, then the new effect is applied to the (possibly new) wallet. All in one DB transaction.

### 5.4 Delete
- **Balance revert**: Wallet balance is adjusted back (subtract income, add expense) in the same DB transaction, then the transaction document is deleted.

### 5.5 Duplicate
- New transaction with same amount, type, category, description, notes, wallet, user; **date** is set to current date. Wallet balance is updated as for create (income/expense). Transfer not applied.

### 5.6 Business rules (current)
- **Transfer**: Stored as type `transfer` but wallet balance is not updated; implement as: debit source wallet, credit destination wallet (e.g. `toWallet` field or separate logic).
- **Negative balance**: Expense can make balance negative; add a rule here if you want to forbid or warn.

---

## 6. Categories (`category.service.ts`)

### 6.1 Listing
- **Filter**: Optional `user`, `type`. Paginated.
- **By user**: List categories for one user; paginated.

### 6.2 Create
- **Fields**: name, type, optional parentCategory, user, icon, color (default `#000000`).

### 6.3 Update & delete
- **Update**: Partial; parentCategory can be set to null.
- **Delete**: Physical delete by ID.

---

## 7. Goals (`goal.service.ts`)

### 7.1 Listing & access
- **List**: Goals for the given user; sorted by `createdAt` desc; paginated.
- **Get by ID**: By goal ID (consider adding ownership check so only owner can read).

### 7.2 Create
- **Fields**: title, targetAmount, currentAmount (default 0), dueDate, user.

### 7.3 Update & delete
- **Update**: Partial (title, targetAmount, currentAmount, dueDate).
- **Delete**: Physical delete by ID.

### 7.4 Progress
- **Progress**: Computed as `currentAmount / targetAmount`; typically done in frontend or a dedicated endpoint. No automatic link from transactions to goals yet (e.g. “contribute to goal” could update `currentAmount`).

---

## 8. Budgets (`budget.service.ts`)

### 8.1 Listing
- **Filter**: user (required); optional category, period, isActive. Paginated.

### 8.2 Create
- **Date rule**: `startDate` must be **before** `endDate`; otherwise error.
- **Fields**: amount, category, period, startDate, endDate, user, isActive (default true).

### 8.3 Update
- **Date rule**: If start/end are updated, `startDate` must still be before `endDate`.
- **Fields**: amount, category, period, startDate, endDate, isActive (all optional).

### 8.4 Delete
- Physical delete by ID.

### 8.5 Spent amount
- **Spent**: Not computed in service yet. Can be added: sum of expense transactions in the same category and within [startDate, endDate] for the budget’s user.

---

## 9. Currencies (`currency.service.ts`)

- **List**: All currencies; sorted by code; paginated (e.g. pageSize 50).
- **Get by code**: Case-insensitive match on `code` (e.g. USD).
- **Get by ID**: By MongoDB _id.
- **Read-only**: No create/update/delete in service; data is seeded or managed separately.

---

## 10. Notifications (`notification.service.ts`)

### 10.1 Listing & count
- **List**: By user; optional filter by type, isRead; sorted by createdAt desc; paginated.
- **Unread count**: Count where user + `isRead === false`.

### 10.2 Create
- **Fields**: title, content, type (default `info`), user, redirectType (default `none`), redirectId (optional). Created as unread.

### 10.3 Read state
- **Mark one read**: Sets `isRead = true`, `readAt = now`.
- **Mark all read**: All unread notifications for the user.

### 10.4 Delete
- **Delete one**: By ID.
- **Delete all read**: Delete all read notifications for the user; returns count.

---

## 11. Tutorial (`tutorial.service.ts`)

- **One record per user**: Get/upsert by user ID.
- **Get**: Returns tutorial for user or null.
- **Upsert**: Updates lastViewedAt; optionally isCompleted; **completedSteps** are merged and deduplicated by stepId.
- **Complete step**: Adds step to completedSteps if not already present; creates tutorial if missing.
- **Complete**: Sets isCompleted = true.
- **Reset**: Sets isCompleted = false, completedSteps = [].

---

## 12. Exchange rates (`exchangeRate.service.ts`)

### 12.1 Providers
- **exchangerate-api.com**: No API key (free tier).
- **Fixer.io / CurrencyLayer**: Require `EXCHANGE_RATE_API_KEY`. Provider set via `EXCHANGE_RATE_API_PROVIDER`.

### 12.2 Update rates
- **Fetch**: Rates from provider for a base currency (default USD).
- **Save**: One document per (baseCurrency, targetCurrency, date). Date normalized to start of day. Invalid or duplicate codes skipped per target.

### 12.3 Get rate & convert
- **Get rate**: (baseCurrency, targetCurrency, optional date). Prefer exact date; else latest available.
- **Convert**: amount × rate; if from === to, return amount unchanged. Returns null if rate missing.

---

## 13. Pagination (`utils/pagination.ts`)

- **Input**: items (array), page, pageSize, totalItems.
- **Output**: `{ data, pagination: { page, pageSize, totalItems, totalPages } }`.
- **Note**: Services usually paginate at DB level (skip/limit) and pass totalItems from count; the utility builds the response shape. The implementation slices the already-fetched items again; typically items.length ≤ pageSize and slice is redundant but harmless.

---

## 14. Resource ownership (security)

- **Wallets**: getById, update, delete enforce that the wallet’s `user` equals the requesting user (see wallet.service).
- **Transactions, goals, budgets, notifications**: List/get/create are scoped by user in controller (filter by `req.user.id`). Get/update/delete by ID can be strengthened to verify resource ownership in each service (same pattern as wallet).

---

## 15. Errors and validation

- **Not found**: Services throw `Error('... not found')`; middleware maps to 404.
- **Validation**: Controllers check required body/query (e.g. name for wallet); services enforce business rules (e.g. date range, max wallets, duplicate username/email).
- **Auth**: Missing or invalid token → 401; ownership failure → 403 or 404 depending on implementation.

This file is the single reference for “what the backend does” from a business rules perspective. When adding features (e.g. transfer handling, budget spent, goal contributions), update the relevant service and this document.
