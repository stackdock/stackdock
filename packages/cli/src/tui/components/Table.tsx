import { useState } from 'react'
import { useKeyboard } from '../hooks/useKeyboard'
import { calculateViewport, truncate } from '../utils/layout'
import { colorize } from '../utils/colors'
import type { TerminalSize } from '../hooks/useTerminal'

export interface TableColumn<T> {
  header: string
  accessor: (row: T) => string
  width?: number
}

export interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  onSelect?: (row: T) => void
  onSort?: (column: string) => void
  terminalSize: TerminalSize
}

/**
 * Table component for TUI
 */
export function Table<T>({
  columns,
  data,
  onSelect,
  terminalSize,
}: TableProps<T>) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  // Sorting state (for future use)
  // const [sortColumn, setSortColumn] = useState<string | null>(null)
  // const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const sortColumn: string | null = null
  const sortDirection: 'asc' | 'desc' = 'asc'

  // Calculate column widths
  const totalWidth = terminalSize.width - 2 // Reserve space for borders
  const columnWidths = columns.map((col) => {
    if (col.width) return col.width
    return Math.floor(totalWidth / columns.length)
  })

  const viewport = calculateViewport(
    data.length,
    terminalSize.height - 4, // Reserve space for header/footer
    selectedIndex
  )

  // Sort handler (for future use)
  // const handleSort = (columnHeader: string) => {
  //   if (onSort) {
  //     onSort(columnHeader)
  //   } else {
  //     if (sortColumn === columnHeader) {
  //       setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
  //     } else {
  //       setSortColumn(columnHeader)
  //       setSortDirection('asc')
  //     }
  //   }
  // }

  useKeyboard({
    onArrowUp: () => {
      setSelectedIndex((idx) => Math.max(0, idx - 1))
    },
    onArrowDown: () => {
      setSelectedIndex((idx) => Math.min(data.length - 1, idx + 1))
    },
    onEnter: () => {
      if (onSelect && data[selectedIndex]) {
        onSelect(data[selectedIndex])
      }
    },
  })

  // Render header
  const headerCells = columns.map((col, index) => {
    const width = columnWidths[index] ?? Math.floor(totalWidth / columns.length)
    const headerText = truncate(col.header, width)
    const sortIndicator = sortColumn === col.header ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''
    const fullText = headerText + sortIndicator + ' '.repeat(Math.max(0, width - headerText.length - sortIndicator.length))
    
    return fullText
  })

  // Render rows
  const rows = data.slice(viewport.startIndex, viewport.endIndex).map((row, index) => {
    const actualIndex = viewport.startIndex + index
    const isSelected = actualIndex === selectedIndex
    
    const cells = columns.map((col, colIndex) => {
      const width = columnWidths[colIndex] ?? Math.floor(totalWidth / columns.length)
      const cellValue = col.accessor(row)
      const cellText = truncate(cellValue, width)
      return cellText + ' '.repeat(Math.max(0, width - cellText.length))
    })

    const rowText = (isSelected ? '> ' : '  ') + cells.join(' ')

    return (
      <box key={actualIndex}>
        <text>
          {isSelected ? colorize(rowText, 'info') : rowText}
        </text>
      </box>
    )
  })

  return (
    <box>
      <text>{colorize(headerCells.join(' '), 'info')}</text>
      <text>{'-'.repeat(totalWidth)}</text>
      <box>{rows}</box>
      {data.length > viewport.visibleCount && (
        <text>
          Showing {viewport.startIndex + 1}-{viewport.endIndex} of {data.length}
        </text>
      )}
    </box>
  )
}
