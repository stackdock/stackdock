#!/usr/bin/env node
/**
 * Test Coverage
 * 
 * Generate test coverage reports
 * 
 * Usage:
 *   npm run test:coverage
 */

import { runNpx } from '../core/run-command.js'
import { fromRoot } from '../core/paths.js'
import { logger } from '../core/logger.js'

const args = process.argv.slice(2)
const workspace = args[0] || 'apps/web'
const workspacePath = fromRoot(workspace)

logger.header('Generating Test Coverage')
logger.info(`Workspace: ${workspace}`)
logger.plain('')

const exitCode = await runNpx('vitest', ['run', '--coverage'], {
  cwd: workspacePath,
  label: `vitest coverage (${workspace})`,
})

if (exitCode === 0) {
  logger.plain('')
  logger.success('Coverage report generated!')
  logger.info(`View: ${workspace}/coverage/index.html`)
}

process.exit(exitCode)
