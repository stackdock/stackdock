/**
 * Path Utilities
 * 
 * Cross-platform path resolution
 */

import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Get repo root (scripts/ is one level down)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export const REPO_ROOT = resolve(__dirname, '../..')

/**
 * Resolve path from repo root
 */
export function fromRoot(...paths) {
  return resolve(REPO_ROOT, ...paths)
}

/**
 * Common paths
 */
export const paths = {
  root: REPO_ROOT,
  scripts: fromRoot('scripts'),
  apps: fromRoot('apps'),
  packages: fromRoot('packages'),
  convex: fromRoot('convex'),
  web: fromRoot('apps/web'),
  marketing: fromRoot('apps/marketing'),
  docs: fromRoot('apps/docs'),
}
