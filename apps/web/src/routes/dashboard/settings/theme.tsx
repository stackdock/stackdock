import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/settings/theme")({
  component: ThemePage,
})

function ThemePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Theme</h2>
        <p className="text-muted-foreground text-xs">
          Customize your theme preferences
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-muted-foreground">Theme settings coming soon...</p>
      </div>
    </div>
  )
}
