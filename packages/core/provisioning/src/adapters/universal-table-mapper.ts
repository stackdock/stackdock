/**
 * StackDock-specific Universal Table Mapper
 * 
 * This file is NOT derived from SST.dev - it's a new StackDock component
 * that maps SST resources to StackDock universal tables.
 */

/**
 * Universal Table Mapper
 * 
 * PURPOSE:
 * Maps provisioned resources to StackDock universal tables.
 * 
 * This is a NEW component for StackDock, not extracted from SST.
 * It translates SST resource types to universal table schema.
 */

export type UniversalTable = 'servers' | 'webServices' | 'domains' | 'databases'

export interface ResourceMapping {
  sstResourceType: string
  universalTable: UniversalTable
  mapping: {
    provider: string
    providerResourceId: string
    name: string
    [key: string]: unknown
  }
}

/**
 * Resource type to universal table mapping
 */
const RESOURCE_TYPE_MAP: Record<string, UniversalTable> = {
  'aws.ec2.Instance': 'servers',
  'aws.ec2.SpotInstance': 'servers',
  'aws.lightsail.Instance': 'servers',
  'aws.s3.Bucket': 'webServices',
  'aws.cloudfront.Distribution': 'webServices',
  'aws.lambda.Function': 'webServices',
  'aws.apigateway.RestApi': 'webServices',
  'cloudflare.Worker': 'webServices',
  'cloudflare.Pages': 'webServices',
  'aws.rds.Instance': 'databases',
  'aws.rds.Cluster': 'databases',
  'aws.dynamodb.Table': 'databases',
  'aws.route53.Zone': 'domains',
  'aws.route53.Record': 'domains',
  'cloudflare.Zone': 'domains',
}

/**
 * Map SST resource type to universal table
 */
export function mapResourceTypeToTable(
  sstResourceType: string
): UniversalTable | null {
  return RESOURCE_TYPE_MAP[sstResourceType] || null
}

/**
 * Map SST resource to universal table record
 */
export function mapResourceToUniversalTable(
  sstResource: {
    type: string
    id: string
    provider: string
    name: string
    [key: string]: unknown
  }
): ResourceMapping | null {
  const universalTable = mapResourceTypeToTable(sstResource.type)
  if (!universalTable) {
    return null
  }

  return {
    sstResourceType: sstResource.type,
    universalTable,
    mapping: {
      provider: sstResource.provider,
      providerResourceId: sstResource.id,
      name: sstResource.name,
      ...sstResource,
    },
  }
}
