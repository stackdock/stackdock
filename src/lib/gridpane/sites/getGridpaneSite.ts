"use server";

import { SingleSiteResponse, SingleSiteApiResponse, SitesResponse } from './types';
import {
  getGridPaneConfig,
  createFetchWithTimeout,
  logApiCall,
  createGridPaneHeaders,
  GridPaneApiError
} from '../helpers';
import {
  withRetry,
  handleGridPaneResponse
} from '../utils';

export async function getGridPaneSiteByDomain(siteDomain: string): Promise<SingleSiteResponse> {
  const startTime = performance.now();
  const { url, token } = getGridPaneConfig();

  const endpoint = `site-by-domain/${siteDomain}`;
  
  // Clean and validate domain name
  const cleanDomain = siteDomain.toLowerCase().trim();
  if (!cleanDomain || cleanDomain.length === 0) {
    throw new GridPaneApiError(
      `Invalid domain: ${siteDomain}. Domain cannot be empty.`,
      400,
      endpoint
    );
  }

  // Basic domain validation (allow letters, numbers, dots, hyphens)
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(cleanDomain)) {
    throw new GridPaneApiError(
      `Invalid domain format: ${cleanDomain}. Must be a valid domain name.`,
      400,
      endpoint
    );
  }

  try {
    const fetchWithTimeout = createFetchWithTimeout();

    // Step 1: Get all sites and find matching domain
    let foundSiteId: number | null = null;
    let currentPage = 1;
    const maxPages = 10; // Prevent infinite loops

    while (currentPage <= maxPages && !foundSiteId) {
      const sitesListUrl = `${url}/site?page=${currentPage}`;
      
      const sitesResponse = await withRetry(
        async () => {
          return await fetchWithTimeout(sitesListUrl, {
            method: 'GET',
            headers: createGridPaneHeaders(token),
            next: {
              revalidate: 60, // Cache sites list for 1 minute
              tags: [`gridpane-sites-search`, `gridpane-sites-page-${currentPage}`]
            }
          });
        },
        `sites-search-page-${currentPage}`
      );

      const sitesData = await handleGridPaneResponse<SitesResponse>(sitesResponse, `sites-search-page-${currentPage}`);

      // Search for matching domain in current page
      const matchingSite = sitesData.data.find(site => 
        site.url.toLowerCase() === cleanDomain
      );

      if (matchingSite) {
        foundSiteId = matchingSite.id;
        break;
      }

      // Check if there are more pages
      if (currentPage >= sitesData.meta.last_page) {
        break;
      }

      currentPage++;
    }

    if (!foundSiteId) {
      throw new GridPaneApiError(
        `Site not found: ${cleanDomain}. No site exists with this domain.`,
        404,
        endpoint
      );
    }

    // Step 2: Fetch the detailed site using the found ID
    const siteDetailUrl = `${url}/site/${foundSiteId}`;
    const detailResponse = await withRetry(
      async () => {
        return await fetchWithTimeout(siteDetailUrl, {
          method: 'GET',
          headers: createGridPaneHeaders(token),
          next: {
            revalidate: 180,
            tags: [`gridpane-single-site`, `gridpane-single-site-${foundSiteId}`, `gridpane-site-domain-${cleanDomain}`]
          }
        });
      },
      `site/${foundSiteId}`
    );

    const apiResponse = await handleGridPaneResponse<SingleSiteApiResponse>(detailResponse, `site/${foundSiteId}`);

    // Validate response structure
    if (!apiResponse || !apiResponse.data) {
      throw new GridPaneApiError(
        'Invalid response structure: missing data object',
        200,
        endpoint
      );
    }

    const siteData = apiResponse.data;

    if (!siteData || typeof siteData.id !== 'number') {
      throw new GridPaneApiError(
        'Invalid response structure: missing or invalid site id',
        200,
        endpoint
      );
    }

    if (!siteData.url || !siteData.server) {
      throw new GridPaneApiError(
        'Invalid response structure: missing required site fields',
        200,
        endpoint
      );
    }

    if (!Array.isArray(siteData.vpsServices)) {
      throw new GridPaneApiError(
        'Invalid response structure: vpsServices must be an array',
        200,
        endpoint
      );
    }

    if (!Array.isArray(siteData.schedule_backups)) {
      throw new GridPaneApiError(
        'Invalid response structure: schedule_backups must be an array',
        200,
        endpoint
      );
    }

    // Calculate duration and prepare metadata
    const duration = Math.round(performance.now() - startTime);
    
    // Create enhanced response with metadata
    const siteResponse: SingleSiteResponse = {
      ...siteData,
      _metadata: {
        fetched_at: new Date().toISOString(),
        cached_until: new Date(Date.now() + 180000).toISOString(), // 3 minutes from now
        request_duration_ms: duration,
        api_version: '1.0'
      }
    };

    // Log successful call
    logApiCall(`${endpoint} (site: ${siteData.url}, found on page ${currentPage})`, undefined, duration);

    return siteResponse;

  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    
    if (error instanceof GridPaneApiError) {
      console.error(`[GridPane API Error] ${endpoint}: ${error.message} (${duration}ms)`);
      throw error;
    }

    // Handle unexpected errors
    const unexpectedError = new GridPaneApiError(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0,
      endpoint,
      undefined,
      error
    );
    
    console.error(`[GridPane API Error] ${endpoint}: ${unexpectedError.message} (${duration}ms)`, error);
    throw unexpectedError;
  }
}

