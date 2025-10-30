import { createFileRoute } from '@tanstack/react-router'
import { useOrganization } from '@clerk/tanstack-start'

export const Route = createFileRoute('/dashboard/settings/organization')({
  component: OrganizationSettings,
})

function OrganizationSettings() {
  const { organization } = useOrganization()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Organization Settings</h1>
        <p className="text-slate-600 mt-2">
          {organization?.name || 'Personal Workspace'}
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Organization Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={organization?.name || ''}
                disabled
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Organization ID
              </label>
              <input
                type="text"
                value={organization?.id || ''}
                disabled
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">🚧 Coming Soon</h3>
          <p className="text-yellow-700 text-sm">
            Full organization management (edit name, delete, transfer ownership) will be available soon.
          </p>
        </div>
      </div>
    </div>
  )
}
