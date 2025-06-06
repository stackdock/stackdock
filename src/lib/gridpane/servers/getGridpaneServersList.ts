"use server";

import { ServersResponse } from './types';

// Read from .env.local 
const url = process.env.GRIDPANE_API_URL;
const token = process.env.GRIDPANE_BEARER_TOKEN;

// Async call for Gridpane API to list all servers 
export async function getGridPaneServersList(page: number = 1): Promise<ServersResponse> {
    // Throw error if env variables are not set in .env.local
    if (!url || !token) {
        throw new Error('Missing GridPane API configuration');
    }

    // Construct the URL with the page parameter
    const requestUrl = `${url}/server?page=${page}`;

    try {
        // TEMPORARY FOR TESTING
        console.log(`[${new Date().toLocaleTimeString()}] Fetching GridPane server list...`);

        const response = await fetch(requestUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json'
            },
            // next: {
            //     revalidate: 60, // Revalidate cache every 1 minute(s) (60 seconds)
            //     tags: [GRIDPANE_SERVERS_TAG, `${GRIDPANE_SERVERS_TAG}-page-${page}`] // Tag declaration
            //     // tags: [`${GRIDPANE_SERVERS_TAG}-page-${page}`] // In case tags for cache need more granular control per page
            // }
        });
        // Throw error when response sends a failure
        if (!response.ok) {
            throw new Error(`List servers page (${page}) API response failed | API Response: ${response.status}`);
        }
        // Set and return data from successful response
        const data: ServersResponse = await response.json();
        return data;
    // Throw error if call completely fails 
    } catch (error) {
        console.error(`Error fetching data for page ${page}:`, error);
        throw error;
    }
}
