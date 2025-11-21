import { colorize } from '../utils/colors'

export interface ProgressProps {
  value: number
  max: number
  label?: string
  variant?: 'bar' | 'spinner'
  width?: number
}

/**
 * Progress indicator component for TUI
 */
export function Progress({
  value,
  max,
  label,
  variant = 'bar',
  width = 40,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, Math.floor((value / max) * 100)))
  
  if (variant === 'spinner') {
    const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    const spinnerIndex = Math.floor(Date.now() / 100) % spinnerChars.length
    
    return (
      <box>
        {label && <text>{label} </text>}
        <text>{spinnerChars[spinnerIndex]}</text>
      </box>
    )
  }

  // Progress bar
  const filled = Math.floor((percentage / 100) * width)
  const empty = width - filled
  const bar = '█'.repeat(filled) + '░'.repeat(empty)

  return (
    <box>
      {label && <text>{label}</text>}
      <text>
        <span>{colorize(bar.slice(0, filled), 'info')}</span>
        <span>{bar.slice(filled)}</span>
        <span> {percentage}%</span>
      </text>
    </box>
  )
}
