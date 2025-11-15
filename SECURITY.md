# Security

## Dependency Vulnerabilities

### js-yaml Vulnerability (GHSA-mh29-5h37-fv8m)

**Status**: ✅ Mitigated via npm overrides

**Issue**: `js-yaml` <4.1.1 has a prototype pollution vulnerability in merge (<<)

**Affected Dependency Chain**:
- `@tanstack/react-start` → `@tanstack/start-plugin-core` → `xmlbuilder2` → `js-yaml` <4.1.1

**Mitigation**: 
- Added npm `overrides` in root `package.json` to force `js-yaml` >=4.1.1
- Updated `@tanstack/react-start` to latest version (1.136.5)

**Note**: 
- npm audit may still show this vulnerability because it doesn't recognize overrides
- The actual installed version is safe (js-yaml >=4.1.1)
- This will be fully resolved when TanStack updates their dependencies

**Override Configuration**:
```json
{
  "overrides": {
    "js-yaml": "^4.1.1",
    "xmlbuilder2": {
      "js-yaml": "^4.1.1"
    }
  }
}
```

**Last Updated**: November 14, 2025

