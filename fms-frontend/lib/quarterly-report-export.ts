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
      margin-top: 32px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-stat {
      padding: 20px;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: #fcfcfc;
    }
    .stat-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .stat-value {
      font-size: 26px;
      font-weight: 800;
      color: var(--accent);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      table-layout: fixed;
    }
    th {
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--muted);
      padding: 10px 4px;
      border-bottom: 1px solid var(--accent);
    }
    td {
      font-size: 11px;
      padding: 12px 4px;
      border-bottom: 1px solid var(--rule);
      word-wrap: break-word;
    }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    
    .executive-summary {
      font-size: 14px;
      color: #374151;
      margin-bottom: 30px;
      line-height: 1.6;
    }

    .footer {
      position: absolute;
      bottom: 15mm;
      left: 20mm;
      right: 20mm;
      border-top: 1px solid var(--rule);
      padding-top: 10px;
      font-size: 10px;
      font-weight: 500;
      color: var(--muted);
      display: flex;
      justify-content: space-between;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .approval-section {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
      gap: 40px;
      page-break-inside: avoid;
    }
    .signature-line {
      flex: 1;
      border-top: 1px solid var(--ink);
      padding-top: 12px;
      font-size: 11px;
    }
    .no-data {
      padding: 20px;
      text-align: center;
      color: var(--muted);
      font-style: italic;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="report-container" id="report-content">
    <!-- Page 1: Cover -->
    <div class="page cover-page">
      <div class="company-logo" style="font-size: 32px; letter-spacing: 0.2em; color: var(--accent);">FINFLOW</div>
      <h1 class="report-title" style="margin-top: 20px;">Financial Performance Report</h1>
      <div class="report-period">Fiscal Period: ${period}</div>
      <div class="report-meta">
        <div style="margin-bottom: 4px;">Generation Date: <strong>${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong></div>
        <div>System: <strong>FINFLOW Management</strong></div>
      </div>
      
      <div class="footer">
        <div>FINFLOW Financial Systems</div>
        <div>Report Cover</div>
      </div>
    </div>

    <!-- Page 2: Summary and Data -->
    <div class="page">
      <div class="section-title" style="margin-top: 0;">Executive Summary</div>
      <div class="executive-summary">
        This document provides a consolidated overview of the financial activities for <strong>${period}</strong>. 
        It integrates departmental budget allocations, cash disbursement cycles, and verified operational expenses 
        to facilitate high-level capital oversight and liquidity management.
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
        <colgroup>
          <col style="width: 35%">
          <col style="width: 25%">
          <col style="width: 15%">
          <col style="width: 15%">
          <col style="width: 10%">
        </colgroup>
        <thead>
          <tr>
            <th>Budget Name</th>
            <th>Department</th>
            <th>Allocated</th>
            <th>Actual Spent</th>
            <th class="text-right">Util.</th>
          </tr>
        </thead>
        <tbody>
          ${pBudgets.length > 0 ? pBudgets.map((b) => `
            <tr>
              <td class="font-bold">${b.name}</td>
              <td>${b.department || "N/A"}</td>
              <td>${money(b.amount)}</td>
              <td>${money(b.spent)}</td>
              <td class="text-right">${b.amount > 0 ? ((b.spent / b.amount) * 100).toFixed(0) : 0}%</td>
            </tr>
          `).join("") : `<tr><td colspan="5" class="no-data">No budget data available for this period.</td></tr>`}
        </tbody>
      </table>

      <div class="footer">
        <div>FINFLOW Financial Systems</div>
        <div>Page 2</div>
      </div>
    </div>

    <!-- Page 3: Detailed Logs -->
    ${(pRequests.length > 0 || pExpenses.length > 0) ? `
    <div class="page">
      ${pRequests.length > 0 ? `
      <div class="section-title" style="margin-top: 0;">Cash Disbursement Log</div>
      <table>
        <colgroup>
          <col style="width: 40%">
          <col style="width: 25%">
          <col style="width: 15%">
          <col style="width: 20%">
        </colgroup>
        <thead>
          <tr>
            <th>Purpose</th>
            <th>Department</th>
            <th>Status</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${pRequests.slice(0, 12).map((r) => `
            <tr>
              <td>${r.title}</td>
              <td>${r.department || "N/A"}</td>
              <td style="text-transform: capitalize;">${r.status}</td>
              <td class="text-right font-bold">${money(r.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      ` : ""}

      ${pExpenses.length > 0 ? `
      <div class="section-title">Expense Verification Log</div>
      <table>
        <colgroup>
          <col style="width: 40%">
          <col style="width: 25%">
          <col style="width: 15%">
          <col style="width: 20%">
        </colgroup>
        <thead>
          <tr>
            <th>Description</th>
            <th>Department</th>
            <th>Status</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${pExpenses.slice(0, 12).map((e) => `
            <tr>
              <td>${e.description}</td>
              <td>${e.department || "N/A"}</td>
              <td style="text-transform: capitalize;">${e.status}</td>
              <td class="text-right font-bold">${money(e.amount)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      ` : ""}

      <div class="approval-section">
        <div class="signature-line">
          <strong>Finance Reviewer</strong><br/>
          <span style="font-size: 9px; color: var(--muted);">Authorized Signature & Date</span>
        </div>
        <div class="signature-line">
          <strong>Approving Authority</strong><br/>
          <span style="font-size: 9px; color: var(--muted);">Authorized Signature & Date</span>
        </div>
      </div>

      <div class="footer">
        <div>FINFLOW Financial Systems</div>
        <div>Page 3</div>
      </div>
    </div>
    ` : ""}
  </div>
</body>
</html>`
}
