import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from '@clerk/tanstack-start'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div className="flex h-screen bg-slate-50">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-slate-200">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-slate-900">StackDock</h1>
              <p className="text-sm text-slate-500">Multi-Cloud Control</p>
            </div>

            <nav className="px-4 space-y-1">
              <NavLink to="/dashboard" label="Dashboard" icon="📊" />
              <NavLink to="/dashboard/docks" label="Docks" icon="🔌" />
              <NavLink to="/dashboard/projects" label="Projects" icon="📁" />
              <NavLink to="/dashboard/infrastructure" label="Infrastructure" icon="🖥️" />
              <NavLink to="/dashboard/settings" label="Settings" icon="⚙️" />
            </nav>

            <div className="absolute bottom-0 w-64 p-4 border-t border-slate-200">
              <UserButton afterSignOutUrl="/" />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </SignedIn>
    </>
  )
}

function NavLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors [&.active]:bg-blue-50 [&.active]:text-blue-600 [&.active]:font-medium"
      activeProps={{ className: 'active' }}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
