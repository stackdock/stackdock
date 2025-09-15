"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DialogProps } from "@radix-ui/react-dialog"
import {
  Settings,
  User,
  Server,
  Database,
  Globe,
  Users,
  Key,
  Bell,
  Activity,
  FileText,
  Home,
  Shield,
  Plus,
  Moon,
  Sun,
  Laptop,
  MonitorSmartphoneIcon,
  SaveAll,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useTheme } from "@/components/settings/theme-provider"
import { useOperatingSystem } from "@/hooks/operating-system-provider"

interface CommandPaletteProps extends DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange, ...props }: CommandPaletteProps) {
  const router = useRouter()
  const { setTheme } = useTheme()
  const { modifierKey } = useOperatingSystem()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return
        }

        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  const runCommand = React.useCallback((command: () => unknown) => {
    onOpenChange(false)
    command()
  }, [onOpenChange])

  // Remove isMounted check - always show current state
  const shortcut = (key: string) => `${modifierKey} + ${key}`

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} {...props}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard"))}
          >
            <Home className="mr-2 h-4 w-4" />
            Dashboard
            <CommandShortcut>{shortcut("D")}</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/sites"))}
          >
            <MonitorSmartphoneIcon className="mr-2 h-4 w-4" />
            Sites
            <CommandShortcut>{shortcut("W")}</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/servers"))}
          >
            <Server className="mr-2 h-4 w-4" />
            Servers
            <CommandShortcut>{shortcut("S")}</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/domains"))}
          >
            <Globe className="mr-2 h-4 w-4" />
            Domains
            <CommandShortcut>{shortcut("B")}</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/backups/schedules"))}
          >
            <SaveAll className="mr-2 h-4 w-4" />
            Backups
            <CommandShortcut>{shortcut("A")}</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/monitoring"))}
          >
            <Activity className="mr-2 h-4 w-4" />
            Monitoring
            <CommandShortcut>{shortcut("M")}</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/settings/profile"))}
          >
            <User className="mr-2 h-4 w-4" />
            Profile Settings
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/settings/api-keys"))}
          >
            <Key className="mr-2 h-4 w-4" />
            API Keys
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/settings/notifications"))}
          >
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/settings/preferences"))}
          >
            <Settings className="mr-2 h-4 w-4" />
            Preferences
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => runCommand(() => {
              router.push("/dashboard/servers/new")
            })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Server
            <CommandShortcut>{shortcut("N")}</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => {
              router.push("/dashboard/sites/new")
            })}
          >
            <Globe className="mr-2 h-4 w-4" />
            Add New Site
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => {
              router.push("/dashboard/databases/new")
            })}
          >
            <Database className="mr-2 h-4 w-4" />
            Create Database
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" />
            Light Theme
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            Dark Theme
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <Laptop className="mr-2 h-4 w-4" />
            System Theme
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Links">
          <CommandItem
            onSelect={() => runCommand(() => window.open("https://docs.stackdock.com", "_blank"))}
          >
            <FileText className="mr-2 h-4 w-4" />
            Documentation
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => window.open("https://status.stackdock.com", "_blank"))}
          >
            <Shield className="mr-2 h-4 w-4" />
            System Status
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => window.open("https://support.stackdock.com", "_blank"))}
          >
            <Users className="mr-2 h-4 w-4" />
            Support Center
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
