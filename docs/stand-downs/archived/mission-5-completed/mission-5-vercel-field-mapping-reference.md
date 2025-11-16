# Vercel Field Mapping Reference

> **Quick Reference**: Field mappings from Vercel API to Universal Schema  
> **Source**: `docks/vercel/projects/retrievealistofprojects.json`  
> **Target**: `convex/schema.ts` → `webServices` table

---

## Quick Mapping Table

| Universal Field | Vercel Source | Extraction Logic | Example |
|----------------|---------------|------------------|---------|
| `providerResourceId` | `project.id` | Direct | `"prj_8kpgj4jqKA28AHdtuidFVW7lij1U"` |
| `name` | `project.name` | Direct | `"vapr-ballistics-js-client"` |
| `productionUrl` | `targets.production.url` | Add `https://` prefix | `"https://vapr-ballistics-js-client-qxjujfn7z-vaos.vercel.app"` |
| `environment` | `targets.production.target` | Direct (always "production") | `"production"` |
| `gitRepo` | `link.org + "/" + link.repo` | Combine if link exists | `"robsdevcraft/vapr-ballistics"` |
| `status` | `targets.production.readyState` | Map via function | `"READY"` → `"running"` |
| `fullApiData` | `project` | Entire object | `{ id, name, targets, link, ... }` |

---

## Status Mapping

```typescript
READY → running
BUILDING → pending
ERROR → error
QUEUED → pending
CANCELED → stopped
```

---

## Edge Case Handling

### Missing Production Deployment
```typescript
// Fall back to latestDeployments[0]
const deployment = project.targets?.production || project.latestDeployments?.[0]
```

### Missing URL
```typescript
// Set to undefined (schema allows optional)
productionUrl: deployment?.url ? `https://${deployment.url}` : undefined
```

### Missing Git Link
```typescript
// Set to undefined (schema allows optional)
gitRepo: project.link ? `${project.link.org}/${project.link.repo}` : undefined
```

### Missing Status
```typescript
// Default to pending
status: deployment?.readyState ? mapVercelStatus(deployment.readyState) : "pending"
```

---

## Code Snippets

### Get Production URL
```typescript
function getProductionUrl(project: VercelProject): string | undefined {
  const url = project.targets?.production?.url || project.latestDeployments?.[0]?.url
  if (!url) return undefined
  return url.startsWith("http") ? url : `https://${url}`
}
```

### Get Git Repo
```typescript
function getGitRepo(project: VercelProject): string | undefined {
  if (!project.link) return undefined
  const { org, repo } = project.link
  return org && repo ? `${org}/${repo}` : undefined
}
```

### Get Status
```typescript
function getStatus(project: VercelProject): string {
  const readyState = project.targets?.production?.readyState || 
                     project.latestDeployments?.[0]?.readyState
  return readyState ? mapVercelStatus(readyState) : "pending"
}
```

---

## Example Mapping

**Input** (Vercel Project):
```json
{
  "id": "prj_8kpgj4jqKA28AHdtuidFVW7lij1U",
  "name": "vapr-ballistics-js-client",
  "targets": {
    "production": {
      "url": "vapr-ballistics-js-client-qxjujfn7z-vaos.vercel.app",
      "readyState": "READY"
    }
  },
  "link": {
    "org": "robsdevcraft",
    "repo": "vapr-ballistics"
  }
}
```

**Output** (Universal webServices):
```typescript
{
  providerResourceId: "prj_8kpgj4jqKA28AHdtuidFVW7lij1U",
  name: "vapr-ballistics-js-client",
  productionUrl: "https://vapr-ballistics-js-client-qxjujfn7z-vaos.vercel.app",
  environment: "production",
  gitRepo: "robsdevcraft/vapr-ballistics",
  status: "running",  // READY → running
  fullApiData: { /* entire project object */ }
}
```

---

## Validation Rules

- ✅ `providerResourceId` must be project ID (`prj_...`), NOT deployment ID (`dpl_...`)
- ✅ `productionUrl` must include `https://` prefix
- ✅ `gitRepo` format must be `"org/repo"` (not just repo name)
- ✅ `status` must be mapped via `mapVercelStatus()` function
- ✅ `fullApiData` must contain entire project object (for future use)

---

**Use this as a quick reference while implementing the adapter.**
