"use server";

import { GridPaneApiError, GRIDPANE_CONFIG } from './helpers';

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
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        if (errorData.errors) {
          const errorDetails = Object.entries(errorData.errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
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
