import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            StackDock
          </h1>
          <p className="text-2xl mb-4 text-slate-300">
            Infrastructure's WordPress Moment
          </p>
          <p className="text-xl mb-12 text-slate-400">
            Open-source multi-cloud management. Own your infrastructure adapters.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link
              to="/dashboard"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-colors"
            >
              Get Started
            </Link>
            <a
              href="https://github.com/stackdock/stackdock"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-lg transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            title="Docks Registry"
            description="Copy infrastructure adapters into your codebase. GridPane, Vercel, AWS, and more."
            icon="🔌"
          />
          <FeatureCard
            title="UI Registry"
            description="Dashboard components that work with any provider. True composability."
            icon="🎨"
          />
          <FeatureCard
            title="The Platform"
            description="Universal RBAC, encryption, audit logs. Your infrastructure, unified."
            icon="⚓"
          />
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: string
}) {
  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  )
}
