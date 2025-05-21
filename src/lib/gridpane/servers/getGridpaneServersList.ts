"use server";

import { ServerResponse } from './types';

const url = process.env.GRIDPANE_API_URL;
const token = process.env.GRIDPANE_BEARER_TOKEN;

export async function getAllServers(): Promise<ServerResponse> {
    if (!url || !token) {
        throw new Error('Missing GridPane API configuration');
    }

    try {
        const response = await fetch(`${url}/server`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`List servers API response failed | API Response: ${response.status}`);
        }
        
        const data: ServerResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}
