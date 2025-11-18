/**
 * Edge Function - Add Custom Header
 * 
 * This edge function runs at the edge and adds a custom header to all responses.
 * Edge functions are deployed globally and run closer to users.
 * 
 * @see https://docs.netlify.com/edge-functions/overview/
 */

import type { Context } from '@netlify/edge-functions';

export default async (request: Request, context: Context) => {
  const response = await context.next();
  
  // Add custom header to response
  response.headers.set('X-Powered-By', 'StackDock-Netlify-Edge');
  response.headers.set('X-Edge-Location', context.geo?.city || 'Unknown');
  
  return response;
};

export const config = {
  path: '/*',
};
