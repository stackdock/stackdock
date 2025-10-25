// Filepath: c:\Users\veter\Desktop\DEV\github\next\stackdock\src\lib\gridpane\servers\deleteGridpaneServer.ts (Example)
// "use server";

// import { revalidateTag } from 'next/cache';
// import { GRIDPANE_SERVERS_TAG } from './getGridpaneServersList';

// ... other imports, types, and config ...

// export async function deleteGridpaneServer(serverId: number): Promise<{ message: string }> {
//     ... (fetch call to DELETE /server/{serverId}) ...

//     After successful deletion:
//     if (response.ok) {
//         revalidateTag(GRIDPANE_SERVERS_TAG);
//         return { message: "Server deleted successfully" };
//     } else {
//         // Handle error
//     }
//     ...
//     Placeholder for actual implementation
//     console.log(`Deleting server ${serverId}`);
//     revalidateTag(GRIDPANE_SERVERS_TAG); // Call this after successful API call
//     return { message: "Server deletion simulated, cache revalidated" };
// }
