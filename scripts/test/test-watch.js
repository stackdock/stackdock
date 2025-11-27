#!/usr/bin/env node
/**
 * Test Watch Mode
 * 
 * Run tests in watch mode for development
 * 
 * Usage:
 *   npm run test:watch
 *   npm run test:watch apps/marketing
 */

import { runNpx } from '../core/run-command.js'
import { fromRoot } from '../core/paths.js'
import { logger } from '../core/logger.js'

const args = process.argv.slice(2)
const workspace = args[0] || 'apps/web'
const workspacePath = fromRoot(workspace)

logger.header('Test Watch Mode')
logger.info(`Workspace: ${workspace}`)
logger.info('Press Ctrl+C to exit')
logger.plain('')

await runNpx('vitest', [], {
  cwd: workspacePath,
  label: `vitest watch (${workspace})`,
})
