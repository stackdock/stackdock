"use server";

import { SitesResponse } from './types';
import {
    getGridPaneConfig,
    validatePageParameter,
    createFetchWithTimeout,
    withRetry,
    handleGridPaneResponse,
    logApiCall,
    createGridPaneHeaders,
    GridPaneApiError
} from '../utils';

export async function getGridPaneSitesList(page: number = 1): Promise<SitesResponse> {
    const startTime = performance.now();
    const validPage = validatePageParameter(page);
    const { url, token } = getGridPaneConfig();

    const endpoint = 'sites';
    const requestUrl = `${url}/site?page=${validPage}`;

    try {
        const fetchWithTimeout = createFetchWithTimeout();

        const response = await withRetry(
            async () => {
                return await fetchWithTimeout(requestUrl, {
                    method: 'GET',
                    headers: createGridPaneHeaders(token),
                    next: {
                        revalidate: 60,
                        tags: [`gridpane-sites`, `gridpane-sites-page-${validPage}`]
                    }
                });
            },
            endpoint,
            validPage
        );

    const data = await handleGridPaneResponse<SitesResponse>(response, endpoint, validPage);

        // Validate response structure
        if (!data || !Array.isArray(data.data)) {
        throw new GridPaneApiError(
            'Invalid response structure: missing or invalid data array',
            200,
            endpoint,
            validPage
        );
        }

        if (!data.meta || typeof data.meta.current_page !== 'number') {
        throw new GridPaneApiError(
            'Invalid response structure: missing or invalid meta object',
            200,
            endpoint,
            validPage
        );
        }

        // Log successful call
        const duration = Math.round(performance.now() - startTime);
        logApiCall(`${endpoint} (${data.data.length} sites)`, validPage, duration);

        return data;

    } catch (error) {
        const duration = Math.round(performance.now() - startTime);
        
        if (error instanceof GridPaneApiError) {
            console.error(`[GridPane API Error] ${endpoint} page ${validPage}: ${error.message} (${duration}ms)`);
            throw error;
        }

        // Handle unexpected errors
        const unexpectedError = new GridPaneApiError(
            `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            0,
            endpoint,
            validPage,
            error
        );
        
        console.error(`[GridPane API Error] ${endpoint} page ${validPage}: ${unexpectedError.message} (${duration}ms)`, error);
        throw unexpectedError;
    }
}
