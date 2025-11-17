"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOrganizationList, useOrganization } from "@clerk/clerk-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Building2 } from "lucide-react"

interface Props {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}

export function TeamSwitcher({ teams }: Props) {
  const { isMobile } = useSidebar()
  const { organizationList, setActive } = useOrganizationList()
  const { organization } = useOrganization()
  const [activeTeam, setActiveTeam] = React.useState(teams[0])
  const [open, setOpen] = React.useState(false)

  // Use Clerk organizations if available, otherwise fallback to teams prop
  const displayTeams = organizationList?.length
    ? organizationList.map((org) => ({
        name: org.organization.name,
        logo: Building2,
        plan: org.organization.membersCount
          ? `${org.organization.membersCount} members`
          : "Free",
        id: org.organization.id,
      }))
    : teams

  const handleTeamChange = async (team: typeof displayTeams[0] & { id?: string }) => {
    if (team.id && setActive) {
      await setActive({ organization: team.id })
    }
    setActiveTeam(team as typeof teams[0])
  }

  return (
    <>
      {typeof window !== "undefined" &&
        createPortal(
          <div
            className={cn(
              "fixed inset-0 z-50 bg-black/80 transition-opacity duration-200",
              open ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            onClick={() => setOpen(false)}
          />,
          document.body
        )}
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="ring-sidebar-primary/50 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground focus-visible:ring-1"
            >
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-semibold">
                  {activeTeam.name}
                </span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={12}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {displayTeams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => handleTeamChange(team)}
                className="gap-2 p-2 text-balance"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <team.logo
                    className={cn(
                      "size-4 shrink-0",
                      index === 0 && "invert-0 dark:invert"
                    )}
                  />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add organization</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
    </>
  )
}
