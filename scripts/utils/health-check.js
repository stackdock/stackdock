#!/usr/bin/env node
/**
 * Health Check
 * 
 * Check system health and dependencies
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { logger } from '../core/logger.js'
import { paths } from '../core/paths.js'

logger.header('StackDock Health Check')

const checks = []

// Check Node version
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim()
  checks.push({ name: 'Node.js', status: 'ok', info: nodeVersion })
} catch {
  checks.push({ name: 'Node.js', status: 'error', info: 'Not found' })
}

// Check npm version
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
  checks.push({ name: 'npm', status: 'ok', info: npmVersion })
} catch {
  checks.push({ name: 'npm', status: 'error', info: 'Not found' })
}

// Check Convex
try {
  execSync('npx convex --version', { encoding: 'utf8', stdio: 'pipe' })
  checks.push({ name: 'Convex CLI', status: 'ok', info: 'Installed' })
} catch {
  checks.push({ name: 'Convex CLI', status: 'warning', info: 'Not installed' })
}

// Check dependencies
const hasRootDeps = existsSync(`${paths.root}/node_modules`)
const hasWebDeps = existsSync(`${paths.web}/node_modules`)

checks.push({ 
  name: 'Root dependencies', 
  status: hasRootDeps ? 'ok' : 'error', 
  info: hasRootDeps ? 'Installed' : 'Missing (run: npm install)' 
})

checks.push({ 
  name: 'Web dependencies', 
  status: hasWebDeps ? 'ok' : 'error', 
  info: hasWebDeps ? 'Installed' : 'Missing' 
})

// Check .env files
const hasWebEnv = existsSync(`${paths.web}/.env.local`)
checks.push({ 
  name: 'Web .env.local', 
  status: hasWebEnv ? 'ok' : 'warning', 
  info: hasWebEnv ? 'Exists' : 'Missing (see docs)' 
})

// Print results
logger.plain('')
checks.forEach(check => {
  const icon = check.status === 'ok' ? '✓' : check.status === 'warning' ? '⚠' : '✗'
  const color = check.status === 'ok' ? 'green' : check.status === 'warning' ? 'yellow' : 'red'
  
  if (check.status === 'ok') {
    logger.success(`${check.name}: ${check.info}`)
  } else if (check.status === 'warning') {
    logger.warning(`${check.name}: ${check.info}`)
  } else {
    logger.error(`${check.name}: ${check.info}`)
  }
})

const hasErrors = checks.some(c => c.status === 'error')
logger.plain('')

if (hasErrors) {
  logger.error('Health check failed - fix errors above')
  process.exit(1)
} else {
  logger.success('Health check passed! System ready.')
}
