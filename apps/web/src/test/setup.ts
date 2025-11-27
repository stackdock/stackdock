/**
 * Vitest Test Setup
 * 
 * Global setup for all test files
 */

import '@testing-library/react'

// Mock environment variables
process.env.VITE_CONVEX_URL = process.env.VITE_CONVEX_URL || 'https://test.convex.cloud'
process.env.VITE_CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_mock'
