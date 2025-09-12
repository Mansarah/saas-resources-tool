// components/team-switcher.tsx
'use client';

import * as React from "react"
import { ChevronsUpDown, GalleryVerticalEnd } from "lucide-react"
import { useSession } from "next-auth/react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function TeamSwitcher({ companyName }: { companyName: string | null }) {

  const { isMobile } = useSidebar()
 

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
            {companyName || "Company"}
            <span className="truncate text-xs">LeaveFlow CRM</span>
          </div>
          <ChevronsUpDown className="ml-auto" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}