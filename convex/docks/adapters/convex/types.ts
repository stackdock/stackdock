/**
 * Convex API Types
 * 
 * Generated from actual API responses in docks/convex/
 * 
 * @see docks/convex/getTokenDetails.json
 * @see docks/convex/listProjects.json
 * @see docks/convex/listDeployments.json
 */

/**
 * Convex Token Details
 * @see docks/convex/getTokenDetails.json
 */
export interface ConvexTokenDetails {
  type: "teamToken" | "userToken"
  teamId: number
  name: string
  createTime: number
}

/**
 * Convex Project
 * @see docks/convex/listProjects.json
 */
export interface ConvexProject {
  id: number
  name: string
  slug: string
  teamId: number
  createTime: number
}

/**
 * Convex Deployment
 * @see docks/convex/listDeployments.json
 */
export interface ConvexDeployment {
  name: string
  createTime: number
  deploymentType: "dev" | "prod" | "preview"
  projectId: number
  previewIdentifier: string | null
}
