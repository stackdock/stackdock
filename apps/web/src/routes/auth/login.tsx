import { createFileRoute } from "@tanstack/react-router"
import { SignIn } from "@clerk/clerk-react"

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn 
        routing="path"
        path="/auth/login"
        signUpUrl="/auth/register"
      />
    </div>
  )
}
