import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/operations")({
  component: OperationsLayout,
})

function OperationsLayout() {
  return <Outlet />
}
