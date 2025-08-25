import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility functions for user name handling
export function getInitials(firstName?: string | null, lastName?: string | null): string {
  if (!firstName && !lastName) return "?";
  const first = firstName?.[0] || "";
  const last = lastName?.[0] || "";
  return `${first}${last}`.toUpperCase();
}

export function getFullName(firstName?: string | null, lastName?: string | null): string {
  if (!firstName && !lastName) return "Unknown User";
  return [firstName, lastName].filter(Boolean).join(" ");
}
