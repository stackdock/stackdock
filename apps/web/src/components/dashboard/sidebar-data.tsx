import {
  LayoutDashboard,
  FolderKanban,
  Folder,
  Server,
  Database,
  HardDrive,
  HardDriveDownload,
  Network,
  Workflow,
  Settings,
  Building2,
  User,
  Palette,
  Plug,
  Code,
  CodeXml,
  Cpu,
  Globe,
  House,
  Archive,
  BarChart3,
  Activity,
  Bell,
  AlertCircle,
  Link2,
  Plus,
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
        title: "",
        items: [
          {
            title: "Dashboard",
            icon: House,
            items: [
              {
                title: "Insights",
                url: "/dashboard",
                icon: LayoutDashboard,
              },
            ],
          },
        ],
      },
      {
        title: "",
        items: [
          {
            title: "Projects",
            icon: Folder,
            items: [
              {
                title: "Code",
                url: "/dashboard/projects/code",
                icon: CodeXml,
              },
              // Future placeholders (commented out for now):
              // {
              //   title: "Calendar",
              //   url: "/dashboard/projects/calendar",
              //   icon: Calendar,
              // },
              // {
              //   title: "Content",
              //   url: "/dashboard/projects/content",
              //   icon: FileText,
              // },
              // {
              //   title: "Social",
              //   url: "/dashboard/projects/social",
              //   icon: Users,
              // },
            ],
          },
        ],
      },
      {
        title: "",
        items: [
          {
            title: "Infrastructure",
            icon: Server,
            items: [
              {
                title: "Compute",
                url: "/dashboard/infrastructure/compute",
                icon: Cpu,
              },
              {
                title: "Data",
                url: "/dashboard/infrastructure/data",
                icon: Database,
              },
              {
                title: "Storage",
                url: "/dashboard/infrastructure/storage",
                icon: Archive,
              },
              {
                title: "Networking",
                url: "/dashboard/infrastructure/networking",
                icon: Globe,
              },
            ],
          },
        ],
      },
      {
        title: "",
        items: [
          {
            title: "Operations",
            icon: Network,
            items: [
              {
                title: "Backups",
                url: "/dashboard/operations/backups",
                icon: HardDriveDownload,
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
        title: "",
        items: [
          {
            title: "Monitoring",
            icon: BarChart3,
            items: [
              {
                title: "Activity",
                url: "/dashboard/monitoring/activity",
                icon: Activity,
              },
              {
                title: "Alerts",
                url: "/dashboard/monitoring/alerts",
                icon: Bell,
              },
              {
                title: "Errors",
                url: "/dashboard/monitoring/errors",
                icon: AlertCircle,
              },
            ],
          },
        ],
      },
      {
        title: "",
        items: [
          {
            title: "Docks",
            icon: Plug,
            items: [
              {
                title: "Connected",
                url: "/dashboard/docks/connected",
                icon: Link2,
              },
              {
                title: "Add",
                url: "/dashboard/docks/add",
                icon: Plus,
              },
            ],
          },
        ],
      },
      {
        title: "",
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
      title: "",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          items: [
            {
              title: "Insights",
              url: "/dashboard",
              icon: LayoutDashboard,
            },
          ],
        },
      ],
    },
    {
      title: "",
      items: [
        {
          title: "Projects",
          icon: FolderKanban,
          items: [
            {
              title: "Code",
              url: "/dashboard/projects/code",
              icon: Code,
            },
            // Future placeholders (commented out for now):
            // {
            //   title: "Calendar",
            //   url: "/dashboard/projects/calendar",
            //   icon: Calendar,
            // },
            // {
            //   title: "Content",
            //   url: "/dashboard/projects/content",
            //   icon: FileText,
            // },
            // {
            //   title: "Social",
            //   url: "/dashboard/projects/social",
            //   icon: Users,
            // },
          ],
        },
      ],
    },
    {
      title: "",
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
            {
              title: "Networking",
              url: "/dashboard/infrastructure/networking",
              icon: Network,
            },
          ],
        },
      ],
    },
    {
      title: "",
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
              title: "Workflows",
              url: "/dashboard/operations/workflows",
              icon: Workflow,
            },
          ],
        },
      ],
    },
    {
      title: "",
      items: [
        {
          title: "Monitoring",
          icon: BarChart3,
          items: [
            {
              title: "Activity",
              url: "/dashboard/monitoring/activity",
              icon: Activity,
            },
            {
              title: "Alerts",
              url: "/dashboard/monitoring/alerts",
              icon: Bell,
            },
            {
              title: "Errors",
              url: "/dashboard/monitoring/errors",
              icon: AlertCircle,
            },
          ],
        },
      ],
    },
    {
      title: "",
      items: [
        {
          title: "Docks",
          icon: Plug,
          items: [
            {
              title: "Connected",
              url: "/dashboard/docks/connected",
              icon: Link2,
            },
            {
              title: "Add",
              url: "/dashboard/docks/add",
              icon: Plus,
            },
          ],
        },
      ],
    },
    {
      title: "",
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
          ],
        },
      ],
    },
  ],
}
