import { UserButton as ClerkUserButton } from '@clerk/clerk-react'

export function UserButton() {
  return (
    <div className="flex items-center">
      <ClerkUserButton 
        appearance={{
          elements: {
            avatarBox: "w-10 h-10",
          },
        }}
      />
    </div>
  )
}

