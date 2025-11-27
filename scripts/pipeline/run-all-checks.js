#!/usr/bin/env node
/**
 * Pipeline - Run All Checks
 * 
 * Run all CI/CD checks
 */

import { runCommand } from '../core/run-command.js'
import { logger } from '../core/logger.js'

logger.header('StackDock Pipeline - All Checks')

const checks = [
  { name: 'Lint & Type Check', script: 'pipeline:lint' },
  { name: 'Unit Tests', script: 'pipeline:test' },
  { name: 'Security Scan', script: 'pipeline:security' },
  { name: 'Build Verification', script: 'pipeline:build' },
]

let failed = false

for (const check of checks) {
  logger.section(`Running: ${check.name}`)
  
  const exitCode = await runCommand('npm', ['run', check.script], {
    label: check.name,
  })
  
  if (exitCode !== 0) {
    failed = true
    logger.error(`${check.name} failed`)
    break
  }
  
  logger.plain('')
}

if (!failed) {
  logger.success('✅ All pipeline checks passed!')
} else {
  logger.error('❌ Pipeline failed')
  process.exit(1)
}
