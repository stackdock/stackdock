import { SettingsSidebarNav } from "./SettingsSidebarNav"
import { Building2, User, Palette, Plug } from "lucide-react"

interface Props {
  children: React.ReactNode
}

const sidebarNavItems = [
  {
    title: "Organization",
    icon: <Building2 />,
    href: "/dashboard/settings/organization",
  },
  {
    title: "User",
    icon: <User />,
    href: "/dashboard/settings/user",
  },
  {
    title: "Theme",
    icon: <Palette />,
    href: "/dashboard/settings/theme",
  },
  {
    title: "Docks",
    icon: <Plug />,
    href: "/dashboard/settings/docks",
  },
]

export function SettingsLayout({ children }: Props) {
  return (
    <div
      data-layout="fixed"
      className="flex flex-1 flex-col gap-4 overflow-hidden p-4"
    >
      <div className="space-y-0.5">
        <h1 className="text-lg font-bold tracking-tight md:text-xl">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Update account preferences and manage integrations.
        </p>
      </div>
      <div className="flex flex-1 flex-col space-y-8 overflow-auto md:space-y-2 md:overflow-hidden lg:flex-row lg:space-y-0 lg:space-x-12">
        <aside className="lg:sticky lg:w-1/5">
          <SettingsSidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex w-full overflow-y-scroll p-1 pr-4 md:overflow-y-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
