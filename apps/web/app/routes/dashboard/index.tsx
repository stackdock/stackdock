import { createFileRoute } from '@tanstack/react-router'
import { useOrganization, useUser } from '@clerk/tanstack-start'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardHome,
})

function DashboardHome() {
  const { user } = useUser()
  const { organization } = useOrganization()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {user?.firstName || 'Captain'}!
        </h1>
        <p className="text-slate-600 mt-2">
          {organization?.name || 'Personal Workspace'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Docks Connected"
          value="0"
          subtitle="Connect your first provider"
          icon="🔌"
          color="blue"
        />
        <StatCard
          title="Resources Synced"
          value="0"
          subtitle="Servers, sites, domains"
          icon="🖥️"
          color="green"
        />
        <StatCard
          title="Active Projects"
          value="0"
          subtitle="Create your first project"
          icon="📁"
          color="purple"
        />
      </div>

      <div className="mt-12 bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Getting Started</h2>
        <div className="space-y-4">
          <SetupStep
            number={1}
            title="Create an organization"
            description="Set up your organization to manage infrastructure"
            status="pending"
          />
          <SetupStep
            number={2}
            title="Connect a dock"
            description="Connect GridPane, Vercel, or DigitalOcean"
            status="pending"
          />
          <SetupStep
            number={3}
            title="Sync resources"
            description="Your infrastructure will appear automatically"
            status="pending"
          />
          <SetupStep
            number={4}
            title="Create a project"
            description="Link resources across providers"
            status="pending"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string
  value: string
  subtitle: string
  icon: string
  color: string
}) {
  const bgColor = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
  }[color]

  const textColor = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
  }[color]

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center text-2xl mb-4`}>
        {icon}
      </div>
      <h3 className="text-sm font-medium text-slate-600">{title}</h3>
      <p className={`text-3xl font-bold ${textColor} mt-2`}>{value}</p>
      <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
    </div>
  )
}

function SetupStep({
  number,
  title,
  description,
  status,
}: {
  number: number
  title: string
  description: string
  status: 'completed' | 'pending'
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          status === 'completed'
            ? 'bg-green-100 text-green-600'
            : 'bg-slate-100 text-slate-600'
        }`}
      >
        {status === 'completed' ? '✓' : number}
      </div>
      <div>
        <h3 className="font-medium text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  )
}
