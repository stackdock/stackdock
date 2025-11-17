/**
 * Component that automatically syncs user to Convex when authenticated
 * Only runs when Convex recognizes the user as authenticated (has auth token)
 */
import { useEffect } from 'react'
import { useMutation, useQuery, Authenticated } from 'convex/react'
import { api } from 'convex/_generated/api'

export function UserSync() {
  const ensureUser = useMutation(api.users.ensureCurrentUser)
  const currentUser = useQuery(api.users.getCurrent)
  
  useEffect(() => {
    // Only sync if user is authenticated but doesn't exist in database yet
    if (currentUser === null) {
      // Small delay to ensure everything is settled
      const timer = setTimeout(() => {
        ensureUser().catch(() => {
          // Silently ignore - user might already exist or auth might not be ready
          // The query will retry automatically
        })
      }, 200)
      
      return () => clearTimeout(timer)
    }
  }, [currentUser, ensureUser])
  
  // This component doesn't render anything
  return null
}

/**
 * Wrapper that only renders UserSync when authenticated
 */
export function AuthenticatedUserSync() {
  return (
    <Authenticated>
      <UserSync />
    </Authenticated>
  )
}
