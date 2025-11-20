"use client"

import * as React from "react"
import { useNavigate } from "@tanstack/react-router"
import { Search as SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useSidebarData } from "./sidebar-data"

interface Props {
  className?: string
  placeholder?: string
}

export function Search({ className = "", placeholder = "Search" }: Props) {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()
  const sidebarData = useSidebarData()

  // Flatten all navigation items for the command palette
  const allNavItems = React.useMemo(() => {
    const items: Array<{ title: string; url: string; icon: React.ComponentType<{ className?: string }>; group: string }> = []
    
    sidebarData.navGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.items) {
          item.items.forEach((subItem) => {
            if (subItem.url && subItem.icon && typeof subItem.icon !== 'string') {
              items.push({
                title: subItem.title,
                url: subItem.url,
                icon: subItem.icon as React.ComponentType<{ className?: string }>,
                group: item.title,
              })
            }
          })
        }
      })
    })
    
    return items
  }, [sidebarData])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((url: string) => {
    navigate({ to: url })
    setOpen(false)
  }, [navigate])

  // Group items by their parent group
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, typeof allNavItems> = {}
    allNavItems.forEach((item) => {
      if (!groups[item.group]) {
        groups[item.group] = []
      }
      const group = groups[item.group]
      if (group) {
        group.push(item)
      }
    })
    return groups
  }, [allNavItems])

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "bg-muted/25 text-muted-foreground hover:bg-muted/50 relative h-8 w-full justify-start rounded-md text-xs font-normal shadow-none sm:pr-12 md:w-40 lg:w-56 xl:w-64",
          className
        )}
        onClick={() => setOpen(true)}
        aria-label={`Search ${placeholder.toLowerCase()}`}
      >
        <SearchIcon
          aria-hidden="true"
          className="absolute top-1/2 left-1.5 -translate-y-1/2 size-4"
        />
        <span className="ml-3">{placeholder}</span>
        <kbd className="bg-muted pointer-events-none absolute top-[0.3rem] right-[0.3rem] hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-xs font-medium opacity-100 select-none sm:flex">
          /
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {Object.entries(groupedItems).map(([groupName, items], index) => (
            <React.Fragment key={groupName}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={groupName}>
                {items.map((item) => {
                  const Icon = item.icon
                  if (!Icon) return null
                  return (
                    <CommandItem
                      key={item.url}
                      onSelect={() => runCommand(item.url)}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
