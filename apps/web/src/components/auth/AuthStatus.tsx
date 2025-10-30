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
          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          <span className="text-gray-400 text-sm">Not signed in</span>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-yellow-400 text-sm">Authenticating...</span>
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
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        <span className="text-yellow-400 text-sm">Loading...</span>
      </div>
    )
  }
  
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-green-400 text-sm">
        Authenticated • User ID: {userId?.substring(0, 8)}...
      </span>
    </div>
  )
}

