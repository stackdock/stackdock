import { useState } from 'react'
import { useKeyboard } from '../hooks/useKeyboard'
import { colorize } from '../utils/colors'
import type { AppState } from '../App'
import type { TerminalSize } from '../hooks/useTerminal'
// OpenTUI components are available via JSX runtime when jsxImportSource is set

export interface CommandMenuProps {
  onSelectCommand: (command: AppState) => void
  terminalSize: TerminalSize
}

interface MenuItem {
  label: string
  description: string
  command: AppState
}

const menuItems: MenuItem[] = [
  { label: 'Add', description: 'Install a component or adapter from the registry', command: 'add' },
  { label: 'List', description: 'List available components and adapters', command: 'list' },
  { label: 'Init', description: 'Initialize StackDock in your project', command: 'init' },
  { label: 'Help', description: 'Show help and keyboard shortcuts', command: 'help' },
  { label: 'Exit', description: 'Exit the CLI', command: 'exit' },
]

/**
 * Main command selection menu
 */
export function CommandMenu({ onSelectCommand, terminalSize }: CommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useKeyboard({
    onArrowUp: () => {
      setSelectedIndex((idx) => Math.max(0, idx - 1))
    },
    onArrowDown: () => {
      setSelectedIndex((idx) => Math.min(menuItems.length - 1, idx + 1))
    },
    onEnter: () => {
      const item = menuItems[selectedIndex]
      if (item) {
        onSelectCommand(item.command)
      }
    },
    onEscape: () => {
      onSelectCommand('exit')
    },
  })

  // Center the menu
  const menuWidth = 60
  const menuHeight = menuItems.length + 4
  const startX = Math.floor((terminalSize.width - menuWidth) / 2)
  const startY = Math.floor((terminalSize.height - menuHeight) / 2)

  return (
    <box>
      {/* Header */}
      <box style={{ top: startY }}>
        <text>{colorize('StackDock CLI', 'info')}</text>
      </box>
      <text>{colorize('─'.repeat(menuWidth), 'muted')}</text>
      
      {/* Menu items */}
      <box>
        {menuItems.map((item, index) => {
          const isSelected = index === selectedIndex
          return (
            <box key={index} style={{ left: startX }}>
              <text>
                {isSelected ? '> ' : '  '}
                {isSelected ? colorize(item.label, 'info') : item.label}
                {colorize(` - ${item.description}`, 'muted')}
              </text>
            </box>
          )
        })}
      </box>
      
      {/* Footer */}
      <box style={{ top: terminalSize.height - startY - menuHeight }}>
        <text>{colorize('Use ↑↓ to navigate, Enter to select, Esc to exit', 'muted')}</text>
      </box>
    </box>
  )
}
