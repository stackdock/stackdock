#!/usr/bin/env node

/**
 * Generate a secure 256-bit encryption key for StackDock
 * 
 * Usage: node scripts/generate-encryption-key.js
 * 
 * Output: 64-character hexadecimal string
 * Add to .env.local as ENCRYPTION_MASTER_KEY
 */

const crypto = require('crypto')

// Generate 256-bit (32 byte) key
const key = crypto.randomBytes(32).toString('hex')

console.log('╔═══════════════════════════════════════════════════════════════╗')
console.log('║         StackDock Encryption Key Generator                    ║')
console.log('╚═══════════════════════════════════════════════════════════════╝')
console.log('')
console.log('🔐 Your encryption key (256-bit AES):')
console.log('')
console.log(`ENCRYPTION_MASTER_KEY=${key}`)
console.log('')
console.log('⚠️  SECURITY WARNINGS:')
console.log('  1. Add this to .env.local (NEVER commit to git)')
console.log('  2. Store in secure secrets manager for production')
console.log('  3. Rotate this key every 90 days')
console.log('  4. Never log or expose this key')
console.log('')
console.log('📝 Next steps:')
console.log('  1. Copy the line above to your .env.local file')
console.log('  2. Restart your development server')
console.log('  3. Test dock connection to verify encryption works')
console.log('')
