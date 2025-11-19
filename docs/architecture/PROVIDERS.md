# Provider Capability Matrix

This document maps which providers support which universal tables and operations in StackDock.

## Quick Reference

StackDock integrates **17 providers** across **10 universal table types**:

- ✅ = Supported (read-only sync)
- ❌ = Not supported

## Capability Matrix

| Provider | Servers | Web Services | Domains | Databases | Repositories | Block Volumes | Buckets | Monitors | Issues | Deployments |
|----------|---------|--------------|---------|-----------|--------------|---------------|---------|----------|--------|-------------|
| **BetterStack** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Cloudflare** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Convex** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Coolify** | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **DigitalOcean** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **GitHub** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **GridPane** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Hetzner** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Linode** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Neon** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Netlify** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **PlanetScale** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Sentry** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Turso** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Vercel** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Vultr** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

## Universal Table Types

StackDock uses a universal table architecture to normalize resources across providers. Here's what each table type represents:

### Infrastructure Resources (IaaS)

- **Servers**: Virtual machines, instances, droplets (VPS/compute)
  - Examples: DigitalOcean Droplets, Vultr Instances, Linode Linodes, Hetzner Cloud Servers
  
- **Block Volumes**: Block storage devices that can be attached to servers
  - Examples: DigitalOcean Volumes, Vultr Block Storage

- **Buckets**: Object storage (S3-compatible)
  - Examples: Linode Object Storage, DigitalOcean Spaces

### Platform Resources (PaaS)

- **Web Services**: Hosted applications, sites, and deployments
  - Examples: Vercel Projects, Netlify Sites, Cloudflare Pages, GridPane Sites

- **Databases**: Managed database instances
  - Examples: PlanetScale Databases, Neon Databases, Turso Databases, Convex Deployments

- **Deployments**: Deployment instances and environments
  - Examples: Convex Deployments

### Development & Operations

- **Repositories**: Code repositories
  - Examples: GitHub Repositories

- **Domains**: DNS zones and domain registrations
  - Examples: Cloudflare Domains, GridPane Domains

- **Monitors**: Uptime and performance monitoring
  - Examples: BetterStack Monitors

- **Issues**: Error tracking, exceptions, and alerts
  - Examples: Sentry Issues (called "alerts" in UI to avoid confusion with GitHub issues)

## Provider Details

### Infrastructure Providers

#### DigitalOcean
- **Type**: Infrastructure as a Service (IaaS)
- **Supports**: Servers (Droplets), Block Volumes
- **Adapter**: `convex/docks/adapters/digitalocean/`
- **API Docs**: https://docs.digitalocean.com/reference/api/

#### Vultr
- **Type**: Infrastructure as a Service (IaaS)
- **Supports**: Servers (Instances), Block Volumes
- **Adapter**: `convex/docks/adapters/vultr/`
- **API Docs**: https://www.vultr.com/api/

#### Linode
- **Type**: Infrastructure as a Service (IaaS)
- **Supports**: Servers (Linodes), Buckets (Object Storage)
- **Adapter**: `convex/docks/adapters/linode/`
- **API Docs**: https://www.linode.com/docs/api/

#### Hetzner
- **Type**: Infrastructure as a Service (IaaS)
- **Supports**: Servers (Cloud Servers)
- **Adapter**: `convex/docks/adapters/hetzner/`
- **API Docs**: https://docs.hetzner.com/cloud/

### Platform Providers

#### Vercel
- **Type**: Platform as a Service (PaaS)
- **Supports**: Web Services (Projects/Deployments)
- **Adapter**: `convex/docks/adapters/vercel/`
- **API Docs**: https://vercel.com/docs/rest-api

#### Netlify
- **Type**: Platform as a Service (PaaS)
- **Supports**: Web Services (Sites)
- **Adapter**: `convex/docks/adapters/netlify/`
- **API Docs**: https://docs.netlify.com/api/get-started/

#### Cloudflare
- **Type**: Platform as a Service (PaaS)
- **Supports**: Web Services (Pages), Domains (DNS Zones)
- **Adapter**: `convex/docks/adapters/cloudflare/`
- **API Docs**: https://developers.cloudflare.com/api/

