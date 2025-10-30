import { createFileRoute, Link } from '@tanstack/react-router'
import { useOrganization } from '@clerk/tanstack-start'

export const Route = createFileRoute('/dashboard/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { organization } = useOrganization()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2">
          {organization?.name || 'Personal Workspace'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingCard
          title="Organization"
          description="Manage organization details and members"
          icon="🏢"
          link="/dashboard/settings/organization"
        />
        <SettingCard
          title="Teams"
          description="Create and manage teams"
          icon="👥"
          link="/dashboard/settings/teams"
        />
        <SettingCard
          title="Clients"
          description="Manage client access"
          icon="🤝"
          link="/dashboard/settings/clients"
        />
        <SettingCard
          title="Roles & Permissions"
          description="Configure access control (RBAC)"
          icon="🔐"
          link="/dashboard/settings/roles"
        />
      </div>
    </div>
  )
}

function SettingCard({
  title,
  description,
  icon,
  link,
}: {
  title: string
  description: string
  icon: string
  link: string
}) {
  return (
    <Link
      to={link}
      className="bg-white rounded-lg border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </Link>
  )
}
