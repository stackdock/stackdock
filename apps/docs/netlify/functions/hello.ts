/**
 * Example Netlify Function
 * 
 * This serverless function demonstrates basic Netlify Functions usage.
 * Endpoint: /.netlify/functions/hello
 * 
 * @see https://docs.netlify.com/functions/overview/
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const { name = 'World' } = event.queryStringParameters || {};

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
      path: event.path,
      method: event.httpMethod,
    }),
  };
};
