/**
 * Run Command Utility
 * 
 * Cross-platform command runner with proper error handling
 */

import { spawn } from 'child_process'
import { logger } from './logger.js'

/**
 * Run a command with arguments
 * 
 * @param {string} command - Command to run (e.g., 'npm', 'npx')
 * @param {string[]} args - Command arguments
 * @param {object} options - Options
 * @param {string} options.cwd - Working directory
 * @param {boolean} options.silent - Suppress output
 * @param {string} options.label - Label for logging
 * @returns {Promise<number>} - Exit code
 */
export function runCommand(command, args = [], options = {}) {
  const { cwd = process.cwd(), silent = false, label = command } = options
  
  return new Promise((resolve, reject) => {
    if (!silent) {
      logger.info(`Running: ${label}`)
    }
    
    const child = spawn(command, args, {
      cwd,
      stdio: silent ? 'pipe' : 'inherit',
      shell: true, // Required for Windows
    })
    
    child.on('error', (error) => {
      logger.error(`Failed to run ${label}: ${error.message}`)
      reject(error)
    })
    
    child.on('exit', (code) => {
      if (code === 0) {
        if (!silent) {
          logger.success(`${label} completed`)
        }
        resolve(code)
      } else {
        logger.error(`${label} failed with code ${code}`)
        resolve(code)
      }
    })
  })
}

/**
 * Run npm command in a workspace
 * 
 * @param {string} script - npm script name
 * @param {string} workspace - Workspace path (e.g., 'apps/web')
 * @param {object} options - Options
 */
export function runNpmScript(script, workspace, options = {}) {
  return runCommand('npm', ['run', script, '--workspace', workspace], {
    ...options,
    label: `npm run ${script} (${workspace})`,
  })
}

/**
 * Run command with npx
 */
export function runNpx(command, args = [], options = {}) {
  return runCommand('npx', [command, ...args], options)
}
