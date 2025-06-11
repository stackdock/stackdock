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

// Create standard headers for GridPane API requests
export function createGridPaneHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': GRIDPANE_CONFIG.USER_AGENT,
  };
}

// Structured logging for API calls with performance monitoring
export function logApiCall(endpoint: string, page?: number, duration?: number) {
  const timestamp = new Date().toISOString();
  const pageInfo = page ? ` (page ${page})` : '';
  const durationInfo = duration ? ` - ${duration}ms` : '';
  console.log(`[${timestamp}] [GridPane API] ${endpoint}${pageInfo}${durationInfo}`);
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
