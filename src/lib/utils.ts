/**
 * @file utils.ts
 * @description Utility functions for common operations.
 * Combines clsx and tailwind-merge for safe className management.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes safely
 * Combines clsx for conditional classes with twMerge for conflict resolution
 *
 * This function handles Tailwind CSS specificity and prevents conflicting classes
 * from coexisting. When two Tailwind utilities conflict, the last one takes precedence.
 *
 * @param {...ClassValue[]} inputs - CSS classes to merge (strings, arrays, or objects)
 * @returns {string} Merged className string safe for React
 *
 * @example
 * // Basic usage
 * cn('px-2', 'px-4') → 'px-4'
 *
 * @example
 * // Conditional classes
 * cn('px-2', isActive && 'bg-blue-500', isActive ? 'text-white' : 'text-black')
 * → 'px-2 bg-blue-500 text-white' (if isActive is true)
 *
 * @example
 * // With objects
 * cn({ 'rounded': true, 'shadow': false }) → 'rounded'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
