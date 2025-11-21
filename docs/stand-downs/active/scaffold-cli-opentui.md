# Scaffold CLI with OpenTUI Terminal UI Framework

**Status**: 🟡 In Progress  
**Branch**: `feature/scaffold-cli-opentui`  
**GitHub Issue**: #63  
**Last Updated**: 2025-01-XX

## Goal
Replace the basic Commander.js CLI implementation with a rich terminal user interface (TUI) using OpenTUI, providing an interactive, modern command-line experience for StackDock users.

## Current State
**Location**: `packages/cli/`

**Status**: TUI framework scaffolded and functional. Needs refinement and testing.

Current Implementation:

Basic Commander.js CLI with three placeholder commands (add, list, init)
Simple console.log output
No interactive UI or visual feedback
Commands are stubs with "under development" messages
Uses esbuild for bundling
TypeScript source in src/index.ts
Related Mission: Mission 2 - "Scaffold CLI" (high priority, pending)

Reference: OpenTUI GitHub Repository

Why OpenTUI?
OpenTUI is a TypeScript library for building terminal user interfaces (TUIs) that provides:

Modern TUI Framework: Built specifically for terminal interfaces with React/SolidJS reconcilers
TypeScript Support: Full type safety and modern tooling
Standalone Core: @opentui/core works completely standalone with imperative API
React Integration: @opentui/react reconciler available for React-based UI components
Active Development: Maintained by SST team, actively developed
Production Ready: Used by SST's own tools (opencode, terminaldotshop)
Implementation Steps
Phase 1: Setup and Installation
Install OpenTUI Dependencies

cd packages/cli
npm install @opentui/core @opentui/react react react-dom
npm install --save-dev @types/react @types/react-dom
Update Build Configuration

Update package.json scripts to handle React/JSX
Configure esbuild for JSX transformation
Ensure proper bundling for terminal environment
Install Zig (Required for OpenTUI)

Add Zig installation instructions to README
Document system requirements
Add to CI/CD if needed
Phase 2: Core TUI Setup
Create TUI Application Structure

Create src/tui/ directory
Set up OpenTUI core initialization
Create main TUI component wrapper
Handle terminal lifecycle (resize, cleanup)
Migrate Commands to TUI

Convert add command to interactive TUI
Convert list command to interactive table/list view
Convert init command to interactive setup wizard
Phase 3: Interactive Commands
Implement stackdock add TUI

Interactive component/adapter selection
Search/filter functionality
Preview component details
Confirmation dialog
Progress indicators during installation
Implement stackdock list TUI

Table view with sorting/filtering
Pagination for large lists
Component details view
Category filtering (components vs adapters)
Implement stackdock init TUI

Interactive setup wizard
Configuration prompts
Registry selection
Project structure creation
Success confirmation
Phase 4: Enhanced Features
Add Interactive Elements

Loading spinners
Progress bars
Status indicators
Error handling with retry options
Keyboard navigation
Add Help System

Interactive help menu
Command-specific help
Keyboard shortcuts display
Examples and usage
Phase 5: Testing and Documentation
Testing

Unit tests for TUI components
Integration tests for commands
Terminal compatibility testing
Cross-platform testing (Windows, macOS, Linux)
Documentation

Update README with TUI screenshots/examples
Document keyboard shortcuts
Update installation instructions
Add troubleshooting guide
Files to Create/Update
New Files
packages/cli/src/tui/App.tsx - Main TUI application component
packages/cli/src/tui/components/ - TUI component library
CommandMenu.tsx - Main command selection menu
AddCommand.tsx - Add command TUI
ListCommand.tsx - List command TUI
InitCommand.tsx - Init command TUI
Table.tsx - Reusable table component
Input.tsx - Input field component
Select.tsx - Select dropdown component
Progress.tsx - Progress indicator component
Dialog.tsx - Dialog/modal component
packages/cli/src/tui/hooks/ - Custom React hooks
useTerminal.ts - Terminal size and lifecycle
useKeyboard.ts - Keyboard navigation
packages/cli/src/tui/utils/ - TUI utilities
colors.ts - Color theme utilities
layout.ts - Layout helpers
packages/cli/src/commands/ - Command implementations (refactored)
add.ts - Add command logic
list.ts - List command logic
init.ts - Init command logic
packages/cli/src/utils/ - Utility functions
registry.ts - Registry API client
installer.ts - Component installation logic
packages/cli/tests/ - Test files
tui.test.ts - TUI component tests
commands.test.ts - Command tests
Updated Files
packages/cli/package.json - Add OpenTUI dependencies, update scripts
packages/cli/src/index.ts - Initialize OpenTUI instead of Commander.js
packages/cli/tsconfig.json - Add JSX support, React types
packages/cli/README.md - Update with TUI documentation, screenshots
packages/cli/.gitignore - Add build artifacts if needed
Technical Considerations
OpenTUI Integration
Core vs React Reconciler

Start with @opentui/core for imperative API
Migrate to @opentui/react for component-based UI
Consider both approaches for different use cases
Terminal Compatibility

Ensure compatibility with common terminals (iTerm2, Windows Terminal, etc.)
Handle terminal resize events
Graceful degradation for unsupported terminals
Performance

Optimize rendering for large lists
Use virtual scrolling if needed
Minimize re-renders
Error Handling

Graceful error display in TUI
Fallback to text output if TUI fails
Clear error messages
Architecture Decisions
Command Structure

Keep command logic separate from TUI
TUI layer calls command implementations
Maintain testability
State Management

Use React hooks for local state
Consider context for global CLI state
Keep state minimal and focused
Styling

Use OpenTUI's styling system
Create consistent theme
Support dark/light terminal themes
Success Criteria

OpenTUI successfully integrated into CLI package

All three commands (add, list, init) have interactive TUI implementations

TUI works on Windows, macOS, and Linux

Keyboard navigation works correctly

Error handling is user-friendly

Performance is acceptable (no lag on command execution)

Documentation is updated with TUI examples

Tests cover TUI components and commands

CLI maintains backward compatibility (can still be used non-interactively)

Build process works correctly with OpenTUI dependencies
Dependencies
OpenTUI: @opentui/core and @opentui/react
React: For React reconciler (if using @opentui/react)
Zig: Required system dependency for OpenTUI (document installation)
References
OpenTUI GitHub Repository
OpenTUI Documentation
OpenTUI Examples
StackDock CLI README
Mission 2: Scaffold CLI (.stackdock-state.json)
Notes
OpenTUI requires Zig to be installed on the system
Consider providing installation script or clear instructions
May need to update CI/CD to handle Zig dependency
OpenTUI is still in development (v0.1.47 as of Nov 2025) - monitor for updates
Consider contributing improvements back to OpenTUI if needed
Related Issues
Mission 2: Scaffold CLI (.stackdock-state.json)
Future: Registry integration for component listing/installation
Future: Component installation logic implementation
