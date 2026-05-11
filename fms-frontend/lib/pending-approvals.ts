const PENDING_KEY = "fms_pending_approvals"
const BLOCKED_KEY = "fms_blocked_accounts"

export interface PendingUser {
  email: string
  name: string
  role: string
  createdAt: string
}

export function addPendingApproval(email: string, name: string, role: string) {
  const pending = getPendingApprovals()
  if (!pending.find((p) => p.email === email)) {
    pending.push({ email, name, role, createdAt: new Date().toISOString() })
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  }
}

export function getPendingApprovals(): PendingUser[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]")
  } catch {
    return []
  }
}

export function approveUser(email: string) {
  const pending = getPendingApprovals().filter((p) => p.email !== email)
  localStorage.setItem(PENDING_KEY, JSON.stringify(pending))
}

export function rejectUser(email: string) {
  approveUser(email)
  const blocked = getBlockedEmails()
  if (!blocked.includes(email)) {
    localStorage.setItem(BLOCKED_KEY, JSON.stringify([...blocked, email]))
  }
}

export function isPendingApproval(email: string): boolean {
  return getPendingApprovals().some((p) => p.email === email)
}

export function isBlockedAccount(email: string): boolean {
  return getBlockedEmails().includes(email)
}

function getBlockedEmails(): string[] {
  try {
    return JSON.parse(localStorage.getItem(BLOCKED_KEY) || "[]")
  } catch {
    return []
  }
}
