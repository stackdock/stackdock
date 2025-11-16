"use client"

import { ReactNode } from "react"
import { ChevronRight } from "lucide-react"
import { Link, useRouterState } from "@tanstack/react-router"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { NavItem, type NavGroup } from "./types"

export function NavGroup({ title, items }: NavGroup) {
  const { setOpenMobile } = useSidebar()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  return (
    <SidebarGroup>
      {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          if (!item.items) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={checkIsActive(pathname, item, true)}
                  tooltip={item.title}
                >
                  <Link to={item.url} onClick={() => setOpenMobile(false)}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && <NavBadge>{item.badge}</NavBadge>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={checkIsActive(pathname, item, true)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  {item.url ? (
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link to={item.url} onClick={() => setOpenMobile(false)}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        {item.badge && <NavBadge>{item.badge}</NavBadge>}
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      {item.badge && <NavBadge>{item.badge}</NavBadge>}
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="CollapsibleContent">
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <NavSubItem
                        key={subItem.title}
                        item={subItem}
                        pathname={pathname}
                      />
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

const NavBadge = ({ children }: { children: ReactNode }) => (
  <Badge className="rounded-full px-1 py-0 text-xs">{children}</Badge>
)

// Recursive component for nested submenu items
function NavSubItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const { setOpenMobile } = useSidebar()

  // If sub-item has no nested items, render as a link
  if (!item.items && item.url) {
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          asChild
          isActive={checkIsActive(pathname, item)}
        >
          <Link to={item.url} onClick={() => setOpenMobile(false)}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
          </Link>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    )
  }

  // If sub-item has nested items, render as collapsible
  if (item.items) {
    return (
      <Collapsible
        asChild
        defaultOpen={checkIsActive(pathname, item, true)}
        className="group/collapsible-sub"
      >
        <SidebarMenuSubItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuSubButton isActive={checkIsActive(pathname, item)}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              {item.badge && <NavBadge>{item.badge}</NavBadge>}
              <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible-sub:rotate-90" />
            </SidebarMenuSubButton>
          </CollapsibleTrigger>
          <CollapsibleContent className="CollapsibleContent">
            <SidebarMenuSub>
              {item.items.map((nestedItem) => (
                <NavSubItem
                  key={nestedItem.title}
                  item={nestedItem}
                  pathname={pathname}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuSubItem>
      </Collapsible>
    )
  }

  return null
}

function checkIsActive(pathname: string, item: NavItem, mainNav = false) {
  // Check if this item's URL matches
  if (item.url) {
    if (
      pathname === item.url ||
      pathname.split("?")[0] === item.url ||
      (mainNav &&
        pathname.split("/")[1] !== "" &&
        pathname.split("/")[1] === item.url.split("/")[1])
    ) {
      return true
    }
  }

  // Recursively check nested items
  if (item.items) {
    return item.items.some((subItem) =>
      checkIsActive(pathname, subItem, false)
    )
  }

  return false
}
