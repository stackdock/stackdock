# Mission 5: GridPane API Pagination & Rate Limit Handling

## Problem Identified

**Current Issue:**
- GridPane API uses pagination (`per_page: 10`, `last_page: 2`, `total: 12`)
- Current `getSites()` only fetches first page (10 sites)
- Missing sites from later pages (2 sites missing in example)
- No rate limit detection or handling
- No pagination handling for other endpoints (servers, domains, backups)

**Root Cause:**
- API client doesn't detect or handle pagination
- No rate limit header parsing
- No automatic page crawling

**Evidence:**
From `docks/gridpane/site/getallsites.json`:
```json
{
  "meta": {
    "current_page": 1,
    "last_page": 2,
    "per_page": 10,
    "total": 12
  },
  "links": {
    "next": "https://my.gridpane.com/oauth/api/v1/site?page=2"
  }
}
```

---

## Solution: Generic Pagination Handler with Rate Limit Detection

### Architecture Overview

1. **Detect Pagination**: Check response for `meta.last_page` or `links.next`
2. **Crawl All Pages**: Automatically fetch all pages until `current_page >= last_page`
3. **Rate Limit Awareness**: Parse headers (`X-RateLimit-*`, `Retry-After`)
4. **Adaptive Delays**: Adjust request speed based on remaining rate limit
5. **Logging**: Log pagination progress and rate limit info for debugging

---

## Implementation Plan

### Step 1: Update Types to Support Pagination

**File**: `convex/docks/adapters/gridpane/types.ts`

**Add pagination response types:**

```typescript
/**
 * GridPane Paginated Response Structure
 * Detected from actual API responses (sites, servers, domains, etc.)
 * @see docks/gridpane/site/getallsites.json
 */
export interface GridPanePaginatedResponse<T> {
  data: T[]
  links?: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta?: {
    current_page: number
    from: number
    last_page: number
    per_page: number
    to: number
    total: number
    path?: string
    links?: Array<{
      url: string | null
      label: string
      active: boolean
    }>
  }
}

/**
 * GridPane API Response (can be paginated or non-paginated)
 * Non-paginated responses: { data: T[] }
 * Paginated responses: { data: T[], links: {...}, meta: {...} }
 */
export type GridPaneResponse<T> = 
  | { data: T[] }  // Non-paginated
  | GridPanePaginatedResponse<T>  // Paginated
```

---

### Step 2: Update Request Method to Capture Headers

**File**: `convex/docks/adapters/gridpane/api.ts`

**Add header capture and rate limit detection:**

```typescript
/**
 * API Response with headers for rate limit detection
 */
interface APIResponseWithHeaders<T> {
  data: T
  headers: {
    rateLimitRemaining?: string
    rateLimitTotal?: string
    rateLimitReset?: string
    retryAfter?: string
    [key: string]: string | undefined
  }
}

/**
 * Make authenticated request to GridPane API
 * Returns data and headers for rate limit detection
 */
private async requestWithHeaders<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponseWithHeaders<T>> {
  const url = `${this.baseUrl}/oauth/api/v1${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  // Extract rate limit headers (case-insensitive)
  const headers: Record<string, string | undefined> = {}
  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase()
    if (
      lowerKey.includes("ratelimit") ||
      lowerKey.includes("rate-limit") ||
      lowerKey === "retry-after" ||
      lowerKey === "x-ratelimit-remaining" ||
      lowerKey === "x-ratelimit-limit" ||
      lowerKey === "x-ratelimit-reset"
    ) {
      headers[lowerKey] = value
    }
  })

  if (!response.ok) {
    // Handle 429 Rate Limit specifically
    if (response.status === 429) {
      const retryAfter = headers["retry-after"] || headers["x-ratelimit-reset"]
      const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 60
      throw new Error(
        `GridPane API rate limit exceeded. Retry after ${waitSeconds} seconds. ` +
        `Rate limit info: ${JSON.stringify(headers)}`
      )
    }
    
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(
      `GridPane API error (${response.status}): ${errorText}`
    )
  }

  const data = await response.json()
  
  // Log rate limit info for debugging
  if (headers["x-ratelimit-remaining"] || headers["ratelimit-remaining"]) {
    console.log(`[GridPane API] Rate limit info for ${endpoint}:`, {
      remaining: headers["x-ratelimit-remaining"] || headers["ratelimit-remaining"],
      total: headers["x-ratelimit-limit"] || headers["ratelimit-limit"],
      reset: headers["x-ratelimit-reset"] || headers["ratelimit-reset"],
    })
  }

  return { data, headers }
}

