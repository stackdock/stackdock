/**
 * Sentry Dock Adapter
 * 
 * Translates Sentry API responses to StackDock's universal schema.
 * 
 * Endpoints implemented:
 * - GET /projects/ → validateCredentials() and listProjects()
 * - GET /projects/{org}/{project}/issues/ → syncIssues()
 * 
 * **Terminology Note**: Sentry calls them "issues", but StackDock uses "alerts" in user-facing
 * contexts to avoid confusion with GitHub issues, bug trackers, etc. Internally, we use "issues"
 * table for backward compatibility and semantic clarity (these are error tracking issues).
 * 
 * @see https://docs.sentry.io/api/
 * @see convex/docks/_types.ts for DockAdapter interface
 */

import type { DockAdapter } from "../../_types"
import type { MutationCtx } from "../../../_generated/server"
import type { Doc } from "../../../_generated/dataModel"
import { decryptApiKey } from "../../../lib/encryption"
import { SentryAPI } from "./api"
import type { SentryIssue, SentryProject } from "./types"

/**
 * Map Sentry issue level to universal severity
 */
function mapSentryLevel(level: string): string {
  const levelMap: Record<string, string> = {
    debug: "low",
    info: "low",
    warning: "medium",
    error: "high",
    fatal: "critical",
  }
  return levelMap[level.toLowerCase()] || "medium"
}

/**
 * Map Sentry issue status to universal status
 */
function mapSentryStatus(status: string): string {
  const statusMap: Record<string, string> = {
    resolved: "resolved",
    unresolved: "open",
    ignored: "ignored",
  }
  return statusMap[status.toLowerCase()] || "open"
}

/**
 * Convert ISO 8601 timestamp to Unix timestamp (milliseconds)
 */
function isoToTimestamp(iso: string): number {
  return new Date(iso).getTime()
}

export const sentryAdapter: DockAdapter = {
  provider: "sentry",

  /**
   * Validate Sentry API credentials
   */
  async validateCredentials(apiKey: string): Promise<boolean> {
    try {
      const api = new SentryAPI(apiKey)
      return await api.validateCredentials()
    } catch (error) {
      console.error("Sentry credential validation failed:", error)
      throw error
    }
  },

  /**
   * Sync Sentry "issues" to universal `issues` table
   * 
   * **Terminology**: Sentry calls them "issues", but StackDock uses "alerts" in user-facing
   * contexts to avoid confusion with GitHub issues, bug trackers, etc. Internally, we use "issues"
   * table for backward compatibility and semantic clarity (these are error tracking issues).
   * 
   * Flow:
   * 1. If preFetchedData provided, use it (from action)
   * 2. Otherwise, decrypt API key and fetch data
   * 3. For each project, fetch issues (Sentry's terminology)
   * 4. For each issue, upsert into `issues` table
   * 5. Map level to severity, status to universal status
   * 6. Store all Sentry fields in fullApiData
   */
  async syncIssues(
    ctx: MutationCtx,
    dock: Doc<"docks">,
    preFetchedData?: Array<{ project: SentryProject; issues: SentryIssue[] }>
  ): Promise<void> {
    console.log(`[Sentry Adapter] 🔄 syncIssues called for dock ${dock._id}`)
    console.log(`[Sentry Adapter]   - preFetchedData provided: ${!!preFetchedData}`)
    console.log(`[Sentry Adapter]   - preFetchedData length: ${preFetchedData?.length || 0}`)
    
    let projectsWithIssues: Array<{ project: SentryProject; issues: SentryIssue[] }>

    if (preFetchedData) {
      // Use pre-fetched data from action
      console.log(`[Sentry Adapter] ✅ Using pre-fetched data: ${preFetchedData.length} projects`)
      projectsWithIssues = preFetchedData
    } else {
      // Fetch data directly (fallback, shouldn't happen in normal flow)
      const apiKey = await decryptApiKey(dock.encryptedApiKey, ctx, {
        dockId: dock._id,
        orgId: dock.orgId,
      })

      const api = new SentryAPI(apiKey)
      projectsWithIssues = await api.listAllIssues()
    }

    // Track synced resource IDs for orphan detection
    const syncedResourceIds = new Set<string>()

    // Sync each Sentry "issue" to StackDock "issues" table
    let totalIssuesSynced = 0
    console.log(`[Sentry Adapter] 🔄 Starting sync for ${projectsWithIssues.length} projects`)
    
    for (const { project, issues } of projectsWithIssues) {
      console.log(`[Sentry Adapter]   - Project: ${project.name} (${project.slug}) - ${issues.length} issues`)
      for (const issue of issues) {
        const providerResourceId = issue.id
        syncedResourceIds.add(providerResourceId)

        const existing = await ctx.db
          .query("issues")
          .withIndex("by_dock_resource", (q) =>
            q.eq("dockId", dock._id).eq("providerResourceId", providerResourceId)
          )
          .first()

        const issueData = {
          orgId: dock.orgId,
          dockId: dock._id,
          provider: "sentry",
          providerResourceId,
          title: issue.title,
          status: mapSentryStatus(issue.status),
          severity: mapSentryLevel(issue.level),
          project: project.name,
          projectSlug: project.slug,
          organizationSlug: project.organization.slug,
          // Sentry API returns count as string, convert to number
          count: typeof issue.count === "string" ? parseInt(issue.count, 10) : issue.count,
          userCount: issue.userCount,
          firstSeen: isoToTimestamp(issue.firstSeen),
          lastSeen: isoToTimestamp(issue.lastSeen),
          fullApiData: {
            // Store all Sentry fields
            issue: {
              ...issue,
            },
            project: {
              ...project,
            },
          },
          updatedAt: Date.now(),
        }

        if (existing) {
          await ctx.db.patch(existing._id, issueData)
        } else {
          await ctx.db.insert("issues", issueData)
          totalIssuesSynced++
        }
      }
    }
    
    console.log(`[Sentry Adapter] ✅ Sync complete: ${totalIssuesSynced} new issues inserted`)

    // Delete orphaned resources (exist in DB but not in API response)
    const existingIssues = await ctx.db
      .query("issues")
      .withIndex("by_dockId", (q) => q.eq("dockId", dock._id))
      .collect()

    for (const existing of existingIssues) {
      if (!syncedResourceIds.has(existing.providerResourceId)) {
        console.log(`[Sentry] Deleting orphaned issue: ${existing.title} (${existing.providerResourceId})`)
        await ctx.db.delete(existing._id)
      }
    }
  },
}
