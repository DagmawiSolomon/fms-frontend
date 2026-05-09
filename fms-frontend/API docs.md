
Public
ENVIRONMENT
No Environment
LAYOUT
Double Column
LANGUAGE
cURL - cURL
FMS
Introduction
POST
registerUser
POST
loginUser
GET
promoteUser
GET
GetAllUser
GET
GetspecificProfile
GET
createBudget
GET
ChangeUserRole
GET
GetALLBudgets
GET
DisburseCashRequest
GET
GetSpecificBudget
GET
UpdateBudget
GET
ApproveBudget
GET
RejectBudget
GET
GetBudgetSummary
GET
CreateCashRequest
GET
ApproveCashRequest
GET
GetAllCashRequests
GET
GetSpecificCashRequest
POST
GetAllExpenses
POST
GetSpecificExpenses
POST
VerifyExpenses
POST
createExpense
POST
UploadReceipt
POST
ReadReceiptFile
GET
ReportOverview
GET
ReportBudgets
GET
ReportCashRequests
GET
ReportExpenses
GET
New Request
FMS
GET
ReportCashRequests
Example Request
ReportBudgets Copy
View More
curl
curl --location 'http://localhost:8080/reports/cash-requests' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjk0ZmE1YzViMTU0NDM4Yjg3MTMzYjc1IiwiZW1haWwiOiJmaW5hbmNlMEBnbWFpbC5jb20iLCJyb2xlIjoiRmluYW5jZSBUZWFtIiwiaXNzIjoiZm1zLWFwaSIsImV4cCI6MTc2NzcxNTk1OSwiaWF0IjoxNzY3NjI5NTU5fQ.18mDXcg6fbHq1ugBpCbcHXIVKzZoAkEZWIWv5Irap_M'
200 OK
Example Response
Body
Headers (3)
View More
[
  {
    "request_id": "695162b1ad6d457c9b8e22e1",
    "purpose": "soaps",
    "amount": 400,
    "status": "approved",
    "requested_by": "elon dusk",
    "department": "N/A",
    "created_at": "2025-12-28T17:02:41.152Z"
  },
  {
    "request_id": "69517106ad6d457c9b8e22e3",
    "purpose": "salary",
    "amount": 4000,
    "status": "disbursed",
    "requested_by": "elon dusk",
    "department": "N/A",
    "created_at": "2025-12-28T18:03:50.177Z",
    "disbursed_at": "2025-12-28T18:09:55.337Z"
  }
]
GET
ReportExpenses
Example Request
ReportCashRequests Copy
View More
curl
curl --location 'http://localhost:8080/reports/expenses' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjk0ZmE1YzViMTU0NDM4Yjg3MTMzYjc1IiwiZW1haWwiOiJmaW5hbmNlMEBnbWFpbC5jb20iLCJyb2xlIjoiRmluYW5jZSBUZWFtIiwiaXNzIjoiZm1zLWFwaSIsImV4cCI6MTc2NzcxNTk1OSwiaWF0IjoxNzY3NjI5NTU5fQ.18mDXcg6fbHq1ugBpCbcHXIVKzZoAkEZWIWv5Irap_M'
200 OK
Example Response
Body
Headers (3)
View More
[
  {
    "expense_id": "6952881a5b93dab4f3295f8e",
    "description": "Office supplies",
    "amount": 300,
    "category": "Stationery",
    "department": "IT",
    "verified": false,
    "created_by": "elon dusk",
    "created_at": "2025-12-29T13:54:34.174Z",
    "receipt_attached": false
  },
  {
    "expense_id": "695be5a0b70141a18328c40f",
    "description": "Catered lunch for sprint review",
    "amount": 120.5,
    "category": "Meals",
    "department": "cleaning",
    "verified": true,
    "created_by": "elon dusk",
    "created_at": "2026-01-05T16:24:00.022Z",
    "receipt_attached": false
  }
]
GET
New Request
Example Request
New Request
curl
curl --location ''
Example Response
Body
Headers (0)
No response body
This request doesn't return any response body