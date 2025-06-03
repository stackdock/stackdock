"use server";

import { SitesResponse, GRIDPANE_SITES_TAG } from './types';

// Read from .env.local
const url = process.env.GRIDPANE_API_URL;
const token = process.env.GRIDPANE_BEARER_TOKEN;

// Async call for Gridpane API to list all sites
export async function getGridPaneSitesList(page: number = 1): Promise<SitesResponse> {
    if (!url || !token) {
        throw new Error('Missing GridPane API configuration');
    }

    // Format the URL for query string pagination
    const requestUrl = `${url}/site?page=${page}`;

    // Log 1: Confirm the URL being requested
    // console.log(`[GET_SITES_LIST] Attempting to fetch. Page: ${page}, URL: ${requestUrl}`);

    try {
        const response = await fetch(requestUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            next: { // Add this back
                revalidate: 60, // 60 Seconds till revalidation
                tags: [GRIDPANE_SITES_TAG, `${GRIDPANE_SITES_TAG}-page-${page}`]
            }
        });

        // Log 2: Confirm the status from the API
        // console.log(`[GET_SITES_LIST] API Response received for Page ${page}. Status: ${response.status}, StatusText: ${response.statusText}`);

        // Log 3: See the RAW text response from the API
        // Clone the response to log its text content without consuming the body for .json()
        // const responseText = await response.clone().text();
        // console.log(`[GET_SITES_LIST] RAW API Response Text for Page ${page} (first 500 chars):`, responseText.substring(0, 500));

        if (!response.ok) {
            // console.error(`[GET_SITES_LIST] API Error for Page ${page}. Status: ${response.status}. Raw Body: ${responseText.substring(0, 200)}...`);
            throw new Error(`List sites page (${page}) API response failed | API Response: ${response.status}`);
        }

        const data: SitesResponse = await response.json();

        // Log 4: Confirm the meta data AFTER parsing JSON
        // console.log(`[GET_SITES_LIST] Parsed JSON Meta for Page ${page}:`, JSON.stringify(data.meta, null, 2));
        // console.log(`[GET_SITES_LIST] Parsed JSON Data Length for Page ${page}:`, data.data?.length);
        // if (data.data && data.data.length > 0) {
        //    console.log(`[GET_SITES_LIST] Parsed JSON First Item ID for Page ${page}:`, data.data[0]?.id);
        // }

        return data;

    } catch (error) {
        if (!(error instanceof Error && error.message.includes("API response failed"))) {
            console.error(`[GET_SITES_LIST] General Error for Page ${page}:`, error);
        }
        throw error;
    }
}
