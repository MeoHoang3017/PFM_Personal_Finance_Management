# PFM Backend – User Stories

User stories derived from the implemented API and business logic. Format: **As a** [role], **I want** [action] **so that** [benefit].

---

## 1. Authentication & Registration

| ID | User Story | API / Behavior |
|----|------------|----------------|
| A1 | **As a** new visitor, **I want** to request a verification code to my email **so that** I can prove I own the email before signing up. | `POST /otp/send-register-otp` |
| A2 | **As a** new visitor, **I want** to register with username, email, password and a valid OTP **so that** I can create an account and start using the app. | `POST /auth/register` (OTP required) |
| A3 | **As a** registered user, **I want** to log in with email and password **so that** I can access my data. | `POST /auth/login` |
| A4 | **As a** user, **I want** to log in with Google **so that** I can sign in without a password. | `POST /auth/google` |
| A5 | **As a** logged-in user, **I want** to log out **so that** my session is ended on this device. | `POST /auth/logout` (with token) |
| A6 | **As a** user with an expired access token, **I want** to get a new access token using my refresh token **so that** I can stay logged in. | `POST /auth/refresh-token` |
| A7 | **As a** user who forgot my password, **I want** to request a reset code by email **so that** I can set a new password. | `POST /otp/send-forgot-password-otp` |
| A8 | **As a** user who requested a reset, **I want** to set a new password after entering the code **so that** I can log in again. | `POST /auth/reset-password` |
| A9 | **As a** logged-in user (non-Google), **I want** to change my password after confirming my current one **so that** I can keep my account secure. | `PUT /users/change-password` |
| A10 | **As a** user, **I want** to verify an OTP I received **so that** the app can confirm my email for registration or reset. | `POST /otp/verify` |

---

## 2. Profile & Settings

| ID | User Story | API / Behavior |
|----|------------|----------------|
| U1 | **As a** logged-in user, **I want** to view my profile **so that** I can see my username, email and preferences. | `GET /users/profile` |
| U2 | **As a** logged-in user, **I want** to update my profile (username, email, avatar, theme, language, currency, money format, reminders) **so that** my account reflects my preferences. | `PUT /users/profile` |
| U3 | **As a** logged-in user, **I want** to update only my settings (theme, language, currency, avatar, money format, daily reminder) **so that** I can customize the app without changing email/password. | `PUT /users/settings` |
| U4 | **As a** logged-in user, **I want** to delete my account **so that** my data can be removed (soft delete). | `DELETE /users/profile` |
| U5 | **As an** admin/support, **I want** to list users with pagination **so that** I can manage or search accounts. | `GET /users/list` |
| U6 | **As an** admin/support, **I want** to view a user by ID **so that** I can inspect their account. | `GET /users/:id` |
| U7 | **As an** admin/support, **I want** to search users by username or email **so that** I can find a specific account. | `GET /users/search?q=...` |

---

## 3. Wallets

| ID | User Story | API / Behavior |
|----|------------|----------------|
| W1 | **As a** logged-in user, **I want** to see a list of my wallets (with pagination) **so that** I can manage my accounts. | `GET /wallets` |
| W2 | **As a** logged-in user, **I want** to open a wallet by ID **so that** I can view its name and balance. | `GET /wallets/:id` (owner only) |
| W3 | **As a** logged-in user, **I want** to create a new wallet with a name and optional starting balance **so that** I can track separate accounts (e.g. Cash, Bank). | `POST /wallets` (max 10 per user) |
| W4 | **As a** logged-in user, **I want** to update a wallet’s name or balance **so that** I can correct or reconcile. | `PUT /wallets/:id` (owner only) |
| W5 | **As a** logged-in user, **I want** to delete a wallet **so that** I can remove accounts I no longer use. | `DELETE /wallets/:id` (owner only) |

---

## 4. Transactions

| ID | User Story | API / Behavior |
|----|------------|----------------|
| T1 | **As a** logged-in user, **I want** to see my transactions with filters (type, category, wallet, date range, search) and pagination **so that** I can review my spending and income. | `GET /transactions` |
| T2 | **As a** logged-in user, **I want** to open a transaction by ID **so that** I can see its details. | `GET /transactions/:id` |
| T3 | **As a** logged-in user, **I want** to add an income or expense to a wallet **so that** the wallet balance updates and I have a record. | `POST /transactions` (income/expense) |
| T4 | **As a** logged-in user, **I want** to edit a transaction (amount, type, category, date, wallet, etc.) **so that** I can fix mistakes; the wallet balance should be corrected. | `PUT /transactions/:id` |
| T5 | **As a** logged-in user, **I want** to delete a transaction **so that** it is removed and the wallet balance is reverted. | `DELETE /transactions/:id` |
| T6 | **As a** logged-in user, **I want** to duplicate a transaction with today’s date **so that** I can quickly add a similar entry. | `POST /transactions/:id/duplicate` |

---

## 5. Categories

| ID | User Story | API / Behavior |
|----|------------|----------------|
| C1 | **As a** user (optionally logged in), **I want** to list categories with optional filters **so that** I can browse or pick categories. | `GET /categories` (optional auth) |
| C2 | **As a** logged-in user, **I want** to see my own categories **so that** I can manage and use them in transactions. | `GET /categories/user/list` |
| C3 | **As a** logged-in user, **I want** to create a category (name, type, optional parent, icon, color) **so that** I can classify income and expenses. | `POST /categories` |
| C4 | **As a** logged-in user, **I want** to view a category by ID **so that** I can see its details. | `GET /categories/:id` |
| C5 | **As a** logged-in user, **I want** to update a category **so that** I can fix name, type, parent, icon or color. | `PUT /categories/:id` |
| C6 | **As a** logged-in user, **I want** to delete a category **so that** I can remove ones I no longer use. | `DELETE /categories/:id` |

