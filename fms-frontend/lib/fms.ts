import { apiRequest, unwrapList } from "@/lib/api"
import { normalizeRole, type UserRole } from "@/lib/auth"

export type FmsBudgetStatus = "pending" | "approved" | "rejected" | "draft"

export type FmsBudget = {
  id: string | number
  name: string
  department?: string | null
  amount: number
  spent: number
  status: FmsBudgetStatus
  owner?: string | null
  period?: string | null
  notes?: string | null
  updatedAt?: string | null
}

export type FmsSessionUser = {
  id: string | number
  name: string
  email: string
  avatar?: string | null
  role: UserRole
  department?: string | null
}

export type FmsSummary = {
  totalBudget: number
  totalSpent: number
  pendingApprovals: number
  activeBudgets: number
  remainingBudget: number
}

export type FmsReportPoint = {
  label: string
  budgeted: number
  spent: number
  requests?: number
}

export type FmsReportOverview = {
  summary?: FmsSummary | Record<string, unknown>
  series?: FmsReportPoint[]
  points?: FmsReportPoint[]
  data?: FmsReportPoint[]
}

export type FmsCashRequest = {
  id: string | number
  title: string
  amount: number
  status: "pending" | "approved" | "disbursed" | "rejected"
  purpose?: string | null
  requestedBy?: string | null
  budgetId?: string | number | null
}

export type FmsExpense = {
  id: string | number
  merchant: string
  amount: number
  status: "pending" | "approved" | "verified" | "rejected"
  category?: string | null
  receiptUrl?: string | null
  budgetId?: string | number | null
  requestId?: string | number | null
  date?: string | null
  submitter?: string | null
}

export type FmsAuthResponse = {
  token?: string
  accessToken?: string
  user?: Partial<FmsSessionUser> & { role?: string | null }
  data?: {
    token?: string
    accessToken?: string
    user?: Partial<FmsSessionUser> & { role?: string | null }
  }
}

