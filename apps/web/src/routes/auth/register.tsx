import { createFileRoute } from "@tanstack/react-router"
import { SignUp } from "@clerk/clerk-react"

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
})

function RegisterPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp
        routing="path"
        path="/auth/register"
        signInUrl="/auth/login"
      />
    </div>
  )
}
