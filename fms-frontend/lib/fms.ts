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
}

export type FmsExpense = {
  id: string | number
  title: string
  amount: number
  status: "pending" | "verified" | "rejected"
  category?: string | null
  receiptUrl?: string | null
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
}

export type BudgetInput = {
  name: string
  department: string
  amount: number
  spent: number
  period: string
  status: FmsBudgetStatus
  notes?: string
}

export type CashRequestInput = {
  title: string
  amount: number
  purpose: string
}

export type ExpenseInput = {
  title: string
  amount: number
  category: string
  notes?: string
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
  }
}

export function normalizeBudgets(payload: unknown): FmsBudget[] {
  return unwrapList<FmsBudget>(payload).map((item, index) => {
    const budget = item as Record<string, unknown>

    return {
      id: normalizeIdentifier(budget.id ?? budget._id, index),
      name: (budget.name ?? budget.title ?? "Budget") as string,
      department: (budget.department ?? budget.departmentName ?? null) as
        | string
        | null,
      amount: numberValue(budget.amount ?? budget.totalAmount),
      spent: numberValue(budget.spent ?? budget.usedAmount ?? 0),
      status: normalizeBudgetStatus(budget.status),
      owner: (budget.owner ?? budget.createdBy ?? null) as string | null,
      period: (budget.period ?? budget.fiscalYear ?? budget.month ?? null) as
        | string
        | null,
      notes: (budget.notes ?? budget.description ?? null) as string | null,
      updatedAt: (budget.updatedAt ?? budget.updated_at ?? null) as
        | string
        | null,
    }
  })
}

export function normalizeSummary(payload: unknown): FmsSummary {
  const candidate = payload as Record<string, unknown> | null
  const summary = candidate?.summary as Record<string, unknown> | undefined
  const source = summary ?? candidate ?? {}

  const totalBudget = numberValue(
    source.totalBudget ??
      source.total_budget ??
      source.budget ??
      source.total ??
      source.amount
  )
  const totalSpent = numberValue(
    source.totalSpent ?? source.total_spent ?? source.spent ?? source.used
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
        point.label ?? point.name ?? point.month,
        `Item ${index + 1}`
      ),
      budgeted: numberValue(point.budgeted ?? point.budget ?? point.limit ?? 0),
      spent: numberValue(point.spent ?? point.actual ?? point.used ?? 0),
      requests: numberValue(point.requests ?? point.count ?? 0),
    }
  })
}

export function normalizeCashRequests(payload: unknown): FmsCashRequest[] {
  return unwrapList<FmsCashRequest>(payload).map((item, index) => {
    const request = item as Record<string, unknown>
    return {
      id: normalizeIdentifier(request.id ?? request._id, index),
      title: (request.title ?? request.name ?? "Cash request") as string,
      amount: numberValue(request.amount ?? request.total ?? 0),
      status: normalizeCashStatus(request.status),
      purpose: (request.purpose ?? request.reason ?? null) as string | null,
      requestedBy: (request.requestedBy ?? request.createdBy ?? null) as
        | string
        | null,
    }
  })
}

export function normalizeExpenses(payload: unknown): FmsExpense[] {
  return unwrapList<FmsExpense>(payload).map((item, index) => {
    const expense = item as Record<string, unknown>
    return {
      id: normalizeIdentifier(expense.id ?? expense._id, index),
      title: (expense.title ?? expense.name ?? "Expense") as string,
      amount: numberValue(expense.amount ?? expense.total ?? 0),
      status: normalizeExpenseStatus(expense.status),
      category: (expense.category ?? expense.type ?? null) as string | null,
      receiptUrl: (expense.receiptUrl ?? expense.receipt ?? null) as
        | string
        | null,
    }
  })
}

export const fmsApi = {
  loginUser: (payload: LoginPayload) =>
    apiRequest<FmsAuthResponse>("/loginUser", {
      method: "POST",
      body: payload,
      skipAuth: true,
    }),
  registerUser: (payload: RegisterPayload) =>
    apiRequest<FmsAuthResponse>("/registerUser", {
      method: "POST",
      body: payload,
      skipAuth: true,
    }),
  getBudgetSummary: () => apiRequest<unknown>("/GetBudgetSummary"),
  getReportOverview: () => apiRequest<unknown>("/ReportOverview"),
  getBudgets: () => apiRequest<unknown>("/budgets"),
  createBudget: (payload: BudgetInput) =>
    apiRequest<unknown>("/budgets", {
      method: "POST",
      body: payload,
    }),
  updateBudget: (id: string | number, payload: Partial<BudgetInput>) =>
    apiRequest<unknown>(`/budgets/${id}`, {
      method: "PATCH",
      body: payload,
    }),
  setBudgetStatus: (id: string | number, status: FmsBudgetStatus) =>
    apiRequest<unknown>(`/budgets/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
  getUsers: () => apiRequest<unknown>("/GetAllUser"),
  updateUserRole: (id: string | number, role: UserRole) =>
    apiRequest<unknown>(`/users/${id}/role`, {
      method: "PATCH",
      body: { role },
    }),
  getMe: () => apiRequest<unknown>("/api/users/me"),
  createCashRequest: (payload: CashRequestInput) =>
    apiRequest<unknown>("/cash-requests", {
      method: "POST",
      body: payload,
    }),
  getCashRequests: () => apiRequest<unknown>("/cash-requests"),
  approveCashRequest: (id: string | number) =>
    apiRequest<unknown>(`/cash-requests/${id}/approve`, {
      method: "PATCH",
    }),
  disburseCashRequest: (id: string | number) =>
    apiRequest<unknown>(`/cash-requests/${id}/disburse`, {
      method: "PATCH",
    }),
  createExpense: (payload: ExpenseInput | FormData) =>
    apiRequest<unknown>("/expenses", {
      method: "POST",
      body: payload,
    }),
  getExpenses: () => apiRequest<unknown>("/expenses"),
  verifyExpense: (id: string | number) =>
    apiRequest<unknown>(`/expenses/${id}/verify`, {
      method: "PATCH",
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

  return fallback
}

function normalizeText(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) {
    return value
  }

  return fallback
}
