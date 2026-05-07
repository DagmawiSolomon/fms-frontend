import { 
  HomeIcon, 
  HandCoins, 
  ReceiptTextIcon, 
  WalletIcon, 
  ChartColumnBigIcon, 
  User,
  ShieldCheck,
  Briefcase,
  Users,
  LucideIcon
} from "lucide-react"

export type Role = "employee" | "manager" | "finance" | "admin"

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
      "reports.budgets",
      "reports.expenses",
      "reports.overview"
    ],
    color: "rose"
  },
  finance: {
    name: "Finance Team",
    description: "Financial oversight, budget creation, and disbursement.",
    navigation: ["Dashboard", "Budgets", "Cash Requests", "Expenses", "Reports", "Users"],
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
      "reports.budgets",
      "reports.expenses",
      "reports.overview"
    ],
    color: "emerald"
  },
  manager: {
    name: "Department Manager",
    description: "Budget approval and cash request verification.",
    navigation: ["Dashboard", "Budgets", "Cash Requests", "Expenses", "Reports", "Users"],
    permissions: [
      "users.view_all",
      "users.view_profile",
      "budgets.view_all",
      "budgets.view_specific",
      "budgets.approve",
      "budgets.reject",
      "budgets.summary",
      "cash_requests.view_all",
      "cash_requests.view_specific",
      "cash_requests.approve",
      "expenses.view_all",
      "expenses.read_receipt",
      "reports.budgets",
      "reports.expenses",
      "reports.overview"
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
  }
}

export const ALL_NAV_ITEMS = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: HomeIcon,
  },
  {
    title: "Budgets",
    url: "/budgets",
    icon: HandCoins,
  },
  {
    title: "Cash Requests",
    url: "/cash-requests",
    icon: ReceiptTextIcon,
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: WalletIcon,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: ChartColumnBigIcon,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
]
