import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/settings/docks")({
  beforeLoad: () => {
    throw redirect({
      to: "/dashboard/docks/connected",
    })
  },
})
