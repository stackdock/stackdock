import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ConvexProvider, ConvexReactClient } from 'convex/react'

import Header from '../components/Header'

import appCss from '../styles.css?url'

// Convex client - only initialize if URL is provided
const convexUrl = import.meta.env.VITE_CONVEX_URL
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'StackDock',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const content = (
    <>
      <Header />
      {children}
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
      <Scripts />
    </>
  )

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {convex ? (
          <ConvexProvider client={convex}>{content}</ConvexProvider>
        ) : (
          content
        )}
      </body>
    </html>
  )
}
