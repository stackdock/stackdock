// Filepath: c:\Users\veter\Desktop\DEV\github\next\stackdock\src\lib\gridpane\servers\createGridpaneServer.ts (Example)
// "use server";

// import { revalidateTag } from 'next/cache';
// import { GRIDPANE_SERVERS_TAG } from './getGridpaneServersList'; // Import the tag

// Assume other necessary imports, types, and environment variables (url, token)

// interface NewServerData { /* ... properties for a new server ... */ }
// interface CreatedServerResponse { /* ... type for the API response after creation ... */ }

// const API_URL = process.env.GRIDPANE_API_URL;
// const API_TOKEN = process.env.GRIDPANE_BEARER_TOKEN;

// export async function createGridpaneServer(serverData: NewServerData): Promise<CreatedServerResponse> {
//     if (!API_URL || !API_TOKEN) {
//         throw new Error('Missing GridPane API configuration for create server');
//     }

//     try {
//         const response = await fetch(`${API_URL}/server`, { // Assuming POST to the same base URL
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${API_TOKEN}`,
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(serverData)
//         });

//         if (!response.ok) {
//             Handle API error appropriately
//             const errorData = await response.json().catch(() => ({ message: "Failed to parse error response" }));
//             throw new Error(`Create server API failed: ${response.status} - ${JSON.stringify(errorData)}`);
//         }

//         const newServer = await response.json();

//         *** CRITICAL STEP: Invalidate the cache for the server list ***
//         revalidateTag(GRIDPANE_SERVERS_TAG);

//         return newServer;
//     } catch (error) {
//         console.error('Error in createGridpaneServer:', error);
//         throw error; // Re-throw to be handled by the caller
//     }
// }
