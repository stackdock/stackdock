import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'


import { ConvexClerkProvider } from '../lib/convex-clerk'
import { ThemeProvider } from '../components/dashboard/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { MonitoringErrorBoundary } from '@stackdock/monitoring'
import { initWebMonitoring } from '../lib/monitoring'

import appCss from '../styles.css?url'

// Initialize monitoring
initWebMonitoring()

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const isDark = theme === 'dark' || 
                  (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
                  (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                
                if (isDark) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      {/* suppressHydrationWarning: Grammarly extension adds attributes that cause hydration warnings */}
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="theme"
          disableTransitionOnChange
        >
          <MonitoringErrorBoundary>
            <ConvexClerkProvider>{content}</ConvexClerkProvider>
            <Toaster />
          </MonitoringErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
