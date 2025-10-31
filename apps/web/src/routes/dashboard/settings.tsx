import { createFileRoute, Outlet } from "@tanstack/react-router"
import { SettingsLayout } from "@/components/dashboard/SettingsLayout"

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsLayoutWrapper,
})

function SettingsLayoutWrapper() {
  return (
    <SettingsLayout>
      <Outlet />
    </SettingsLayout>
  )
}
