/**
 * Sentry API Types
 * 
 * Generated from Sentry API documentation
 * 
 * @see https://docs.sentry.io/api/
 */

/**
 * Sentry Project
 * Used to fetch issues for each project
 */
export interface SentryProject {
  id: string
  name: string
  slug: string
  organization: {
    id: string
    slug: string
    name: string
  }
  platform: string | null
  dateCreated: string
  firstEvent: string | null
  features: string[]
  status: string
  isBookmarked: boolean
  isMember: boolean
  color: string
}

/**
 * Sentry Issue
 * 
 * **Terminology Note**: Sentry calls these "issues", but StackDock maps them to the
 * universal `issues` table (StackDock uses "alerts" in user-facing contexts to avoid confusion with GitHub issues, bug trackers, etc.)
 * 
 * @see https://docs.sentry.io/api/events/list-a-projects-issues/
 */
export interface SentryIssue {
  id: string
  shortId: string
  title: string
  culprit: string
  permalink: string
  logger: string | null
  level: "debug" | "info" | "warning" | "error" | "fatal"
  status: "resolved" | "unresolved" | "ignored"
  statusDetails: Record<string, any>
  isPublic: boolean
  platform: string | null
  project: {
    id: string
    name: string
    slug: string
  }
  type: string
  metadata: {
    type?: string
    value?: string
    filename?: string
    function?: string
    [key: string]: any
  }
  numComments: number
  assignedTo: {
    id: string
    name: string
    email: string
  } | null
  isBookmarked: boolean
  isSubscribed: boolean
  subscriptionDetails: Record<string, any> | null
  hasSeen: boolean
  annotations: string[]
  issueType: string
  issueCategory: string
  priority: string
  priorityLockedAt: string | null
  seenBy: Array<{
    id: string
    name: string
    email: string
  }>
  tags: Array<{
    key: string
    value: string
  }>
  userCount: number
  stats: {
    "24h": Array<[number, number]>
    "14d": Array<[number, number]>
  }
  firstSeen: string
  lastSeen: string
  count: number
  userReportCount: number
  firstRelease: {
    id: string
    version: string
    dateCreated: string
  } | null
  lastRelease: {
    id: string
    version: string
    dateCreated: string
  } | null
}
