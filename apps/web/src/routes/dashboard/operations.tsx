import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/operations")({
  component: OperationsLayout,
})

function OperationsLayout() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-0.5">
        <h1 className="text-lg font-bold tracking-tight md:text-xl">
          Operations
        </h1>
        <p className="text-muted-foreground">
          Functional, cross-fleet actions.
        </p>
      </div>
      <Outlet />
    </div>
  )
}