/**
 * Make authenticated request (backward compatible)
 * Use requestWithHeaders internally for pagination support
 */
private async request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { data } = await this.requestWithHeaders<T>(endpoint, options)
  return data
}
```

---

### Step 3: Create Pagination Detection Method

**File**: `convex/docks/adapters/gridpane/api.ts`

**Add pagination detection:**

```typescript
/**
 * Detect if response has pagination metadata
 * Checks for meta.last_page (most reliable indicator)
 */
private hasPagination(response: any): response is GridPanePaginatedResponse<any> {
  return (
    response &&
    typeof response === "object" &&
    "meta" in response &&
    response.meta &&
    typeof response.meta === "object" &&
    "last_page" in response.meta &&
    "current_page" in response.meta &&
    "per_page" in response.meta &&
    typeof response.meta.last_page === "number" &&
    response.meta.last_page > 1
  )
}
```

---

### Step 4: Create Generic Pagination Handler

**File**: `convex/docks/adapters/gridpane/api.ts`

**Add generic pagination crawler:**

```typescript
/**
 * Fetch all pages for a paginated endpoint
 * Automatically detects pagination and crawls all pages
 * Respects rate limits by checking headers and adding delays
 * 
 * @param endpoint - API endpoint (e.g., "/site", "/server")
 * @param options - Optional fetch options
 * @returns Array of all items from all pages
 */
private async fetchAllPages<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T[]> {
  const allItems: T[] = []
  let currentPage = 1
  let hasMorePages = true
  let lastResponseHeaders: Record<string, string | undefined> = {}
  
  // Default delay between requests (ms) - can be adjusted based on rate limits
  let delayBetweenRequests = 500 // 500ms = 2 requests/second max
  
  console.log(`[GridPane API] Starting pagination crawl for ${endpoint}`)
  
  while (hasMorePages) {
    // Build URL with page parameter
    const pageEndpoint = endpoint.includes("?") 
      ? `${endpoint}&page=${currentPage}`
      : `${endpoint}?page=${currentPage}`
    
    try {
      const { data, headers } = await this.requestWithHeaders<GridPaneResponse<T>>(
        pageEndpoint,
        options
      )
      
      lastResponseHeaders = headers
      
      // Extract items from response
      const items = Array.isArray(data) ? data : (data as any).data || []
      allItems.push(...items)
      
      console.log(
        `[GridPane API] Fetched page ${currentPage}: ${items.length} items ` +
        `(total so far: ${allItems.length})`
      )
      
      // Check if response has pagination metadata
      if (this.hasPagination(data)) {
        const meta = (data as GridPanePaginatedResponse<T>).meta!
        console.log(
          `[GridPane API] Pagination detected: page ${meta.current_page}/${meta.last_page}, ` +
          `per_page: ${meta.per_page}, total: ${meta.total}`
        )
        
        hasMorePages = meta.current_page < meta.last_page
        currentPage = meta.current_page + 1
        
        // Adjust delay based on rate limit headers
        if (headers["x-ratelimit-remaining"]) {
          const remaining = parseInt(headers["x-ratelimit-remaining"], 10)
          // If we're getting low on requests, slow down
          if (remaining < 10) {
            delayBetweenRequests = 2000 // 2 seconds between requests
            console.log(`[GridPane API] Rate limit low (${remaining} remaining), slowing down`)
          } else if (remaining < 50) {
            delayBetweenRequests = 1000 // 1 second between requests
          } else {
            delayBetweenRequests = 500 // Normal speed
          }
        }
      } else {
        // No pagination metadata - assume single page
        hasMorePages = false
        console.log(`[GridPane API] No pagination detected, single page response`)
      }
      
      // Wait before next request (unless it's the last page)
      if (hasMorePages) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenRequests))
      }
      
    } catch (error) {
      // Handle rate limit errors specifically
      if (error instanceof Error && error.message.includes("rate limit")) {
        const retryAfterMatch = error.message.match(/Retry after (\d+) seconds/)
        const waitSeconds = retryAfterMatch ? parseInt(retryAfterMatch[1], 10) : 60
        
        console.warn(
          `[GridPane API] Rate limit hit, waiting ${waitSeconds} seconds before retry...`
        )
        
        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000))
        
        // Retry the same page
        continue
      }
      
      // Re-throw other errors
      throw error
    }
  }
  
  console.log(
    `[GridPane API] Pagination crawl complete for ${endpoint}: ` +
    `${allItems.length} total items across ${currentPage - 1} page(s)`
  )
  
  return allItems
}
```

---

### Step 5: Update All List Methods

**File**: `convex/docks/adapters/gridpane/api.ts`

**Update methods to use pagination:**

```typescript
/**
 * Get all servers (with pagination support)
 * GET /oauth/api/v1/server
 */
