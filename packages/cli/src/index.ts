#!/usr/bin/env node

/**
 * StackDock CLI
 * 
 * Command-line tool for installing components and adapters from the registry
 */

import { Command } from 'commander'
import { initCommand } from './commands/init'
import { listCommand } from './commands/list'
import { addCommand } from './commands/add'
import { initializeAndRenderTUI } from './tui/initOpenTUI'
import { App } from './tui/App'
import React from 'react'

// Check if we should use TUI or fallback to Commander.js
const useTUI = !process.argv.includes('--no-tui') && process.stdout.isTTY

if (useTUI) {
  // Try to initialize OpenTUI and render TUI
  initializeAndRenderTUI(React.createElement(App))
    .then((success) => {
      if (!success) {
        // Fall back to Commander.js if OpenTUI failed
        runCommanderMode()
      }
      // If success, OpenTUI is handling the rendering and the app will run
    })
    .catch((error) => {
      // Fall back to Commander.js on error
      console.warn('TUI mode unavailable, falling back to text mode')
      console.warn('Error:', error instanceof Error ? error.message : String(error))
      console.warn('Install Zig to enable TUI mode: https://ziglang.org/download/')
      runCommanderMode()
    })
} else {
  // Use Commander.js for non-interactive mode
  runCommanderMode()
}

function runCommanderMode() {
  const program = new Command()

  program
    .name('stackdock')
    .description('StackDock CLI - Install components and adapters from the registry')
    .version('0.1.0')
    .option('--no-tui', 'Disable TUI mode and use text output')

  program
    .command('add <name>')
    .description('Install a component or adapter from the registry')
    .option('-t, --type <type>', 'Type: component or adapter', 'component')
    .action(async (name: string, options: { type: string }) => {
      const result = await addCommand(name, options.type as 'component' | 'adapter')
      if (result.success) {
        console.log(result.message)
      } else {
        console.error(result.message)
        if (result.errors) {
          result.errors.forEach((err) => console.error(`  - ${err}`))
        }
        process.exit(1)
      }
    })

  program
    .command('list [type]')
    .description('List available components and adapters')
    .option('-t, --type <type>', 'Type: components, adapters, or all', 'all')
    .action(async (type: string | undefined, options: { type: string }) => {
      const filter = (options.type || type || 'all') as 'all' | 'components' | 'adapters'
      const result = await listCommand(filter)
      
      console.log(`\nFound ${result.total} items:\n`)
      
      if (result.components.length > 0) {
        console.log('Components:')
        result.components.forEach((item) => {
          console.log(`  - ${item.name}: ${item.description}`)
        })
        console.log()
      }
      
      if (result.adapters.length > 0) {
        console.log('Adapters:')
        result.adapters.forEach((item) => {
          console.log(`  - ${item.name}: ${item.description}`)
        })
        console.log()
      }
    })

  program
    .command('init')
    .description('Initialize StackDock in your project')
    .option('-n, --name <name>', 'Project name')
    .action(async (options: { name?: string }) => {
      const result = await initCommand(options.name)
      if (result.success) {
        console.log(result.message)
        if (result.createdFiles) {
          console.log('\nCreated files:')
          result.createdFiles.forEach((file) => console.log(`  - ${file}`))
        }
      } else {
        console.error(result.message)
        if (result.errors) {
          result.errors.forEach((err) => console.error(`  - ${err}`))
        }
        process.exit(1)
      }
    })

  program.parse()
}
