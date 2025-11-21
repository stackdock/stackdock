import { useState } from 'react'
import { useKeyboard } from '../hooks/useKeyboard'
import { colorize } from '../utils/colors'

export interface DialogButton {
  label: string
  action: () => void
  primary?: boolean
}

export interface DialogProps {
  title: string
  message: string
  buttons: DialogButton[]
  onClose?: () => void
}

/**
 * Dialog/modal component for TUI
 */
export function Dialog({ title, message, buttons, onClose }: DialogProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useKeyboard({
    onArrowLeft: () => {
      setSelectedIndex((idx) => Math.max(0, idx - 1))
    },
    onArrowRight: () => {
      setSelectedIndex((idx) => Math.min(buttons.length - 1, idx + 1))
    },
    onEnter: () => {
      buttons[selectedIndex]?.action()
      onClose?.()
    },
    onEscape: () => {
      onClose?.()
    },
  })

  return (
    <box>
      <text>{colorize(title, 'info')}</text>
      <text>{message}</text>
      <box>
        {buttons.map((button, index) => (
          <span key={index}>
            <text>
              {index === selectedIndex ? '[' : ' '}
              {button.primary ? colorize(button.label, 'info') : button.label}
              {index === selectedIndex ? ']' : ' '}
            </text>
          </span>
        ))}
      </box>
    </box>
  )
}
