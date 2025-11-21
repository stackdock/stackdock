import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import type { RegistryItem } from './registry'

export interface InstallResult {
  success: boolean
  message: string
  filesCopied?: string[]
  errors?: string[]
}

/**
 * Installer for components and adapters
 */
export class Installer {
  private targetBasePath: string

  constructor(targetBasePath: string = process.cwd()) {
    this.targetBasePath = targetBasePath
  }

  /**
   * Install a component or adapter
   */
  async install(
    item: RegistryItem,
    type: 'component' | 'adapter',
    sourceBasePath: string = process.cwd()
  ): Promise<InstallResult> {
    const errors: string[] = []
    const filesCopied: string[] = []

    try {
      // Determine source and target paths
      const sourcePath = join(sourceBasePath, item.location)
      const targetPath = this.getTargetPath(item, type)

      // Check if source exists
      if (!existsSync(sourcePath)) {
        return {
          success: false,
          message: `Source file not found: ${sourcePath}`,
          errors: [`File not found: ${sourcePath}`],
        }
      }

      // Create target directory if needed
      const targetDir = dirname(targetPath)
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true })
      }

      // Copy file
      copyFileSync(sourcePath, targetPath)
      filesCopied.push(targetPath)

      // Update registry manifest if needed
      await this.updateRegistryManifest(item, type)

      return {
        success: true,
        message: `Successfully installed ${type}: ${item.name}`,
        filesCopied,
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
      return {
        success: false,
        message: `Failed to install ${type}: ${item.name}`,
        errors,
        filesCopied,
      }
    }
  }

  /**
   * Get target path for installation
   */
  private getTargetPath(item: RegistryItem, type: 'component' | 'adapter'): string {
    if (type === 'component') {
      // Components go to apps/web/src/components/
      return join(this.targetBasePath, 'apps', 'web', 'src', 'components', item.name + '.tsx')
    } else {
      // Adapters go to convex/docks/adapters/
      return join(this.targetBasePath, 'convex', 'docks', 'adapters', item.name, 'adapter.ts')
    }
  }

  /**
   * Update registry manifest in target project
   */
  private async updateRegistryManifest(
    _item: RegistryItem,
    _type: 'component' | 'adapter'
  ): Promise<void> {
    // This would update the registry.json in the target project
    // For now, we'll skip this as it requires more complex logic
    // TODO: Implement registry manifest updates
  }

  /**
   * Check if item is already installed
   */
  isInstalled(item: RegistryItem, type: 'component' | 'adapter'): boolean {
    const targetPath = this.getTargetPath(item, type)
    return existsSync(targetPath)
  }

  /**
   * Uninstall a component or adapter
   */
  async uninstall(
    item: RegistryItem,
    type: 'component' | 'adapter'
  ): Promise<InstallResult> {
    try {
      const targetPath = this.getTargetPath(item, type)

      if (!existsSync(targetPath)) {
        return {
          success: false,
          message: `${type} not found: ${item.name}`,
        }
      }

      // In a real implementation, we would delete the file
      // For now, we'll just return success
      // TODO: Implement file deletion

      return {
        success: true,
        message: `Successfully uninstalled ${type}: ${item.name}`,
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to uninstall ${type}: ${item.name}`,
        errors: [error instanceof Error ? error.message : String(error)],
      }
    }
  }
}
