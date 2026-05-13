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
    @page { size: A4; margin: 18mm; }
    :root { --ink: #151515; --muted: #5f5a52; --rule: #d7d0c4; --paper: #fbf8f2; --accent: #7a5a2b; }
    body { margin: 0; background: #eee7db; color: var(--ink); font-family: "Georgia", "Times New Roman", serif; }
    .page { width: 100%; background: var(--paper); padding: 0; }
    .header { border-bottom: 1px solid var(--rule); padding-bottom: 14px; margin-bottom: 18px; }
    h1 { margin: 0; font-size: 30px; letter-spacing: 0.04em; text-transform: uppercase; }
    .subtitle { margin-top: 6px; color: var(--muted); font-size: 12px; }
    .meta { display: flex; justify-content: space-between; gap: 16px; margin-top: 10px; font-size: 11px; color: var(--muted); }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 18px 0; }
    .card { border: 1px solid var(--rule); padding: 12px 14px; border-radius: 10px; background: #fffdf9; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); margin-bottom: 6px; }
    .value { font-size: 22px; font-weight: 700; }
    .small { font-size: 11px; color: var(--muted); margin-top: 3px; }
    .section { margin-top: 18px; }
    .section h2 { font-size: 16px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.04em; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border-top: 1px solid var(--rule); padding: 8px 6px; text-align: left; vertical-align: top; }
    th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
    .split { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .note { margin-top: 14px; font-size: 10px; color: var(--muted); }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>Quarterly Financial Report</h1>
      <div class="subtitle">Prepared in a print-ready report layout for ${period}</div>
      <div class="meta">
        <div>Role: ${role}</div>
        <div>Total approved budget: ${money(totalApprovedBudget)}</div>
        <div>Generated: ${new Date().toLocaleString()}</div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="label">Approved Budget</div>
        <div class="value">${money(totalApprovedBudget)}</div>
        <div class="small">${approvedBudgets.length} approved items</div>
      </div>
      <div class="card">
        <div class="label">Disbursed Cash</div>
        <div class="value">${money(totalDisbursed)}</div>
        <div class="small">${disbursedRequests.length} disbursed requests</div>
      </div>
      <div class="card">
        <div class="label">Verified Expenses</div>
        <div class="value">${money(totalVerifiedExpenses)}</div>
        <div class="small">${verifiedExpenses.length} verified records</div>
      </div>
    </div>

    <div class="split">
      <div class="card">
        <div class="label">Pending Budget Requests</div>
        <div class="value">${money(totalPendingBudget)}</div>
        <div class="small">${pendingBudgets.length} items awaiting approval</div>
      </div>
      <div class="card">
        <div class="label">Pending Requests & Expenses</div>
        <div class="value">${money(totalPendingRequest + totalPendingExpense)}</div>
        <div class="small">${pendingRequests.length} cash requests and ${pendingExpenses.length} expenses still open</div>
      </div>
    </div>

    <div class="section">
      <h2>Budget Summary</h2>
      <table>
        <thead><tr><th>Name</th><th>Department</th><th>Status</th><th>Amount</th><th>Spent</th></tr></thead>
        <tbody>
          ${pBudgets.slice(0, 10).map((b) => `<tr><td>${b.name}</td><td>${b.department ?? "Unassigned"}</td><td>${b.status}</td><td>${money(b.amount)}</td><td>${money(b.spent)}</td></tr>`).join("") || `<tr><td colspan="5">No budget data for ${period}</td></tr>`}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Cash Requests</h2>
      <table>
        <thead><tr><th>Title</th><th>Department</th><th>Status</th><th>Amount</th></tr></thead>
        <tbody>
          ${pRequests.slice(0, 10).map((r) => `<tr><td>${r.title}</td><td>${r.department ?? "Unassigned"}</td><td>${r.status}</td><td>${money(r.amount)}</td></tr>`).join("") || `<tr><td colspan="4">No cash request data for ${period}</td></tr>`}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Expenses</h2>
      <table>
        <thead><tr><th>Description</th><th>Department</th><th>Status</th><th>Amount</th></tr></thead>
        <tbody>
          ${pExpenses.slice(0, 10).map((e) => `<tr><td>${e.description}</td><td>${e.department ?? "Unassigned"}</td><td>${e.status}</td><td>${money(e.amount)}</td></tr>`).join("") || `<tr><td colspan="4">No expense data for ${period}</td></tr>`}
        </tbody>
      </table>
    </div>

    <div class="note">This report uses a LaTeX-inspired print layout for clean PDF export via the browser print dialog.</div>
  </div>
</body>
</html>`
}
