import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/infrastructure")({
  component: InfrastructureLayout,
})

function InfrastructureLayout() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">
          Infrastructure
        </h1>
        <p className="text-muted-foreground">
          Resource-centric view. Show me all my engines.
        </p>
      </div>
      <Outlet />
    </div>
  )
}
