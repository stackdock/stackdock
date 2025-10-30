import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/infrastructure')({
  component: InfrastructurePage,
})

function InfrastructurePage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Infrastructure</h1>
        <p className="text-slate-600 mt-2">View all resources across providers</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-green-900 mb-2">🚧 Under Construction</h3>
        <p className="text-green-700">
          Unified infrastructure view coming soon. See servers, sites, domains from all providers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <ResourceTypeCard title="Servers" count={0} icon="🖥️" color="blue" />
        <ResourceTypeCard title="Web Services" count={0} icon="🌐" color="green" />
        <ResourceTypeCard title="Domains" count={0} icon="🔗" color="purple" />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Planned Features</h2>
        <ul className="space-y-2 text-slate-600">
          <li>✅ View servers (AWS, DigitalOcean, Vultr, etc.)</li>
          <li>✅ View web services (Vercel, GridPane, Railway, etc.)</li>
          <li>✅ View domains (Cloudflare, Route53, etc.)</li>
          <li>✅ Filter by provider</li>
          <li>✅ Real-time status updates</li>
        </ul>
      </div>
    </div>
  )
}

function ResourceTypeCard({
  title,
  count,
  icon,
  color,
}: {
  title: string
  count: number
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
      <p className={`text-3xl font-bold ${textColor} mt-2`}>{count}</p>
    </div>
  )
}
