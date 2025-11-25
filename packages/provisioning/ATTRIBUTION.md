# devpush Attribution

This package is inspired by [devpush](https://github.com/hunvreus/devpush), an open-source alternative to Vercel.

## devpush

- **Source**: [devpush](https://github.com/hunvreus/devpush) - Like Vercel, but open source and for all languages
- **License**: MIT License
- **GitHub**: https://github.com/hunvreus/devpush
- **Website**: https://devpu.sh

## StackDock Implementation

StackDock Provisioning adapts devpush's approach for StackDock's architecture:
- **Direct API Calls**: No abstraction layers, direct provider API calls (same philosophy as devpush)
- **Dock Adapter Pattern**: Provisioning logic in dock adapters (copy/paste/own)
- **Docker Support**: Docker-based deployments for applicable providers (like devpush)
- **Simple and Transparent**: What you see is what you get (aligned with devpush philosophy)

## Key Differences

- **Dock Adapter Pattern**: Provisioning logic in adapters (copy/paste/own)
- **Universal Schema**: All resources map to universal tables
- **Multi-Provider**: Works across all providers (not just Docker)
- **Registry Model**: Adapters live in registry, users copy them

## License

devpush is licensed under MIT License. StackDock Provisioning is also MIT licensed.

## References

- devpush: https://github.com/hunvreus/devpush
- devpush Docs: https://devpu.sh/docs
- devpush Website: https://devpu.sh
