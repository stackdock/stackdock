#!/usr/bin/env node
/**
 * Cleanup
 * 
 * Clean node_modules and build artifacts
 */

import { runNpx } from '../core/run-command.js'
import { logger } from '../core/logger.js'

logger.header('Cleaning StackDock')
logger.info('Removing node_modules...')
logger.plain('')

await runNpx('rimraf', [
  'node_modules',
  'apps/web/node_modules',
  'apps/marketing/node_modules',
  'apps/docs/node_modules',
  'apps/web/dist',
  'packages/*/dist',
], {
  label: 'cleanup',
})

logger.plain('')
logger.success('Cleanup complete!')
logger.info('Run: npm install')