export function extractAuthToken(payload: FmsAuthResponse | unknown) {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const candidate = payload as FmsAuthResponse
  return (
    candidate.token ??
    candidate.accessToken ??
    candidate.data?.token ??
    candidate.data?.accessToken ??
    null
  )
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = LoginPayload & {
  name: string
  role?: string
  department?: string
}

export type BudgetInput = {
  name: string
  department: string
  amount: number
  spent: number
  period: string
  year: number
  status: FmsBudgetStatus
  notes?: string
  userId?: string
}

export type CashRequestInput = {
  purpose: string
  amount: number
  /** The authenticated user's ID (from JWT user_id claim) */
  userId?: string
}

export type ExpenseInput = {
  /** Maps to `title` in the API body */
  title: string
  amount: number
  category: string
  /** ISO date string — maps to `incurred_at` */
  incurred_at: string
  budget_id?: string | null
  /** Maps to `description` in the API body */
  description?: string
}

export function normalizeSessionUser(payload: unknown): FmsSessionUser | null {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const candidate = payload as Record<string, unknown>
  const source =
    (candidate.data && typeof candidate.data === "object"
      ? (candidate.data as Record<string, unknown>)
      : candidate) ?? candidate

  const id = normalizeIdentifier(source.id ?? source._id ?? source.userId, "me")
  const name = (source.name ?? source.fullName ?? source.username ?? "User") as
    | string
    | undefined
  const email = (source.email ?? "user@example.com") as string | undefined
  const avatar = (source.avatar ?? source.image ?? null) as string | null
  const role = normalizeRole(source.role as string | null | undefined)

  return {
    id,
    name: name ?? "User",
    email: email ?? "user@example.com",
    avatar,
    role,
    department: (source.department ?? null) as string | null,
  }
}

export function normalizeBudgets(payload: unknown): FmsBudget[] {
  return unwrapList<FmsBudget>(payload).map((item, index) => {
    const budget = item as Record<string, unknown>

    const department = (budget.department ?? budget.departmentName ?? "") as string
    const period = (budget.period ?? budget.fiscalYear ?? budget.month ?? null) as string | null

    return {
      id: normalizeIdentifier(budget.id ?? budget._id, index),
      // API has no 'name' field — derive a readable label from department + period
      name: department
        ? period
          ? `${department} (${period})`
          : department
        : (budget.name ?? budget.title ?? `Budget ${index + 1}`) as string,
      department: department || null,
      amount: numberValue(budget.amount ?? budget.totalAmount),
      // API returns spent as 'spent_amount', not 'spent'
      spent: numberValue(budget.spent_amount ?? budget.spent ?? budget.usedAmount ?? 0),
      status: normalizeBudgetStatus(budget.status),
      owner: (budget.owner ?? budget.createdBy ?? budget.submitted_by ?? null) as string | null,
      period,
      notes: (budget.notes ?? budget.description ?? null) as string | null,
      updatedAt: (budget.updatedAt ?? budget.updated_at ?? null) as string | null,
    }
  })
}

export function normalizeSummary(payload: unknown): FmsSummary {
  const candidate = payload as Record<string, unknown> | null
  const summary = candidate?.summary as Record<string, unknown> | undefined
  const source = summary ?? candidate ?? {}

  const totalBudget = numberValue(
    source.totalBudget ??
      source.total_budgets ??
      source.total_budget ??
      source.budget ??
      source.total ??
      source.amount
  )
  const totalSpent = numberValue(
    source.totalSpent ?? 
    source.total_spent ?? 
    source.total_expenses ??
    source.spent ?? 
    source.used
  )
  const activeBudgets = numberValue(
    source.activeBudgets ?? source.active_budgets ?? source.active ?? 0
  )
  const pendingApprovals = numberValue(
    source.pendingApprovals ?? source.pending ?? source.awaiting ?? 0
  )

  return {
    totalBudget,
    totalSpent,
    activeBudgets,
    pendingApprovals,
    remainingBudget: Math.max(totalBudget - totalSpent, 0),
  }
}

export function normalizeReportPoints(payload: unknown): FmsReportPoint[] {
  const candidate = payload as FmsReportOverview | FmsReportPoint[] | null
  const sourceArray =
    (candidate && Array.isArray(candidate) && candidate) ||
    candidate?.series ||
    candidate?.points ||
    candidate?.data ||
    []

  return sourceArray.map((item, index) => {
    const point = item as Record<string, unknown>
    return {
      label: normalizeText(
        point.label ?? point.name ?? point.month ?? point.category ?? point.department,
        `Item ${index + 1}`
      ),
      budgeted: numberValue(point.budgeted ?? point.budget ?? point.limit ?? 0),
      spent: numberValue(point.spent ?? point.actual ?? point.used ?? point.amount ?? 0),
      requests: numberValue(point.requests ?? point.count ?? 0),
    }
  })
}

export function normalizeCashRequests(payload: unknown): FmsCashRequest[] {
  return unwrapList<FmsCashRequest>(payload).map((item, index) => {
    const request = item as Record<string, unknown>
    return {
      id: normalizeIdentifier(request.id ?? request._id ?? request.request_id, index),
      title: (request.title ?? request.purpose ?? request.name ?? "Cash request") as string,
      amount: numberValue(request.amount ?? request.total ?? 0),
      status: normalizeCashStatus(request.status),
      purpose: (request.purpose ?? request.reason ?? null) as string | null,
      requestedBy: (request.requestedBy ?? request.requested_by ?? request.createdBy ?? null) as
        | string
        | null,
      budgetId: (request.budgetId ?? request.budget_id ?? null) as string | number | null,
    }
  })
}

export function normalizeExpenses(payload: unknown): FmsExpense[] {
  return unwrapList<FmsExpense>(payload).map((item, index) => {
    const expense = item as Record<string, unknown>
    return {
      id: normalizeIdentifier(expense.id ?? expense._id ?? expense.expense_id, index),
      merchant: (expense.merchant ?? expense.title ?? expense.description ?? expense.name ?? "Expense") as string,
      amount: numberValue(expense.amount ?? expense.total ?? 0),
      status: normalizeExpenseStatus(expense.status ?? (expense.verified === true ? "verified" : "pending")),
      category: (expense.category ?? expense.type ?? null) as string | null,
      receiptUrl: (expense.receiptUrl ?? expense.receipt ?? (expense.receipt_attached ? "attached" : null)) as
        | string
        | null,
      budgetId: (expense.budgetId ?? expense.budget_id ?? null) as string | number | null,
      requestId: (expense.requestId ?? expense.request_id ?? null) as string | number | null,
      date: (expense.date ?? expense.created_at ?? expense.incurred_at ?? null) as string | null,
      submitter: (expense.submitter ?? expense.user_name ?? expense.created_by ?? expense.submitted_by ?? null) as string | null,
    }
  })
}

export function normalizeUsers(payload: unknown): FmsSessionUser[] {
  return unwrapList<FmsSessionUser>(payload).map((item, index) => {
    const user = item as Record<string, unknown>
    return {
      id: normalizeIdentifier(user.id ?? user._id ?? user.userId, index),
      name: (user.name ?? user.fullName ?? user.username ?? "User") as string,
      email: (user.email ?? "user@example.com") as string,
      avatar: (user.avatar ?? user.image ?? null) as string | null,
      role: normalizeRole(user.role as string | null | undefined),
      department: (user.department ?? "General") as string,
    }
  })
}

/** Generate a random 24-char hex string to satisfy the backend's BSON ObjectId requirement */
function generateFmsId() {
  return Array.from({ length: 24 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("")
}

export const fmsApi = {
  loginUser: (payload: LoginPayload) =>
    apiRequest<FmsAuthResponse>("/auth-bridge/login", {
      method: "POST",
      body: payload,
      skipAuth: true,
    }),
  registerUser: (payload: RegisterPayload) =>
    apiRequest<FmsAuthResponse>("/auth-bridge/register", {
      method: "POST",
      body: payload,
      skipAuth: true,
    }),
  getBudgetSummary: () => apiRequest<unknown>("/budgets/summary"),
  getReportOverview: () => apiRequest<unknown>("/reports/overview"),
  reportBudgets: () => apiRequest<unknown>("/reports/budgets"),
  reportExpenses: () => apiRequest<unknown>("/reports/expenses"),
  reportCashRequests: () => apiRequest<unknown>("/reports/cash-requests"),
  getBudgets: () => apiRequest<unknown>("/budgets/"),
  getSpecificBudget: (id: string | number) =>
    apiRequest<unknown>(`/budgets/${id}`),
  createBudget: (payload: BudgetInput) => {
    const now = new Date().toISOString()
    const validUserId =
      payload.userId && /^[a-fA-F0-9]{24}$/.test(payload.userId)
        ? payload.userId
        : "000000000000000000000000"
    
    return apiRequest<unknown>("/budgets/", {
      method: "POST",
      body: {
        id: generateFmsId(),
        department: payload.department,
        amount: payload.amount,
        period: payload.period,
        year: payload.year || new Date().getFullYear(),
        submitted_by: validUserId,
        status: payload.status || "pending",
        spent_amount: payload.spent || 0,
        remaining_balance: payload.amount - (payload.spent || 0),
        created_at: now,
        updated_at: now,
      },
    })
  },
  updateBudget: (id: string | number, payload: Partial<BudgetInput>) =>
    apiRequest<unknown>(`/budgets/${id}`, {
      method: "PATCH",
      body: { spent_amount: payload.spent ?? payload.amount },
    }),
  setBudgetStatus: (id: string | number, status: FmsBudgetStatus, reason?: string) =>
    apiRequest<unknown>(`/budgets/${id}/${status === "approved" ? "approve" : "reject"}`, {
      method: "POST",
      body: status === "rejected" ? { reason } : undefined,
    }),
  getUsers: () => apiRequest<unknown>("/users"),
  promoteUser: (username: string) =>
    apiRequest<unknown>("/promote", {
      method: "POST",
      body: { username }
    }),
  getMe: () =>
    apiRequest<unknown>("/users/me"),
  getProfile: (id: string | number) =>
    apiRequest<unknown>(`/users/${id}`),
  changeUserRole: (id: string | number, role: string) =>
    apiRequest<unknown>(`/users/${id}/role`, {
      method: "PATCH",
      body: { Role: role }
    }),
  updateUserRole: (id: string | number, role: UserRole) =>
    apiRequest<unknown>(`/users/${id}/role`, {
      method: "PATCH",
      body: { Role: role },
    }),
  createCashRequest: (payload: CashRequestInput) => {
    const now = new Date().toISOString()
    // User ID must be a valid 24-char hex ObjectId for the backend
    const validUserId =
      payload.userId && /^[a-fA-F0-9]{24}$/.test(payload.userId)
        ? payload.userId
        : "000000000000000000000000"
    return apiRequest<unknown>("/cash-requests/", {
      method: "POST",
      body: {
        id: generateFmsId(),
        purpose: payload.purpose,
        amount: payload.amount,
        requested_by: validUserId,
        status: "pending",
        created_at: now,
        updated_at: now,
      },
    })
  },
  getCashRequests: () => apiRequest<unknown>("/cash-requests/"),
  getSpecificCashRequest: (id: string | number) =>
    apiRequest<unknown>(`/cash-requests/${id}`),
  approveCashRequest: (id: string | number) =>
    apiRequest<unknown>(`/cash-requests/${id}/approve`, {
      method: "POST",
    }),
  disburseCashRequest: (id: string | number) =>
    apiRequest<unknown>(`/cash-requests/${id}/disburse`, {
      method: "POST",
    }),
  createExpense: (payload: ExpenseInput) =>
    apiRequest<unknown>("/expenses", {
      method: "POST",
      body: {
        budget_id: payload.budget_id ?? null,
        title: payload.title,
        amount: payload.amount,
        category: payload.category,
        description: payload.description ?? "",
        incurred_at: payload.incurred_at,
      },
    }),
  getExpenses: () => apiRequest<unknown>("/expenses/"),
  getSpecificExpense: (id: string | number) =>
    apiRequest<unknown>(`/expenses/${id}`),
  /**
   * Returns the proxied URL for the receipt file so it can be used in an
   * <a href> or <img src> tag directly. The browser will send cookies
   * automatically, but the auth token also needs to be in the URL for the
   * Next.js rewrite to forward the Authorization header.
   *
   * For simplicity we just return the proxy path — the page component is
   * responsible for opening / fetching it.
   */
  getReceiptUrl: (expenseId: string | number): string =>
    `/fms-proxy/expenses/${expenseId}/receipts`,
  uploadReceipt: (expenseId: string | number, file: File) => {
    const formData = new FormData()
    formData.append("receipt", file)
    return apiRequest<unknown>(`/expenses/${expenseId}/receipts`, {
      method: "POST",
      body: formData,
    })
  },
  verifyExpense: (id: string | number) =>
    apiRequest<unknown>(`/expenses/${id}/verify`, {
      method: "PATCH",
      body: { verified: true },
    }),
}

function normalizeBudgetStatus(value: unknown): FmsBudgetStatus {
  const status = String(value ?? "pending").toLowerCase()

  if (status.includes("approve")) {
    return "approved"
  }

  if (status.includes("reject")) {
    return "rejected"
  }

  if (status.includes("draft")) {
    return "draft"
  }

  return "pending"
}

function numberValue(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeCashStatus(value: unknown) {
  const status = String(value ?? "pending").toLowerCase()

  if (status.includes("approved")) {
    return "approved"
  }

  if (status.includes("disbur")) {
    return "disbursed"
  }

  if (status.includes("reject")) {
    return "rejected"
  }

  return "pending"
}

function normalizeExpenseStatus(value: unknown) {
  const status = String(value ?? "pending").toLowerCase()

  if (status.includes("verify")) {
    return "verified"
  }

  if (status.includes("reject")) {
    return "rejected"
  }

  return "pending"
}

function normalizeIdentifier(
  value: unknown,
  fallback: string | number
): string | number {
  if (typeof value === "string" || typeof value === "number") {
    return value
  }

  // Handle Mongo-style ObjectId objects
  if (value && typeof value === "object") {
    const candidate = value as Record<string, unknown>
    if (typeof candidate.$oid === "string") return candidate.$oid
    if (typeof candidate.id === "string") return candidate.id
    if (typeof candidate._id === "string") return candidate._id
    
    // Fallback to toString if it's a custom object but not a plain one
    const str = String(value)
    if (str && str !== "[object Object]") return str
  }

  return fallback
}

function normalizeText(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) {
    return value
  }

  return fallback
}