#### Coolify
- **Type**: Self-hosted Platform as a Service (PaaS)
- **Supports**: Servers, Web Services (Applications), Databases
- **Adapter**: `convex/docks/adapters/coolify/`
- **API Docs**: https://coolify.io/docs/api

#### GridPane
- **Type**: WordPress Hosting Management (PaaS)
- **Supports**: Servers, Web Services (WordPress Sites), Domains
- **Adapter**: `convex/docks/adapters/gridpane/`
- **API Docs**: https://gridpane.com/kb/api/

### Database Providers

#### PlanetScale
- **Type**: Database as a Service (DBaaS)
- **Supports**: Databases (MySQL-compatible)
- **Adapter**: `convex/docks/adapters/planetscale/`
- **API Docs**: https://api-docs.planetscale.com/

#### Neon
- **Type**: Database as a Service (DBaaS)
- **Supports**: Databases (Serverless Postgres)
- **Adapter**: `convex/docks/adapters/neon/`
- **API Docs**: https://neon.tech/docs/reference/api-reference

#### Turso
- **Type**: Database as a Service (DBaaS)
- **Supports**: Databases (Edge SQLite)
- **Adapter**: `convex/docks/adapters/turso/`
- **API Docs**: https://docs.turso.tech/

#### Convex
- **Type**: Database as a Service (DBaaS)
- **Supports**: Databases, Deployments
- **Adapter**: `convex/docks/adapters/convex/`
- **API Docs**: https://docs.convex.dev/

### Developer Tools

#### GitHub
- **Type**: Version Control (DevOps)
- **Supports**: Repositories
- **Adapter**: `convex/docks/adapters/github/`
- **API Docs**: https://docs.github.com/en/rest

### Monitoring & Observability

#### BetterStack
- **Type**: Monitoring & Observability
- **Supports**: Monitors (Uptime Monitoring)
- **Adapter**: `convex/docks/adapters/betterstack/`
- **API Docs**: https://betterstack.com/docs/uptime/api/

#### Sentry
- **Type**: Error Tracking & Monitoring
- **Supports**: Issues (Error Tracking)
- **Adapter**: `convex/docks/adapters/sentry/`
- **API Docs**: https://docs.sentry.io/api/

## Operations Support

Currently, all providers support **read-only** sync operations. This means:

- ✅ **Sync**: Fetch resources from provider API and sync to StackDock universal tables
- ❌ **Mutations**: Create, update, delete operations (planned for future)

### Current Mode: Read-Only Sync

All adapters implement the `DockAdapter` interface which provides:

- `validateCredentials()`: Test API credentials
- `sync*()` methods: Sync resources to universal tables (e.g., `syncServers`, `syncWebServices`)

### Future: Read-Write Operations

The `DockAdapter` interface includes optional methods for mutations (not yet implemented):

- `restartServer()`, `deploySite()`, `clearCache()`
- `provisionServer()`, `provisionWebService()`, `provisionDatabase()`, `provisionDomain()`

See `convex/docks/_types.ts` for the complete interface.

## Adding a New Provider

To add support for a new provider:

1. Create adapter directory: `convex/docks/adapters/your-provider/`
2. Implement the `DockAdapter` interface
3. Implement required methods:
   - `validateCredentials()`
   - At least one `sync*()` method for your resource types
4. Register adapter in the adapter registry
5. Update this capability matrix

See [DOCK_ADAPTER_GUIDE.md](../guides/DOCK_ADAPTER_GUIDE.md) for detailed instructions.

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [DOCK_ADAPTER_GUIDE.md](../guides/DOCK_ADAPTER_GUIDE.md) - Building dock adapters
- [Universal Types](../../convex/lib/universalTypes.ts) - TypeScript type definitions
- [DockAdapter Interface](../../convex/docks/_types.ts) - Adapter interface definition

## Version

Last updated: November 2024  
Total Providers: 17  
Total Universal Tables: 10
