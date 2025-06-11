import { GridPaneErrorResponse } from '../gridpane/servers/types';

// GridPane configuration constants
export const GRIDPANE_CONFIG = {
  REQUEST_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000, // 1 second delay
  MIN_PAGE: 1,
  MAX_PAGE: 1000, // upper limit
  USER_AGENT: 'StackDock/1.0',
} as const;

// Input validation for page parameters
export function validatePageParameter(page: number): number {
  if (!Number.isInteger(page) || page < GRIDPANE_CONFIG.MIN_PAGE || page > GRIDPANE_CONFIG.MAX_PAGE) {
    console.warn(`[GridPane] Invalid page parameter: ${page}. Using page 1.`);
    return 1;
  }
  return page;
}

// Enhanced error class for GridPane API errors
export class GridPaneApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
    public page?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'GridPaneApiError';
  }
}

// Create fetch with timeout to prevent hanging requests
export function createFetchWithTimeout(timeoutMs: number = GRIDPANE_CONFIG.REQUEST_TIMEOUT) {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  };
}

// Retry logic with exponential backoff for transient failures
export async function withRetry<T>(
  operation: () => Promise<T>,
  endpoint: string,
  page?: number,
  maxRetries: number = GRIDPANE_CONFIG.MAX_RETRIES
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (error instanceof GridPaneApiError) {
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }
      }

      if (attempt < maxRetries) {
        const delay = GRIDPANE_CONFIG.RETRY_DELAY * Math.pow(2, attempt);
        console.warn(`[GridPane] Retry ${attempt + 1}/${maxRetries} for ${endpoint}${page ? ` (page ${page})` : ''} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new GridPaneApiError(
    `Failed after ${maxRetries + 1} attempts`,
    0,
    endpoint,
    page,
    lastError
  );
}

// Enhanced response handler with structured error extraction
export async function handleGridPaneResponse<T>(
  response: Response,
  endpoint: string,
  page?: number
): Promise<T> {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    // Try to extract structured error from response
    if (contentType?.includes('application/json')) {
      try {
        const errorData: GridPaneErrorResponse = await response.json();
        errorMessage = errorData.message || errorMessage;
        if (errorData.errors) {
          const errorDetails = Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('; ');
          errorMessage += ` - ${errorDetails}`;
        }
      } catch {
        // If JSON parsing fails, try to get response text
        try {
          const text = await response.text();
          if (text) errorMessage += ` - ${text.substring(0, 200)}`;
        } catch {
          // If even text extraction fails, use the original message
        }
      }
    }

    throw new GridPaneApiError(errorMessage, response.status, endpoint, page);
  }

  // Validate JSON response
  if (!contentType?.includes('application/json')) {
    throw new GridPaneApiError(
      `Expected JSON response but received ${contentType}`,
      response.status,
      endpoint,
      page
    );
  }

  try {
    const data: T = await response.json();
    return data;
  } catch (error) {
    throw new GridPaneApiError(
      `Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      response.status,
      endpoint,
      page,
      error
    );
  }
}

// Get and validate GridPane configuration from environment variables
export function getGridPaneConfig(): { url: string; token: string } {
  const url = process.env.GRIDPANE_API_URL;
  const token = process.env.GRIDPANE_BEARER_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Missing GridPane API configuration. Please set GRIDPANE_API_URL and GRIDPANE_BEARER_TOKEN environment variables.'
    );
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid GRIDPANE_API_URL format');
  }

  return { url, token };
}

// Structured Manual Console logging for API calls with performance monitoring
export function logApiCall(endpoint: string, page?: number, duration?: number) {
  const timestamp = new Date().toISOString();
  const pageInfo = page ? ` (page ${page})` : '';
  const durationInfo = duration ? ` - ${duration}ms` : '';
  console.log(`[${timestamp}] [GridPane API] ${endpoint}${pageInfo}${durationInfo}`);
}

// Create standard headers for GridPane API requests
export function createGridPaneHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': GRIDPANE_CONFIG.USER_AGENT,
  };
}
