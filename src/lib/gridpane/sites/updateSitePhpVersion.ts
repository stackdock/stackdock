"use server";

import { revalidateTag } from 'next/cache';
import {
  getGridPaneConfig,
  createFetchWithTimeout,
  logApiCall,
  createGridPaneHeaders,
  GridPaneApiError
} from '../helpers';
import { withRetry, handleGridPaneResponse } from '../utils';
import { rateLimiter } from '../rate-limiter';
import {
  AVAILABLE_PHP_VERSIONS,
  type PhpVersion,
  type UpdatePhpVersionApiResponse,
  type UpdatePhpVersionResult
} from './types';

const RATE_LIMIT_ENDPOINT = 'PUT:/site/{id}';

type AttemptMeta = {
  timestamp: number;
  siteId: number;
  phpVersion: PhpVersion;
};

let lastInvocation: AttemptMeta | null = null;
let lastNetworkSend: AttemptMeta | null = null;

const formatDelta = (current: number, previous: number) => `${((current - previous) / 1000).toFixed(1)}s`;

const logAudit = (message: string) => {
  console.log(`[GridPane PUT Audit] ${message}`);
};

export async function updateSitePhpVersion(
  siteId: number,
  phpVersion: PhpVersion
): Promise<UpdatePhpVersionResult> {
  if (!Number.isInteger(siteId) || siteId <= 0) {
    return {
      success: false,
      message: `Invalid site ID: ${siteId}. Must be a positive integer.`,
      error: 'INVALID_SITE_ID'
    };
  }

  if (!AVAILABLE_PHP_VERSIONS.includes(phpVersion)) {
    return {
      success: false,
      message: `Invalid PHP version: ${phpVersion}. Must be one of: ${AVAILABLE_PHP_VERSIONS.join(', ')}`,
      error: 'INVALID_PHP_VERSION'
    };
  }

  const { url, token } = getGridPaneConfig();
  const fetchWithTimeout = createFetchWithTimeout();
  const endpointPath = `site/${siteId}`;

  const invocationTimestamp = Date.now();
  logAudit(
    `Invocation for site ${siteId} → PHP ${phpVersion} at ${new Date(invocationTimestamp).toISOString()} (${lastInvocation ? `previous invocation ${formatDelta(invocationTimestamp, lastInvocation.timestamp)} ago for site ${lastInvocation.siteId}` : 'no previous invocation recorded'})`
  );
  lastInvocation = { timestamp: invocationTimestamp, siteId, phpVersion };

  const cachedWaitSeconds = rateLimiter.checkEndpoint(RATE_LIMIT_ENDPOINT);
  if (cachedWaitSeconds !== null && cachedWaitSeconds > 0) {
    logAudit(
      `Blocked by cached cooldown (${cachedWaitSeconds}s remaining). Last successful send ${
        lastNetworkSend ? `${formatDelta(invocationTimestamp, lastNetworkSend.timestamp)} ago for site ${lastNetworkSend.siteId}` : 'none recorded'
      }`
    );
    return {
      success: false,
      message: `GridPane rate limit reached. Please wait ${cachedWaitSeconds} seconds before trying again.`,
      error: 'RATE_LIMITED',
      waitSeconds: cachedWaitSeconds
    };
  }

  try {
    const networkSendTimestamp = Date.now();
    logAudit(
      `Sending PUT request for site ${siteId} (PHP ${phpVersion}) at ${new Date(networkSendTimestamp).toISOString()} (${lastNetworkSend ? `previous send ${formatDelta(networkSendTimestamp, lastNetworkSend.timestamp)} ago for site ${lastNetworkSend.siteId}` : 'no previous send recorded'})`
    );
    lastNetworkSend = { timestamp: networkSendTimestamp, siteId, phpVersion };

    const startTime = performance.now();

    const response = await withRetry(
      async () =>
        fetchWithTimeout(`${url}/${endpointPath}`, {
          method: 'PUT',
          headers: {
            ...createGridPaneHeaders(token),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ php_version: phpVersion })
        }),
      RATE_LIMIT_ENDPOINT
    );

    const data = await handleGridPaneResponse<UpdatePhpVersionApiResponse>(
      response,
      RATE_LIMIT_ENDPOINT
    );

    const updatedSite = data.site;
    if (!updatedSite) {
      throw new GridPaneApiError(
        'Invalid response structure: missing site data.',
        response.status,
        RATE_LIMIT_ENDPOINT
      );
    }

    const duration = Math.round(performance.now() - startTime);
    logAudit(`Request completed with HTTP ${response.status} in ${duration}ms for site ${siteId}.`);
    logApiCall(`${endpointPath} (PHP ${phpVersion})`, undefined, duration);

    revalidateTag(`gridpane-single-site-${siteId}`);
    revalidateTag('gridpane-sites');

    return {
      success: true,
      message: `Successfully updated site ${siteId} to PHP ${phpVersion}`,
      data: updatedSite
    };
  } catch (error) {
    if (error instanceof GridPaneApiError) {
      if (error.status === 429) {
        const waitSeconds =
          error.retryAfterSeconds ??
          (rateLimiter.checkEndpoint(RATE_LIMIT_ENDPOINT) ?? undefined);

        logAudit(
          `Received 429 for site ${siteId}. retry-after ${waitSeconds ?? 'unknown'}s. Last send was ${
            lastNetworkSend ? `${formatDelta(Date.now(), lastNetworkSend.timestamp)} ago for site ${lastNetworkSend.siteId}` : 'not recorded'
          }.`
        );

        return {
          success: false,
          message:
            waitSeconds && waitSeconds > 0
              ? `GridPane rate limit reached. Please wait ${waitSeconds} seconds before trying again.`
              : error.message,
          error: 'RATE_LIMITED',
          waitSeconds: waitSeconds && waitSeconds > 0 ? waitSeconds : undefined
        };
      }

      return {
        success: false,
        message: error.message,
        error: 'API_ERROR'
      };
    }

    logAudit(`Unexpected error thrown for site ${siteId}: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      message: 'Unexpected error updating PHP version.',
      error: 'API_ERROR'
    };
  }
}
