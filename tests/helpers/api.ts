/**
 * API Test Helpers
 *
 * Utilities for testing Next.js API routes.
 */

import { NextRequest } from 'next/server';

/**
 * Create a mock NextRequest for API route testing.
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {}, searchParams } = options;

  // Build full URL with search params
  let fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
  if (searchParams) {
    const params = new URLSearchParams(searchParams);
    fullUrl += `?${params.toString()}`;
  }

  // Default headers (CSRF protection for non-GET methods)
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
    defaultHeaders['X-CSRF-Protection'] = '1';
  }

  const allHeaders = { ...defaultHeaders, ...headers };

  const init: RequestInit = {
    method,
    headers: allHeaders,
  };

  if (body && method !== 'GET') {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  return new NextRequest(fullUrl, init);
}

/**
 * Create a mock FormData request (for file uploads).
 */
export function createMockFormDataRequest(
  url: string,
  formData: FormData,
  options: {
    method?: string;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'POST', headers = {} } = options;

  const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;

  return new NextRequest(fullUrl, {
    method,
    headers: {
      'X-CSRF-Protection': '1',
      ...headers,
    },
    body: formData,
  });
}

/**
 * Parse a NextResponse body as JSON.
 */
export async function parseResponseJson<T = unknown>(
  response: Response
): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Assert a response has the expected status code.
 */
export function assertStatus(response: Response, expectedStatus: number): void {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}`
    );
  }
}

/**
 * Create a mock File object for upload testing.
 */
export function createMockFile(
  content: Buffer | string,
  filename: string,
  mimeType: string
): File {
  const data = typeof content === 'string' ? Buffer.from(content) : content;
  return new File([data], filename, { type: mimeType });
}

