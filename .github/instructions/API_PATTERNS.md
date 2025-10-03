# API Provider Integration Patterns

## Purpose
This document defines the standard patterns for integrating new API providers (Kinsta, Rocket.net, etc.) into Stackdock.

Use GridPane implementation as the reference.

---

## Directory Structure

```
src/lib/[provider-name]/
├── types.ts                    # All TypeScript types
├── config.ts                   # Configuration & validation
├── utils.ts                    # Shared utilities (fetch, errors)
├── rate-limiter.ts             # Rate limiting (if needed)
└── [resource]/                 # Resource-specific operations
    ├── types.ts                # Resource-specific types (if large)
    ├── get[Resource].ts        # GET operations
    ├── get[Resource]List.ts    # LIST operations
    ├── create[Resource].ts     # POST operations
    ├── update[Resource].ts     # PUT/PATCH operations
    └── delete[Resource].ts     # DELETE operations
```

**Example:**
```
src/lib/gridpane/
├── types.ts
├── config.ts
├── utils.ts
├── rate-limiter.ts
└── sites/
    ├── types.ts
    ├── getGridpaneSite.ts
    ├── getGridpaneSitesList.ts
    └── updateSitePhpVersion.ts
```

---

## 1. Configuration (`config.ts`)

Every provider needs configuration with validation:

```typescript
// filepath: src/lib/[provider]/config.ts

interface ProviderConfig {
  url: string;
  token: string;
  // ... other config
}

export function getProviderConfig(): ProviderConfig {
  const url = process.env.PROVIDER_API_URL;
  const token = process.env.PROVIDER_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Missing required environment variables: PROVIDER_API_URL, PROVIDER_API_TOKEN'
    );
  }

  return { url, token };
}

// Export any provider-specific constants
export const PROVIDER_CONFIG = {
  REQUEST_TIMEOUT: 30000,
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000,
} as const;
```

**.env.local:**
```bash
PROVIDER_API_URL=https://api.provider.com/v1
PROVIDER_API_TOKEN=your_token_here
```

---

## 2. Types (`types.ts`)

Consolidate all types in one place:

```typescript
// filepath: src/lib/[provider]/types.ts

// API Response Types
export interface Resource {
  id: number;
  name: string;
  // ... fields
}

export interface ResourceListResponse {
  data: Resource[];
  meta: {
    page: number;
    total: number;
  };
}

// Operation Result Types
export interface CreateResourceResult {
  success: boolean;
  data?: Resource;
  error?: string;
}

// Enums/Unions
export type ResourceStatus = 'active' | 'inactive' | 'pending';

export const RESOURCE_STATUSES: ResourceStatus[] = [
  'active',
  'inactive',
  'pending'
];
```

---

## 3. Error Handling (`utils.ts`)

Custom error class + response handler:

```typescript
// filepath: src/lib/[provider]/utils.ts

export class ProviderApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ProviderApiError';
  }
}

export async function handleProviderResponse(
  response: Response,
  endpoint: string
): Promise<any> {
  // Read response once
  const text = await response.text();

  // Handle errors
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = JSON.parse(text);
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Use default message if parsing fails
    }

    throw new ProviderApiError(errorMessage, response.status, endpoint);
  }

  // Parse successful response
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ProviderApiError(
      'Invalid JSON response',
      response.status,
      endpoint,
      error
    );
  }
}

export function createProviderHeaders(token: string): HeadersInit {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}
```

---

## 4. Retry Logic (`utils.ts`)

Standard retry wrapper with exponential backoff:

```typescript
export async function withRetry<T>(
  operation: () => Promise<T>,
  endpoint: string,
  maxRetries: number = PROVIDER_CONFIG.MAX_RETRIES
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (error instanceof ProviderApiError) {
        // Don't retry client errors (4xx) except 429
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }
      }

      if (attempt < maxRetries) {
        const delay = PROVIDER_CONFIG.RETRY_DELAY * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new ProviderApiError(
    `Failed after ${maxRetries + 1} attempts`,
    0,
    endpoint,
    lastError
  );
}
```

---

## 5. Rate Limiting (if needed)

Only add if provider has rate limits. Follow GridPane's pattern:

```typescript
// filepath: src/lib/[provider]/rate-limiter.ts

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

class ProviderRateLimiter {
  private limits = new Map<string, RateLimitInfo>();

  checkLimit(endpoint: string): { allowed: boolean; waitTime?: number } {
    // Implementation
  }

  updateFromHeaders(endpoint: string, headers: Headers): void {
    // Implementation
  }
}

export const rateLimiter = new ProviderRateLimiter();
```

---

## 6. Resource Operations

### GET Single Resource

```typescript
// filepath: src/lib/[provider]/resources/getResource.ts
"use server";

import { getProviderConfig } from '../config';
import { handleProviderResponse, withRetry, createProviderHeaders } from '../utils';
import type { Resource } from '../types';

export async function getResource(id: number): Promise<Resource> {
  const { url, token } = getProviderConfig();
  const endpoint = `resource/${id}`;

  return withRetry(async () => {
    const response = await fetch(`${url}/${endpoint}`, {
      method: 'GET',
      headers: createProviderHeaders(token),
      next: { revalidate: 60 }
    });

    return handleProviderResponse(response, endpoint);
  }, endpoint);
}
```

