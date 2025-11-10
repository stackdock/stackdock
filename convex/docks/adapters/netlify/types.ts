/**
 * Netlify API Types
 * 
 * Generated from actual API responses in docks/netlify/
 * 
 * @see docks/netlify/site/listSites.json
 */

/**
 * Netlify Site
 * @see docks/netlify/site/listSites.json
 */
export interface NetlifySite {
  id: string // "fc7cd4a9-6639-4a6a-907b-844526a43b87"
  site_id: string // Same as id
  name: string // "stackdock-docs"
  url: string // "http://stackdock-docs.netlify.app"
  ssl_url: string | null // "https://stackdock-docs.netlify.app"
  state: string // "current"
  lifecycle_state: string | null // "active", "inactive", "suspended", "deleted"
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
  build_settings: {
    repo_path: string | null // "stackdock/docs"
    repo_url: string | null // "https://github.com/stackdock/docs"
    repo_branch: string | null // "main"
    provider: string | null // "github", "gitlab", "bitbucket"
    [key: string]: any
  } | null
  [key: string]: any // All other fields
}

/**
 * Netlify User (for validateCredentials)
 */
export interface NetlifyUser {
  id: string
  email: string
  full_name: string
  [key: string]: any
}
