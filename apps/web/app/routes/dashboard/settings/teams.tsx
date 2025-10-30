import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/settings/teams')({
  component: TeamsSettings,
})

function TeamsSettings() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Teams</h1>
        <p className="text-slate-600 mt-2">Create and manage teams</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">🚧 Under Construction</h3>
        <p className="text-blue-700">
          Team management interface coming soon.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Planned Features</h2>
        <ul className="space-y-2 text-slate-600">
          <li>✅ Create teams</li>
          <li>✅ Assign users to teams</li>
          <li>✅ Set team roles</li>
          <li>✅ Grant dock access to teams</li>
          <li>✅ Team-scoped resources</li>
        </ul>
      </div>
    </div>
  )
}
