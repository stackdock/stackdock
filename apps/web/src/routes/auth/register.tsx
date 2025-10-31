import { createFileRoute, Link } from "@tanstack/react-router"
import { SignUp } from "@clerk/clerk-react"
import { Card } from "@/components/ui/card"

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
})

function RegisterPage() {
  return (
    <Card className="p-6">
      <div className="mb-2 flex flex-col space-y-2 text-left">
        <h1 className="text-lg font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and password to create an account. <br />
          Already have an account?{" "}
          <Link
            to="/auth/login"
            className="hover:text-primary underline underline-offset-4"
          >
            Log In
          </Link>
        </p>
      </div>
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none",
          },
        }}
        routing="path"
        path="/auth/register"
        signInUrl="/auth/login"
      />
      <p className="text-muted-foreground mt-4 px-8 text-center text-sm">
        By creating an account, you agree to our{" "}
        <a
          href="/terms"
          className="hover:text-primary underline underline-offset-4"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="/privacy"
          className="hover:text-primary underline underline-offset-4"
        >
          Privacy Policy
        </a>
        .
      </p>
    </Card>
  )
}
