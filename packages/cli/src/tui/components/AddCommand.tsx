import { useState } from 'react'
import { useKeyboard } from '../hooks/useKeyboard'
import { Select } from './Select'
import { Dialog } from './Dialog'
import { Progress } from './Progress'
import { colorize, statusColors } from '../utils/colors'
import { RegistryClient } from '../../utils/registry'
import { Installer } from '../../utils/installer'
import type { TerminalSize } from '../hooks/useTerminal'

export interface AddCommandProps {
  onBack: () => void
  terminalSize: TerminalSize
}

type AddState = 'select-type' | 'select-item' | 'confirm' | 'installing' | 'success' | 'error'

/**
 * Add command TUI component
 */
export function AddCommand({ onBack, terminalSize }: AddCommandProps) {
  const [state, setState] = useState<AddState>('select-type')
  const [selectedType, setSelectedType] = useState<'component' | 'adapter'>('component')
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const registryClient = new RegistryClient()
  const installer = new Installer()

  const typeOptions = [
    { label: 'Component', value: 'component', description: 'UI component from the registry' },
    { label: 'Adapter', value: 'adapter', description: 'Dock adapter from the registry' },
  ]

  const items = selectedType === 'component'
    ? registryClient.getComponents()
    : registryClient.getAdapters()

  const itemOptions = items.map((item) => ({
    label: item.name,
    value: item.name,
    description: item.description,
  }))

  useKeyboard({
    onEscape: () => {
      if (state === 'select-type' || state === 'select-item') {
        onBack()
      } else if (state === 'confirm') {
        setState('select-item')
      }
    },
  })

  const handleTypeSelect = (value: string) => {
    setSelectedType(value as 'component' | 'adapter')
    setState('select-item')
  }

  const handleItemSelect = (value: string) => {
    setSelectedItem(value)
    setState('confirm')
  }

  const handleConfirm = async () => {
    if (!selectedItem) return

    setState('installing')
    setProgress(0)

    try {
      const item = selectedType === 'component'
        ? registryClient.getComponent(selectedItem)
        : registryClient.getAdapter(selectedItem)

      if (!item) {
        throw new Error(`Item not found: ${selectedItem}`)
      }

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

      const result = await installer.install(item, selectedType)

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
    case 'select-type':
      return (
        <box>
          <text>{colorize('Add Component or Adapter', 'info')}</text>
          <Select
            options={typeOptions}
            onChange={handleTypeSelect}
            label="Select type:"
            terminalSize={terminalSize}
          />
        </box>
      )

    case 'select-item':
      return (
        <box>
          <text>{colorize(`Add ${selectedType === 'component' ? 'Component' : 'Adapter'}`, 'info')}</text>
          {itemOptions.length === 0 ? (
            <text>{colorize(`No ${selectedType}s available`, 'warning')}</text>
          ) : (
            <Select
              options={itemOptions}
              onChange={handleItemSelect}
              label={`Select ${selectedType}:`}
              searchable
              terminalSize={terminalSize}
            />
          )}
        </box>
      )

    case 'confirm':
      return (
        <Dialog
          title={`Install ${selectedType}: ${selectedItem}`}
          message={`Are you sure you want to install ${selectedItem}?`}
          buttons={[
            { label: 'Yes', action: handleConfirm, primary: true },
            { label: 'No', action: () => setState('select-item') },
          ]}
          onClose={() => setState('select-item')}
        />
      )

    case 'installing':
      return (
        <box>
          <text>{colorize('Installing...', 'info')}</text>
          <Progress value={progress} max={100} label={`Installing ${selectedItem}`} />
        </box>
      )

    case 'success':
      return (
        <box>
          <text>{statusColors.success(`Successfully installed ${selectedType}: ${selectedItem}`)}</text>
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
