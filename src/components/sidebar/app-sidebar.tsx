"use client"

import * as React from "react"
import {
  AudioWaveform,
  MonitorSmartphoneIcon,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  House,
  Server,
  Globe,
  SaveAll,
  Blocks
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "user",
    email: "contact@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: House,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Sites",
      url: "/dashboard/sites",
      icon: MonitorSmartphoneIcon,
      items: [
        {
          title: "All",
          url: "/dashboard/sites",
        },
        {
          title: "Bundles",
          url: "/dashboard/sites/bundles",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Servers",
      url: "/dashboard/servers",
      icon: Server,
      items: [
        {
          title: "All",
          url: "/dashboard/servers",
        },
        {
          title: "System Users",
          url: "/dashboard/servers/system-users",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Domains",
      url: "/dashboard/domains",
      icon: Globe,
      items: [
        {
          title: "All",
          url: "/dashboard/domains",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
    {
      title: "Backups",
      url: "/dashboard/backups",
      icon: SaveAll,
      items: [
        {
          title: "Schedules",
          url: "/dashboard/backups/schedules",
        },
        {
          title: "Integrations",
          url: "/dashboard/backups/integrations",
        },
        {
          title: "Subitem",
          url: "#",
        },
        {
          title: "Subitem-two",
          url: "#",
        },
      ],
    },
        {
      title: "Providers",
      url: "#",
      icon: Blocks,
      items: [
        {
          title: "Integrations",
          url: "#",
        }
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
