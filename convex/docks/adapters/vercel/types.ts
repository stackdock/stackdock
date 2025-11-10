/**
 * Vercel API Types
 * 
 * Generated from actual API responses in docks/vercel/
 * 
 * @see docks/vercel/projects/retrievealistofprojects.json
 */

/**
 * Vercel Projects Response
 */
export interface VercelProjectsResponse {
  projects: VercelProject[]
  pagination: {
    count: number
    next: number | null
    prev: number | null
  }
}

/**
 * Vercel Project
 * @see docks/vercel/projects/retrievealistofprojects.json
 */
export interface VercelProject {
  id: string // "prj_8kpgj4jqKA28AHdtuidFVW7lij1U"
  name: string // "vapr-ballistics-js-client"
  accountId: string
  createdAt: number // Unix timestamp in milliseconds
  updatedAt: number
  framework: string | null // "nextjs", "react", etc.
  nodeVersion: string | null // "22.x"
  live: boolean
  link: {
    type: "github" | "gitlab" | "bitbucket"
    repo: string // "vapr-ballistics"
    org: string // "robsdevcraft"
    repoId: number
    productionBranch: string // "main"
    createdAt: number
    updatedAt: number
  } | null
  targets: {
    production?: VercelDeployment
    preview?: VercelDeployment
  }
  latestDeployments: VercelDeployment[]
  [key: string]: any // All other fields
}

/**
 * Vercel Deployment
 */
export interface VercelDeployment {
  id: string // "dpl_5rHTuBraeiW5wTRyKN99uotLzzyY"
  url: string // "vapr-ballistics-js-client-qxjujfn7z-vaos.vercel.app"
  readyState: "READY" | "BUILDING" | "ERROR" | "QUEUED" | "CANCELED"
  readySubstate?: string // "PROMOTED", etc.
  target: "production" | "preview" | null
  alias: string[] // Array of domain aliases
  aliasAssigned: number | null // Unix timestamp
  aliasError: string | null
  createdAt: number
  buildingAt: number | null
  readyAt: number | null
  plan: "hobby" | "pro" | "enterprise"
  type: "LAMBDAS" | "STATIC"
  createdIn: string // Region: "sfo1", "iad1", etc.
  [key: string]: any // All other fields
}

/**
 * Vercel User (for validateCredentials)
 */
export interface VercelUser {
  user: {
    id: string
    username: string
    email: string
    name: string
  }
}
