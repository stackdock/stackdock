/**
 * Turso API Types
 * 
 * Generated from actual API responses in docks/turso/
 * 
 * @see docks/turso/org/listOrgs.json
 * @see docks/turso/database/listDatabases.json
 * @see docks/turso/group/listGroups.json
 */

/**
 * Turso Organization
 * @see docks/turso/org/listOrgs.json
 */
export interface TursoOrg {
  name: string // "personal"
  slug: string // "wpoperator" - Used in API URLs
  type: "personal" | "team"
  plan_id: string // "starter"
  overages: boolean
  blocked_reads: boolean
  blocked_writes: boolean
  plan_timeline: string
  memory: number
  payment_failing_since: {
    Time: string
    Valid: boolean
  }
  platform: string
  platform_id: string
  platform_access_token: string
  delinquent: boolean
}

/**
 * Turso Database
 * @see docks/turso/database/listDatabases.json
 */
export interface TursoDatabase {
  Name: string // "better-auth-test"
  DbId: string // "68e35d20-1039-4ca3-878f-0583234d76eb"
  Hostname: string // "better-auth-test-wpoperator.aws-us-east-1.turso.io"
  is_schema: boolean
  block_reads: boolean
  block_writes: boolean
  allow_attach: boolean
  delete_protection: boolean
  regions: string[] // ["aws-us-east-1"]
  primaryRegion: string // "aws-us-east-1"
  type: "logical"
  hostname: string // Same as Hostname
  version: string // "tech-preview"
  group: string // "stackdock" - Group name (store in fullApiData)
  sleeping: boolean
  archived: boolean
  schema: string | null
  parent: string | null
}

/**
 * Turso Group (optional, for metadata)
 * @see docks/turso/group/listGroups.json
 */
export interface TursoGroup {
  archived: boolean
  delete_protection: boolean
  locations: string[] // ["aws-us-east-1"]
  name: string // "default", "stackdock", "test"
  primary: string // "aws-us-east-1"
  status: {
    locations: Array<{
      name: string
      status: "up" | "down"
    }>
  }
  uuid: string
  version: string
}
