import { SignInButton as ClerkSignInButton } from '@clerk/clerk-react'

export function SignInButton() {
  return (
    <ClerkSignInButton mode="modal">
      <button className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50">
        Get Started
      </button>
    </ClerkSignInButton>
  )
}

