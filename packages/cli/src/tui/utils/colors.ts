/**
 * Color theme utilities for TUI
 * 
 * Provides consistent color palette and status colors
 * that work with both dark and light terminal themes
 */

export type Color = 'default' | 'success' | 'error' | 'warning' | 'info' | 'muted'

export interface ColorTheme {
  default: string
  success: string
  error: string
  warning: string
  info: string
  muted: string
  reset: string
}

/**
 * ANSI color codes for terminal output
 */
export const colors: ColorTheme = {
  default: '\x1b[0m',
  success: '\x1b[32m', // Green
  error: '\x1b[31m', // Red
  warning: '\x1b[33m', // Yellow
  info: '\x1b[36m', // Cyan
  muted: '\x1b[90m', // Bright Black (Gray)
  reset: '\x1b[0m',
}

/**
 * Get color code for a given color name
 */
export function getColor(color: Color): string {
  return colors[color] || colors.default
}

/**
 * Apply color to text
 */
export function colorize(text: string, color: Color): string {
  return `${getColor(color)}${text}${colors.reset}`
}

/**
 * Status color helpers
 */
export const statusColors = {
  success: (text: string) => colorize(text, 'success'),
  error: (text: string) => colorize(text, 'error'),
  warning: (text: string) => colorize(text, 'warning'),
  info: (text: string) => colorize(text, 'info'),
  muted: (text: string) => colorize(text, 'muted'),
}

/**
 * Detect if terminal supports colors
 */
export function supportsColor(): boolean {
  if (typeof process === 'undefined' || !process.stdout) {
    return false
  }
  
  // Check if NO_COLOR environment variable is set
  if (process.env.NO_COLOR) {
    return false
  }
  
  // Check if FORCE_COLOR is set
  if (process.env.FORCE_COLOR === '1' || process.env.FORCE_COLOR === 'true') {
    return true
  }
  
  // Check if TTY and not dumb terminal
  return process.stdout.isTTY && process.env.TERM !== 'dumb'
}

/**
 * Conditionally apply color based on terminal support
 */
export function conditionalColor(text: string, color: Color): string {
  return supportsColor() ? colorize(text, color) : text
}
