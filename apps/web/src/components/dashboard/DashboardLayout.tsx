import { ReactNode } from "react"
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react"
import { TopNav } from "./TopNav"
import { Sidebar } from "@/components/ui/sidebar"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div className="flex h-screen flex-col bg-white">
          <TopNav />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-gray-50">
              {children}
            </main>
          </div>
        </div>
      </SignedIn>
    </>
  )
}

