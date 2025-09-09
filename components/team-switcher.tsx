// components/team-switcher.tsx
'use client';

import * as React from "react"
import { ChevronsUpDown, GalleryVerticalEnd } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {  useClientCookies } from "@/hooks/use-client-cookie"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
    const { values, isClient } = useClientCookies(['user_companyName'])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-500 text-black">
            <GalleryVerticalEnd className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            {isClient ? (
              <span className="truncate font-semibold">
                {values?.user_companyName || "Company"}
              </span>
            ) : (
              <span className="h-4 w-32 rounded bg-gray-300 animate-pulse" />
            )}
            <span className="truncate text-xs">LeaveFlow CRM</span>
          </div>
          <ChevronsUpDown className="ml-auto" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}