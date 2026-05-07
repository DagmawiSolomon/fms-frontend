1. System Overview
1.1 Purpose & Goals
The Finance Management System (FMS) is a microservice-based platform designed to digitize and centralize
an organization's financial operations. It replaces disconnected manual processes, spreadsheets, email chains,
and paper trails with a unified, auditable, and role-governed digital workflow.
Core goals of the system:
• Centralize budget creation, approval, petty cash, expense tracking, and cash disbursement.
• Enforce financial governance through role-based access control and approval workflows.
• Provide real-time visibility into fund utilization across all departments.
• Automate repetitive tasks such as threshold alerts and approval routing.
• Deliver actionable financial reporting and analytics to leadership.
1.2 Scope
The FMS is scoped to serve a single organization across multiple departments. The platform is architected for
phased delivery: Phase 1 delivers the Petty Cash microservice as a standalone module, followed by six
subsequent phases covering Authentication, Budget Management, Cash Requests, Expense Tracking, and
Reporting.
1.3 Key Stakeholders & Users
Role Responsibilities & System Interaction
CEO / COO Set weekly petty cash limits; approve high-value budgets; view executive
reports.
Finance Officer Verify transactions and expenses; disburse approved cash; manage petty
cash records.
Department Manager Submit budget requests and cash requests; track departmental spending.
Staff / Employee Record petty cash expenditures; upload receipts; view personal expense
history.
System Administrator Manage users, roles, and system configuration
2. Functional Requirements
2.1 Petty Cash Management
• CEO/COO can set and update a weekly petty cash spending limit.
• Finance team records transactions manually or via receipt upload.
• System enforces the weekly limit and blocks overspending.
• Automated alert triggered when 80% of the weekly limit is consumed.
• Dashboard displays total spent, remaining balance, and expense categories.
• Finance Officer can verify individual transactions.
• System generates a weekly summary of petty cash activity.
2.2 Budget Management
• Department managers submit budget requests per department.
• Leadership approves or rejects budget requests.
• Approved budgets track allocation vs. actual spending in real time.
• Budget requests can be updated before approval.
• Budget summary shows remaining balance and usage percentage.
2.3 Cash Request Management
• Staff submit cash disbursement requests, either linked to an approved budget or as out-of-budget
requests.
• Requests go through a defined approval workflow.
• Finance Officers disburse funds only after approval.
• Full audit trail is maintained for each request.
2.4 Expense Tracking
• Expenses can be recorded manually or via AI-scanned receipt upload.
• Expenses are linked to relevant budgets and cash requests.
• Finance Officers verify recorded expenses.
• Receipts are stored and associated with specific expense records.
4
2.5 Reporting & Analytics
• High-level financial overview across all modules.
• Drill-down reports per module: budgets, petty cash, cash requests, expenses.
• Data aggregation across all microservices into a unified reporting layer.
2.6 User & Access Management
• Centralized user authentication via JWT-based Auth Service.
• Role-based access control (RBAC) enforced at each service level.
• Administrators can view, manage, and update user roles.
• Each user can view their own profile.
. Use Case Analysis
5.1 Actors
Actor Description
CEO / COO Executive; sets financial limits and approves high-level budgets.
Finance Officer Operational finance role; verifies, disburses, and manages transaction records.
Department Manager Submits and tracks budget and cash requests for their department.
Employee / Staff Records petty cash expenses and uploads receipts.
System (Automated) Fires threshold alerts, routes notifications, logs audit events.
5.2 Major Use Cases
UC-01: Set Weekly Petty Cash Limit
Field Detail
Actor CEO / COO
Pre-condition User is authenticated and has CEO/COO role.
Main Flow Actor navigates to Petty Cash Settings → inputs new weekly limit → submits PATCH
/petty-cash/settings.
Post-condition New limit is persisted; all subsequent transactions are validated against it.
Exception If limit is lower than current week's spending, the system should warn — not silently
block.
UC-02: Record a Petty Cash Transaction
Field Detail
Actor Finance Officer / Staff
Pre-condition A valid weekly limit exists for the current period.
Main Flow Actor records amount, description, payment mode, and date → POST
/petty-cash/transactions → optionally uploads receipt via POST .../receipts.
Post-condition Transaction is recorded; weekly spent total is updated; alert fires if 80% threshold is
crossed.
Exception Transaction is rejected if it would exceed the weekly limit.
8
UC-03: Approve a Budget Request
Field Detail
Actor Leadership (CEO/COO/Finance Lead)
Pre-condition A budget request exists in 'pending' status.
Main Flow Approver reviews budget details → POST /budgets/{budgetId}/approve → system
updates status and notifies requester.
Post-condition Budget becomes active; spending can be tracked against it.
Exception Leadership may reject with a reason via POST /budgets/{budgetId}/reject.
UC-04: Submit and Disburse a Cash Request
Field Detail
Actor Employee (submit); Finance Officer (disburse)
Pre-condition Employee is authenticated; optionally a budget exists to link the request.
Main Flow Employee submits POST /cash-requests → approver reviews and POSTs approve →
Finance Officer disburses via POST .../disburse.
Post-condition Cash disbursed; budget balance (if linked) decremented; audit log updated.
Exception If request is out-of-budget, a separate approval track may apply (assumption)