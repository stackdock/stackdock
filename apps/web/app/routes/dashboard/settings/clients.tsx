import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/settings/clients')({
  component: ClientsSettings,
})

function ClientsSettings() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
        <p className="text-slate-600 mt-2">Manage client access</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-green-900 mb-2">🚧 Under Construction</h3>
        <p className="text-green-700">
          Client management interface coming soon.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Planned Features</h2>
        <ul className="space-y-2 text-slate-600">
          <li>✅ Create client groups</li>
          <li>✅ Invite client users</li>
          <li>✅ Read-only access by default</li>
          <li>✅ Grant access to specific docks/resources</li>
          <li>✅ Client portal view</li>
        </ul>
      </div>
    </div>
  )
}
