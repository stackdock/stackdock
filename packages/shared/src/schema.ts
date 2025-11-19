/**
 * Universal Resource Types for StackDock
 * 
 * These types represent provider-agnostic resource schemas that can be used
 * across adapters, UI components, and Convex functions.
 * 
 * Design Principles:
 * - Provider-agnostic: Works across all providers (Vultr, Vercel, AWS, etc.)
 * - Extensible: fullApiData field stores provider-specific data
 * - Type-safe: Strong TypeScript types for universal fields
 * - Minimal: Only includes fields common across most providers
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Provisioning source types
 */
export type ProvisioningSource = "sst" | "api" | "manual"

/**
 * Provisioning state types
 */
export type ProvisioningState = "provisioning" | "provisioned" | "failed" | "deprovisioning"

/**
 * Dock sync status types
 */
export type DockSyncStatus = "pending" | "syncing" | "success" | "error"

/**
 * Resource table names (for polymorphic references)
 */
export type ResourceTable = 
  | "servers" 
  | "domains" 
  | "webServices" 
  | "databases" 
  | "blockVolumes" 
  | "buckets"

/**
 * Backup schedule types
 */
export type BackupScheduleType = "local" | "remote"

// ============================================================================
// BASE RESOURCE INTERFACE
// ============================================================================

/**
 * Base interface for all universal resources
 * Contains fields common to all resource types
 */
export interface BaseResource {
  orgId: string
  dockId: string
  provider: string
  providerResourceId: string
  status: string
  fullApiData: any
  updatedAt?: number
  
  // Provisioning metadata (optional)
  provisioningSource?: ProvisioningSource
  sstResourceId?: string
  sstStackName?: string
  provisioningState?: ProvisioningState
  provisionedAt?: number
}

// ============================================================================
// RESOURCE TYPES
// ============================================================================

/**
 * Server (IaaS) - Virtual machines, instances, droplets
 * Examples: Vultr instances, DigitalOcean droplets, AWS EC2, etc.
 */
export interface Server extends BaseResource {
  name: string
  primaryIpAddress?: string
  region?: string
}

/**
 * Web Service (PaaS) - Hosted applications, sites, deployments
 * Examples: Vercel projects, Netlify sites, Railway apps, GridPane sites
 */
export interface WebService extends BaseResource {
  name: string
  productionUrl?: string
  environment?: string
  gitRepo?: string
}

/**
 * Domain - DNS zones, domain registrations
 * Examples: Cloudflare domains, AWS Route53 zones, GridPane domains
 */
export interface Domain extends BaseResource {
  domainName: string
  expiresAt?: number
}

/**
 * Database - Managed database instances
 * Examples: PlanetScale databases, Neon databases, Convex deployments
 */
export interface Database extends BaseResource {
  name: string
  engine?: string
  version?: string
}

/**
 * Block Volume - Block storage, attached volumes
 * Examples: Vultr blocks, DigitalOcean volumes
 */
export interface BlockVolume extends BaseResource {
  name: string
  sizeGb: number
  region: string
  attachedToInstance?: string
  attachedToInstanceLabel?: string
  mountId?: string
  blockType?: string
  filesystemType?: string
}

/**
 * Bucket - Object storage buckets
 * Examples: Linode buckets, DigitalOcean Spaces, AWS S3
 */
export interface Bucket extends BaseResource {
  name: string
  region: string
  cluster?: string
  hostname?: string
  s3Endpoint?: string
  sizeBytes?: number
  objectCount?: number
}

/**
 * Monitor - Uptime monitoring
 * Examples: Better Stack monitors, Pingdom monitors
 */
export interface Monitor extends BaseResource {
  name: string
  url?: string
  monitorType?: string
  lastCheckedAt?: number
  checkFrequency?: number
  monitorGroupId?: string
  monitorGroupName?: string
}

/**
 * Issue - Error tracking, exceptions, alerts
 * Examples: Sentry issues
 * Note: Called "issues" internally, "alerts" in user-facing contexts
 */
export interface Issue extends BaseResource {
  title: string
  severity: string
  project: string
  projectSlug?: string
  organizationSlug?: string
  count?: number
  userCount?: number
  firstSeen?: number
  lastSeen?: number
}

/**
 * Repository - Code repositories
 * Examples: GitHub repositories
 */
export interface Repository extends BaseResource {
  name: string
  fullName: string
  description?: string
  language?: string
  private: boolean
  url?: string
  defaultBranch?: string
}

/**
 * Deployment - Deployment instances
 * Examples: Convex deployments
 */
export interface Deployment extends BaseResource {
  projectId?: number
  name: string
  deploymentType: string
  createdAt?: number
}

/**
 * Backup Schedule - Scheduled backup configuration
 * Examples: GridPane backup schedules, Neon backup schedules
 */
export interface BackupSchedule extends BaseResource {
  siteId: number
  siteUrl: string
  scheduleId: number
  type: BackupScheduleType
  frequency: string
  hour: string
  minute: string
  time: string
  dayOfWeek?: number
  serviceId?: number
  serviceName?: string
  enabled: boolean
  remoteBackupsEnabled: boolean
}

/**
 * Backup Integration - Backup service integrations
 * Examples: GridPane S3 integrations
 */
export interface BackupIntegration extends BaseResource {
  integrationId: number
  integratedService: string
  integrationName: string
  region?: string
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Union type of all resource types
 */
export type UniversalResource = 
  | Server 
  | WebService 
  | Domain 
  | Database 
  | BlockVolume 
  | Bucket 
  | Monitor 
  | Issue 
  | Repository 
  | Deployment 
  | BackupSchedule 
  | BackupIntegration

/**
 * Map resource table names to their types
 */
export type ResourceTypeMap = {
  servers: Server
  webServices: WebService
  domains: Domain
  databases: Database
  blockVolumes: BlockVolume
  buckets: Bucket
  monitors: Monitor
  issues: Issue
  repositories: Repository
  deployments: Deployment
  backupSchedules: BackupSchedule
  backupIntegrations: BackupIntegration
}

/**
 * Extract resource type from table name
 */
export type ResourceType<T extends keyof ResourceTypeMap> = ResourceTypeMap[T]
