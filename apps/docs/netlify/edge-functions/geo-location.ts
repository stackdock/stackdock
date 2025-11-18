/**
 * Edge Function - Geo Location
 * 
 * This edge function provides geographic information about the request.
 * Endpoint: /api/geo
 * 
 * @see https://docs.netlify.com/edge-functions/overview/
 */

import type { Context } from '@netlify/edge-functions';

export default async (request: Request, context: Context) => {
  const geoData = {
    city: context.geo?.city,
    country: context.geo?.country?.name,
    countryCode: context.geo?.country?.code,
    subdivision: context.geo?.subdivision?.name,
    timezone: context.geo?.timezone,
    latitude: context.geo?.latitude,
    longitude: context.geo?.longitude,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(geoData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
};

export const config = {
  path: '/api/geo',
};
