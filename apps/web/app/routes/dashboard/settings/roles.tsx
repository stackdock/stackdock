import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/settings/roles')({
  component: RolesSettings,
})

function RolesSettings() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Roles & Permissions</h1>
        <p className="text-slate-600 mt-2">Configure RBAC (Role-Based Access Control)</p>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">🔐 RBAC System</h3>
        <p className="text-purple-700">
          Role management interface coming soon. Configure granular permissions.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Permission Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PermissionCard
            name="projects"
            description="Create/edit/delete projects"
          />
          <PermissionCard
            name="resources"
            description="Manage servers, sites, domains"
          />
          <PermissionCard
            name="docks"
            description="Connect/disconnect providers"
          />
          <PermissionCard
            name="operations"
            description="Backup/restore operations"
          />
          <PermissionCard
            name="settings"
            description="Organization/team/role management"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Default Roles</h2>
        <ul className="space-y-2 text-slate-600">
          <li><strong>Owner:</strong> Full access to everything</li>
          <li><strong>Admin:</strong> Full access to all operations</li>
          <li><strong>Developer:</strong> Manage projects & resources (read-only docks)</li>
          <li><strong>Support:</strong> Read-only access</li>
          <li><strong>Client:</strong> Read-only access to assigned resources</li>
        </ul>
      </div>
    </div>
  )
}

function PermissionCard({ name, description }: { name: string; description: string }) {
  return (
    <div className="p-4 border border-slate-200 rounded-lg">
      <h3 className="font-semibold text-slate-900 mb-1">{name}</h3>
      <p className="text-sm text-slate-600">{description}</p>
      <div className="mt-2 flex gap-2">
        <span className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">none</span>
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded">read</span>
        <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded">full</span>
      </div>
    </div>
  )
}