### GET Resource List

```typescript
// filepath: src/lib/[provider]/resources/getResourceList.ts
"use server";

import { revalidateTag } from 'next/cache';

export async function getResourceList(
  page: number = 1
): Promise<ResourceListResponse> {
  const { url, token } = getProviderConfig();
  const endpoint = `resources?page=${page}`;

  return withRetry(async () => {
    const response = await fetch(`${url}/${endpoint}`, {
      method: 'GET',
      headers: createProviderHeaders(token),
      next: {
        revalidate: 60,
        tags: [`provider-resources`, `provider-resources-page-${page}`]
      }
    });

    return handleProviderResponse(response, endpoint);
  }, endpoint);
}
```

### CREATE Resource (POST)

```typescript
// filepath: src/lib/[provider]/resources/createResource.ts
"use server";

import { revalidateTag } from 'next/cache';

export async function createResource(
  data: CreateResourceInput
): Promise<CreateResourceResult> {
  const { url, token } = getProviderConfig();
  const endpoint = 'resources';

  try {
    const response = await withRetry(async () => {
      return await fetch(`${url}/${endpoint}`, {
        method: 'POST',
        headers: createProviderHeaders(token),
        body: JSON.stringify(data)
      });
    }, endpoint);

    const result = await handleProviderResponse(response, endpoint);

    // Revalidate cache
    revalidateTag('provider-resources');

    return {
      success: true,
      data: result.resource
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof ProviderApiError
        ? error.message
        : 'Failed to create resource'
    };
  }
}
```

### UPDATE Resource (PUT)

```typescript
// filepath: src/lib/[provider]/resources/updateResource.ts
"use server";

import { revalidateTag } from 'next/cache';

export async function updateResource(
  id: number,
  data: UpdateResourceInput
): Promise<UpdateResourceResult> {
  const { url, token } = getProviderConfig();
  const endpoint = `PUT:/resources/{id}`; // Normalized for rate limiting

  try {
    const response = await withRetry(async () => {
      return await fetch(`${url}/resources/${id}`, {
        method: 'PUT',
        headers: createProviderHeaders(token),
        body: JSON.stringify(data)
      });
    }, endpoint);

    const result = await handleProviderResponse(response, endpoint);

    // Revalidate specific resource
    revalidateTag(`provider-resource-${id}`);

    return {
      success: true,
      data: result.resource
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof ProviderApiError
        ? error.message
        : 'Failed to update resource'
    };
  }
}
```

### DELETE Resource

```typescript
// filepath: src/lib/[provider]/resources/deleteResource.ts
"use server";

import { revalidateTag } from 'next/cache';

export async function deleteResource(
  id: number
): Promise<DeleteResourceResult> {
  const { url, token } = getProviderConfig();
  const endpoint = `resources/${id}`;

  try {
    await withRetry(async () => {
      const response = await fetch(`${url}/${endpoint}`, {
        method: 'DELETE',
        headers: createProviderHeaders(token)
      });

      return handleProviderResponse(response, endpoint);
    }, endpoint);

    // Revalidate
    revalidateTag('provider-resources');
    revalidateTag(`provider-resource-${id}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof ProviderApiError
        ? error.message
        : 'Failed to delete resource'
    };
  }
}
```

---

## 7. Component Integration

```typescript
// filepath: src/components/[feature]/resource-selector.tsx
"use client";

import { useState, useTransition } from 'react';
import { updateResource } from '@/lib/provider/resources/updateResource';

export default function ResourceSelector({ resourceId }: { resourceId: number }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const handleSubmit = async (data: any) => {
    startTransition(async () => {
      const result = await updateResource(resourceId, data);

      if (result.success) {
        setMessage({ type: 'success', text: 'Updated successfully' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Update failed' });
      }
    });
  };

  return (
    // UI implementation
    <div>
      {/* Component UI */}
    </div>
  );
}
```

---

## Checklist: Adding New Provider

- [ ] Create directory: `src/lib/[provider]/`
- [ ] Add environment variables to `.env.local`
- [ ] Create `config.ts` with validation
- [ ] Create `types.ts` with all interfaces
- [ ] Create `utils.ts` with error handling
- [ ] Add rate limiter (if needed)
- [ ] Implement GET operations
- [ ] Implement POST operations
- [ ] Implement PUT operations
- [ ] Implement DELETE operations
- [ ] Add Next.js cache tags
- [ ] Create React components
- [ ] Test all operations
- [ ] Document any provider-specific quirks

---

## Notes

- Always use `"use server"` for API operations
- Always include proper error handling
- Always revalidate cache tags after mutations
- Follow GridPane implementation as reference
- Keep consistent naming across providers
