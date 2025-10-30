import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

export const Route = createFileRoute('/')({ component: App })

function App() {
  // Test Convex connection (only runs if VITE_CONVEX_URL is set)
  const convexUrl = import.meta.env.VITE_CONVEX_URL
  const pingResult = convexUrl ? useQuery(api.test.ping) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-black text-white [letter-spacing:-0.08em] mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              StackDock
            </span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            Infrastructure's WordPress Moment
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Open-source multi-cloud management platform. Manage websites, apps, databases, and servers across multiple providers from a unified interface.
          </p>
          
          {/* Convex Connection Status */}
          <div className="mb-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-sm text-gray-400 mb-2">Convex Status:</p>
            {convexUrl ? (
              pingResult ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm">
                    Connected • {pingResult.message}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-yellow-400 text-sm">Connecting...</span>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-gray-400 text-sm">
                  Not configured • Set VITE_CONVEX_URL in .env.local
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-4">
            <button className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50">
              Get Started
            </button>
            <p className="text-gray-400 text-sm mt-2">
              Welcome to StackDock
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
