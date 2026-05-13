import { fmsApi, normalizeBudgets, normalizeCashRequests, normalizeExpenses, filterByPeriod, filterByDepartment, enrichExpensesWithBudgetDepartments } from "@/lib/fms"
import type { FmsSessionUser } from "@/lib/fms"

type ReportRole = "employee" | "manager" | "finance" | "admin"

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export async function buildQuarterlyReportHtml(period: string, user: FmsSessionUser | null, role: ReportRole) {
  const [budgetsRes, requestsRes, expensesRes] = await Promise.all([
    fmsApi.getBudgets(),
    fmsApi.getCashRequests(),
    fmsApi.getExpenses(),
  ])

  let budgets = normalizeBudgets(budgetsRes)
  let requests = normalizeCashRequests(requestsRes)
  let expenses = normalizeExpenses(expensesRes)
  expenses = enrichExpensesWithBudgetDepartments(expenses, budgets)
  budgets = filterByDepartment(budgets, user, role)
  requests = filterByDepartment(requests, user, role)
  expenses = filterByDepartment(expenses, user, role)

  const pBudgets = filterByPeriod(budgets, period)
  const pRequests = filterByPeriod(requests, period)
  const pExpenses = filterByPeriod(expenses, period)

  const approvedBudgets = pBudgets.filter((b) => b.status === "approved")
  const pendingBudgets = pBudgets.filter((b) => b.status === "pending" || b.status === "draft")
  const disbursedRequests = pRequests.filter((r) => r.status === "disbursed")
  const pendingRequests = pRequests.filter((r) => r.status === "pending" || r.status === "approved")
  const verifiedExpenses = pExpenses.filter((e) => e.status === "verified")
  const pendingExpenses = pExpenses.filter((e) => e.status === "pending")

  const totalApprovedBudget = approvedBudgets.reduce((sum, b) => sum + b.amount, 0)
  const totalPendingBudget = pendingBudgets.reduce((sum, b) => sum + b.amount, 0)
  const totalDisbursed = disbursedRequests.reduce((sum, r) => sum + r.amount, 0)
  const totalPendingRequest = pendingRequests.reduce((sum, r) => sum + r.amount, 0)
  const totalVerifiedExpenses = verifiedExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalPendingExpense = pendingExpenses.reduce((sum, e) => sum + e.amount, 0)

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Quarterly Financial Report ${period}</title>
  <style>
    @page { size: A4; margin: 0; }
    :root { 
      --ink: #1a1a1a; 
      --muted: #4b5563; 
      --rule: #e5e7eb; 
      --paper: #ffffff; 
      --accent: #111827; 
      --header-bg: #f9fafb;
    }
    body { 
      margin: 0; 
      background: #f3f4f6; 
      color: var(--ink); 
      font-family: "Inter", -apple-system, sans-serif; 
      line-height: 1.5;
    }
    .report-container {
      width: 210mm;
      margin: 0 auto;
      background: var(--paper);
      box-shadow: 0 0 20px rgba(0,0,0,0.05);
    }
    .page {
      width: 210mm;
      height: 297mm;
      padding: 25mm 20mm;
      box-sizing: border-box;
      position: relative;
      page-break-after: always;
    }
    
    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: var(--header-bg);
    }
    .company-logo {
      font-weight: 800;
      font-size: 24px;
      letter-spacing: -0.02em;
      margin-bottom: 80mm;
    }
    .report-title {
      font-size: 36px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    .report-period {
      font-size: 18px;
      color: var(--muted);
      margin-bottom: 60mm;
    }
    .report-meta {
      font-size: 14px;
      color: var(--muted);
    }
    .report-meta strong {
      color: var(--ink);
    }

    /* Standard Page Content */
    .section-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      border-bottom: 2px solid var(--accent);
      padding-bottom: 4px;
      margin-bottom: 16px;
      margin-top: 24px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-stat {
      padding: 16px;
      border: 1px solid var(--rule);
      border-radius: 4px;
    }
    .stat-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--muted);
      padding: 8px 4px;
      border-bottom: 1px solid var(--ink);
    }
    td {
      font-size: 11px;
      padding: 10px 4px;
      border-bottom: 1px solid var(--rule);
    }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    
    .executive-summary {
      font-size: 13px;
      color: #374151;
      margin-bottom: 30px;
    }

    .footer {
      position: absolute;
      bottom: 20mm;
      left: 20mm;
      right: 20mm;
      border-top: 1px solid var(--rule);
      padding-top: 8px;
      font-size: 10px;
      color: var(--muted);
      display: flex;
      justify-content: space-between;
    }
    
    .approval-section {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
      gap: 40px;
    }
    .signature-line {
      flex: 1;
      border-top: 1px solid var(--ink);
      padding-top: 8px;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="report-container" id="report-content">
    <!-- Page 1: Cover -->
    <div class="page cover-page">
      <div class="company-logo">FMS FINANCE SYSTEM</div>
      <h1 class="report-title">Financial Performance Report</h1>
      <div class="report-period">Fiscal Period: ${period}</div>
      <div class="report-meta">
        <div>Prepared by: <strong>${user?.name || "System Administrator"}</strong></div>
        <div>Role: <strong>${role.toUpperCase()}</strong></div>
        <div>Date: <strong>${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong></div>
      </div>
    </div>

    <!-- Page 2: Summary -->
    <div class="page">
      <div class="section-title">Executive Summary</div>
      <div class="executive-summary">
        This report provides a comprehensive overview of the financial activities for the period ${period}. 
        It consolidates departmental budgets, cash disbursement requests, and verified operational expenses 
        to provide a high-level view of capital utilization and liquidity.
      </div>

      <div class="summary-grid">
        <div class="summary-stat">
          <div class="stat-label">Total Approved Budget</div>
          <div class="stat-value">${money(totalApprovedBudget)}</div>
        </div>
        <div class="summary-stat">
          <div class="stat-label">Actual Operational Spend</div>
          <div class="stat-value">${money(totalVerifiedExpenses)}</div>
        </div>
        <div class="summary-stat">
          <div class="stat-label">Total Cash Disbursed</div>
          <div class="stat-value">${money(totalDisbursed)}</div>
        </div>
        <div class="summary-stat">
          <div class="stat-label">Liquidity Efficiency</div>
          <div class="stat-value">${totalApprovedBudget > 0 ? ((totalVerifiedExpenses / totalApprovedBudget) * 100).toFixed(1) : 0}%</div>
        </div>
      </div>

      <div class="section-title">Budget Allocation Detail</div>
      <table>
        <thead>
          <tr>
            <th>Budget Name</th>
            <th>Department</th>
            <th>Allocated</th>
            <th>Actual Spent</th>
            <th class="text-right">Utilization</th>
          </tr>
        </thead>
        <tbody>
          ${pBudgets.map((b) => `
            <tr>
              <td class="font-bold">${b.name}</td>
              <td>${b.department || "N/A"}</td>
              <td>${money(b.amount)}</td>
              <td>${money(b.spent)}</td>
              <td class="text-right">${b.amount > 0 ? ((b.spent / b.amount) * 100).toFixed(0) : 0}%</td>
            </tr>
          `).join("") || `<tr><td colspan="5">No budget data recorded.</td></tr>`}
        </tbody>
      </table>

      <div class="footer">
        <div>Confidential - Internal Use Only</div>
        <div>Page 2 of 3</div>
      </div>
    </div>

    <!-- Page 3: Transaction Detail -->
    <div class="page">
      <div class="section-title">Cash Disbursement Log</div>
      <table>
        <thead>
          <tr>
            <th>Purpose</th>
            <th>Department</th>
            <th>Status</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${pRequests.slice(0, 15).map((r) => `
            <tr>
              <td>${r.title}</td>
              <td>${r.department || "N/A"}</td>
              <td>${r.status.toUpperCase()}</td>
              <td class="text-right font-bold">${money(r.amount)}</td>
            </tr>
          `).join("") || `<tr><td colspan="4">No requests recorded.</td></tr>`}
        </tbody>
      </table>

      <div class="section-title">Expense Verification Log</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Department</th>
            <th>Status</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${pExpenses.slice(0, 15).map((e) => `
            <tr>
              <td>${e.description}</td>
              <td>${e.department || "N/A"}</td>
              <td>${e.status.toUpperCase()}</td>
              <td class="text-right font-bold">${money(e.amount)}</td>
            </tr>
          `).join("") || `<tr><td colspan="4">No expenses recorded.</td></tr>`}
        </tbody>
      </table>

      <div class="approval-section">
        <div class="signature-line">
          <strong>Finance Reviewer</strong><br/>
          Name & Date
        </div>
        <div class="signature-line">
          <strong>Approving Authority</strong><br/>
          Name & Date
        </div>
      </div>

      <div class="footer">
        <div>Confidential - Internal Use Only</div>
        <div>Page 3 of 3</div>
      </div>
    </div>
  </div>
</body>
</html>`
}
