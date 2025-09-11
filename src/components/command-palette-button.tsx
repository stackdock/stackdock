"use client"

import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { CommandPalette } from "./command-palette"
import { useOperatingSystem } from "@/hooks/operating-system-provider"
import { useState } from "react"

export function CommandPaletteTrigger() {
  const [open, setOpen] = useState(false)
  const { modifierKey } = useOperatingSystem()

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" aria-hidden="true" />
        <span className="hidden xl:inline-flex">Search [ / ]</span>
        <span className="sr-only">Search bar</span>
        
        {/* Always show - no isMounted check */}
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          {modifierKey} + K
        </kbd>
      </Button>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  )
}