// Keep the original function for backward compatibility
export async function getGridPaneSite(siteId: number): Promise<SingleSiteResponse> {
  const startTime = performance.now();
  const { url, token } = getGridPaneConfig();

  const endpoint = `site/${siteId}`;
  const requestUrl = `${url}/site/${siteId}`;

  // Validate site ID
  if (!Number.isInteger(siteId) || siteId <= 0) {
    throw new GridPaneApiError(
      `Invalid site ID: ${siteId}. Must be a positive integer.`,
      400,
      endpoint
    );
  }

  try {
    const fetchWithTimeout = createFetchWithTimeout();

    const response = await withRetry(
      async () => {
        return await fetchWithTimeout(requestUrl, {
          method: 'GET',
          headers: createGridPaneHeaders(token),
          next: {
            revalidate: 180,
            tags: [`gridpane-single-site`, `gridpane-single-site-${siteId}`]
          }
        });
      },
      endpoint
    );

    const apiResponse = await handleGridPaneResponse<SingleSiteApiResponse>(response, endpoint);

    // Validate response structure
    if (!apiResponse || !apiResponse.data) {
      throw new GridPaneApiError(
        'Invalid response structure: missing data object',
        200,
        endpoint
      );
    }

    const siteData = apiResponse.data;

    if (!siteData || typeof siteData.id !== 'number') {
      throw new GridPaneApiError(
        'Invalid response structure: missing or invalid site id',
        200,
        endpoint
      );
    }

    if (!siteData.url || !siteData.server) {
      throw new GridPaneApiError(
        'Invalid response structure: missing required site fields',
        200,
        endpoint
      );
    }

    if (!Array.isArray(siteData.vpsServices)) {
      throw new GridPaneApiError(
        'Invalid response structure: vpsServices must be an array',
        200,
        endpoint
      );
    }

    if (!Array.isArray(siteData.schedule_backups)) {
      throw new GridPaneApiError(
        'Invalid response structure: schedule_backups must be an array',
        200,
        endpoint
      );
    }

    // Calculate duration and prepare metadata
    const duration = Math.round(performance.now() - startTime);
    
    // Create enhanced response with metadata
    const siteResponse: SingleSiteResponse = {
      ...siteData,
      _metadata: {
        fetched_at: new Date().toISOString(),
        cached_until: new Date(Date.now() + 180000).toISOString(),
        request_duration_ms: duration,
        api_version: '1.0'
      }
    };

    // Log successful call
    logApiCall(`${endpoint} (site: ${siteData.url})`, undefined, duration);

    return siteResponse;

  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    
    if (error instanceof GridPaneApiError) {
      console.error(`[GridPane API Error] ${endpoint}: ${error.message} (${duration}ms)`);
      throw error;
    }

    const unexpectedError = new GridPaneApiError(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0,
      endpoint,
      undefined,
      error
    );
    
    console.error(`[GridPane API Error] ${endpoint}: ${unexpectedError.message} (${duration}ms)`, error);
    throw unexpectedError;
  }
}
