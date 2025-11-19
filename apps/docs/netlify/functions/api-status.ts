/**
 * API Status Function
 * 
 * This function provides a health check endpoint for the documentation site.
 * Endpoint: /.netlify/functions/api-status
 * 
 * @see https://docs.netlify.com/functions/overview/
 */

import { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  const status = {
    status: 'operational',
    version: '1.0.0',
    service: 'StackDock Documentation',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.CONTEXT || 'production',
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
    body: JSON.stringify(status, null, 2),
  };
};
