import { useState, useEffect } from 'react'
import { useTerminal } from './hooks/useTerminal'
import { CommandMenu } from './components/CommandMenu'
import { AddCommand } from './components/AddCommand'
import { ListCommand } from './components/ListCommand'
import { InitCommand } from './components/InitCommand'
import { HelpMenu } from './components/HelpMenu'

export type AppState = 'menu' | 'add' | 'list' | 'init' | 'help' | 'exit'

/**
 * Main TUI Application Component
 * 
 * Initializes OpenTUI and manages the overall application state
 */
export function App() {
  const [state, setState] = useState<AppState>('menu')
  const terminal = useTerminal()

  useEffect(() => {
    // Handle cleanup on exit
    const handleExit = () => {
      // Restore terminal state
      if (typeof process !== 'undefined' && process.stdin) {
        process.stdin.setRawMode(false)
        process.stdin.pause()
      }
    }

    process.on('SIGINT', handleExit)
    process.on('SIGTERM', handleExit)

    return () => {
      process.off('SIGINT', handleExit)
      process.off('SIGTERM', handleExit)
    }
  }, [])

  // Handle state transitions
  const handleStateChange = (newState: AppState) => {
    if (newState === 'exit') {
      process.exit(0)
    }
    setState(newState)
  }

  const handleBack = () => {
    setState('menu')
  }

  // Render based on current state
  switch (state) {
    case 'menu':
      return (
        <CommandMenu
          onSelectCommand={handleStateChange}
          terminalSize={terminal}
        />
      )
    case 'add':
      return <AddCommand onBack={handleBack} terminalSize={terminal} />
    case 'list':
      return <ListCommand onBack={handleBack} terminalSize={terminal} />
    case 'init':
      return <InitCommand onBack={handleBack} terminalSize={terminal} />
    case 'help':
      return <HelpMenu onBack={handleBack} />
    case 'exit':
      return null
    default:
      return <CommandMenu onSelectCommand={handleStateChange} terminalSize={terminal} />
  }
}
