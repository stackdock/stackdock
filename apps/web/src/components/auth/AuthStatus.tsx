import { useAuth } from '@clerk/clerk-react'
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'

/**
 * Shows authentication status and appropriate UI
 */
export function AuthStatus() {
  return (
    <>
      <Authenticated>
        <AuthStatusContent />
      </Authenticated>
      <Unauthenticated>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
          <span className="text-muted-foreground text-sm">Not signed in</span>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
          <span className="text-muted-foreground text-sm">Authenticating...</span>
        </div>
      </AuthLoading>
    </>
  )
}

function AuthStatusContent() {
  const { userId, isLoaded } = useAuth()
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center gap-2">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
        <span className="text-muted-foreground text-sm">Loading...</span>
      </div>
    )
  }
  
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="w-2 h-2 bg-foreground rounded-full animate-pulse"></div>
      <span className="text-foreground text-sm">
        Authenticated • User ID: {userId?.substring(0, 8)}...
      </span>
    </div>
  )
}
