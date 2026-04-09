# PFM API – Test Statistics

## Overview

This document provides a template and instructions for tracking test statistics for the PFM backend API.

---

## 1. Test Execution Summary

Run `npm test` or `npm run test:coverage` and update this section periodically.

| Metric | Value |
|--------|-------|
| **Total Test Suites** | 30 |
| **Total Test Cases** | 196 |
| **Pass Rate** | 100% |
| **Execution Time** | ~16 s |
| **Last Run** | Update after `npm test` |

---

## 2. Coverage by Module

| Module | Test File | Test Count | Status |
|--------|-----------|------------|--------|
| Auth | auth.test.ts | 8 | ✅ |
| OTP | otp.test.ts | 3 | ✅ |
| Users | users.test.ts | 3 | ✅ |
| Wallets | wallets.test.ts | 8 | ✅ |
| Transactions | transactions.test.ts | 6 | ✅ |
| Categories | categories.test.ts | 4 | ✅ |
| Goals | goals.test.ts | 3 | ✅ |
| Budgets | budgets.test.ts | 2 | ✅ |
| Currencies | currencies.test.ts | 3 | ✅ |
| Notifications | notifications.test.ts | 4 | ✅ |
| Tutorial | tutorial.test.ts | 2 | ✅ |
| Exchange Rates | exchangeRates.test.ts | 3 | ✅ |
| **Services** | | | |
| Wallet Service | services/wallet.service.test.ts | 9 | ✅ |
| Category Service | services/category.service.test.ts | 9 | ✅ |
| Currency Service | services/currency.service.test.ts | 3 | ✅ |
| Pagination | services/pagination.test.ts | 5 | ✅ |
| Goal Service | services/goal.service.test.ts | 5 | ✅ |
| Budget Service | services/budget.service.test.ts | 6 | ✅ |
| Notification Service | services/notification.service.test.ts | 9 | ✅ |
| Tutorial Service | services/tutorial.service.test.ts | 5 | ✅ |
| **Controllers** | | | |
| Wallet Controller | controllers/wallet.controller.test.ts | 8 | ✅ |
| Category Controller | controllers/category.controller.test.ts | 8 | ✅ |
| Goal Controller | controllers/goal.controller.test.ts | 6 | ✅ |
| Budget Controller | controllers/budget.controller.test.ts | 6 | ✅ |
| Transaction Controller | controllers/transaction.controller.test.ts | 7 | ✅ |
| User Controller | controllers/user.controller.test.ts | 12 | ✅ |
| Notification Controller | controllers/notification.controller.test.ts | 10 | ✅ |
| Tutorial Controller | controllers/tutorial.controller.test.ts | 7 | ✅ |
| Currency Controller | controllers/currency.controller.test.ts | 5 | ✅ |
| Exchange Rate Controller | controllers/exchangeRate.controller.test.ts | 6 | ✅ |

---

## 3. Coverage by Requirement (Traceability)

| Requirement Area | Total Reqs | Covered | % |
|------------------|------------|---------|---|
| Authentication | 7 | 7 | 100% |
| Users | 3 | 3 | 100% |
| Wallets | 4 | 4 | 100% |
| Transactions | 4 | 4 | 100% |
| Categories | 3 | 3 | 100% |
| Goals | 2 | 2 | 100% |
| Budgets | 2 | 2 | 100% |
| Currencies | 2 | 2 | 100% |
| Notifications | 3 | 3 | 100% |
| Tutorial | 2 | 2 | 100% |
| Exchange Rates | 3 | 3 | 100% |
| OTP | 2 | 2 | 100% |

---

## 4. Code Coverage (from Jest)

Run `npm run test:coverage` and paste the summary:

```
----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   (x)   |   (x)    |   (x)   |   (x)   |
----------------------|---------|----------|---------|---------|
```

---

## 5. Defect Tracking

| ID | Test Case | Failure Type | Status |
|----|-----------|--------------|--------|
| - | - | - | - |

---

## 6. How to Update

1. Run tests: `npm test`
2. Run coverage: `npm run test:coverage`
3. Update "Test Execution Summary" with pass/fail counts and time
4. Update "Code Coverage" with Jest output
5. Add any failing tests to "Defect Tracking"
