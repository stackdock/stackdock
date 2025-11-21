import type { TerminalSize } from '../hooks/useTerminal'

/**
 * Layout helpers for TUI components
 * 
 * Provides utilities for calculating component positions and sizes
 * based on terminal dimensions
 */

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

export interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * Calculate centered position for a component
 */
export function center(size: TerminalSize, componentWidth: number, componentHeight: number): Box {
  return {
    x: Math.floor((size.width - componentWidth) / 2),
    y: Math.floor((size.height - componentHeight) / 2),
    width: componentWidth,
    height: componentHeight,
  }
}

/**
 * Calculate position with padding
 */
export function withPadding(box: Box, padding: Padding): Box {
  return {
    x: box.x + padding.left,
    y: box.y + padding.top,
    width: box.width - padding.left - padding.right,
    height: box.height - padding.top - padding.bottom,
  }
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Calculate scrollable viewport
 */
export function calculateViewport(
  totalItems: number,
  viewportHeight: number,
  selectedIndex: number
): { startIndex: number; endIndex: number; visibleCount: number } {
  const visibleCount = Math.min(totalItems, viewportHeight)
  
  // Keep selected item in view
  let startIndex = selectedIndex - Math.floor(visibleCount / 2)
  startIndex = Math.max(0, Math.min(startIndex, totalItems - visibleCount))
  
  const endIndex = Math.min(startIndex + visibleCount, totalItems)
  
  return {
    startIndex,
    endIndex,
    visibleCount,
  }
}

/**
 * Calculate table column widths
 */
export function calculateColumnWidths(
  totalWidth: number,
  columnCount: number,
  minColumnWidth: number = 10
): number[] {
  const baseWidth = Math.floor(totalWidth / columnCount)
  const widths: number[] = []
  let remaining = totalWidth
  
  // Distribute width evenly, ensuring minimum width
  for (let i = 0; i < columnCount; i++) {
    const width = i === columnCount - 1 ? remaining : Math.max(minColumnWidth, baseWidth)
    widths.push(width)
    remaining -= width
  }
  
  return widths
}

/**
 * Truncate text to fit within width
 */
export function truncate(text: string, width: number, ellipsis: string = '...'): string {
  if (text.length <= width) {
    return text
  }
  
  const ellipsisLength = ellipsis.length
  const truncated = text.slice(0, width - ellipsisLength)
  return `${truncated}${ellipsis}`
}

/**
 * Wrap text to fit within width
 */
export function wrapText(text: string, width: number): string[] {
  const lines: string[] = []
  const words = text.split(/\s+/)
  let currentLine = ''
  
  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine = currentLine ? `${currentLine} ${word}` : word
    } else {
      if (currentLine) {
        lines.push(currentLine)
      }
      // Handle words longer than width
      if (word.length > width) {
        // Split long word
        for (let i = 0; i < word.length; i += width) {
          lines.push(word.slice(i, i + width))
        }
        currentLine = ''
      } else {
        currentLine = word
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine)
  }
  
  return lines.length > 0 ? lines : ['']
}
