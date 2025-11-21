import { useKeyboard } from '../hooks/useKeyboard'
import { colorize } from '../utils/colors'

export interface HelpMenuProps {
  onBack: () => void
}

/**
 * Help menu component with keyboard shortcuts and examples
 */
export function HelpMenu({ onBack }: HelpMenuProps) {
  useKeyboard({
    onEscape: () => {
      onBack()
    },
    onEnter: () => {
      onBack()
    },
  })

  const shortcuts = [
    { key: '↑/↓', description: 'Navigate up/down in menus and lists' },
    { key: '←/→', description: 'Navigate left/right in dialogs and tables' },
    { key: 'Enter', description: 'Select item or confirm action' },
    { key: 'Esc', description: 'Go back or exit' },
    { key: 'Tab', description: 'Move to next field' },
    { key: 'Backspace', description: 'Delete character in input fields' },
  ]

  const examples = [
    {
      command: 'stackdock add',
      description: 'Install a component or adapter interactively',
    },
    {
      command: 'stackdock list',
      description: 'Browse available components and adapters',
    },
    {
      command: 'stackdock init',
      description: 'Initialize StackDock in your project',
    },
  ]

  return (
    <box>
      <text>{colorize('StackDock CLI Help', 'info')}</text>
      <text>{colorize('═'.repeat(60), 'muted')}</text>
      
      <box style={{ top: 2 }}>
        <text>{colorize('Keyboard Shortcuts', 'info')}</text>
        {shortcuts.map((shortcut, index) => (
          <text key={index}>
            {colorize(shortcut.key, 'info')} - {shortcut.description}
          </text>
        ))}
      </box>

      <box style={{ top: 2 }}>
        <text>{colorize('Commands', 'info')}</text>
        {examples.map((example, index) => (
          <box key={index}>
            <text>{colorize(example.command, 'info')}</text>
            <text style={{ left: 2 }}>{colorize(example.description, 'muted')}</text>
          </box>
        ))}
      </box>

      <box style={{ top: 2 }}>
        <text>{colorize('About', 'info')}</text>
        <text>
          StackDock CLI allows you to install components and adapters from the registry
          into your codebase, following the copy/paste/own model.
        </text>
        <text style={{ top: 1 }}>
          Components and adapters are copied to your project, and you own the code.
          You can modify, customize, and extend them as needed.
        </text>
      </box>

      <box style={{ top: 2 }}>
        <text>{colorize('Press Esc or Enter to go back', 'muted')}</text>
      </box>
    </box>
  )
}
