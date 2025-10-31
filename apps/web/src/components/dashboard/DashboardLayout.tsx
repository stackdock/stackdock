"use client"

import { ReactNode } from "react"
import { SignedIn, SignedOut } from "@clerk/clerk-react"
import { useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Header } from "./Header"

interface DashboardLayoutProps {
  children: ReactNode
}

function RedirectToLogin() {
  const navigate = useNavigate()
  
  useEffect(() => {
    navigate({ to: "/auth/login" })
  }, [navigate])
  
  return null
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      <SignedOut>
        <RedirectToLogin />
      </SignedOut>
      <SignedIn>
        <div className="border-grid flex flex-1 flex-col">
          <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <SidebarInset>
              <Header />
              <div
                id="content"
                className={cn(
                  "flex h-full w-full flex-col",
                  "has-[div[data-layout=fixed]]:h-svh",
                  "group-data-[scroll-locked=1]/body:h-full",
                  "has-[data-layout=fixed]:group-data-[scroll-locked=1]/body:h-svh"
                )}
              >
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </div>
      </SignedIn>
    </>
  )
}
