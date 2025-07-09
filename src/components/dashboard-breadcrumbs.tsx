"use client"

import React from 'react';
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

function getBreadcrumbs(pathname: string) {
  const paths = pathname.split('/').filter(Boolean)
  
  if (paths.length === 1 && paths[0] === 'dashboard') {
    return [{ title: 'Dashboard', href: '/dashboard', isLast: true }]
  }
  
  if (paths.length === 2 && paths[0] === 'dashboard') {
    const page = paths[1].charAt(0).toUpperCase() + paths[1].slice(1)
    return [
      { title: 'Dashboard', href: '/dashboard', isLast: false },
      { title: page, href: `/dashboard/${paths[1]}`, isLast: true }
    ]
  }
  
  return [{ title: 'Dashboard', href: '/dashboard', isLast: true }]
}

export function DashboardBreadcrumbs() {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={crumb.href}>
                  {crumb.title}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!crumb.isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
