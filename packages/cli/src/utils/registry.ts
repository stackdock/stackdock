import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'

export interface RegistryItem {
  name: string
  description: string
  location: string
  dependencies?: string[]
  category?: string
}

export interface RegistryManifest {
  version: string
  components?: Record<string, RegistryItem>
  adapters?: Record<string, RegistryItem>
}

/**
 * Registry API client for fetching registry data
 */
export class RegistryClient {
  private uiRegistryPath: string
  private docksRegistryPath: string
  private cache: {
    ui?: RegistryManifest
    docks?: RegistryManifest
  } = {}

  constructor(basePath?: string) {
    // Find monorepo root by looking for packages/ directory
    const repoRoot = basePath || this.findMonorepoRoot()
    this.uiRegistryPath = join(repoRoot, 'packages', 'ui', 'registry.json')
    this.docksRegistryPath = join(repoRoot, 'packages', 'docks', 'registry.json')
  }

  /**
   * Find the monorepo root by walking up from current directory
   * looking for packages/ directory
   */
  private findMonorepoRoot(): string {
    let currentDir = process.cwd()
    const root = process.platform === 'win32' ? 'C:\\' : '/'
    
    while (currentDir !== root) {
      const packagesDir = join(currentDir, 'packages')
      const uiRegistry = join(packagesDir, 'ui', 'registry.json')
      const docksRegistry = join(packagesDir, 'docks', 'registry.json')
      
      // Check if both registry files exist
      if (existsSync(uiRegistry) && existsSync(docksRegistry)) {
        return currentDir
      }
      
      // Move up one directory
      const parentDir = dirname(currentDir)
      if (parentDir === currentDir) {
        break // Reached filesystem root
      }
      currentDir = parentDir
    }
    
    // Fallback to process.cwd() if not found
    return process.cwd()
  }

  /**
   * Load UI registry manifest
   */
  loadUIRegistry(): RegistryManifest {
    if (this.cache.ui) {
      return this.cache.ui
    }

    try {
      const content = readFileSync(this.uiRegistryPath, 'utf-8')
      this.cache.ui = JSON.parse(content) as RegistryManifest
      return this.cache.ui
    } catch (error) {
      console.error(`Failed to load UI registry from ${this.uiRegistryPath}:`, error)
      return { version: '1.0.0', components: {} }
    }
  }

  /**
   * Load docks registry manifest
   */
  loadDocksRegistry(): RegistryManifest {
    if (this.cache.docks) {
      return this.cache.docks
    }

    try {
      const content = readFileSync(this.docksRegistryPath, 'utf-8')
      this.cache.docks = JSON.parse(content) as RegistryManifest
      return this.cache.docks
    } catch (error) {
      console.error(`Failed to load docks registry from ${this.docksRegistryPath}:`, error)
      return { version: '1.0.0', adapters: {} }
    }
  }

  /**
   * Get all components
   */
  getComponents(): RegistryItem[] {
    const registry = this.loadUIRegistry()
    if (!registry.components) {
      return []
    }

    return Object.entries(registry.components).map(([key, item]) => ({
      ...item,
      name: key,
    }))
  }

  /**
   * Get all adapters
   */
  getAdapters(): RegistryItem[] {
    const registry = this.loadDocksRegistry()
    if (!registry.adapters) {
      return []
    }

    return Object.entries(registry.adapters).map(([key, item]) => ({
      ...item,
      name: key,
    }))
  }

  /**
   * Get a specific component by name
   */
  getComponent(name: string): RegistryItem | null {
    const registry = this.loadUIRegistry()
    if (!registry.components || !registry.components[name]) {
      return null
    }

    return {
      ...registry.components[name],
      name,
    }
  }

  /**
   * Get a specific adapter by name
   */
  getAdapter(name: string): RegistryItem | null {
    const registry = this.loadDocksRegistry()
    if (!registry.adapters || !registry.adapters[name]) {
      return null
    }

    return {
      ...registry.adapters[name],
      name,
    }
  }

  /**
   * Search components and adapters
   */
  search(query: string): { components: RegistryItem[]; adapters: RegistryItem[] } {
    const lowerQuery = query.toLowerCase()
    
    const components = this.getComponents().filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery)
    )

    const adapters = this.getAdapters().filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery)
    )

    return { components, adapters }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = {}
  }
}
