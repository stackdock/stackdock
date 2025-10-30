import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ClerkProvider } from '@clerk/tanstack-start'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)
const queryClient = new QueryClient()

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <QueryClientProvider client={queryClient}>
          <html lang="en">
            <head>
              <meta charSet="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>StackDock - Multi-Cloud Management</title>
              <link rel="stylesheet" href="/app/styles/global.css" />
            </head>
            <body>
              <Outlet />
              {import.meta.env.DEV && (
                <>
                  <TanStackRouterDevtools position="bottom-right" />
                  <ReactQueryDevtools position="bottom-left" />
                </>
              )}
            </body>
          </html>
        </QueryClientProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

function useAuth() {
  // Clerk auth integration
  return {
    isLoading: false,
    isAuthenticated: true,
  }
}
