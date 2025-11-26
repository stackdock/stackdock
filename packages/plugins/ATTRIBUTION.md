# Attribution

## Better Stack

The StackDock Plugin System is inspired by [Better Stack](https://www.better-stack.ai/), a composable full-stack plugin system for modern React frameworks.

**Better Stack** provides:
- Composable plugin architecture
- Framework-agnostic design (Next.js, React Router, TanStack Router, Remix)
- Full-stack features in one package (routes, APIs, database schemas, components, hooks, SSR)
- Zero boilerplate approach
- TypeScript-first developer experience

**License**: MIT  
**Website**: https://www.better-stack.ai/  
**GitHub**: https://github.com/better-stack-ai/better-stack  
**Documentation**: https://www.better-stack.ai/docs

### What We Learned

- **Composable Architecture**: Mix and match features like LEGO blocks
- **Framework Adapters**: Abstract framework-specific routing and rendering
- **Full-Stack Plugins**: Include everything needed for a feature in one package
- **Zero Boilerplate**: Configure plugins and they work
- **TypeScript-First**: Strong types across plugins, routes, hooks, and providers

### StackDock Adaptations

- **StackDock Integration**: Uses shared packages (RBAC, encryption, docks)
- **Registry Model**: Plugins follow copy/paste/own pattern (like dock adapters)
- **Convex Support**: Optional Convex integration for real-time features
- **Dock Integration**: Plugins can trigger deployments via dock adapters

Thank you to the Better Stack team for the excellent architecture and inspiration.