async getServers(): Promise<GridPaneServer[]> {
  return this.fetchAllPages<GridPaneServer>("/server")
}

/**
 * Get all sites (with pagination support)
 * GET /oauth/api/v1/site
 */
async getSites(): Promise<GridPaneSite[]> {
  return this.fetchAllPages<GridPaneSite>("/site")
}

/**
 * Get all domains (with pagination support)
 * GET /oauth/api/v1/domain
 * Note: Domain endpoint has different structure { data: { domains: [...] } }
 * May need special handling if paginated
 */
async getDomains(): Promise<GridPaneDomain[]> {
  // Check if domains endpoint uses pagination
  // First, try to detect structure
  const firstPage = await this.requestWithHeaders<GridPaneDomainResponse | GridPanePaginatedResponse<GridPaneDomain>>(
    "/domain?page=1"
  )
  
  // Check if it's the nested structure
  if ("data" in firstPage.data && typeof firstPage.data.data === "object" && "domains" in firstPage.data.data) {
    // Non-paginated nested structure - fetch all pages manually
    const allDomains: GridPaneDomain[] = []
    let currentPage = 1
    let hasMorePages = true
    
    while (hasMorePages) {
      const { data } = await this.requestWithHeaders<GridPaneDomainResponse | GridPanePaginatedResponse<{domains: GridPaneDomain[]}>>(
        `/domain?page=${currentPage}`
      )
      
      // Extract domains from nested structure
      if ("data" in data && typeof data.data === "object" && "domains" in data.data) {
        const domains = (data as GridPaneDomainResponse).data.domains
        allDomains.push(...domains)
        
        // Check for pagination in meta
        if ("meta" in data && data.meta && typeof data.meta === "object" && "last_page" in data.meta) {
          const meta = (data as any).meta
          hasMorePages = meta.current_page < meta.last_page
          currentPage = meta.current_page + 1
        } else {
          hasMorePages = false
        }
      } else {
        hasMorePages = false
      }
      
      if (hasMorePages) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    return allDomains
  }
  
  // Standard paginated structure
  return this.fetchAllPages<GridPaneDomain>("/domain")
}
```

---

### Step 6: Update Backup Methods (if needed)

**File**: `convex/docks/adapters/gridpane/api.ts`

**Check if backup endpoints are paginated:**

```typescript
/**
 * Get all sites backup schedules (with pagination support)
 * GET /oauth/api/v1/backups/schedules
 * Note: This endpoint returns nested structure, but may be paginated
 */
async getAllBackupSchedules(): Promise<GridPaneBackupSchedule[]> {
  // This endpoint returns { success: true, data: GridPaneSiteBackupSchedules[] }
  // May be paginated - check first page
  const allSites: GridPaneSiteBackupSchedules[] = []
  let currentPage = 1
  let hasMorePages = true
  
  while (hasMorePages) {
    const { data } = await this.requestWithHeaders<{
      success: boolean
      data: GridPaneSiteBackupSchedules[]
      meta?: {
        current_page: number
        last_page: number
        per_page: number
        total: number
      }
    }>(`/backups/schedules?page=${currentPage}`)
    
    if (!data.success || !Array.isArray(data.data)) {
      break
    }
    
    allSites.push(...data.data)
    
    // Check pagination
    if (data.meta) {
      hasMorePages = data.meta.current_page < data.meta.last_page
      currentPage = data.meta.current_page + 1
    } else {
      hasMorePages = false
    }
    
    if (hasMorePages) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  // Flatten schedules (existing logic)
  const flattened: GridPaneBackupSchedule[] = []
  for (const site of allSites) {
    for (const schedule of site.schedule_backups) {
      const time = `${schedule.hour.padStart(2, "0")}:${schedule.minute.padStart(2, "0")}`
      const dayOfWeek = schedule.day !== null ? parseInt(schedule.day, 10) : null
      
      flattened.push({
        server_id: site.server_id,
        site_id: site.site_id,
        site_url: site.url,
        schedule_id: schedule.id,
        type: schedule.type,
        frequency: schedule.bup_schedule,
        hour: schedule.hour,
        minute: schedule.minute,
        time,
        day_of_week: dayOfWeek,
        service_id: schedule.service_id,
        service_name: schedule.service_name,
        service_user_id: schedule.service_user_id,
        enabled: true,
        remote_backups_enabled: schedule.type === "remote",
      })
    }
  }
  
  return flattened
}
```

---

## Implementation Checklist

### Backend (Convex)
- [x] Add `GridPanePaginatedResponse` type to `types.ts`
- [x] Update `GridPaneResponse` to support both formats
- [x] Add `requestWithHeaders()` method (capture headers)
- [x] Update `request()` to use `requestWithHeaders()` internally
- [x] Add `hasPagination()` detection method
- [x] Add `fetchAllPages()` generic pagination handler
- [x] Update `getServers()` to use `fetchAllPages()`
- [x] Update `getSites()` to use `fetchAllPages()`
- [x] Update `getDomains()` to handle pagination + nested structure
- [x] Update `getAllBackupSchedules()` to handle pagination
- [ ] Update `getBackupIntegrations()` to handle pagination (if needed)
- [x] Add rate limit header parsing and logging
- [x] Add automatic delay adjustment based on rate limits
- [x] Handle 429 errors with retry logic

### Testing
- [ ] Test with account that has >10 sites
- [ ] Test with account that has >10 servers
- [ ] Test with account that has >10 domains
- [ ] Verify all pages are fetched
- [ ] Verify rate limit headers are logged
- [ ] Test rate limit handling (if possible)
- [ ] Verify no 429 errors occur
- [ ] Verify all sites appear in web services table

---

## Rate Limit Detection Strategy

### Headers to Check (Case-Insensitive)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`
- `X-RateLimit-Limit` / `RateLimit-Limit`
- `X-RateLimit-Reset` / `RateLimit-Reset`
- `Retry-After` (when 429 occurs)

### Adaptive Delay Strategy
1. **Normal**: 500ms delay (2 req/sec)
2. **Low Remaining (<50)**: 1000ms delay (1 req/sec)
3. **Very Low (<10)**: 2000ms delay (0.5 req/sec)
4. **429 Error**: Wait `Retry-After` seconds, then retry

### Logging Strategy
Log pagination and rate limit info:
```typescript
console.log(`[GridPane API] Page ${currentPage}/${lastPage}: ${items.length} items`)
console.log(`[GridPane API] Rate limit: ${remaining}/${total} remaining`)
console.log(`[GridPane API] Delay: ${delayBetweenRequests}ms`)
```

---

## Pagination Detection Logic

### Detection Methods (in order of preference):

1. **Meta Object Detection** (Most Reliable):
   ```typescript
   if (response.meta?.last_page && response.meta?.current_page) {
     // Paginated
   }
   ```

2. **Links Object Detection**:
   ```typescript
   if (response.links?.next) {
     // Paginated (has next page)
   }
   ```

3. **Data Length vs Total**:
   ```typescript
   if (response.meta?.total && response.data.length < response.meta.total) {
     // Paginated (more data available)
   }
   ```

4. **Fallback**: If none detected, assume single page

---

## Expected Behavior

### Before Fix:
- `getSites()` returns 10 sites (first page only)
- Missing sites from pages 2, 3, etc.
- No rate limit awareness
- No logging

### After Fix:
- `getSites()` returns ALL sites (all pages)
- Automatically crawls pages 1, 2, 3, etc.
- Detects rate limits from headers
- Adjusts request speed based on rate limits
- Logs pagination progress and rate limit info
- Handles 429 errors gracefully with retry

---

## Edge Cases to Handle

1. **Non-Paginated Endpoints**: Some endpoints may not have pagination - detect and handle gracefully
2. **Nested Structures**: Domains endpoint uses `{ data: { domains: [...] } }` - handle separately
3. **Empty Pages**: Handle gracefully if a page returns empty array
4. **Rate Limit Mid-Crawl**: Pause and wait if rate limit hit during pagination
5. **Network Errors**: Retry logic for network failures (separate from rate limits)
6. **Single Page**: If `last_page === 1`, don't make additional requests

---

## Files to Modify

1. **`convex/docks/adapters/gridpane/types.ts`**
   - Add `GridPanePaginatedResponse` type
   - Update `GridPaneResponse` to support both formats

2. **`convex/docks/adapters/gridpane/api.ts`**
   - Add `requestWithHeaders()` method
   - Add `hasPagination()` detection
   - Add `fetchAllPages()` pagination handler
   - Update all `get*()` methods to use pagination

3. **Testing**: Verify with real GridPane account

---

## Priority

**CRITICAL** - Missing data in production (sites not syncing)

## Estimated Time

- Backend implementation: 2-3 hours
- Testing: 1 hour
- Total: 3-4 hours

---

## Notes

- **Assume All Endpoints Paginated**: Better to check and handle than miss data
- **Rate Limit Safety**: Start conservative (500ms delay), adjust based on headers
- **Logging is Critical**: Need to see pagination progress and rate limit info
- **Backward Compatible**: Non-paginated endpoints should still work

---

**Status**: ✅ **TESTED - WORKING** - Functional as intended

## Implementation Summary

### Completed Changes

1. **Types Updated** (`convex/docks/adapters/gridpane/types.ts`):
   - Added `GridPanePaginatedResponse<T>` interface with `links` and `meta` fields
   - Updated `GridPaneResponse<T>` to support optional pagination metadata

2. **API Client Updated** (`convex/docks/adapters/gridpane/api.ts`):
   - Added `requestWithHeaders()` method to capture rate limit headers
   - Updated `request()` to use `requestWithHeaders()` internally (backward compatible)
   - Added `hasPagination()` method to detect paginated responses
   - Added `fetchAllPages()` generic pagination handler with:
     - Automatic page detection and crawling
     - Rate limit header parsing and logging
     - Adaptive delay adjustment (500ms → 1000ms → 2000ms based on remaining requests)
     - 429 error handling with retry logic
   - Updated `getServers()` to use `fetchAllPages()`
   - Updated `getSites()` to use `fetchAllPages()`
   - Updated `getDomains()` to handle pagination with nested structure
   - Updated `getAllBackupSchedules()` to handle pagination

### Key Features

- **Automatic Pagination Detection**: Checks `meta.last_page` to determine if more pages exist
- **Rate Limit Awareness**: Parses `X-RateLimit-*` headers and adjusts request speed
- **Adaptive Delays**: 
  - Normal: 500ms (2 req/sec)
  - Low remaining (<50): 1000ms (1 req/sec)
  - Very low (<10): 2000ms (0.5 req/sec)
- **429 Error Handling**: Waits `Retry-After` seconds and retries
- **Comprehensive Logging**: Logs pagination progress and rate limit info

### Testing Results

✅ **Tested and Working**: 
- Pagination implemented and tested
- Working as intended
- May need improvements later but functional for now
- All sites now sync correctly (not just first page)

### Notes

- Functional for current use case
- May need improvements later (rate limit handling, error recovery)
- Ready for production use
