import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/projects')({
  component: ProjectsPage,
})

function ProjectsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
        <p className="text-slate-600 mt-2">Organize and link your infrastructure</p>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">🚧 Under Construction</h3>
        <p className="text-purple-700">
          Project management coming soon. Link resources from multiple providers.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Planned Features</h2>
        <ul className="space-y-2 text-slate-600">
          <li>✅ Create projects for clients/teams</li>
          <li>✅ Link resources across providers (polymorphic)</li>
          <li>✅ Unified project dashboard</li>
          <li>✅ Team & client access control</li>
          <li>✅ GitHub/Linear integration</li>
        </ul>
      </div>
    </div>
  )
}
