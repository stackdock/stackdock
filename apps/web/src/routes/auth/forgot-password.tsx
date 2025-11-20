import { createFileRoute } from "@tanstack/react-router"
import { SignIn } from "@clerk/clerk-react"

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn
        routing="path"
        path="/auth/forgot-password"
      />
    </div>
  )
}
