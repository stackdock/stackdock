import * as React from "react"
import { Link } from "@tanstack/react-router"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Server, 
  Globe, 
  Database,
  Settings,
  Plug
} from "lucide-react"

interface SidebarItem {
  title: string
  href: string
  icon: React.ReactNode
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Servers",
    href: "/dashboard/servers",
    icon: <Server className="h-5 w-5" />,
  },
  {
    title: "Web Services",
    href: "/dashboard/web-services",
    icon: <Globe className="h-5 w-5" />,
  },
  {
    title: "Domains",
    href: "/dashboard/domains",
    icon: <Globe className="h-5 w-5" />,
  },
  {
    title: "Databases",
    href: "/dashboard/databases",
    icon: <Database className="h-5 w-5" />,
  },
  {
    title: "Docks",
    href: "/dashboard/docks",
    icon: <Plug className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
  },
]

export function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <h2 className="text-lg font-semibold text-black">StackDock</h2>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "text-gray-700 hover:bg-gray-100 hover:text-black"
            )}
            activeProps={{
              className: cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "bg-black text-white hover:bg-gray-900"
              ),
            }}
          >
            {item.icon}
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  )
}

