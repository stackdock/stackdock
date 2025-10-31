import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/settings/theme")({
  component: ThemePage,
})

function ThemePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Theme</h2>
        <p className="text-muted-foreground text-sm">
          Customize your theme preferences
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-600">Theme settings coming soon...</p>
      </div>
    </div>
  )
}
