import {
  LayoutDashboard,
  FolderKanban,
  Server,
  Database,
  HardDrive,
  Network,
  Workflow,
  Settings,
  Building2,
  User,
  Palette,
  Plug,
} from "lucide-react"
import { type SidebarData } from "./types"
import { useUser } from "@clerk/clerk-react"
import { useQuery } from "convex/react"
import { api } from "convex/_generated/api"

// Helper hook to get user data from Clerk
function useSidebarUser() {
  const { user } = useUser()
  const convexUser = useQuery(api.users.getCurrent)
  
  return {
    name: convexUser?.name || user?.fullName || user?.firstName || "User",
    email: user?.primaryEmailAddress?.emailAddress || "",
    avatar: user?.imageUrl || "",
  }
}

// Helper hook to get organizations from Clerk
function useSidebarTeams() {
  const { user } = useUser()
  const organizations = useQuery(api.organizations.list)
  
  if (!organizations || organizations.length === 0) {
    return [
      {
        name: "StackDock",
        logo: Building2,
        plan: "Free",
      },
    ]
  }
  
  return organizations.map((org) => ({
    name: org.name,
    logo: Building2,
    plan: "Active",
  }))
}

export function useSidebarData(): SidebarData {
  const user = useSidebarUser()
  const teams = useSidebarTeams()
  
  return {
    user,
    teams,
    navGroups: [
      {
        title: "General",
        items: [
          {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
          },
          {
            title: "Projects",
            url: "/dashboard/projects",
            icon: FolderKanban,
          },
        ],
      },
      {
        title: "Infrastructure",
        items: [
          {
            title: "Infrastructure",
            icon: Server,
            items: [
              {
                title: "Compute",
                url: "/dashboard/infrastructure/compute",
                icon: Server,
              },
              {
                title: "Data",
                url: "/dashboard/infrastructure/data",
                icon: Database,
              },
            ],
          },
        ],
      },
      {
        title: "Operations",
        items: [
          {
            title: "Operations",
            icon: Network,
            items: [
              {
                title: "Backups",
                url: "/dashboard/operations/backups",
                icon: HardDrive,
              },
              {
                title: "Networking",
                url: "/dashboard/operations/networking",
                icon: Network,
              },
              {
                title: "Workflows",
                url: "/dashboard/operations/workflows",
                icon: Workflow,
              },
            ],
          },
        ],
      },
      {
        title: "Settings",
        items: [
          {
            title: "Settings",
            icon: Settings,
            items: [
              {
                title: "Organization",
                url: "/dashboard/settings/organization",
                icon: Building2,
              },
              {
                title: "User",
                url: "/dashboard/settings/user",
                icon: User,
              },
              {
                title: "Theme",
                url: "/dashboard/settings/theme",
                icon: Palette,
              },
              {
                title: "Docks",
                url: "/dashboard/settings/docks",
                icon: Plug,
              },
            ],
          },
        ],
      },
    ],
  }
}

// Static version for components that can't use hooks
export const sidebarData: SidebarData = {
  user: {
    name: "User",
    email: "user@example.com",
    avatar: "",
  },
  teams: [
    {
      name: "StackDock",
      logo: Building2,
      plan: "Free",
    },
  ],
  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Projects",
          url: "/dashboard/projects",
          icon: FolderKanban,
        },
      ],
    },
    {
      title: "Infrastructure",
      items: [
        {
          title: "Infrastructure",
          icon: Server,
          items: [
            {
              title: "Compute",
              url: "/dashboard/infrastructure/compute",
              icon: Server,
            },
            {
              title: "Data",
              url: "/dashboard/infrastructure/data",
              icon: Database,
            },
          ],
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          title: "Operations",
          icon: Network,
          items: [
            {
              title: "Backups",
              url: "/dashboard/operations/backups",
              icon: HardDrive,
            },
            {
              title: "Networking",
              url: "/dashboard/operations/networking",
              icon: Network,
            },
            {
              title: "Workflows",
              url: "/dashboard/operations/workflows",
              icon: Workflow,
            },
          ],
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          title: "Settings",
          icon: Settings,
          items: [
            {
              title: "Organization",
              url: "/dashboard/settings/organization",
              icon: Building2,
            },
            {
              title: "User",
              url: "/dashboard/settings/user",
              icon: User,
            },
            {
              title: "Theme",
              url: "/dashboard/settings/theme",
              icon: Palette,
            },
            {
              title: "Docks",
              url: "/dashboard/settings/docks",
              icon: Plug,
            },
          ],
        },
      ],
    },
  ],
}
