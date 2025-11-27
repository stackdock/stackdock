#!/usr/bin/env node
/**
 * Start Convex
 * 
 * Start Convex development server
 */

import { runNpx } from '../core/run-command.js'
import { logger } from '../core/logger.js'

logger.header('Starting Convex')
logger.info('Watching for changes...')
logger.plain('')

await runNpx('convex', ['dev'], {
  label: 'convex dev',
})
