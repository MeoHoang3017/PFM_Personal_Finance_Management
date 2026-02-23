# PFM API – Test Cases

## Overview

This document lists all automated test cases for the PFM backend API. Tests are implemented in `src/__tests__/` and run with Jest + Supertest.

---

## 1. Auth API (`auth.test.ts`)

| TC-ID | Test Case | Expected Result |
|-------|-----------|-----------------|
| AUTH-001 | POST /register with missing required fields | 400 Bad Request |
| AUTH-002 | POST /register with password too short | 400 Bad Request |
| AUTH-003 | POST /register with valid OTP | 201 Created, accessToken + user |
| AUTH-004 | POST /login with valid credentials | 200 OK, accessToken + user |
| AUTH-005 | POST /login with wrong password | 400 Bad Request |
| AUTH-006 | POST /login with missing fields | 400 Bad Request |
| AUTH-007 | POST /logout without token | 401 Unauthorized |
| AUTH-008 | POST /logout with valid token | 200 OK |

---

## 2. OTP API (`otp.test.ts`)

| TC-ID | Test Case | Expected Result |
|-------|-----------|-----------------|
| OTP-001 | POST /send-register-otp with valid email | 200 OK |
| OTP-002 | POST /send-register-otp with missing email | 400 Bad Request |
| OTP-003 | POST /send-forgot-password-otp with valid email | 200 OK |

---

## 3. Users API (`users.test.ts`)

| TC-ID | Test Case | Expected Result |
|-------|-----------|-----------------|
| USR-001 | GET /profile without valid auth | 401 or 403 |
| USR-002 | GET /profile with valid token | 200 OK, user data |
| USR-003 | PUT /profile with valid token | 200 OK, updated user |

---

## 4. Wallets API (`wallets.test.ts`)

| TC-ID | Test Case | Expected Result |
|-------|-----------|-----------------|
| WL-001 | GET /wallets without auth | 401 Unauthorized |
| WL-002 | GET /wallets with auth (new user) | 200 OK, empty list |
| WL-003 | POST /wallets with name and balance | 201 Created |
| WL-004 | POST /wallets without name | 400 Bad Request |
| WL-005 | GET /wallets/:id with valid ID | 200 OK, wallet object |
| WL-006 | GET /wallets/:id with invalid ID | 404 Not Found |
| WL-007 | PUT /wallets/:id | 200 OK, updated wallet |
| WL-008 | DELETE /wallets/:id | 200 OK |

---

## 5. Transactions API (`transactions.test.ts`)

| TC-ID | Test Case | Expected Result |
|-------|-----------|-----------------|
| TX-001 | GET /transactions without valid auth | 401 or 403 |
| TX-002 | GET /transactions with auth (empty) | 200 OK, empty list |
| TX-003 | POST /transactions with valid payload | 201 Created |
| TX-004 | POST /transactions with missing required fields | 400 Bad Request |
| TX-005 | GET /transactions/:id | 200 OK, transaction object |
| TX-006 | POST /transactions/:id/duplicate | 201 Created, new transaction |

---

## 6. Categories API (`categories.test.ts`)

| TC-ID | Test Case | Expected Result |
|-------|-----------|-----------------|
| CAT-001 | GET /categories without auth | 200 OK (optional auth) |
| CAT-002 | POST /categories with auth and valid payload | 201 Created |
| CAT-003 | POST /categories without required fields | 400 Bad Request |
| CAT-004 | GET /categories/user/list | 200 OK, user's categories |

---

## 7. Goals API (`goals.test.ts`)

| TC-ID | Test Case | Expected Result |
|-------|-----------|-----------------|
| GL-001 | GET /goals without valid auth | 401 or 403 |
| GL-002 | GET /goals with auth (empty) | 200 OK, empty list |
| GL-003 | POST /goals with valid payload | 201 Created |

---

## 8. Budgets API (`budgets.test.ts`)

| TC-ID | Test Case | Expected Result |
|-------|-----------|-----------------|
| BUD-001 | GET /budgets without valid auth | 401 or 403 |
| BUD-002 | POST /budgets with valid payload | 201 Created |

---

## 9. Currencies API (`currencies.test.ts`)

| TC-ID | Test Case | Expected Result |
|-------|-----------|-----------------|
| CUR-001 | GET /currencies | 200 OK, list of currencies |
| CUR-002 | GET /currencies/code/:code | 200 OK, currency object |
| CUR-003 | GET /currencies/:id | 200 OK, currency object |

