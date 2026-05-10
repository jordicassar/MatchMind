// utils — auto-generated shadcn utility file, do not edit manually.
// Exports the cn() helper used throughout the codebase to merge Tailwind classes.
// clsx handles conditional class logic (e.g. cn("base", isActive && "active"))
// and tailwind-merge resolves conflicts when the same utility is applied twice
// (e.g. cn("p-4", "p-8") correctly produces "p-8" rather than both).
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
