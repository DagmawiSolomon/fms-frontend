import {
  Home04Icon,
  Invoice04Icon,
  MoneyBag01Icon,
  ReceiptTextIcon,
  Wallet01Icon,
  UserMultipleIcon,
  UserIcon
} from "@hugeicons/core-free-icons"

export type Role = "employee" | "manager" | "finance" | "admin" | "leadership"

export interface NavItem {
  title: string
  url: string
  icon: any // Store icon component
}

export interface RoleConfig {
  name: string
  description: string
  navigation: string[]
  permissions: string[]
  color: string
}

export const ROLE_CONFIGS: Record<Role, RoleConfig> = {
  admin: {
    name: "System Administrator",
    description: "Full system access, user management, and configuration.",
    navigation: ["Dashboard", "Users"],
    permissions: [
      "users.view_all",
      "users.view_profile",
      "users.promote",
      "users.change_role",
      "budgets.view_all",
      "budgets.view_specific",
      "budgets.create",
      "budgets.update",
      "budgets.approve",
      "budgets.summary",
      "cash_requests.view_all",
      "cash_requests.view_specific",
      "cash_requests.approve",
      "expenses.view_all",
      "expenses.view_specific",
      "expenses.verify",
      "expenses.read_receipt",

    ],
    color: "rose"
  },
  finance: {
    name: "Finance Team",
    description: "Financial oversight, budget creation, and disbursement.",
    navigation: ["Dashboard", "Budgets", "Cash Requests", "Expenses", "Users"],
    permissions: [
      "users.view_all",
      "users.view_profile",
      "budgets.view_all",
      "budgets.view_specific",
      "budgets.create",
      "budgets.update",
      "budgets.summary",

      "cash_requests.view_all",
      "cash_requests.view_specific",
      "cash_requests.disburse",
      "expenses.view_all",
      "expenses.view_specific",
      "expenses.verify",
      "expenses.read_receipt",

    ],
    color: "emerald"
  },
  manager: {
    name: "Department Manager",
    description: "Budget submission, approval, and cash request verification.",
    navigation: ["Dashboard", "Budgets", "Cash Requests", "Expenses"],
    permissions: [
      "users.view_all",
      "users.view_profile",
      "budgets.view_all",
      "budgets.view_specific",
      "budgets.create",
      "budgets.approve",
      "budgets.reject",
      "budgets.summary",
      "cash_requests.view_all",
      "cash_requests.view_specific",
      "cash_requests.create",
      "cash_requests.approve",
      "expenses.view_all",
      "expenses.read_receipt",

    ],
    color: "amber"
  },
  employee: {
    name: "General Employee",
    description: "Submit expenses and request cash for operations.",
    navigation: ["Dashboard", "Cash Requests", "Expenses"],
    permissions: [

      "cash_requests.create",
      "cash_requests.view_specific",
      "cash_requests.view_self",
      "expenses.create",
      "expenses.upload_receipt",
      "expenses.read_receipt",
      "expenses.view_specific",
      "users.view_profile_self"
    ],
    color: "blue"
  },
  leadership: {
    name: "Leadership (CEO/COO)",
    description: "Executive oversight and high-value approvals.",
    navigation: ["Dashboard", "Budgets", "Cash Requests", "Expenses"],
    permissions: [
      "users.view_all",
      "users.view_profile",
      "budgets.view_all",
      "budgets.approve",
      "budgets.reject",
      "budgets.summary",

      "cash_requests.view_all",
      "cash_requests.approve",
      "expenses.view_all",
      "expenses.view_all"
    ],
    color: "indigo"
  }
}

export const ALL_NAV_ITEMS = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home04Icon,
  },
  {
    title: "Budgets",
    url: "/budgets",
    icon: Invoice04Icon,
  },

  {
    title: "Cash Requests",
    url: "/cash-requests",
    icon: ReceiptTextIcon,
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: Wallet01Icon,
  },

  {
    title: "Users",
    url: "/users",
    icon: UserMultipleIcon,
  },
]
