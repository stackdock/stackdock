/**
 * Logger Utility
 * 
 * Cross-platform colored console logging
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

export const logger = {
  info(message) {
    console.log(`${colors.blue}ℹ${colors.reset} ${message}`)
  },
  
  success(message) {
    console.log(`${colors.green}✓${colors.reset} ${message}`)
  },
  
  error(message) {
    console.error(`${colors.red}✗${colors.reset} ${message}`)
  },
  
  warning(message) {
    console.warn(`${colors.yellow}⚠${colors.reset} ${message}`)
  },
  
  header(message) {
    console.log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}\n`)
  },
  
  section(message) {
    console.log(`\n${colors.bright}${message}${colors.reset}`)
  },
  
  plain(message) {
    console.log(message)
  },
}
