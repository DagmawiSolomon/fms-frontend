# Finance Management System (FMS) API Documentation

**Base URL**: `https://fms-app-production-5b62.up.railway.app/`  
**Authentication**: Bearer Token in `Authorization` header.

---

## 1. Auth & User Management

### Register User
- **Method**: `POST`
- **Path**: `/register`
- **Body**:
  ```json
  {
    "name": "string",
    "role": "string",
    "email": "string",
    "password": "string",
    "department": "string"
  }
  ```

### Login User
- **Method**: `POST`
- **Path**: `/login`
- **Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

### Promote User
- **Method**: `POST`
- **Path**: `/promote`
- **Body**: `{"username": "string"}`

### List All Users
- **Method**: `GET`
- **Path**: `/users`

### Get Current User Profile
- **Method**: `GET`
- **Path**: `/users/me`

### Get User Profile
- **Method**: `GET`
- **Path**: `/users/{id}`

### Change User Role
- **Method**: `PATCH`
- **Path**: `/users/{id}/role`
- **Body**: `{"Role": "string"}`

---

## 2. Budgets

### Create Budget
- **Method**: `POST`
- **Path**: `/budgets/`
- **Body**:
  ```json
  {
    "department": "string",
    "amount": number,
    "period": "string"
  }
  ```

### List All Budgets
- **Method**: `GET`
- **Path**: `/budgets/`

### Get Specific Budget
- **Method**: `GET`
- **Path**: `/budgets/{id}`

### Update Budget
- **Method**: `PATCH`
- **Path**: `/budgets/{id}`
- **Body**: `{"spent_amount": number}`

### Approve Budget
- **Method**: `POST`
- **Path**: `/budgets/{id}/approve`

### Reject Budget
- **Method**: `POST`
- **Path**: `/budgets/{id}/reject`
- **Body**: `{"reason": "string"}`

### Budget Summary
- **Method**: `GET`
- **Path**: `/budgets/summary`

---

## 3. Cash Requests

### Create Cash Request
- **Method**: `POST`
- **Path**: `/cash-requests/`
- **Body**:
  ```json
  {
    "purpose": "string",
    "amount": number
  }
  ```

### List All Cash Requests
- **Method**: `GET`
- **Path**: `/cash-requests/`

### Get Specific Cash Request
- **Method**: `GET`
- **Path**: `/cash-requests/{id}`

### Approve Cash Request
- **Method**: `POST`
- **Path**: `/cash-requests/{id}/approve`

### Disburse Cash Request
- **Method**: `POST`
- **Path**: `/cash-requests/{id}/disburse`

---

## 4. Expenses & Receipts

### Create Expense
- **Method**: `POST`
- **Path**: `/expenses`
- **Body**:
  ```json
  {
    "budget_id": "string",
    "title": "string",
    "amount": number,
    "category": "string",
    "description": "string",
    "incurred_at": "ISO Date"
  }
  ```

### List All Expenses
- **Method**: `GET`
- **Path**: `/expenses`

### Get Specific Expense
- **Method**: `GET`
- **Path**: `/expenses/{id}`

### Verify Expense
- **Method**: `PATCH`
- **Path**: `/expenses/{id}/verify`
- **Body**: `{"verified": true}`

### Upload Receipt
- **Method**: `POST`
- **Path**: `/expenses/{id}/receipts`
- **Body**: Multipart form-data with `receipt` file.

---

## 5. Reports

### Overview Report
- **Method**: `GET`
- **Path**: `/reports/overview`

### Budgets Report
- **Method**: `GET`
- **Path**: `/reports/budgets`

### Expenses Report
- **Method**: `GET`
- **Path**: `/reports/expenses`

### Cash Requests Report
- **Method**: `GET`
- **Path**: `/reports/cash-requests`

---

## 6. Common Data Structures & Normalization

### Budget Object
```json
{
  "budget_id": "string",
  "department": "string",
  "amount": 50000,
  "spent_amount": 400,
  "status": "approved",
  "period": "monthly",
  "created_at": "ISO Date"
}
```

### Cash Request Object
```json
{
  "request_id": "string",
  "purpose": "soaps",
  "amount": 400,
  "status": "approved",
  "requested_by": "elon dusk",
  "department": "N/A",
  "created_at": "ISO Date"
}
```

### Expense Object
```json
{
  "expense_id": "string",
  "description": "Office supplies",
  "amount": 300,
  "category": "Stationery",
  "department": "IT",
  "verified": false,
  "created_by": "elon dusk",
  "created_at": "ISO Date",
  "receipt_attached": false
}
```

### Summary / Overview Response
```json
{
  "total_budgets": 150000,
  "total_expenses": 45000,
  "pending_approvals": 5,
  "budget_utilization": 30
}
```
