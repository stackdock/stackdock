# UI Registry Guide

> Learn how to build UI components for the StackDock registry (shadcn/ui model for infrastructure).

## Table of Contents

1. [Overview](#overview)
2. [Component Philosophy](#component-philosophy)
3. [Building a Component](#building-a-component)
4. [Publishing to Registry](#publishing-to-registry)
5. [Best Practices](#best-practices)

---

## Overview

### What is the UI Registry?

The **UI Registry** is a collection of dashboard components that work with StackDock's universal resource tables.

**Like shadcn/ui**:
```bash
npx shadcn add button
# Copies button component into YOUR codebase
```

**StackDock Registry**:
```bash
npx stackdock add server-health-widget
# Copies widget component into YOUR codebase
# Works with servers from ANY provider (AWS, DigitalOcean, etc.)
```

### Key Principles

1. **Copy/Paste Ownership**: Components are copied to your repo, you own them
2. **Provider-Agnostic**: Use universal tables (not provider-specific)
3. **Composable**: Mix and match widgets to build your dashboard
4. **Customizable**: Modify components without forking StackDock

---

## Component Philosophy

### Provider-Agnostic Design

❌ **WRONG** (Provider-Specific):
```typescript
// GridPaneSiteCard.tsx
export function GridPaneSiteCard({ site }: { site: GridPaneSite }) {
  return (
    <Card>
      <h3>{site.name}</h3>
      <p>PHP: {site.phpVersion}</p>
      <p>Backups: {site.backup_schedule}</p>
    </Card>
  )
}
```

**Problem**: Only works with GridPane sites.

✅ **CORRECT** (Universal):
```typescript
// WebServiceCard.tsx
export function WebServiceCard({ service }: { service: Doc<"webServices"> }) {
  return (
    <Card>
      <h3>{service.name}</h3>
      <Badge>{service.provider}</Badge>
      <p>URL: {service.productionUrl}</p>
      <p>Status: {service.status}</p>
      
      {/* Provider-specific (optional) */}
      {service.provider === "gridpane" && service.fullApiData && (
        <p>PHP: {service.fullApiData.phpVersion}</p>
      )}
    </Card>
  )
}
```

**Why it works**:
- Uses `webServices` table (works with Vercel, GridPane, Railway, etc.)
- Shows universal fields (name, url, status)
- Optionally shows provider-specific fields from `fullApiData`

---

## Building a Component

### Example: Server Health Widget

#### Step 1: Create Component Directory

```bash
# Registry location (source code)
packages/ui/components/server-health-widget/
├── server-health-widget.tsx
├── README.md
├── package.json
└── tests/
    └── server-health-widget.test.tsx
```

**Note**: Components are copied to `apps/web/src/components/` when installed via CLI: `npx stackdock add server-health-widget`

#### Step 2: Implement Component

```typescript
// packages/ui/components/server-health-widget/server-health-widget.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@stackdock/ui/card"
import { Badge } from "@stackdock/ui/badge"
import { Doc } from "convex/_generated/dataModel"

interface ServerHealthWidgetProps {
  server: Doc<"servers">
  className?: string
}

export function ServerHealthWidget({ server, className }: ServerHealthWidgetProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {server.name}
          <Badge variant={getStatusVariant(server.status)}>
            {server.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Provider</span>
            <span className="text-sm font-medium">{server.provider}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">IP Address</span>
            <span className="text-sm font-medium">{server.ipAddress}</span>
          </div>
          
          {/* Provider-specific metrics (optional) */}
          {renderProviderMetrics(server)}
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusVariant(status: string) {
  switch (status) {
    case "running":
      return "success"
    case "stopped":
      return "secondary"
    case "error":
      return "destructive"
    default:
      return "outline"
  }
}

function renderProviderMetrics(server: Doc<"servers">) {
  const { provider, fullApiData } = server
  
  if (provider === "digitalocean" && fullApiData) {
    return (
      <>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Region</span>
          <span className="text-sm font-medium">{fullApiData.region?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Size</span>
          <span className="text-sm font-medium">{fullApiData.size?.slug}</span>
        </div>
      </>
    )
  }
  
  if (provider === "aws" && fullApiData) {
    return (
      <>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Instance Type</span>
          <span className="text-sm font-medium">{fullApiData.InstanceType}</span>
        </div>
      </>
    )
  }
  
  return null
}
```

#### Step 3: Write Documentation

```markdown
# Server Health Widget

A card component that displays server status and metrics.

## Features

- ✅ Works with any server provider (AWS, DigitalOcean, Vultr, etc.)
- ✅ Shows universal fields (name, IP, status)
- ✅ Optionally shows provider-specific metrics
- ✅ Responsive design
- ✅ Accessible (WCAG 2.1 AA)

## Installation

```bash
# Install a component (when CLI is ready)
npx stackdock add server-health-widget

# Component is copied to apps/web/src/components/server-health-widget/
# You own it, modify it, customize it
```

**Registry Location**: `packages/ui/components/`  
**Installation Location**: `apps/web/src/components/`  
**Registry Documentation**: [packages/ui/README.md](../../packages/ui/README.md)

## Usage

```tsx
import { ServerHealthWidget } from "@/components/server-health-widget"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function Dashboard() {
  const servers = useQuery(api.resources.servers.list, { orgId })
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {servers?.map(server => (
        <ServerHealthWidget key={server._id} server={server} />
      ))}
    </div>
  )
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `server` | `Doc<"servers">` | Yes | Server object from Convex |
| `className` | `string` | No | Additional CSS classes |

## Dependencies

- `@/components/ui/card`
- `@/components/ui/badge`

## Provider Support

| Provider | Metrics Shown |
|----------|---------------|
| AWS | Instance Type |
| DigitalOcean | Region, Size |
| Vultr | Plan, Location |
| Generic | Name, IP, Status |
```

#### Step 4: Add Tests

```typescript
// packages/ui/components/server-health-widget/tests/server-health-widget.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ServerHealthWidget } from '../server-health-widget'

describe('ServerHealthWidget', () => {
  it('renders server name', () => {
    const server = {
      _id: "server_123",
      name: "web-server-01",
      provider: "digitalocean",
      ipAddress: "192.168.1.1",
      status: "running",
      fullApiData: {},
    }
    
    render(<ServerHealthWidget server={server} />)
    expect(screen.getByText("web-server-01")).toBeInTheDocument()
  })
  
  it('shows provider-specific metrics for DigitalOcean', () => {
    const server = {
      _id: "server_123",
      name: "web-server-01",
      provider: "digitalocean",
      ipAddress: "192.168.1.1",
      status: "running",
      fullApiData: {
        region: { name: "NYC1" },
        size: { slug: "s-1vcpu-1gb" },
      },
    }
    
    render(<ServerHealthWidget server={server} />)
    expect(screen.getByText("NYC1")).toBeInTheDocument()
    expect(screen.getByText("s-1vcpu-1gb")).toBeInTheDocument()
  })
})
```

---

## Publishing to Registry

### Step 1: Add to Registry Manifest

```json
// packages/ui/registry.json
{
  "server-health-widget": {
    "name": "server-health-widget",
    "title": "Server Health Widget",
    "description": "Display server status and metrics",
    "version": "1.0.0",
    "author": "StackDock Team",
    "resourceTypes": ["servers"],
    "files": [
      "components/server-health-widget/server-health-widget.tsx"
    ],
    "dependencies": [],
    "registryDependencies": ["card", "badge"]
  }
}
```

**Registry Location**: `packages/ui/registry.json`  
**Absolute Path**: `{REPO_ROOT}/packages/ui/registry.json`

### Step 2: Submit PR

```bash
# Fork https://github.com/stackdock/stackdock
git clone https://github.com/YOUR_USERNAME/stackdock
cd stackdock

# Create branch
git checkout -b add-server-health-widget

# Add your component to registry
cp -r server-health-widget packages/ui/components/

# Update registry.json
vim packages/ui/registry.json

# Commit and push
git add .
git commit -m "feat(ui): add server-health-widget"
git push origin add-server-health-widget

# Open PR on GitHub
```

**Note**: After PR is merged, components can be installed via CLI: `npx stackdock add server-health-widget` (copies from `packages/ui/components/server-health-widget/` to `apps/web/src/components/server-health-widget/`).

---

## Best Practices

### 1. Use Universal Tables

```typescript
// ✅ GOOD: Uses universal table
function WebServiceCard({ service }: { service: Doc<"webServices"> }) {
  // Works with ANY PaaS provider
}

// ❌ BAD: Provider-specific
function VercelProjectCard({ project }: { project: VercelProject }) {
  // Only works with Vercel
}
```

### 2. Handle Missing Data Gracefully

```typescript
// ✅ GOOD: Checks for existence
{service.gitRepo && (
  <a href={service.gitRepo}>View on GitHub</a>
)}

// ❌ BAD: Assumes data exists
<a href={service.gitRepo}>View on GitHub</a>
```

### 3. Make Provider-Specific Features Optional

```typescript
// ✅ GOOD: Optional enhancement
{service.provider === "vercel" && service.fullApiData?.framework && (
  <Badge>{service.fullApiData.framework}</Badge>
)}

// ❌ BAD: Breaks for non-Vercel
<Badge>{service.fullApiData.framework}</Badge>
```

### 4. Follow shadcn/ui Patterns

```typescript
// ✅ GOOD: Composable
<Card>
  <CardHeader>
    <CardTitle>{server.name}</CardTitle>
  </CardHeader>
  <CardContent>
    {/* ... */}
  </CardContent>
</Card>

// ❌ BAD: Custom structure
<div className="my-custom-card">
  <div className="my-custom-header">
    <h3>{server.name}</h3>
  </div>
</div>
```

### 5. Be Accessible

```typescript
// ✅ GOOD: Semantic HTML, ARIA labels
<button aria-label={`Restart ${server.name}`}>
  <RestartIcon aria-hidden="true" />
</button>

// ❌ BAD: No label
<button>
  <RestartIcon />
</button>
```

### 6. Test with Multiple Providers

```typescript
describe('Component', () => {
  it('works with AWS', () => { /* ... */ })
  it('works with DigitalOcean', () => { /* ... */ })
  it('works with generic provider', () => { /* ... */ })
})
```

---

## Component Ideas

### Infrastructure
- Server health widget
- Server list table
- Web service deployment timeline
- Domain status card
- Database connection info

### Monitoring
- Resource usage chart
- Uptime monitor
- Alert dashboard
- Log viewer

### Operations
- Backup status list
- Deployment trigger button
- Server restart control
- Cache clear button

---

**Questions?** Join Discord: https://stackdock.dev/discord
