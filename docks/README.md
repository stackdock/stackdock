# Provider API Response Dumps

This directory contains JSON dumps of provider API responses for adapter development.

## Purpose

These files are used to:
- Understand provider API response structures
- Build accurate TypeScript types
- Map provider fields to universal schema
- Test adapter implementations locally

## Structure

```
docks/
├── gridpane/
│   ├── sites.json          # GET /api/v1/sites response
│   ├── servers.json        # GET /api/v1/servers response
│   └── domains.json        # GET /api/v1/domains response
├── vercel/
│   └── deployments.json    # GET /v1/deployments response
└── {provider}/
    └── {resource}.json
```

## Usage

1. **Export API responses** from provider dashboards or API clients
2. **Save as JSON** in the appropriate provider directory
3. **Reference in adapter code** when building field mappings
4. **Never commit** - These files are gitignored (may contain sensitive data)

## Adding New Provider Dumps

1. Create directory: `docks/{provider}/`
2. Export API responses (one per resource type)
3. Name files descriptively: `{resource-type}.json`
4. Document endpoint URLs in comments if needed

## Security

⚠️ **These files may contain sensitive data:**
- Resource IDs
- Domain names
- Server IPs
- Other metadata

**Never commit these files to git** - They are automatically gitignored.

## Example: GridPane

```json
// docks/gridpane/sites.json
[
  {
    "id": 12345,
    "name": "example.com",
    "primary_domain": "example.com",
    "status": "active",
    "php_version": "8.2",
    ...
  }
]
```

---

**Note**: These are local development files only. They help build adapters but are not shipped with the application.

