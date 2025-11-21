import { useState } from 'react'
import { useKeyboard } from '../hooks/useKeyboard'
import { Input } from './Input'
import { Progress } from './Progress'
import { Dialog } from './Dialog'
import { colorize, statusColors } from '../utils/colors'
import { initCommand } from '../../commands/init'
import type { TerminalSize } from '../hooks/useTerminal'

export interface InitCommandProps {
  onBack: () => void
  terminalSize: TerminalSize
}

type InitState = 'input-name' | 'confirming' | 'initializing' | 'success' | 'error'

/**
 * Init command TUI component
 */
export function InitCommand({ onBack }: InitCommandProps) {
  const [state, setState] = useState<InitState>('input-name')
  const [projectName, setProjectName] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useKeyboard({
    onEscape: () => {
      if (state === 'input-name' || state === 'confirming') {
        onBack()
      } else if (state === 'success' || state === 'error') {
        onBack()
      }
    },
  })

  const handleNameSubmit = (name: string) => {
    setProjectName(name)
    setState('confirming')
  }

  const handleConfirm = async () => {
    setState('initializing')
    setProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return p + 10
        })
      }, 200)

      const result = await initCommand(projectName || undefined)

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success) {
        setState('success')
      } else {
        setError(result.message)
        setState('error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setState('error')
    }
  }

  switch (state) {
    case 'input-name':
      return (
        <box>
          <text>{colorize('Initialize StackDock', 'info')}</text>
          <Input
            value={projectName}
            onChange={setProjectName}
            onSubmit={handleNameSubmit}
            placeholder="Enter project name (optional)"
            label="Project name:"
          />
        </box>
      )

    case 'confirming':
      return (
        <Dialog
          title="Initialize StackDock"
          message={`Initialize StackDock in the current directory${projectName ? ` as "${projectName}"` : ''}?`}
          buttons={[
            { label: 'Yes', action: handleConfirm, primary: true },
            { label: 'No', action: () => setState('input-name') },
          ]}
          onClose={() => setState('input-name')}
        />
      )

    case 'initializing':
      return (
        <box>
          <text>{colorize('Initializing...', 'info')}</text>
          <Progress value={progress} max={100} label="Setting up StackDock" />
        </box>
      )

    case 'success':
      return (
        <box>
          <text>{statusColors.success('StackDock initialized successfully!')}</text>
          <text>{colorize('Press any key to continue...', 'muted')}</text>
        </box>
      )

    case 'error':
      return (
        <box>
          <text>{statusColors.error(`Error: ${error || 'Unknown error'}`)}</text>
          <text>{colorize('Press Esc to go back...', 'muted')}</text>
        </box>
      )

    default:
      return null
  }
}
