import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export const SWATCHES = [
  "#2dd4bf",
  "#38bdf8",
  "#a78bfa",
  "#fb7185",
  "#fbbf24",
  "#4ade80",
  "#f97316",
  "#e879f9",
] as const

export function getDeterministicColor(name: string): string {
  if (!name) return SWATCHES[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % SWATCHES.length
  return SWATCHES[index]
}
