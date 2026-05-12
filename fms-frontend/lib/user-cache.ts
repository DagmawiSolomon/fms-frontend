import { type FmsSessionUser } from "./fms"

const USERS_CACHE_KEY = "fms_users_cache"

export function saveUsersToCache(users: FmsSessionUser[]) {
  if (typeof window === "undefined") return
  
  // Merge with existing users to avoid losing data
  const existing = getUsersFromCache()
  const userMap = new Map(existing.map(u => [String(u.id), u]))
  
  users.forEach(u => {
    userMap.set(String(u.id), u)
  })
  
  const merged = Array.from(userMap.values())
  localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(merged))
}

export function getUsersFromCache(): FmsSessionUser[] {
  if (typeof window === "undefined") return []
  
  const stored = localStorage.getItem(USERS_CACHE_KEY)
  if (!stored) return []
  
  try {
    return JSON.parse(stored)
  } catch (e) {
    console.error("Failed to parse users cache", e)
    return []
  }
}

export function getUserFromCache(id: string | number | null | undefined): FmsSessionUser | null {
  if (!id) return null
  const users = getUsersFromCache()
  return users.find(u => String(u.id) === String(id)) || null
}

export function addUserToCache(user: FmsSessionUser) {
  const users = getUsersFromCache()
  const exists = users.some(u => String(u.id) === String(user.id))
  
  if (!exists) {
    saveUsersToCache([...users, user])
  }
}
