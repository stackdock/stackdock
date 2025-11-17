import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// In monorepo, Next.js package is hoisted to root node_modules
// turbopack.root should point to repo root where next/package.json can be found
const repoRoot = resolve(__dirname, '../..')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  turbopack: {
    root: repoRoot,
  },
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
}

export default nextConfig
