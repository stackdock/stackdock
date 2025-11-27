#!/usr/bin/env node
/**
 * Start Web App
 * 
 * Start the main StackDock web application
 */

import { runNpmScript } from '../core/run-command.js'
import { logger } from '../core/logger.js'

logger.header('Starting StackDock Web App')
logger.info('Workspace: apps/web')
logger.info('Port: 3000')
logger.info('URL: http://localhost:3000')
logger.plain('')

await runNpmScript('dev', 'apps/web')
