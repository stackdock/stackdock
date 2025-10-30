/**
 * Convex + Clerk Integration
 * 
 * This module provides a component that integrates Convex with Clerk authentication.
 * Uses Convex's built-in ConvexProviderWithClerk component.
 * 
 * Based on: https://docs.convex.dev/auth/clerk
 */

import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ReactNode, useMemo } from 'react'

const convexUrl = import.meta.env.VITE_CONVEX_URL
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

/**
 * Inner component that uses Convex's built-in Clerk integration
 */
function ConvexWithClerk({ children }: { children: ReactNode }) {
  // Create Convex client
  const convex = useMemo(() => {
    if (!convexUrl) return null
    return new ConvexReactClient(convexUrl)
  }, [convexUrl])
  
  if (!convex) {
    return <>{children}</>
  }
  
  // Use Convex's built-in Clerk provider
  // It automatically handles token fetching and authentication
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}

/**
 * Root provider that wraps Clerk and Convex
 * Only renders providers if both are configured
 */
export function ConvexClerkProvider({ children }: { children: ReactNode }) {
  // If Convex is not configured, skip providers
  if (!convexUrl) {
    return <>{children}</>
  }
  
  // If Clerk is not configured, use Convex without auth
  if (!clerkPublishableKey) {
    const convex = new ConvexReactClient(convexUrl)
    return <ConvexProvider client={convex}>{children}</ConvexProvider>
  }
  
  // If both are configured, wrap with ClerkProvider and connect Convex
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ConvexWithClerk>{children}</ConvexWithClerk>
    </ClerkProvider>
  )
}

