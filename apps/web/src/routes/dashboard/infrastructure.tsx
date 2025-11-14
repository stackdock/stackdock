import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/infrastructure")({
  component: InfrastructureLayout,
})

function InfrastructureLayout() {
  return <Outlet />
}
