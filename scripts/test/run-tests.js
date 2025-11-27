#!/usr/bin/env node
/**
 * Run Tests
 * 
 * Universal cross-platform test runner
 * 
 * Usage:
 *   npm test                    # Test apps/web
 *   npm test apps/marketing     # Test specific workspace
 *   node scripts/test/run-tests.js packages/plugins/ai-assistant
 */

import { runNpx } from '../core/run-command.js'
import { fromRoot } from '../core/paths.js'
import { logger } from '../core/logger.js'

const args = process.argv.slice(2)
const workspace = args[0] || 'apps/web'
const workspacePath = fromRoot(workspace)

logger.header('Running Tests')
logger.info(`Workspace: ${workspace}`)
logger.plain('')

const exitCode = await runNpx('vitest', ['run'], {
  cwd: workspacePath,
  label: `vitest (${workspace})`,
})

if (exitCode === 0) {
  logger.plain('')
  logger.success('All tests passed! 🎉')
} else {
  logger.plain('')
  logger.error('Tests failed')
  process.exit(exitCode)
}
