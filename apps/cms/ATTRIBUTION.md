# Pages CMS Attribution

This package is inspired by [Pages CMS](https://github.com/pages-cms/pages-cms), an open-source CMS for static site generators.

## Pages CMS

- **Source**: [Pages CMS](https://github.com/pages-cms/pages-cms) - The No-Hassle CMS for Static Site Generators
- **License**: MIT License
- **GitHub**: https://github.com/pages-cms/pages-cms
- **Website**: https://pagescms.org

## StackDock Implementation

StackDock CMS adapts Pages CMS concepts for StackDock's architecture:
- **Adapter Pattern**: CMS adapters follow StackDock's dock adapter pattern (copy/paste/own)
- **GitHub Integration**: Uses GitHub App for file operations (same approach as Pages CMS)
- **Registry Model**: CMS adapters live in registry, users copy them (aligned with StackDock philosophy)
- **StackDock Integration**: Uses shared packages (RBAC, encryption, docks)

## Key Differences

- **Adapter Pattern**: CMS adapters are copy/paste/own (like dock adapters)
- **Registry Model**: Adapters live in registry, users copy them
- **StackDock Integration**: Uses shared RBAC, encryption, and dock adapters
- **Deployment Integration**: Can trigger deployments via dock adapters

## License

Pages CMS is licensed under MIT License. StackDock CMS is also MIT licensed.

## References

- Pages CMS: https://github.com/pages-cms/pages-cms
- Pages CMS Docs: https://pagescms.org/docs
- Pages CMS Website: https://pagescms.org
