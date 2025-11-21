import { useState } from 'react'
import { useKeyboard } from '../hooks/useKeyboard'
import { calculateViewport } from '../utils/layout'
import { colorize } from '../utils/colors'
import type { TerminalSize } from '../hooks/useTerminal'

export interface SelectOption {
  label: string
  value: string
  description?: string
}

export interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  searchable?: boolean
  label?: string
  terminalSize: TerminalSize
}

/**
 * Select dropdown component for TUI
 */
export function Select({
  options,
  value,
  onChange,
  searchable = false,
  label,
  terminalSize,
}: SelectProps) {
  const [selectedIndex, setSelectedIndex] = useState(() => {
    if (value) {
      const index = options.findIndex((opt) => opt.value === value)
      return index >= 0 ? index : 0
    }
    return 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const filteredOptions = searchable && searchQuery
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options

  const viewport = calculateViewport(
    filteredOptions.length,
    terminalSize.height - 4, // Reserve space for header/footer
    selectedIndex
  )

  useKeyboard({
    onArrowUp: () => {
      setSelectedIndex((idx) => Math.max(0, idx - 1))
      setIsSearching(false)
    },
    onArrowDown: () => {
      setSelectedIndex((idx) => Math.min(filteredOptions.length - 1, idx + 1))
      setIsSearching(false)
    },
    onEnter: () => {
      if (filteredOptions[selectedIndex]) {
        onChange(filteredOptions[selectedIndex].value)
      }
    },
    onKey: (key: string) => {
      if (searchable && key.length === 1) {
        setIsSearching(true)
        setSearchQuery((q) => q + key)
      }
    },
    onBackspace: () => {
      if (searchable) {
        setIsSearching(true)
        setSearchQuery((q) => q.slice(0, -1))
      }
    },
  })

  return (
    <box>
      {label && <text>{colorize(label, 'info')}</text>}
      {searchable && isSearching && (
        <text>
          Search: {searchQuery}
        </text>
      )}
      <box>
        {filteredOptions.slice(viewport.startIndex, viewport.endIndex).map((option, index) => {
          const actualIndex = viewport.startIndex + index
          const isSelected = actualIndex === selectedIndex
          
          return (
            <box key={option.value}>
              <text>
                {isSelected ? '> ' : '  '}
                {isSelected ? colorize(option.label, 'info') : option.label}
                {option.description && (
                  <span> {colorize(`- ${option.description}`, 'muted')}</span>
                )}
              </text>
            </box>
          )
        })}
      </box>
    </box>
  )
}
