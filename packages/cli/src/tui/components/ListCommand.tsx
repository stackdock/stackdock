import { useState } from 'react'
import { useKeyboard } from '../hooks/useKeyboard'
import { Table } from './Table'
import { Select } from './Select'
import { colorize } from '../utils/colors'
import { RegistryClient } from '../../utils/registry'
import type { TerminalSize } from '../hooks/useTerminal'

export interface ListCommandProps {
  onBack: () => void
  terminalSize: TerminalSize
}

type ListFilter = 'all' | 'components' | 'adapters'

/**
 * List command TUI component
 */
export function ListCommand({ onBack, terminalSize }: ListCommandProps) {
  const [filter, setFilter] = useState<ListFilter>('all')
  const registryClient = new RegistryClient()

  const filterOptions = [
    { label: 'All', value: 'all', description: 'Show all items' },
    { label: 'Components', value: 'components', description: 'Show only UI components' },
    { label: 'Adapters', value: 'adapters', description: 'Show only dock adapters' },
  ]

  useKeyboard({
    onEscape: () => {
      onBack()
    },
  })

  const components = registryClient.getComponents()
  const adapters = registryClient.getAdapters()

  let displayItems: Array<{ name: string; description: string; type: string }> = []

  if (filter === 'all') {
    displayItems = [
      ...components.map((c) => ({ name: c.name, description: c.description, type: 'Component' })),
      ...adapters.map((a) => ({ name: a.name, description: a.description, type: 'Adapter' })),
    ]
  } else if (filter === 'components') {
    displayItems = components.map((c) => ({ name: c.name, description: c.description, type: 'Component' }))
  } else {
    displayItems = adapters.map((a) => ({ name: a.name, description: a.description, type: 'Adapter' }))
  }

  return (
    <box>
      <text>{colorize('List Components and Adapters', 'info')}</text>
      <box>
        <Select
          options={filterOptions}
          value={filter}
          onChange={(value) => setFilter(value as ListFilter)}
          label="Filter:"
          terminalSize={terminalSize}
        />
      </box>
      <box>
        <Table
          columns={[
            { header: 'Name', accessor: (row) => row.name },
            { header: 'Type', accessor: (row) => row.type },
            { header: 'Description', accessor: (row) => row.description },
          ]}
          data={displayItems}
          terminalSize={terminalSize}
        />
      </box>
      <text>{colorize('Press Esc to go back', 'muted')}</text>
    </box>
  )
}