---

## 6. Goals

| ID | User Story | API / Behavior |
|----|------------|----------------|
| G1 | **As a** logged-in user, **I want** to see my savings goals with pagination **so that** I can track progress. | `GET /goals` |
| G2 | **As a** logged-in user, **I want** to open a goal by ID **so that** I can see target, current amount and due date. | `GET /goals/:id` |
| G3 | **As a** logged-in user, **I want** to create a goal (title, target amount, optional current amount, due date) **so that** I can save toward something. | `POST /goals` |
| G4 | **As a** logged-in user, **I want** to update a goal **so that** I can change title, amounts or due date. | `PUT /goals/:id` |
| G5 | **As a** logged-in user, **I want** to delete a goal **so that** I can remove goals I no longer want. | `DELETE /goals/:id` |

---

## 7. Budgets

| ID | User Story | API / Behavior |
|----|------------|----------------|
| B1 | **As a** logged-in user, **I want** to list my budgets with optional filters **so that** I can see spending limits per category/period. | `GET /budgets` |
| B2 | **As a** logged-in user, **I want** to open a budget by ID **so that** I can see amount, category, period and dates. | `GET /budgets/:id` |
| B3 | **As a** logged-in user, **I want** to create a budget (amount, category, period, start/end date) **so that** I can set a spending limit; start date must be before end date. | `POST /budgets` |
| B4 | **As a** logged-in user, **I want** to update a budget **so that** I can change amount, category, period or dates. | `PUT /budgets/:id` |
| B5 | **As a** logged-in user, **I want** to delete a budget **so that** I can remove limits I no longer use. | `DELETE /budgets/:id` |

---

## 8. Currencies & Exchange Rates

| ID | User Story | API / Behavior |
|----|------------|----------------|
| CR1 | **As a** user, **I want** to list supported currencies with pagination **so that** I can choose my currency. | `GET /currencies` |
| CR2 | **As a** user, **I want** to get a currency by code (e.g. USD) **so that** I can show symbol and name. | `GET /currencies/code/:code` |
| CR3 | **As a** user, **I want** to get a currency by ID **so that** I can resolve references. | `GET /currencies/:id` |
| E1 | **As a** user, **I want** to get the exchange rate between two currencies (optional date) **so that** I can display or convert amounts. | `GET /exchange-rates/rate?base=...&target=...` |
| E2 | **As a** user, **I want** to convert an amount from one currency to another **so that** I can show values in my preferred currency. | `POST /exchange-rates/convert` |
| E3 | **As a** logged-in user, **I want** to trigger an update of exchange rates **so that** the app has fresh rates. | `POST /exchange-rates/update` |

---

## 9. Notifications

| ID | User Story | API / Behavior |
|----|------------|----------------|
| N1 | **As a** logged-in user, **I want** to see my notifications with filters and pagination **so that** I can read alerts and tips. | `GET /notifications` |
| N2 | **As a** logged-in user, **I want** to see how many unread notifications I have **so that** I can show a badge. | `GET /notifications/unread/count` |
| N3 | **As a** logged-in user, **I want** to open a notification by ID **so that** I can read it and follow a link if any. | `GET /notifications/:id` |
| N4 | **As a** system or admin, **I want** to create a notification for a user **so that** they receive an in-app message. | `POST /notifications` |
| N5 | **As a** logged-in user, **I want** to mark a notification as read **so that** it no longer counts as unread. | `PUT /notifications/:id/read` |
| N6 | **As a** logged-in user, **I want** to mark all my notifications as read **so that** I can clear the unread state. | `PUT /notifications/read-all` |
| N7 | **As a** logged-in user, **I want** to delete a single notification **so that** I can remove it from my list. | `DELETE /notifications/:id` |
| N8 | **As a** logged-in user, **I want** to delete all read notifications **so that** my list stays clean. | `DELETE /notifications/read/all` |

---

## 10. Tutorial / Onboarding

| ID | User Story | API / Behavior |
|----|------------|----------------|
| TU1 | **As a** logged-in user, **I want** to see my tutorial progress **so that** I can resume or skip onboarding. | `GET /tutorial` |
| TU2 | **As a** logged-in user, **I want** to update my tutorial state (e.g. last viewed, completed steps) **so that** progress is saved. | `PUT /tutorial` |
| TU3 | **As a** logged-in user, **I want** to mark a tutorial step as complete **so that** the app knows which steps I’ve done. | `POST /tutorial/step/complete` |
| TU4 | **As a** logged-in user, **I want** to mark the whole tutorial as completed **so that** I don’t see onboarding again. | `POST /tutorial/complete` |
| TU5 | **As a** logged-in user, **I want** to reset my tutorial progress **so that** I can go through onboarding again. | `POST /tutorial/reset` |

---

## Roles Summary

| Role | Description |
|------|-------------|
| **New visitor** | Not registered; can request OTP, register, (optionally browse categories). |
| **Registered user** | Logged in; can manage profile, wallets, transactions, categories, goals, budgets, notifications, tutorial. |
| **Admin / support** | Can list users, get user by ID, search users (assumed via same API with appropriate permissions). |

---

## Acceptance Notes (from code)

- **Auth**: Registration requires OTP; Google users cannot use password login or password reset.
- **Wallets**: Max 10 per user; get/update/delete enforce ownership (other user’s wallet returns 404).
- **Transactions**: Income/expense update wallet balance in a single DB transaction; duplicate uses current date.
- **Budgets**: `startDate` must be before `endDate`.
- **Categories**: Can be listed without auth (optional); user list and create/update/delete require auth.
- **Exchange rates**: Convert and get rate can be used without auth; update rates is protected.

This document reflects the behavior implemented in the backend as of the last update. For detailed business rules, see [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md).
