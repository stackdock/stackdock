import { createFileRoute, Outlet } from "@tanstack/react-router"
import { AuthLayout } from "@/components/auth/AuthLayout"

export const Route = createFileRoute("/auth")({
  component: AuthLayoutWrapper,
})

function AuthLayoutWrapper() {
  return (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  )
}
