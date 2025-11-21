import type { RegistryItem } from '../utils/registry'
import { RegistryClient } from '../utils/registry'

export interface ListCommandResult {
  components: RegistryItem[]
  adapters: RegistryItem[]
  total: number
}

export type ListFilter = 'all' | 'components' | 'adapters'

/**
 * List command logic
 * 
 * Lists available components and adapters from the registry
 */
export async function listCommand(filter: ListFilter = 'all'): Promise<ListCommandResult> {
  try {
    const registryClient = new RegistryClient()
    
    const components = filter === 'all' || filter === 'components' 
      ? registryClient.getComponents() 
      : []
    
    const adapters = filter === 'all' || filter === 'adapters' 
      ? registryClient.getAdapters() 
      : []
    
    return {
      components,
      adapters,
      total: components.length + adapters.length,
    }
  } catch (error) {
    console.error('Failed to list registry items:', error)
    return {
      components: [],
      adapters: [],
      total: 0,
    }
  }
}
