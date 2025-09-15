import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { DashboardBreadcrumbs } from "@/components/sidebar/dashboard-breadcrumbs"
import { ThemeProvider } from "@/components/settings/theme-provider"
import { CommandPaletteTrigger } from "@/components/command/command-palette-button"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Bell, HelpCircle } from "lucide-react"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getTheme } from "@/lib/theme"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = await getTheme()
  
  return (
    <ThemeProvider defaultTheme={theme}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-[orientation=vertical]:h-4"
                />
                <DashboardBreadcrumbs />
              </div>
              
              <div className="ml-auto flex items-center gap-2 px-4">
                <CommandPaletteTrigger />
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
    </ThemeProvider>
  )
}
