"use server";

import { SitesResponse } from './types';

// Read from .env.local 
const url = process.env.GRIDPANE_API_URL;
const token = process.env.GRIDPANE_BEARER_TOKEN;

// Async call for Gridpane API to list all sites 
export async function getGridPaneSitesList(page: number = 1): Promise<SitesResponse> {
    // Throw error if env variables are not set in .env.local
    if (!url || !token) {
        throw new Error('Missing GridPane API configuration');
    }

    // Construct the URL with the page parameter
    const requestUrl = `${url}/site?page=${page}`;

    try {
        // TEMPORARY FOR TESTING
        //console.log(`[${new Date().toLocaleTimeString()}] Fetching GridPane site list...`);
        console.log(`[${new Date().toLocaleTimeString()}] Fetching GridPane site list for page ${page}... URL: ${requestUrl}`);


        const response = await fetch(requestUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json'
            },
            // next: {
            //     revalidate: 60, // Revalidate cache every 1 minute(s) (60 seconds)
            //     tags: [GRIDPANE_SITES_TAG, `${GRIDPANE_SITES_TAG}-page-${page}`] // Tag declaration
            //     // tags: [`${GRIDPANE_SITES_TAG}-page-${page}`] // In case tags for cache need more granular control per page
            // }
        });
        // Throw error when response sends a failure
        if (!response.ok) {
            throw new Error(`List sites page (${page}) API response failed | API Response: ${response.status}`);
        }
        // Set and return data from successful response
        const data: SitesResponse = await response.json();
        return data;
    // Throw error if call completely fails 
    } catch (error) {
        console.error(`Error fetching data for page ${page}:`, error);
        throw error;
    }
}
