# Netlify Field Mapping Reference

> **Quick Reference**: Field mappings from Netlify API to Universal Schema  
> **Source**: `docks/netlify/site/listSites.json`  
> **Target**: `convex/schema.ts` → `webServices` table

---

## Quick Mapping Table

| Universal Field | Netlify Source | Extraction Logic | Example |
|----------------|---------------|------------------|---------|
| `providerResourceId` | `site.id` | Direct | `"fc7cd4a9-6639-4a6a-907b-844526a43b87"` |
| `name` | `site.name` | Direct | `"stackdock-docs"` |
| `productionUrl` | `site.ssl_url` (prefer) or `site.url` | Prefer HTTPS, convert HTTP to HTTPS | `"https://stackdock-docs.netlify.app"` |
| `environment` | Always `"production"` | Direct | `"production"` |
| `gitRepo` | `build_settings.repo_path` | Direct (already formatted) | `"stackdock/docs"` |
| `status` | `lifecycle_state` (primary) or `state` | Map via function | `"active"` → `"running"` |
| `fullApiData` | `site` | Entire object | `{ id, name, ssl_url, build_settings, ... }` |

---

## Status Mapping

```typescript
active → running
inactive → stopped
suspended → stopped
deleted → stopped
current (state field) → running (fallback)
```

---

## Edge Case Handling

### Missing SSL URL
```typescript
// Fall back to HTTP URL, convert to HTTPS
if (site.url && !site.ssl_url) {
  productionUrl = site.url.replace("http://", "https://")
}
```

### Missing Git Repo Path
```typescript
// Extract from repo_url if repo_path missing
if (!site.build_settings.repo_path && site.build_settings.repo_url) {
  const match = site.build_settings.repo_url.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/)
  gitRepo = match ? `${match[1]}/${match[2]}` : undefined
}
```

### Missing Status
```typescript
// Default to pending if both lifecycle_state and state missing
status: site.lifecycle_state ? mapNetlifyStatus(site.lifecycle_state, site.state) : "pending"
```

### URL Formatting
```typescript
// Ensure HTTPS
if (site.ssl_url) {
  productionUrl = site.ssl_url  // Already HTTPS
} else if (site.url) {
  productionUrl = site.url.startsWith("https") ? site.url : site.url.replace("http://", "https://")
} else if (site.default_domain) {
  productionUrl = `https://${site.default_domain}`
}
```

---

## Code Snippets

### Get Production URL
```typescript
function getProductionUrl(site: NetlifySite): string | undefined {
  // Prefer SSL URL (HTTPS)
  if (site.ssl_url) {
    return site.ssl_url
  }
  
  // Fall back to HTTP URL, convert to HTTPS
  if (site.url) {
    return site.url.startsWith("https") ? site.url : site.url.replace("http://", "https://")
  }
  
  // Try default_domain
  if (site.default_domain) {
    return `https://${site.default_domain}`
  }
  
  return undefined
}
```

### Get Git Repo
```typescript
function getGitRepo(site: NetlifySite): string | undefined {
  if (!site.build_settings) return undefined
  
  // Prefer repo_path (already in "org/repo" format)
  if (site.build_settings.repo_path) {
    return site.build_settings.repo_path
  }
  
  // Extract from repo_url if available
  if (site.build_settings.repo_url) {
    const url = site.build_settings.repo_url
    const match = url.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/)
    if (match) {
      return `${match[1]}/${match[2]}`
    }
  }
  
  return undefined
}
```

### Get Status
```typescript
function getStatus(site: NetlifySite): string {
  return mapNetlifyStatus(site.lifecycle_state || "", site.state)
}

function mapNetlifyStatus(lifecycleState: string, state?: string): string {
  const lifecycleMap: Record<string, string> = {
    active: "running",
    inactive: "stopped",
    suspended: "stopped",
    deleted: "stopped",
  }
  
  if (lifecycleState && lifecycleMap[lifecycleState]) {
    return lifecycleMap[lifecycleState]
  }
  
  if (state === "current") {
    return "running"
  }
  
  return lifecycleState?.toLowerCase() || "pending"
}
```

---

## Example Mapping

**Input** (Netlify Site):
```json
{
  "id": "fc7cd4a9-6639-4a6a-907b-844526a43b87",
  "name": "stackdock-docs",
  "ssl_url": "https://stackdock-docs.netlify.app",
  "lifecycle_state": "active",
  "build_settings": {
    "repo_path": "stackdock/docs"
  }
}
```

**Output** (Universal webServices):
```typescript
{
  providerResourceId: "fc7cd4a9-6639-4a6a-907b-844526a43b87",
  name: "stackdock-docs",
  productionUrl: "https://stackdock-docs.netlify.app",
  environment: "production",
  gitRepo: "stackdock/docs",
  status: "running",  // active → running
  fullApiData: { /* entire site object */ }
}
```

---

## Validation Rules

- ✅ `providerResourceId` must be site `id` (not `site_id`)
- ✅ `productionUrl` must prefer `ssl_url` (HTTPS)
- ✅ `gitRepo` format must be `"org/repo"` (not full URL)
- ✅ `status` must be mapped via `mapNetlifyStatus()` function
- ✅ `fullApiData` must contain entire site object (for future use)

---

**Use this as a quick reference while implementing the adapter.**
