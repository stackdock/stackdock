#!/usr/bin/env node

/**
 * Sync Universal Types Script
 * 
 * Copies universal types from packages/shared to convex/lib/universalTypes.ts
 * This ensures the Convex copy stays in sync with the shared package.
 * 
 * Usage:
 *   node scripts/sync-universal-types.js
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '..')

const sourcePath = join(repoRoot, 'packages', 'shared', 'src', 'schema.ts')
const targetPath = join(repoRoot, 'convex', 'lib', 'universalTypes.ts')

console.log('Syncing universal types...')
console.log(`Source: ${sourcePath}`)
console.log(`Target: ${targetPath}`)

try {
  const sourceContent = readFileSync(sourcePath, 'utf-8')
  
  // Write to target
  writeFileSync(targetPath, sourceContent, 'utf-8')
  
  console.log('✅ Successfully synced universal types!')
  console.log('   The Convex copy is now in sync with packages/shared')
} catch (error) {
  console.error('❌ Error syncing universal types:', error.message)
  process.exit(1)
}
