# PFM API – Test Requirements

## 1. Purpose

This document defines the test requirements for the Personal Finance Management (PFM) backend API. Tests ensure correctness, reliability, and maintainability of all REST endpoints and business logic.

---

## 2. Scope

### 2.1 In Scope

- **API Integration Tests**: All REST endpoints under `/api/*`
- **Authentication & Authorization**: JWT validation, protected routes, role-based access
- **Data Validation**: Request body validation, query params, path params
- **Business Logic**: Wallets, transactions, budgets, goals, categories
- **Error Handling**: 400, 401, 403, 404, 500 responses

### 2.2 Out of Scope (Phase 1)

- **Unit Tests** for individual service functions
- **End-to-End (E2E)** tests with real frontend
- **Performance/Load** testing
- **Security penetration** testing

---

## 3. Functional Requirements

### 3.1 Authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | Register with valid OTP returns 201 and tokens | High |
| AUTH-02 | Register without OTP or invalid OTP fails | High |
| AUTH-03 | Login with valid credentials returns 200 and tokens | High |
| AUTH-04 | Login with invalid credentials returns 400 | High |
| AUTH-05 | Logout with valid token returns 200 | Medium |
| AUTH-06 | Protected routes return 401 without token | High |
| AUTH-07 | Protected routes return 403 with invalid token | High |

### 3.2 Users

| ID | Requirement | Priority |
|----|-------------|----------|
| USR-01 | GET /profile returns user data with valid JWT | High |
| USR-02 | PUT /profile updates user data | Medium |
| USR-03 | Profile endpoints reject unauthenticated requests | High |

### 3.3 Wallets

| ID | Requirement | Priority |
|----|-------------|----------|
| WL-01 | CRUD operations require authentication | High |
| WL-02 | Create wallet with valid name and balance | High |
| WL-03 | List wallets returns paginated results | Medium |
| WL-04 | Get by ID returns 404 for non-existent wallet | Medium |

### 3.4 Transactions

| ID | Requirement | Priority |
|----|-------------|----------|
| TX-01 | Create transaction requires amount, type, category, wallet, date | High |
| TX-02 | Transaction type must be income, expense, or transfer | High |
| TX-03 | Duplicate transaction creates a copy | Medium |
| TX-04 | Filters (type, category, wallet, date range) work correctly | Medium |

### 3.5 Categories

| ID | Requirement | Priority |
|----|-------------|----------|
| CAT-01 | Public GET /categories works without auth | Medium |
| CAT-02 | Create category requires auth and name, type | High |
| CAT-03 | User list returns only user's custom categories | Medium |

### 3.6 Goals

| ID | Requirement | Priority |
|----|-------------|----------|
| GL-01 | All goal endpoints require authentication | High |
| GL-02 | Create goal requires title, targetAmount, dueDate | High |

### 3.7 Budgets

| ID | Requirement | Priority |
|----|-------------|----------|
| BUD-01 | All budget endpoints require authentication | High |
| BUD-02 | Create budget requires amount, category, period, startDate, endDate | High |

### 3.8 Currencies

| ID | Requirement | Priority |
|----|-------------|----------|
| CUR-01 | Currencies are publicly readable (no auth) | Medium |
| CUR-02 | Get by code and ID work correctly | Medium |

### 3.9 Notifications

| ID | Requirement | Priority |
|----|-------------|----------|
| NOT-01 | All notification endpoints require authentication | High |
| NOT-02 | Create notification with title and content | Medium |
| NOT-03 | Unread count returns correct number | Medium |

### 3.10 Tutorial

| ID | Requirement | Priority |
|----|-------------|----------|
| TUT-01 | Tutorial endpoints require authentication | High |
| TUT-02 | Get returns 200 or 404 if not yet created | Medium |

### 3.11 Exchange Rates

| ID | Requirement | Priority |
|----|-------------|----------|
| EX-01 | Get rate with baseCurrency and targetCurrency | Medium |
| EX-02 | Convert amount between currencies | Medium |
| EX-03 | Missing params return 400 | Medium |

### 3.12 OTP

| ID | Requirement | Priority |
|----|-------------|----------|
| OTP-01 | Send OTP for valid email returns 200 | High |
| OTP-02 | Send OTP with missing email returns 400 | High |

---

## 4. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | Tests run in < 60 seconds total |
| NFR-02 | Tests use in-memory MongoDB (no external DB) |
| NFR-03 | Tests do not send real emails (mailer mocked) |
| NFR-04 | Tests are isolated (no shared state between tests) |
| NFR-05 | Tests can run in CI/CD pipeline |

---

## 5. Test Environment

- **Runtime**: Node.js with Jest
- **Database**: MongoDB Memory Server
- **Auth**: Bearer token (JWT) in Authorization header
- **Base URL**: N/A (in-process request to Express app)

---

## 6. Traceability

Each test case in `TEST_CASES.md` maps to one or more requirements above. Test statistics in `TEST_STATISTICS.md` track coverage of these requirements.
