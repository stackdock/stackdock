"use client"

import { useState } from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Building2,
  User,
  Palette,
  Plug,
} from "lucide-react"

interface Props extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    icon: React.ReactNode
  }[]
}

export function SettingsSidebarNav({ className, items, ...props }: Props) {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  return (
    <nav
      className={cn(
        "flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === item.href
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "justify-start"
          )}
        >
          <span className="mr-2 [&_svg]:size-[1.125rem]">{item.icon}</span>
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