---

## 10. Notifications API (`notifications.test.ts`)

| TC-ID | Test Case | Expected Result |
|-------|-----------|-----------------|
| NOT-001 | GET /notifications without valid auth | 401 or 403 |
| NOT-002 | GET /notifications with auth | 200 OK |
| NOT-003 | POST /notifications | 201 Created |
| NOT-004 | GET /notifications/unread/count | 200 OK, count object |

---

## 11. Tutorial API (`tutorial.test.ts`)

| TC-ID | Test Case | Expected Result |
|-------|-----------|-----------------|
| TUT-001 | GET /tutorial without valid auth | 401 or 403 |
| TUT-002 | GET /tutorial with auth | 200/201/404 (depends on creation) |

---

## 12. Exchange Rates API (`exchangeRates.test.ts`)

| TC-ID | Test Case | Expected Result |
|-------|-----------|-----------------|
| EX-001 | GET /exchange-rates/rate with valid params | 200 OK, rate object |
| EX-002 | GET /exchange-rates/rate with missing params | 400 Bad Request |
| EX-003 | POST /exchange-rates/convert | 200 OK, converted amount |

---

## 13. Service Tests (`__tests__/services/`)

| TC-ID | Test Case | Expected Result |
|-------|-----------|-----------------|
| SVC-W1 | wallet.service: createWallet, getUserWallets, getById, update, delete | Business logic verified |
| SVC-C1 | category.service: createCategory, listCategories, getById, update, delete | Business logic verified |
| SVC-CUR1 | currency.service: getAllCurrencies, getByCode, getById | Returns seeded data |
| SVC-P1 | pagination: paginate() structure and slice logic | Pure function tests |
| SVC-G1 | goal.service: create, getUserGoals, getGoalById, update, delete | Business logic verified |
| SVC-B1 | budget.service: create (valid dates), getUserBudgets, getById, update, delete; validation when startDate >= endDate | Business logic verified |
| SVC-N1 | notification.service: create, getUserNotifications, getUnreadCount, getById, markAsRead, markAllAsRead, delete, deleteAllRead | Business logic verified |
| SVC-T1 | tutorial.service: getTutorialByUser, upsert, completeStep, complete, reset | Business logic verified |

## 14. Controller Tests (`__tests__/controllers/`)

| TC-ID | Test Case | Expected Result |
|-------|-----------|-----------------|
| CTRL-W1 | wallet.controller: getUserWallets, getWalletById (success + error), createWallet, updateWallet, deleteWallet; 401 when no user, 400 when missing name | Service mock called correctly |
| CTRL-C1 | category.controller: list, create, update, delete with mocked services | Validation and delegation verified |
| CTRL-G1 | goal.controller: getUserGoals (401 + success), createGoal (400 + success), getById, update, delete | Service mock + status codes |
| CTRL-B1 | budget.controller: getUserBudgets (401 + success), createBudget (400 + success), getById, update, delete (400 when id missing) | Service mock + status codes |
| CTRL-TX1 | transaction.controller: getUserTransactions, create, getById, update, delete, duplicate (401/400 + success) | Service mock + status codes |
| CTRL-U1 | user.controller: getUserList, getUserById, getProfile, updateUserSettings, updateProfile, deleteUser, searchUsers (400 when q missing), changePassword (401, 400, 200) | Service mock + status codes |
| CTRL-N1 | notification.controller: getUserNotifications, getUnreadCount, getNotificationById, createNotification, markNotificationAsRead, markAllNotificationsAsRead (401 + 200), deleteNotification, deleteAllReadNotifications (401 + 200) | Service mock + status codes |
| CTRL-TUT1 | tutorial.controller: getTutorialByUser (401, 404, 200), upsertTutorial, completeTutorialStep (400 + 200), completeTutorial, resetTutorial | Service mock + status codes |
| CTRL-CUR1 | currency.controller: getAllCurrencies (pagination), getCurrencyByCode (404 + 200), getCurrencyById (404 + 200) | Service mock + status codes |
| CTRL-EX1 | exchangeRate.controller: updateRates (200/400), getRate (400 missing params, 404, 200), convert (400, 404, 200) | Service mock + status codes |

---

## Test Execution

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run only service + controller tests
npm test -- --testPathPattern="(services|controllers)"
```

---

## Mapping to API Test Plan

See `API_TEST_PLAN.md` in the project root for the full manual test plan. The automated tests above cover a subset of the manual plan for CI/CD and regression.
