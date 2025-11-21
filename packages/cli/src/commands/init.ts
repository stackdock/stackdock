import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface InitCommandResult {
  success: boolean
  message: string
  createdFiles?: string[]
  errors?: string[]
}

/**
 * Init command logic
 * 
 * Initializes StackDock in the current project
 */
export async function initCommand(projectName?: string): Promise<InitCommandResult> {
  const createdFiles: string[] = []
  const errors: string[] = []

  try {
    const basePath = process.cwd()
    const stackdockDir = join(basePath, '.stackdock')

    // Create .stackdock directory
    if (!existsSync(stackdockDir)) {
      mkdirSync(stackdockDir, { recursive: true })
      createdFiles.push(stackdockDir)
    }

    // Create registry config file
    const configPath = join(stackdockDir, 'config.json')
    if (!existsSync(configPath)) {
      const config = {
        version: '1.0.0',
        projectName: projectName || 'stackdock-project',
        registries: {
          ui: '../../packages/ui/registry.json',
          docks: '../../packages/docks/registry.json',
        },
      }
      writeFileSync(configPath, JSON.stringify(config, null, 2))
      createdFiles.push(configPath)
    }

    return {
      success: true,
      message: 'StackDock initialized successfully',
      createdFiles,
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error))
    return {
      success: false,
      message: 'Failed to initialize StackDock',
      errors,
      createdFiles,
    }
  }
}
